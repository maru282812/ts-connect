-- ============================================================
-- 021_community_weekly_themes.sql
-- 社内SNS「週替わりテーマ」追加マイグレーション（追加のみ・非破壊）
--
-- 目的: 「何を書けばいいか分からない」を解消し投稿のきっかけを提供する。
--       管理者がテーマを用意し、ユーザーはそのテーマに沿って社内SNSへ投稿する。
-- 方針:
--   - 020_community_sns.sql と同様 community_ 接頭辞で分離。
--   - 既存 RLS ヘルパー public.get_user_role() / public.get_user_company_ids() を再利用。
--   - company_id = NULL は「全社共通テーマ」。
--   - 本ファイル適用後、プロジェクト規約に従い 001_schema.sql へ反映すること。
-- ============================================================

-- ============================================================
-- 1. テーブル
-- ============================================================

-- ── community_weekly_themes: 週替わりテーマ本体 ──
create table if not exists public.community_weekly_themes (
  id          uuid        primary key default gen_random_uuid(),
  company_id  uuid        references public.companies(id) on delete cascade, -- NULL=全社共通
  title       text        not null,                 -- 例: 便利だったショートカット
  description text,                                  -- 投稿を促す補足説明
  starts_on   date        not null,
  ends_on     date        not null,
  is_active   boolean     not null default true,
  sort_order  int         not null default 0,
  created_by  uuid        references public.users(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  check (ends_on >= starts_on)
);

create index if not exists community_weekly_themes_company_idx
  on public.community_weekly_themes(company_id);
-- 「現在アクティブなテーマ」取得用（期間 + is_active）
create index if not exists community_weekly_themes_active_idx
  on public.community_weekly_themes(is_active, starts_on, ends_on);

-- ============================================================
-- 2. community_posts への参照カラム追加（投稿がどのテーマに紐づくか）
-- ============================================================
alter table public.community_posts
  add column if not exists weekly_theme_id uuid
    references public.community_weekly_themes(id) on delete set null;

create index if not exists community_posts_weekly_theme_idx
  on public.community_posts(weekly_theme_id);

-- ============================================================
-- 3. RLS（既存ヘルパー get_user_role() / get_user_company_ids() を再利用）
-- ============================================================
alter table public.community_weekly_themes enable row level security;

-- 閲覧: 全社共通(NULL) または自社のテーマは全員閲覧可
drop policy if exists "weekly_themes: select in scope" on public.community_weekly_themes;
create policy "weekly_themes: select in scope" on public.community_weekly_themes
  for select using (
    company_id is null
    or company_id = any(public.get_user_company_ids())
  );

-- 管理: ADMIN / MASTER_ADMIN が作成・更新・削除（自社テーマ + 全社共通）
drop policy if exists "weekly_themes: admin manage" on public.community_weekly_themes;
create policy "weekly_themes: admin manage" on public.community_weekly_themes
  for all
  using (
    public.get_user_role() in ('ADMIN','MASTER_ADMIN')
    and (company_id is null or company_id = any(public.get_user_company_ids()))
  )
  with check (
    public.get_user_role() in ('ADMIN','MASTER_ADMIN')
    and (company_id is null or company_id = any(public.get_user_company_ids()))
  );

-- ============================================================
-- 4. updated_at 自動更新トリガー（既存関数 public.update_updated_at を利用）
-- ============================================================
drop trigger if exists trg_community_weekly_themes_updated_at
  on public.community_weekly_themes;
create trigger trg_community_weekly_themes_updated_at
  before update on public.community_weekly_themes
  for each row execute function public.update_updated_at();

-- ============================================================
-- 5. 初期テーマ（全社共通・今週分）。冪等に投入する。
-- ============================================================
insert into public.community_weekly_themes (company_id, title, description, starts_on, ends_on, is_active, sort_order)
select null, '便利だったショートカット', '日々の業務で使っている時短ワザ・ショートカットを共有しよう。',
       current_date, current_date + 6, true, 0
where not exists (
  select 1 from public.community_weekly_themes where company_id is null and title = '便利だったショートカット'
);

insert into public.community_weekly_themes (company_id, title, description, starts_on, ends_on, is_active, sort_order)
select null, '失敗から学んだこと', '小さな失敗とそこから得た学びを気軽にシェアしよう。',
       current_date + 7, current_date + 13, false, 1
where not exists (
  select 1 from public.community_weekly_themes where company_id is null and title = '失敗から学んだこと'
);

insert into public.community_weekly_themes (company_id, title, description, starts_on, ends_on, is_active, sort_order)
select null, 'チーム紹介', '自分のチームの仕事・雰囲気・最近のトピックを紹介しよう。',
       current_date + 14, current_date + 20, false, 2
where not exists (
  select 1 from public.community_weekly_themes where company_id is null and title = 'チーム紹介'
);
