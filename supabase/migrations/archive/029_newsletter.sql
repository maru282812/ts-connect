-- ============================================================
-- 029_newsletter.sql
-- フェーズ2「社内報 + 作成・管理画面」向けテーブル追加（追加のみ・非破壊）
--
-- 目的:
--   - 会社の「今」を伝える社内報を DB 管理する。管理者が号を作成・公開し、
--     一般ユーザーは公開済みの号を閲覧する。閲覧数（手応え）を可視化する。
-- 方針:
--   - 020/021 と同様に既存 RLS ヘルパー public.get_user_role() /
--     public.get_user_company_ids() を再利用。company_id = NULL は「全社共通」。
--   - 閲覧数は security definer 関数 increment_newsletter_view() で加算し、
--     newsletter_view_logs による既読判定で同一ユーザーの二重計上を防ぐ。
--   - GRANT は 023 と同方針（anon 付与なし / service_role に ALL）。
--   - 本ファイル適用後、プロジェクト規約に従い 001_schema.sql へ反映すること。
-- ============================================================

-- ============================================================
-- 1. テーブル
-- ============================================================

-- ── newsletter_issues: 社内報の号（記事）本体 ──
create table if not exists public.newsletter_issues (
  id              uuid        primary key default gen_random_uuid(),
  company_id      uuid        references public.companies(id) on delete cascade, -- NULL=全社共通
  title           text        not null,
  category        text        not null default 'MONTHLY'
                              check (category in ('MONTHLY', 'FEATURE', 'PEOPLE', 'NOTICE')),
  summary         text,       -- 一覧・カードに表示する短い説明
  body            text        not null default '',
  cover_image_url text,
  image_urls      text[],     -- 本文に載せるその他写真（任意）
  status          text        not null default 'DRAFT'
                              check (status in ('DRAFT', 'PUBLISHED', 'SCHEDULED')),
  published_at    timestamptz,
  is_pickup       boolean     not null default false,
  view_count      int         not null default 0,
  created_by      uuid        references public.users(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists newsletter_issues_company_idx
  on public.newsletter_issues(company_id);
-- 公開一覧・並び順取得用（公開状態 + 発行日）
create index if not exists newsletter_issues_status_pub_idx
  on public.newsletter_issues(status, published_at desc);

-- ── newsletter_view_logs: 閲覧ログ（既読判定 + 二重計上防止） ──
create table if not exists public.newsletter_view_logs (
  id         uuid        primary key default gen_random_uuid(),
  issue_id   uuid        not null references public.newsletter_issues(id) on delete cascade,
  user_id    uuid        references public.users(id),
  viewed_at  timestamptz not null default now(),
  unique (issue_id, user_id)
);

create index if not exists newsletter_view_logs_issue_idx
  on public.newsletter_view_logs(issue_id);

-- ============================================================
-- 2. 閲覧数加算関数（同一ユーザーの既読は加算しない）
-- ============================================================
create or replace function public.increment_newsletter_view(p_issue_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user     uuid := auth.uid();
  v_inserted int;
begin
  if v_user is null then
    return;
  end if;
  -- 既読なら加算しない（二重計上防止）。同時アクセスは unique 制約 + on conflict で吸収。
  insert into public.newsletter_view_logs (issue_id, user_id)
    values (p_issue_id, v_user)
    on conflict (issue_id, user_id) do nothing;
  get diagnostics v_inserted = row_count;
  if v_inserted > 0 then
    update public.newsletter_issues
      set view_count = view_count + 1
      where id = p_issue_id;
  end if;
end;
$$;

grant execute on function public.increment_newsletter_view(uuid) to authenticated;
grant execute on function public.increment_newsletter_view(uuid) to service_role;

-- ============================================================
-- 3. updated_at 自動更新トリガー（既存関数 public.update_updated_at）
-- ============================================================
drop trigger if exists trg_newsletter_issues_updated_at on public.newsletter_issues;
create trigger trg_newsletter_issues_updated_at
  before update on public.newsletter_issues
  for each row execute function public.update_updated_at();

-- ============================================================
-- 4. RLS
-- ============================================================
alter table public.newsletter_issues    enable row level security;
alter table public.newsletter_view_logs enable row level security;

-- newsletter_issues 閲覧: 公開済み(PUBLISHED) かつ スコープ内は全員閲覧可
drop policy if exists "newsletter_issues: select published in scope" on public.newsletter_issues;
create policy "newsletter_issues: select published in scope" on public.newsletter_issues
  for select using (
    status = 'PUBLISHED'
    and (company_id is null or company_id = any(public.get_user_company_ids()))
  );

-- newsletter_issues 管理: ADMIN/MASTER_ADMIN はスコープ内を全操作（下書き閲覧含む）
drop policy if exists "newsletter_issues: admin manage in scope" on public.newsletter_issues;
create policy "newsletter_issues: admin manage in scope" on public.newsletter_issues
  for all
  using (
    public.get_user_role() in ('ADMIN', 'MASTER_ADMIN')
    and (company_id is null or company_id = any(public.get_user_company_ids()))
  )
  with check (
    public.get_user_role() in ('ADMIN', 'MASTER_ADMIN')
    and (company_id is null or company_id = any(public.get_user_company_ids()))
  );

-- newsletter_view_logs 閲覧: 本人分 + ADMIN/MASTER_ADMIN
-- （INSERT は increment_newsletter_view() が security definer で行うため直接権限は付与しない）
drop policy if exists "newsletter_view_logs: select own or admin" on public.newsletter_view_logs;
create policy "newsletter_view_logs: select own or admin" on public.newsletter_view_logs
  for select using (
    user_id = auth.uid()
    or public.get_user_role() in ('ADMIN', 'MASTER_ADMIN')
  );

-- ============================================================
-- 5. GRANT（anon には付与しない / service_role に ALL）
-- ============================================================
grant all on public.newsletter_issues    to service_role;
grant all on public.newsletter_view_logs to service_role;

-- newsletter_issues: 参照 + 管理（作成/更新/削除は上記 RLS が ADMIN に限定）
grant select, insert, update, delete on public.newsletter_issues to authenticated;

-- newsletter_view_logs: 参照のみ（追加は increment_newsletter_view() 経由）
grant select on public.newsletter_view_logs to authenticated;
