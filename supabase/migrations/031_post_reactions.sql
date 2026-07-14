-- ============================================================
-- 031_post_reactions.sql
--
-- posts テーブルにいいね機能を追加する migration
-- - posts.like_count カラムを追加（ない場合）
-- - post_reactions テーブルを作成
-- - トリガー関数で like_count を自動同期
-- - RLS ポリシーを設定
-- ============================================================

-- ── Step 1: posts テーブルに like_count カラムを追加（既存 DB 対応） ──
alter table public.posts
  add column if not exists like_count int not null default 0;

-- ── Step 2: post_reactions テーブル作成 ──
-- community_post_reactions をモデルに、posts 用のいいねテーブル
create table if not exists public.post_reactions (
  id         uuid        primary key default gen_random_uuid(),
  post_id    uuid        not null references public.posts(id) on delete cascade,
  user_id    uuid        not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);

create index if not exists post_reactions_post_idx on public.post_reactions(post_id);
create index if not exists post_reactions_user_idx on public.post_reactions(user_id);

-- ── Step 3: トリガー関数：post_reactions から like_count を同期 ──
create or replace function public.post_sync_like_count()
returns trigger as $$
begin
  if tg_op = 'DELETE' then
    update public.posts
      set like_count = coalesce((
        select count(*) from public.post_reactions where post_id = old.post_id
      ), 0)
    where id = old.post_id;
    return old;
  else -- INSERT
    update public.posts
      set like_count = coalesce((
        select count(*) from public.post_reactions where post_id = new.post_id
      ), 0)
    where id = new.post_id;
    return new;
  end if;
end $$ language plpgsql;

-- ── Step 4: トリガーを作成・再作成 ──
drop trigger if exists trg_post_like_count on public.post_reactions;
create trigger trg_post_like_count
  after insert or delete on public.post_reactions
  for each row execute function public.post_sync_like_count();

-- ── Step 5: RLS ポリシー設定 ──
alter table public.post_reactions enable row level security;

-- 全員が読み取り可能
drop policy if exists "post_reactions_select" on public.post_reactions;
create policy "post_reactions_select"
  on public.post_reactions for select
  using (true);

-- 本人のみいいね追加・削除可能
drop policy if exists "post_reactions_insert" on public.post_reactions;
create policy "post_reactions_insert"
  on public.post_reactions for insert
  with check (auth.uid() = user_id);

drop policy if exists "post_reactions_delete" on public.post_reactions;
create policy "post_reactions_delete"
  on public.post_reactions for delete
  using (auth.uid() = user_id);

-- service_role でも削除可能（管理用）
drop policy if exists "post_reactions_delete_admin" on public.post_reactions;
create policy "post_reactions_delete_admin"
  on public.post_reactions for delete
  using (auth.role() = 'service_role');
