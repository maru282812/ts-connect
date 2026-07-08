-- ============================================================
-- 026_community_mentions_and_polls.sql
-- 社内SNS: ①メンション(@さん)＋自分宛て可視化 ②アンケート投稿（単一選択）（追加のみ・非破壊）
--
-- 背景/方針:
--   - メンション: 投稿者が同僚を名指しできるようにする。第1弾では全社通知ベルは出さない
--     決定（release_scope_phase1）に従い、通知は SNS 内「自分宛て」タブで届ける。
--     ただし将来のベル解禁に備え notifications 行も裏で作成しておく。
--   - 通常 USER は他人の users / company_members を SELECT できない RLS のため、
--     メンション補完用の同僚名簿は SECURITY DEFINER の RPC で最小列(id,表示名)だけ返す。
--     表示名は mention 行にスナップショット保存し、描画時に users へ依存しない。
--   - アンケート: 1人1票の単一選択。集計は vote_count を集計トリガーで保持。
--   - GRANT/ALTER は冪等。トリガー・ポリシーは drop してから作成。
--   - 本ファイル適用後、プロジェクト規約に従い 001_schema.sql / 020 へ反映すること。
-- ============================================================

-- ============================================================
-- 1. メンション
-- ============================================================
create table if not exists public.community_post_mentions (
  post_id                uuid        not null references public.community_posts(id) on delete cascade,
  mentioned_user_id      uuid        not null references public.users(id)           on delete cascade,
  mentioned_display_name text        not null default '', -- メンション時点の表示名スナップショット
  created_at             timestamptz not null default now(),
  primary key (post_id, mentioned_user_id)
);
create index if not exists community_mentions_user_idx on public.community_post_mentions(mentioned_user_id);
create index if not exists community_mentions_post_idx on public.community_post_mentions(post_id);

alter table public.community_post_mentions enable row level security;

grant select, insert, delete on public.community_post_mentions to authenticated;

-- 閲覧: 自分宛て、または親投稿が見えるなら見える
drop policy if exists "community_mentions: select" on public.community_post_mentions;
create policy "community_mentions: select" on public.community_post_mentions
  for select using (
    mentioned_user_id = auth.uid()
    or exists (select 1 from public.community_posts p where p.id = post_id)
  );

-- 付与/削除: 自分の投稿に対してのみ
drop policy if exists "community_mentions: insert via own post" on public.community_post_mentions;
create policy "community_mentions: insert via own post" on public.community_post_mentions
  for insert with check (
    exists (
      select 1 from public.community_posts p
       where p.id = post_id and p.author_user_id = auth.uid()
    )
  );

drop policy if exists "community_mentions: delete via own post" on public.community_post_mentions;
create policy "community_mentions: delete via own post" on public.community_post_mentions
  for delete using (
    exists (
      select 1 from public.community_posts p
       where p.id = post_id and p.author_user_id = auth.uid()
    )
  );

-- ── notifications.type に 'MENTION' を追加（非破壊で制約を貼り替え） ──
alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check
  check (type in (
    'APPLICATION_RECEIVED', 'APPLICATION_STATUS_CHANGED',
    'MESSAGE_RECEIVED', 'POST_CLOSED', 'INVITATION_RECEIVED',
    'ANNOUNCEMENT', 'SYSTEM', 'POINT_GRANTED', 'REVIEW_RECEIVED',
    'MENTION'
  ));

-- ── メンション行 → 通知行を裏で作成（将来の通知ベル解禁時にそのまま使える） ──
-- notifications は authenticated に INSERT 権限が無いため SECURITY DEFINER で挿入する。
create or replace function public.community_notify_mention()
returns trigger as $$
declare
  v_author  uuid;
  v_snippet text;
begin
  select author_user_id, left(coalesce(body, ''), 80)
    into v_author, v_snippet
    from public.community_posts
   where id = new.post_id;

  -- 自分自身へのメンションは通知しない
  if new.mentioned_user_id = v_author then
    return null;
  end if;

  insert into public.notifications (user_id, type, title, body, related_type, related_id)
  values (
    new.mentioned_user_id, 'MENTION', 'あなたがメンションされました',
    coalesce(v_snippet, ''), 'community_post', new.post_id
  );
  return null;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists trg_community_notify_mention on public.community_post_mentions;
create trigger trg_community_notify_mention
  after insert on public.community_post_mentions
  for each row execute function public.community_notify_mention();

