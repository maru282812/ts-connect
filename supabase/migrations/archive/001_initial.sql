-- ============================================================
-- WorkMarket 初期マイグレーション
-- ============================================================

-- ============================================================
-- 1. users テーブル
-- ============================================================
create table if not exists public.users (
  id             uuid        primary key references auth.users(id) on delete cascade,
  email          text        unique not null,
  display_name   text        not null,
  system_role    text        not null default 'USER'
                             check (system_role in ('ADMIN', 'USER')),
  account_status text        not null default 'ACTIVE'
                             check (account_status in ('ACTIVE', 'PRO', 'SUSPENDED')),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ============================================================
-- 2. companies テーブル
-- ============================================================
create table if not exists public.companies (
  id         uuid        primary key default gen_random_uuid(),
  name       text        not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- 3. company_members テーブル
-- ============================================================
create table if not exists public.company_members (
  id              uuid        primary key default gen_random_uuid(),
  user_id         uuid        not null references public.users(id) on delete cascade,
  company_id      uuid        not null references public.companies(id) on delete cascade,
  membership_role text        not null default 'USER'
                              check (membership_role in ('ADMIN', 'USER')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (user_id, company_id)
);

-- ============================================================
-- 4. posts テーブル
-- ============================================================
create table if not exists public.posts (
  id                          uuid        primary key default gen_random_uuid(),
  company_id                  uuid        not null references public.companies(id) on delete cascade,
  created_by_user_id          uuid        not null references public.users(id) on delete cascade,
  title                       text        not null,
  body                        text        not null,
  post_type                   text        not null default 'OFFICIAL'
                                          check (post_type in ('OFFICIAL', 'CASUAL')),
  post_status                 text        not null default 'DRAFT'
                                          check (post_status in ('DRAFT', 'PUBLISHED', 'CLOSED')),
  price_text                  text        null,
  contact_person_name         text        null,
  deadline_at                 timestamptz null,
  published_at                timestamptz null,
  closed_at                   timestamptz null,
  application_limit           int         null,
  is_application_limit_enabled boolean   not null default false,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

-- インデックス
create index if not exists posts_post_type_idx    on public.posts(post_type);
create index if not exists posts_post_status_idx  on public.posts(post_status);
create index if not exists posts_company_id_idx   on public.posts(company_id);
create index if not exists posts_created_by_idx   on public.posts(created_by_user_id);
create index if not exists posts_search_idx       on public.posts using gin(to_tsvector('simple', title || ' ' || body));

-- ============================================================
-- 5. applications テーブル
-- ============================================================
create table if not exists public.applications (
  id                         uuid        primary key default gen_random_uuid(),
  post_id                    uuid        not null references public.posts(id) on delete cascade,
  applicant_user_id          uuid        not null references public.users(id) on delete cascade,
  message                    text        null,
  application_type           text        not null
                                         check (application_type in ('APPLY', 'INQUIRY')),
  application_status         text        not null default 'APPLIED'
                                         check (application_status in ('APPLIED', 'REVIEWING', 'ACCEPTED', 'REJECTED', 'CANCELED', 'INQUIRY')),
  applicant_email_snapshot   text        not null,
  applicant_name_snapshot    text        not null,
  applicant_company_snapshot text        null,
  post_title_snapshot        text        not null,
  application_sequence       int         null,
  applied_at                 timestamptz not null default now(),
  reviewed_at                timestamptz null,
  created_at                 timestamptz not null default now(),
  updated_at                 timestamptz not null default now()
);

-- インデックス
create index if not exists applications_applicant_idx on public.applications(applicant_user_id);
create index if not exists applications_post_idx      on public.applications(post_id);
create index if not exists applications_applied_at_idx on public.applications(applied_at desc);

-- ============================================================
-- 6. updated_at 自動更新トリガー
-- ============================================================
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

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

-- ============================================================
-- 7. auth.users → public.users 同期トリガー
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, display_name, system_role, account_status)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'system_role', 'USER'),
    'ACTIVE'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- 8. RLS (Row Level Security) 有効化
-- ============================================================
alter table public.users           enable row level security;
alter table public.companies       enable row level security;
alter table public.company_members enable row level security;
alter table public.posts           enable row level security;
alter table public.applications    enable row level security;

-- ============================================================
-- 9. RLS ポリシー: users
-- ============================================================
-- ヘルパー関数: system_role 取得
create or replace function public.get_user_role()
returns text as $$
  select system_role from public.users where id = auth.uid()
$$ language sql security definer stable;

-- 自分のレコードは参照可能
create policy "users: select own" on public.users
  for select using (id = auth.uid());

-- ADMIN は全件参照可能
create policy "users: admin select all" on public.users
  for select using (public.get_user_role() = 'ADMIN');

-- 自分のレコードは更新可能
create policy "users: update own" on public.users
  for update using (id = auth.uid());

-- ============================================================
-- 10. RLS ポリシー: companies
-- ============================================================
-- 全ユーザーが参照可能（会社名の表示に必要）
create policy "companies: select all authenticated" on public.companies
  for select using (auth.role() = 'authenticated');

-- ADMIN のみ操作可能
create policy "companies: admin all" on public.companies
  for all using (public.get_user_role() = 'ADMIN');

-- ============================================================
-- 11. RLS ポリシー: company_members
-- ============================================================
create policy "company_members: select own" on public.company_members
  for select using (user_id = auth.uid());

create policy "company_members: admin all" on public.company_members
  for all using (public.get_user_role() = 'ADMIN');

-- ============================================================
-- 12. RLS ポリシー: posts
-- ============================================================
-- USER: PUBLISHED 投稿のみ参照可能
create policy "posts: user select published" on public.posts
  for select using (
    public.get_user_role() = 'USER'
    and post_status = 'PUBLISHED'
  );

-- ADMIN: 全件参照・操作可能
create policy "posts: admin all" on public.posts
  for all using (public.get_user_role() = 'ADMIN');

-- USER: CASUAL 投稿のみ作成可能
create policy "posts: user insert casual" on public.posts
  for insert with check (
    public.get_user_role() = 'USER'
    and post_type = 'CASUAL'
    and created_by_user_id = auth.uid()
  );

-- USER: 自分の CASUAL 投稿のみ更新可能（将来拡張用）
create policy "posts: user update own casual" on public.posts
  for update using (
    public.get_user_role() = 'USER'
    and post_type = 'CASUAL'
    and created_by_user_id = auth.uid()
  );

-- ============================================================
-- 13. RLS ポリシー: applications
-- ============================================================
-- USER: 自分の応募のみ参照可能
create policy "applications: user select own" on public.applications
  for select using (applicant_user_id = auth.uid());

-- USER: 応募作成可能
create policy "applications: user insert" on public.applications
  for insert with check (applicant_user_id = auth.uid());

-- ADMIN: 全件参照可能
create policy "applications: admin all" on public.applications
  for all using (public.get_user_role() = 'ADMIN');
