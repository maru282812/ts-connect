-- ============================================================
-- 001_schema.sql
-- WorkMarket 本開発用 DB 初期化 SQL
-- 空の Supabase プロジェクトに一発適用して完成形 DB を構築する。
--
-- 適用順: このファイル → 002_seed_dev.sql (任意)
--
-- 統合済みパッチ:
--   003_company_members_permissions.sql  (Section 5, 8)
--   004_service_role_grants.sql          (Section 5)
--   006_fix_email_trigger.sql            (Section 3, 13)
--
-- 注: 005_fix_email_sync.sql は既存環境向け補正であり、このファイルには含めない
-- ============================================================

-- ============================================================
-- 1. Tables
-- ============================================================

-- ── users ──────────────────────────────────────────────────
create table if not exists public.users (
  id                 uuid        primary key references auth.users(id) on delete cascade,
  email              text        unique not null,
  display_name       text        not null,
  notification_email text,
  system_role        text        not null default 'USER'
                                 check (system_role in ('USER', 'ADMIN', 'MASTER_ADMIN')),
  account_status     text        not null default 'ACTIVE'
                                 check (account_status in ('ACTIVE', 'PRO', 'SUSPENDED')),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- ── companies ──────────────────────────────────────────────
create table if not exists public.companies (
  id                   uuid        primary key default gen_random_uuid(),
  name                 text        not null,
  email                text,
  notification_email   text,
  notification_enabled boolean     not null default true,
  description          text,
  logo_url             text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- ── company_members ────────────────────────────────────────
create table if not exists public.company_members (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references public.users(id) on delete cascade,
  company_id uuid        not null references public.companies(id) on delete cascade,
  role       text        not null default 'USER'
                         check (role in ('ADMIN', 'USER')),
  status     text        not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, company_id)
);

-- ── posts ──────────────────────────────────────────────────
create table if not exists public.posts (
  id                          uuid        primary key default gen_random_uuid(),
  company_id                  uuid        not null references public.companies(id) on delete cascade,
  created_by_user_id          uuid        not null references public.users(id) on delete cascade,
  title                       text        not null,
  body                        text        not null,
  post_type                   text        not null default 'OFFICIAL'
                                          check (post_type in ('OFFICIAL', 'CASUAL')),
  post_status                 text        not null default 'DRAFT'
                                          check (post_status in ('DRAFT', 'OPEN', 'IN_PROGRESS', 'CLOSED')),
  price_text                  text,
  contact_person_name         text,
  deadline_at                 timestamptz,
  published_at                timestamptz,
  closed_at                   timestamptz,
  application_limit           int,
  is_application_limit_enabled boolean    not null default false,
  thumbnail_url               text,
  requirements                text,
  reference_url               text,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

create index if not exists posts_post_type_idx   on public.posts(post_type);
create index if not exists posts_post_status_idx on public.posts(post_status);
create index if not exists posts_company_id_idx  on public.posts(company_id);
create index if not exists posts_created_by_idx  on public.posts(created_by_user_id);
create index if not exists posts_search_idx      on public.posts using gin(to_tsvector('simple', title || ' ' || body));

-- ── applications ───────────────────────────────────────────
create table if not exists public.applications (
  id                         uuid        primary key default gen_random_uuid(),
  post_id                    uuid        not null references public.posts(id) on delete cascade,
  applicant_user_id          uuid        not null references public.users(id) on delete cascade,
  message                    text,
  application_type           text        not null
                                         check (application_type in ('APPLY', 'INQUIRY')),
  application_status         text        not null default 'APPLIED'
                                         check (application_status in ('APPLIED', 'REVIEWING', 'ACCEPTED', 'REJECTED', 'CANCELED', 'INQUIRY')),
  applicant_email_snapshot   text        not null,
  applicant_name_snapshot    text        not null,
  applicant_company_snapshot text,
  post_title_snapshot        text        not null,
  application_sequence       int,
  applied_at                 timestamptz not null default now(),
  reviewed_at                timestamptz,
  created_at                 timestamptz not null default now(),
  updated_at                 timestamptz not null default now()
);

create index if not exists applications_applicant_idx  on public.applications(applicant_user_id);
create index if not exists applications_post_idx       on public.applications(post_id);
create index if not exists applications_applied_at_idx on public.applications(applied_at desc);

-- ============================================================
-- 2. Functions
-- ============================================================

-- ── updated_at 自動更新トリガー関数 ────────────────────────
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ── get_user_role: 現在ユーザーの system_role を返す ────────
-- SECURITY DEFINER + search_path 固定で RLS バイパスせずに安全取得
create or replace function public.get_user_role()
returns text as $$
  select system_role from public.users where id = auth.uid()
$$ language sql security definer stable set search_path = public;

grant execute on function public.get_user_role() to authenticated;
grant execute on function public.get_user_role() to service_role;

-- ── get_user_company_ids: active 所属会社 ID の配列を返す ───
create or replace function public.get_user_company_ids()
returns uuid[] as $$
  select coalesce(array_agg(company_id), array[]::uuid[])
  from public.company_members
  where user_id = auth.uid()
    and status = 'active'
$$ language sql security definer stable set search_path = public;

grant execute on function public.get_user_company_ids() to authenticated;
grant execute on function public.get_user_company_ids() to service_role;

-- ── handle_new_user: auth.users 作成時に public.users を自動挿入 ─
-- system_role は常に 'USER' で作成し、昇格は DB 直接更新で管理する。
-- display_name / company_id は raw_user_meta_data から取得する。
create or replace function public.handle_new_user()
returns trigger as $$
declare
  v_company_id uuid;
begin
  -- public.users を挿入。email UNIQUE 違反（孤立レコード）は明示エラーにする
  begin
    insert into public.users (id, email, display_name, system_role, account_status)
    values (
      new.id,
      new.email,
      coalesce(nullif(trim(new.raw_user_meta_data->>'display_name'), ''), split_part(new.email, '@', 1)),
      'USER',
      'ACTIVE'
    )
    on conflict (id) do nothing;
  exception when unique_violation then
    raise exception
      '[handle_new_user] users INSERT 失敗: email "%" は既に public.users に存在します (auth.user_id=%)',
      new.email, new.id
      using errcode = 'unique_violation';
  end;

  -- company_id を UUID キャスト。失敗時は WARNING だけ残して NULL 扱い
  begin
    v_company_id := (new.raw_user_meta_data->>'company_id')::uuid;
  exception when others then
    raise warning
      '[handle_new_user] company_id のキャスト失敗 (auth.user_id=%, raw_value="%", error=%)',
      new.id,
      coalesce(new.raw_user_meta_data->>'company_id', '(null)'),
      sqlerrm;
    v_company_id := null;
  end;

  -- company_id が有効な場合のみ company_members に挿入
  if v_company_id is not null then
    begin
      insert into public.company_members (user_id, company_id, role, status)
      values (new.id, v_company_id, 'USER', 'active')
      on conflict (user_id, company_id) do nothing;
    exception when foreign_key_violation then
      raise exception
        '[handle_new_user] company_members INSERT 失敗: company_id "%" は public.companies に存在しません (auth.user_id=%)',
        v_company_id, new.id
        using errcode = 'foreign_key_violation';
    end;
  end if;

  return new;
end;
$$ language plpgsql security definer;

-- ============================================================
-- 3. Triggers
-- ============================================================

create trigger users_updated_at
  before update on public.users
  for each row execute function public.update_updated_at();

create trigger companies_updated_at
  before update on public.companies
  for each row execute function public.update_updated_at();

create trigger company_members_updated_at
  before update on public.company_members
  for each row execute function public.update_updated_at();

create trigger posts_updated_at
  before update on public.posts
  for each row execute function public.update_updated_at();

create trigger applications_updated_at
  before update on public.applications
  for each row execute function public.update_updated_at();

-- auth.users 作成時に public.users を自動同期
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── handle_auth_user_email_updated: auth email 確定後に public.users を同期 ─
create or replace function public.handle_auth_user_email_updated()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.users
     set email      = new.email,
         updated_at = now()
   where id = new.id
     and email is distinct from new.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_updated on auth.users;

create trigger on_auth_user_email_updated
  after update of email on auth.users
  for each row
  when (old.email is distinct from new.email)
  execute function public.handle_auth_user_email_updated();

-- ============================================================
-- 4. RLS 有効化
-- ============================================================

alter table public.users           enable row level security;
alter table public.companies       enable row level security;
alter table public.company_members enable row level security;
alter table public.posts           enable row level security;
alter table public.applications    enable row level security;

-- ============================================================
-- 5. GRANTS
-- ============================================================
-- GRANT は「テーブルへの入口」のみを開ける。
-- 行レベルの制御は Section 6〜10 の RLS ポリシーが担う。
--
-- 切り分け方:
--   permission denied → GRANT 不足（RLS に到達していない）
--   0件取得 / エラー  → RLS ポリシー不足（GRANT は通過済み）
--
-- anon（未ログイン）には一切付与しない。
-- service_role: API Route 内の admin client（service role key）が使用する。
--   新形式キー（sb_secret_xxx）では明示的 GRANT が必要。
--   RLS は BYPASSRLS 属性でスキップされるが、テーブル GRANT は別途必要。

-- service_role: 全テーブルへの全操作権限（RLS バイパスで使用する管理用ロール）
GRANT ALL ON public.users           TO service_role;
GRANT ALL ON public.companies       TO service_role;
GRANT ALL ON public.company_members TO service_role;
GRANT ALL ON public.posts           TO service_role;
GRANT ALL ON public.applications    TO service_role;

-- users: 参照（自分・管理者）／自分のプロフィール更新
GRANT SELECT, UPDATE ON public.users TO authenticated;

-- companies: 参照（全認証済み）／管理者が会社を作成・更新
GRANT SELECT, INSERT, UPDATE ON public.companies TO authenticated;

-- company_members: 参照・追加・削除（マイページでの会社所属変更に必要）
GRANT SELECT, INSERT, DELETE ON public.company_members TO authenticated;

-- posts: 参照・作成・更新（削除はアプリ動線なし）
GRANT SELECT, INSERT, UPDATE ON public.posts TO authenticated;

-- applications: 参照・作成・更新（削除はアプリ動線なし）
GRANT SELECT, INSERT, UPDATE ON public.applications TO authenticated;

-- ============================================================
-- 6. RLS ポリシー: users
--
-- GRANT: SELECT, UPDATE
-- 対応ポリシー:
--   SELECT: 自分 / ADMIN・MASTER_ADMIN は全件
--   UPDATE: 自分のみ
-- ============================================================

-- 自分のレコードを参照可能
create policy "users: select own" on public.users
  for select using (id = auth.uid());

-- ADMIN / MASTER_ADMIN は全件参照可能
create policy "users: admin or master select all" on public.users
  for select using (public.get_user_role() in ('ADMIN', 'MASTER_ADMIN'));

-- 自分のレコードのみ更新可能
create policy "users: update own" on public.users
  for update using (id = auth.uid());

-- ============================================================
-- 7. RLS ポリシー: companies
--
-- GRANT: SELECT, INSERT, UPDATE（DELETE なし）
-- 対応ポリシー:
--   SELECT: 全認証済みユーザー
--   INSERT: ADMIN / MASTER_ADMIN
--   UPDATE: ADMIN / MASTER_ADMIN
-- ============================================================

-- 認証済み全ユーザーが会社名を参照可能（UI 表示に必要）
create policy "companies: select all authenticated" on public.companies
  for select using (auth.role() = 'authenticated');

-- ADMIN / MASTER_ADMIN: 会社を作成可能
create policy "companies: admin or master insert" on public.companies
  for insert with check (public.get_user_role() in ('ADMIN', 'MASTER_ADMIN'));

-- ADMIN / MASTER_ADMIN: 会社情報を更新可能
create policy "companies: admin or master update" on public.companies
  for update
  using  (public.get_user_role() in ('ADMIN', 'MASTER_ADMIN'))
  with check (public.get_user_role() in ('ADMIN', 'MASTER_ADMIN'));

-- ============================================================
-- 8. RLS ポリシー: company_members
--
-- GRANT: SELECT のみ（INSERT / UPDATE / DELETE は現時点で不要）
-- 対応ポリシー:
--   SELECT: 自分の所属 / ADMIN は自社メンバー / MASTER_ADMIN は全件
-- ============================================================

-- 自分の所属レコードを参照可能（全ロール共通）
create policy "company_members: select own" on public.company_members
  for select using (user_id = auth.uid());

-- MASTER_ADMIN: 全 company_members を参照可能
create policy "company_members: master_admin select all" on public.company_members
  for select using (public.get_user_role() = 'MASTER_ADMIN');

-- ADMIN: active 所属会社の company_members を参照可能
create policy "company_members: admin select own company" on public.company_members
  for select using (
    public.get_user_role() = 'ADMIN'
    and company_id = any(public.get_user_company_ids())
  );

-- 全認証済みユーザー: 自分の所属を追加可能（マイページでの会社設定に必要）
create policy "company_members: user insert own" on public.company_members
  for insert with check (user_id = auth.uid());

-- 全認証済みユーザー: 自分の所属を削除可能（マイページでの会社変更に必要）
create policy "company_members: user delete own" on public.company_members
  for delete using (user_id = auth.uid());

-- ============================================================
-- 9. RLS ポリシー: posts
--
-- GRANT: SELECT, INSERT, UPDATE（DELETE なし）
-- 対応ポリシー:
--   SELECT:
--     USER        → OPEN / IN_PROGRESS の全社投稿 + 自分の CASUAL 投稿
--     ADMIN       → OPEN / IN_PROGRESS の全社投稿 + 自社の全ステータス投稿
--     MASTER_ADMIN → 全件
--   INSERT:
--     USER        → CASUAL のみ・自分名義
--     ADMIN       → active 所属会社・自分名義
--     MASTER_ADMIN → 全件
--   UPDATE:
--     USER        → 自分の CASUAL 投稿のみ
--     ADMIN       → 自分が作成した自社投稿のみ
--     MASTER_ADMIN → 全件
-- ============================================================

-- USER: OPEN / IN_PROGRESS の投稿を閲覧可能（全社）
create policy "posts: user select open" on public.posts
  for select using (
    public.get_user_role() = 'USER'
    and post_status in ('OPEN', 'IN_PROGRESS')
  );

-- USER: 自分の CASUAL 投稿はステータスを問わず参照可能
create policy "posts: user select own casual" on public.posts
  for select using (
    public.get_user_role() = 'USER'
    and post_type = 'CASUAL'
    and created_by_user_id = auth.uid()
  );

-- USER: CASUAL 投稿のみ作成可能
create policy "posts: user insert casual" on public.posts
  for insert with check (
    public.get_user_role() = 'USER'
    and post_type = 'CASUAL'
    and created_by_user_id = auth.uid()
  );

-- USER: 自分の CASUAL 投稿のみ更新可能
create policy "posts: user update own casual" on public.posts
  for update using (
    public.get_user_role() = 'USER'
    and post_type = 'CASUAL'
    and created_by_user_id = auth.uid()
  );

-- MASTER_ADMIN: 全件操作可能（SELECT / INSERT / UPDATE）
create policy "posts: master_admin all" on public.posts
  for all
  using  (public.get_user_role() = 'MASTER_ADMIN')
  with check (public.get_user_role() = 'MASTER_ADMIN');

-- ADMIN SELECT:
--   (A) OPEN / IN_PROGRESS なら全社分閲覧可（案件一覧）
--   (B) 自社の投稿はステータスを問わず閲覧可（投稿管理）
create policy "posts: admin select" on public.posts
  for select using (
    public.get_user_role() = 'ADMIN'
    and (
      post_status in ('OPEN', 'IN_PROGRESS')
      or company_id = any(public.get_user_company_ids())
    )
  );

-- ADMIN INSERT: active 所属会社かつ自分が created_by_user_id
create policy "posts: admin insert own company" on public.posts
  for insert with check (
    public.get_user_role() = 'ADMIN'
    and company_id = any(public.get_user_company_ids())
    and created_by_user_id = auth.uid()
  );

-- ADMIN UPDATE: 自分が投稿した（かつ active 所属会社）のみ
create policy "posts: admin update own" on public.posts
  for update
  using (
    public.get_user_role() = 'ADMIN'
    and created_by_user_id = auth.uid()
    and company_id = any(public.get_user_company_ids())
  )
  with check (
    public.get_user_role() = 'ADMIN'
    and created_by_user_id = auth.uid()
    and company_id = any(public.get_user_company_ids())
  );

-- ============================================================
-- 10. RLS ポリシー: applications
--
-- GRANT: SELECT, INSERT, UPDATE（DELETE なし）
-- 対応ポリシー:
--   SELECT:
--     応募者      → 自分の応募
--     投稿オーナー → 自分の投稿に届いた応募（CASUAL 投稿 USER 含む）
--     ADMIN       → active 所属会社の投稿への応募
--     MASTER_ADMIN → 全件
--   INSERT:
--     全認証済み  → 自分名義のみ
--   UPDATE:
--     ADMIN       → active 所属会社の投稿への応募ステータス変更
--     MASTER_ADMIN → 全件
-- ============================================================

-- 応募者: 自分の応募を参照可能
create policy "applications: applicant select own" on public.applications
  for select using (applicant_user_id = auth.uid());

-- 投稿オーナー: 自分の投稿に届いた応募を参照可能
-- （CASUAL 投稿を持つ USER が受信した応募を確認できるようにする）
create policy "applications: post owner select" on public.applications
  for select using (
    post_id in (
      select id from public.posts
      where created_by_user_id = auth.uid()
    )
  );

-- 応募作成: 自分名義のみ可能（ログインユーザー本人）
create policy "applications: applicant insert" on public.applications
  for insert with check (applicant_user_id = auth.uid());

-- MASTER_ADMIN: 全件操作可能（SELECT / INSERT / UPDATE）
create policy "applications: master_admin all" on public.applications
  for all
  using  (public.get_user_role() = 'MASTER_ADMIN')
  with check (public.get_user_role() = 'MASTER_ADMIN');

-- ADMIN SELECT: active 所属会社の投稿への応募を閲覧可能
create policy "applications: admin select own company" on public.applications
  for select using (
    public.get_user_role() = 'ADMIN'
    and post_id in (
      select id from public.posts
      where company_id = any(public.get_user_company_ids())
    )
  );

-- ADMIN UPDATE: active 所属会社の投稿への応募ステータス変更可能
create policy "applications: admin update own company" on public.applications
  for update
  using (
    public.get_user_role() = 'ADMIN'
    and post_id in (
      select id from public.posts
      where company_id = any(public.get_user_company_ids())
    )
  )
  with check (
    public.get_user_role() = 'ADMIN'
    and post_id in (
      select id from public.posts
      where company_id = any(public.get_user_company_ids())
    )
  );

-- ============================================================
-- 11. Storage
-- ============================================================

-- thumbnails バケット（公開バケット / 最大 5MB / 画像のみ）
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'thumbnails',
  'thumbnails',
  true,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

-- 認証済みユーザーは自分のフォルダにアップロード可能
-- パス形式: thumbnails/{user_id}/{filename}
create policy "thumbnails: authenticated upload own folder"
  on storage.objects for insert
  with check (
    bucket_id = 'thumbnails'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- 認証済みユーザーは自分のファイルを更新可能
create policy "thumbnails: authenticated update own"
  on storage.objects for update
  using (
    bucket_id = 'thumbnails'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- 認証済みユーザーは自分のファイルを削除可能
create policy "thumbnails: authenticated delete own"
  on storage.objects for delete
  using (
    bucket_id = 'thumbnails'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- 全員が thumbnails バケットのファイルを閲覧可能（public バケット補助）
create policy "thumbnails: public select"
  on storage.objects for select
  using (bucket_id = 'thumbnails');

-- ============================================================
-- 12. companies 初期データ（会社マスタのみ）
-- ============================================================
-- 本番に近い構成で空 DB を作成する場合、company マスタは必要なため含める。
-- users / posts / applications などの検証データは 002_seed_dev.sql で投入する。

insert into public.companies (id, name) values
  ('11111111-1111-1111-1111-111111111111', 'T''s agency holdings'),
  ('22222222-2222-2222-2222-222222222222', 'ゼロプライド株式会社'),
  ('33333333-3333-3333-3333-333333333333', '株式会社ULTI-ME'),
  ('44444444-4444-4444-4444-444444444444', '株式会社T''s grace'),
  ('55555555-5555-5555-5555-555555555555', '株式会社TSHD'),
  ('66666666-6666-6666-6666-666666666666', '株式会社T''s Nexus Solution')
on conflict (id) do nothing;

-- ============================================================
-- 13. email 補正（既存環境向け・新規 DB では no-op）
-- ============================================================
-- auth.users と public.users の email が乖離している場合に補正する。
-- 新規 DB にはデータが存在しないため、このクエリは何も変更しない。

update public.users pu
   set email      = au.email,
       updated_at = now()
  from auth.users au
 where pu.id = au.id
   and pu.email is distinct from au.email;