-- ── 同僚名簿 RPC（@補完用・最小列のみ返す / 自社の active メンバー） ──
-- 通常 USER は他人の users を SELECT できないため、列を限定した SECURITY DEFINER で公開する。
create or replace function public.community_member_directory(
  keyword text default '',
  lim     int  default 8
)
returns table (user_id uuid, display_name text)
language sql
security definer
set search_path = public
as $$
  select distinct u.id, u.display_name
    from public.company_members cm
    join public.users u on u.id = cm.user_id
   where cm.company_id = any(public.get_user_company_ids())
     and cm.status = 'active'
     and u.deleted_at is null
     and u.id <> auth.uid()
     and (keyword = '' or u.display_name ilike '%' || keyword || '%')
   order by u.display_name
   limit greatest(1, least(lim, 50));
$$;

grant execute on function public.community_member_directory(text, int) to authenticated;

-- ============================================================
-- 2. アンケート（単一選択）
-- ============================================================
create table if not exists public.community_polls (
  id             uuid        primary key default gen_random_uuid(),
  post_id        uuid        not null unique references public.community_posts(id) on delete cascade,
  allow_multiple boolean     not null default false, -- 第1弾は単一選択(false)。将来の複数選択用に保持。
  closes_at      timestamptz,
  created_at     timestamptz not null default now()
);
create index if not exists community_polls_post_idx on public.community_polls(post_id);

create table if not exists public.community_poll_options (
  id         uuid        primary key default gen_random_uuid(),
  poll_id    uuid        not null references public.community_polls(id) on delete cascade,
  label      text        not null,
  sort_order int         not null default 0,
  vote_count int         not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists community_poll_options_poll_idx on public.community_poll_options(poll_id);

create table if not exists public.community_poll_votes (
  id         uuid        primary key default gen_random_uuid(),
  poll_id    uuid        not null references public.community_polls(id)        on delete cascade,
  option_id  uuid        not null references public.community_poll_options(id) on delete cascade,
  user_id    uuid        not null references public.users(id)                  on delete cascade,
  created_at timestamptz not null default now(),
  unique (poll_id, user_id) -- 単一選択: 1人1票（投票変更は delete→insert）
);
create index if not exists community_poll_votes_poll_idx   on public.community_poll_votes(poll_id);
create index if not exists community_poll_votes_option_idx on public.community_poll_votes(option_id);

alter table public.community_polls        enable row level security;
alter table public.community_poll_options enable row level security;
alter table public.community_poll_votes   enable row level security;

grant select, insert         on public.community_polls        to authenticated;
grant select, insert         on public.community_poll_options to authenticated;
grant select, insert, delete on public.community_poll_votes   to authenticated;

-- polls / options: 親投稿が見えれば閲覧可 / 自分の投稿にのみ作成可
drop policy if exists "community_polls: select via post" on public.community_polls;
create policy "community_polls: select via post" on public.community_polls
  for select using (
    exists (select 1 from public.community_posts p where p.id = post_id)
  );
drop policy if exists "community_polls: insert via own post" on public.community_polls;
create policy "community_polls: insert via own post" on public.community_polls
  for insert with check (
    exists (
      select 1 from public.community_posts p
       where p.id = post_id and p.author_user_id = auth.uid()
    )
  );

drop policy if exists "community_poll_options: select via poll" on public.community_poll_options;
create policy "community_poll_options: select via poll" on public.community_poll_options
  for select using (
    exists (select 1 from public.community_polls pl where pl.id = poll_id)
  );
drop policy if exists "community_poll_options: insert via own post" on public.community_poll_options;
create policy "community_poll_options: insert via own post" on public.community_poll_options
  for insert with check (
    exists (
      select 1
        from public.community_polls pl
        join public.community_posts p on p.id = pl.post_id
       where pl.id = poll_id and p.author_user_id = auth.uid()
    )
  );

-- votes: 閲覧は全員（集計表示のため） / 自分の票のみ作成・削除
drop policy if exists "community_poll_votes: select" on public.community_poll_votes;
create policy "community_poll_votes: select" on public.community_poll_votes
  for select using (true);
drop policy if exists "community_poll_votes: insert own" on public.community_poll_votes;
create policy "community_poll_votes: insert own" on public.community_poll_votes
  for insert with check (user_id = auth.uid());
drop policy if exists "community_poll_votes: delete own" on public.community_poll_votes;
create policy "community_poll_votes: delete own" on public.community_poll_votes
  for delete using (user_id = auth.uid());

-- ── 票の増減に合わせて option.vote_count を自動同期 ──
create or replace function public.community_sync_poll_votes()
returns trigger as $$
begin
  update public.community_poll_options o
     set vote_count = (
       select count(*) from public.community_poll_votes v where v.option_id = o.id
     )
   where o.id = coalesce(new.option_id, old.option_id);
  return null;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists trg_community_poll_votes on public.community_poll_votes;
create trigger trg_community_poll_votes
  after insert or delete on public.community_poll_votes
  for each row execute function public.community_sync_poll_votes();
