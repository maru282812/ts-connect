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
-- Phase 2+ 拡張対応:
--   Part 1: 既存テーブル拡張 (users / companies / posts / applications)
--   Part 2: ユーザー・会社系テーブル追加 (予定)
--   Part 3: 投稿・案件系テーブル追加 (予定)
--   Part 4: 応募・問い合わせ系テーブル追加 (予定)
--   Part 5: 通知・メール系テーブル追加 (予定)
--   Part 6: 管理画面系テーブル追加 (予定)
--   Part 7: 契約・納品・レビュー系テーブル追加 (予定)
--   Part 8: ポイント系テーブル追加 (予定)
--   Part 9: EC・注文系テーブル追加 (予定)
--   Part 10: 分析・ログ系テーブル追加 (予定)
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
  avatar_url         text,
  bio                text,
  system_role        text        not null default 'USER'
                                 check (system_role in ('USER', 'ADMIN', 'MASTER_ADMIN')),
  account_status     text        not null default 'ACTIVE'
                                 check (account_status in ('ACTIVE', 'PRO', 'SUSPENDED', 'DELETED')),
  deleted_at         timestamptz,
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
  website_url          text,
  industry             text,
  size_range           text        check (size_range in ('1-10', '11-50', '51-200', '201-500', '501-1000', '1000+')),
  prefecture           text,
  address              text,
  phone                text,
  deleted_at           timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- ── company_members ────────────────────────────────────────
create table if not exists public.company_members (
  id            uuid        primary key default gen_random_uuid(),
  user_id       uuid        not null references public.users(id) on delete cascade,
  company_id    uuid        not null references public.companies(id) on delete cascade,
  department_id uuid,       -- FK to departments は departments 作成後に ALTER TABLE で追加
  role          text        not null default 'USER'
                            check (role in ('ADMIN', 'USER')),
  job_title     text,
  status        text        not null default 'active'
                            check (status in ('active', 'inactive')),
  joined_at     timestamptz not null default now(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (user_id, company_id)
);

-- ── posts ──────────────────────────────────────────────────
create table if not exists public.posts (
  id                           uuid        primary key default gen_random_uuid(),
  company_id                   uuid        not null references public.companies(id) on delete cascade,
  created_by_user_id           uuid        not null references public.users(id) on delete cascade,
  category_id                  uuid,       -- FK to post_categories は Part 3 で追加
  title                        text        not null,
  body                         text        not null,
  post_type                    text        not null default 'OFFICIAL'
                                           check (post_type in ('OFFICIAL', 'CASUAL')),
  post_status                  text        not null default 'DRAFT'
                                           check (post_status in ('DRAFT', 'OPEN', 'IN_PROGRESS', 'CLOSED', 'ARCHIVED')),
  price_text                   text,
  contact_person_name          text,
  requirements                 text,
  reference_url                text,
  thumbnail_url                text,
  recruit_count                int         not null default 1,
  application_limit            int,
  is_application_limit_enabled boolean     not null default false,
  is_featured                  boolean     not null default false,
  is_recommended               boolean     not null default false,
  deadline_at                  timestamptz,
  scheduled_publish_at         timestamptz,
  published_at                 timestamptz,
  closed_at                    timestamptz,
  archived_at                  timestamptz,
  deleted_at                   timestamptz,
  view_count                   int         not null default 0,
  application_count            int         not null default 0,
  created_at                   timestamptz not null default now(),
  updated_at                   timestamptz not null default now()
);

create index if not exists posts_post_type_idx    on public.posts(post_type);
create index if not exists posts_post_status_idx  on public.posts(post_status);
create index if not exists posts_company_id_idx   on public.posts(company_id);
create index if not exists posts_created_by_idx   on public.posts(created_by_user_id);
create index if not exists posts_featured_idx     on public.posts(is_featured) where is_featured = true;
create index if not exists posts_recommended_idx  on public.posts(is_recommended) where is_recommended = true;
create index if not exists posts_deleted_at_idx   on public.posts(deleted_at) where deleted_at is null;
create index if not exists posts_search_idx       on public.posts using gin(to_tsvector('simple', title || ' ' || body));

-- ── applications ───────────────────────────────────────────
create table if not exists public.applications (
  id                         uuid        primary key default gen_random_uuid(),
  post_id                    uuid        not null references public.posts(id) on delete cascade,
  applicant_user_id          uuid        not null references public.users(id) on delete cascade,
  message                    text,
  application_type           text        not null
                                         check (application_type in ('APPLY', 'INQUIRY')),
  application_status         text        not null default 'APPLIED'
                                         check (application_status in (
                                           'APPLIED', 'REVIEWING', 'ACCEPTED', 'REJECTED',
                                           'CANCELED', 'INQUIRY', 'COMPLETED', 'WITHDRAWN'
                                         )),
  applicant_email_snapshot   text        not null,
  applicant_name_snapshot    text        not null,
  applicant_company_snapshot text,
  post_title_snapshot        text        not null,
  application_sequence       int,
  cancel_reason              text,
  reject_reason              text,
  applied_at                 timestamptz not null default now(),
  reviewed_at                timestamptz,
  completed_at               timestamptz,
  deleted_at                 timestamptz,
  created_at                 timestamptz not null default now(),
  updated_at                 timestamptz not null default now(),
  unique (post_id, applicant_user_id, application_type)
);

create index if not exists applications_applicant_idx  on public.applications(applicant_user_id);
create index if not exists applications_post_idx       on public.applications(post_id);
create index if not exists applications_applied_at_idx on public.applications(applied_at desc);
create index if not exists applications_status_idx     on public.applications(application_status);
create index if not exists applications_deleted_at_idx on public.applications(deleted_at) where deleted_at is null;

-- ============================================================
-- 1b. テーブル追加: ユーザー・会社系 (Part 2)
-- ============================================================

-- ── user_profiles ──────────────────────────────────────────
-- ユーザー拡張プロフィール。スキル・ポートフォリオ・稼働状況を管理する。
-- Phase 2: マイページ・ユーザー検索画面で使用。
create table if not exists public.user_profiles (
  id                   uuid        primary key default gen_random_uuid(),
  user_id              uuid        not null unique references public.users(id) on delete cascade,
  skills               text[],
  portfolio_url        text,
  linkedin_url         text,
  github_url           text,
  twitter_url          text,
  availability         text        check (availability in ('AVAILABLE', 'PART_TIME', 'UNAVAILABLE')),
  preferred_work_style text[],     -- 'REMOTE' / 'ONSITE' / 'HYBRID'
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- ── user_settings ──────────────────────────────────────────
-- ユーザーごとの通知・UI 設定。
-- Phase 2: 設定画面で使用。
create table if not exists public.user_settings (
  id                           uuid    primary key default gen_random_uuid(),
  user_id                      uuid    not null unique references public.users(id) on delete cascade,
  notify_new_application       boolean not null default true,
  notify_application_status    boolean not null default true,
  notify_message               boolean not null default true,
  notify_announcement          boolean not null default true,
  email_notify_new_application boolean not null default true,
  email_notify_status_change   boolean not null default true,
  language                     text    not null default 'ja',
  timezone                     text    not null default 'Asia/Tokyo',
  created_at                   timestamptz not null default now(),
  updated_at                   timestamptz not null default now()
);

-- ── user_status_histories ──────────────────────────────────
-- users.account_status の変更履歴。変更者・理由を記録する。
-- Phase 2: 管理画面のユーザー管理で使用。
create table if not exists public.user_status_histories (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references public.users(id) on delete cascade,
  from_status text        not null,
  to_status   text        not null,
  changed_by  uuid        references public.users(id),
  reason      text,
  created_at  timestamptz not null default now()
);

create index if not exists user_status_hist_user_idx on public.user_status_histories(user_id);

-- ── departments ────────────────────────────────────────────
-- 会社の部署マスタ。親子構造（parent_id）で階層部署に対応。
-- Phase 2: 会社管理画面・メンバー管理で使用。
create table if not exists public.departments (
  id          uuid        primary key default gen_random_uuid(),
  company_id  uuid        not null references public.companies(id) on delete cascade,
  name        text        not null,
  description text,
  parent_id   uuid        references public.departments(id),
  sort_order  int         not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists departments_company_id_idx on public.departments(company_id);

-- company_members.department_id FK を departments 作成後に付与
alter table public.company_members
  add constraint company_members_department_id_fkey
  foreign key (department_id) references public.departments(id);

-- ── company_invitations ────────────────────────────────────
-- 会社への招待管理。トークンベースで期限付き招待リンクを発行する。
-- Phase 2: 会社メンバー招待機能で使用。
create table if not exists public.company_invitations (
  id          uuid        primary key default gen_random_uuid(),
  company_id  uuid        not null references public.companies(id) on delete cascade,
  invited_by  uuid        not null references public.users(id),
  email       text        not null,
  role        text        not null default 'USER'
              check (role in ('ADMIN', 'USER')),
  token       text        not null unique default gen_random_uuid()::text,
  status      text        not null default 'PENDING'
              check (status in ('PENDING', 'ACCEPTED', 'EXPIRED', 'CANCELED')),
  expires_at  timestamptz not null default now() + interval '7 days',
  accepted_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists company_invitations_company_idx on public.company_invitations(company_id);
create index if not exists company_invitations_email_idx   on public.company_invitations(email);

-- ── company_settings ───────────────────────────────────────
-- 会社ごとの運用設定。投稿上限・通知先・応募ルールを管理する。
-- Phase 2: 会社設定画面で使用。
create table if not exists public.company_settings (
  id                          uuid    primary key default gen_random_uuid(),
  company_id                  uuid    not null unique references public.companies(id) on delete cascade,
  max_active_posts            int     not null default 10,
  application_auto_close_days int,
  notification_emails         text[],
  allow_casual_posts          boolean not null default true,
  require_application_message boolean not null default false,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

-- ============================================================
-- 1c. テーブル追加: 投稿・案件系 (Part 3)
-- ============================================================

-- ── post_categories ────────────────────────────────────────
-- 投稿カテゴリマスタ。MASTER_ADMIN が管理し、投稿に紐付ける。
-- Phase 2: 投稿作成・検索フィルターで使用。
create table if not exists public.post_categories (
  id          uuid        primary key default gen_random_uuid(),
  name        text        not null unique,
  slug        text        not null unique,
  description text,
  sort_order  int         not null default 0,
  is_active   boolean     not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- posts.category_id FK を post_categories 作成後に付与
alter table public.posts
  add constraint posts_category_id_fkey
  foreign key (category_id) references public.post_categories(id);

-- ── post_files ─────────────────────────────────────────────
-- 投稿への添付ファイル・複数画像。sort_order で表示順を制御する。
-- Phase 2: 投稿詳細画面の画像ギャラリー・ファイルダウンロードで使用。
create table if not exists public.post_files (
  id          uuid        primary key default gen_random_uuid(),
  post_id     uuid        not null references public.posts(id) on delete cascade,
  uploaded_by uuid        not null references public.users(id),
  file_url    text        not null,
  file_type   text        not null default 'IMAGE'
              check (file_type in ('IMAGE', 'DOCUMENT', 'VIDEO', 'OTHER')),
  file_name   text        not null,
  file_size   bigint      not null default 0,
  mime_type   text,
  sort_order  int         not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists post_files_post_id_idx on public.post_files(post_id);

-- ── post_tags ──────────────────────────────────────────────
-- 投稿タグマスタ。MASTER_ADMIN が管理し、複数付与可能。
-- Phase 2: 投稿検索・タグフィルターで使用。
create table if not exists public.post_tags (
  id         uuid        primary key default gen_random_uuid(),
  name       text        not null unique,
  slug       text        not null unique,
  color      text,
  is_active  boolean     not null default true,
  created_at timestamptz not null default now()
);

-- ── post_tag_relations ─────────────────────────────────────
-- 投稿とタグの中間テーブル。1投稿に複数タグを付与できる。
-- Phase 2: 投稿タグ管理・タグ検索で使用。
create table if not exists public.post_tag_relations (
  id      uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  tag_id  uuid not null references public.post_tags(id) on delete cascade,
  unique (post_id, tag_id)
);

create index if not exists post_tag_rel_post_idx on public.post_tag_relations(post_id);
create index if not exists post_tag_rel_tag_idx  on public.post_tag_relations(tag_id);

-- ── post_status_histories ──────────────────────────────────
-- 投稿ステータス変更履歴。変更者・理由を追記専用で記録する。
-- Phase 2: 投稿管理画面の操作ログで使用。
create table if not exists public.post_status_histories (
  id          uuid        primary key default gen_random_uuid(),
  post_id     uuid        not null references public.posts(id) on delete cascade,
  from_status text        not null,
  to_status   text        not null,
  changed_by  uuid        not null references public.users(id),
  reason      text,
  created_at  timestamptz not null default now()
);

create index if not exists post_status_hist_post_idx on public.post_status_histories(post_id);

-- ── featured_posts ─────────────────────────────────────────
-- ピックアップ・おすすめ投稿の表示管理。期間・種別・表示順を制御する。
-- Phase 2: トップページのピックアップ枠・おすすめ枠で使用。
create table if not exists public.featured_posts (
  id           uuid        primary key default gen_random_uuid(),
  post_id      uuid        not null unique references public.posts(id) on delete cascade,
  feature_type text        not null default 'FEATURED'
               check (feature_type in ('FEATURED', 'RECOMMENDED', 'BANNER')),
  sort_order   int         not null default 0,
  starts_at    timestamptz not null default now(),
  ends_at      timestamptz,
  created_by   uuid        not null references public.users(id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists featured_posts_type_idx     on public.featured_posts(feature_type);
create index if not exists featured_posts_starts_at_idx on public.featured_posts(starts_at);

-- ── post_templates ─────────────────────────────────────────
-- 投稿テンプレート。会社内で再利用できる投稿の雛形を管理する。
-- Phase 2: 投稿作成画面のテンプレート選択で使用。
create table if not exists public.post_templates (
  id                 uuid        primary key default gen_random_uuid(),
  company_id         uuid        not null references public.companies(id) on delete cascade,
  created_by_user_id uuid        not null references public.users(id),
  title              text        not null,
  body               text        not null,
  post_type          text        not null default 'OFFICIAL'
                     check (post_type in ('OFFICIAL', 'CASUAL')),
  category_id        uuid        references public.post_categories(id),
  price_text         text,
  requirements       text,
  is_shared          boolean     not null default false,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists post_templates_company_idx on public.post_templates(company_id);

-- ── post_bookmarks ─────────────────────────────────────────
-- ユーザーのお気に入り投稿。自分のみ参照・追加・削除できる。
-- Phase 2: 投稿一覧・詳細のブックマークボタン、マイページで使用。
create table if not exists public.post_bookmarks (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references public.users(id) on delete cascade,
  post_id    uuid        not null references public.posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, post_id)
);

create index if not exists post_bookmarks_user_idx on public.post_bookmarks(user_id);
create index if not exists post_bookmarks_post_idx on public.post_bookmarks(post_id);

-- ── post_view_logs ─────────────────────────────────────────
-- 投稿閲覧ログ。未ログイン分は user_id = NULL で記録する。
-- Phase 2: 投稿の閲覧数集計・CVR分析で使用。
create table if not exists public.post_view_logs (
  id         uuid        primary key default gen_random_uuid(),
  post_id    uuid        not null references public.posts(id) on delete cascade,
  user_id    uuid        references public.users(id),
  ip_hash    text,
  user_agent text,
  viewed_at  timestamptz not null default now()
);

create index if not exists post_view_logs_post_idx      on public.post_view_logs(post_id);
create index if not exists post_view_logs_user_idx      on public.post_view_logs(user_id);
create index if not exists post_view_logs_viewed_at_idx on public.post_view_logs(viewed_at desc);

-- ── post_reports ───────────────────────────────────────────
-- 投稿通報。ユーザーが不適切な投稿を報告し、管理者がレビューする。
-- Phase 2: 投稿詳細画面の通報ボタン・管理画面のモデレーションで使用。
create table if not exists public.post_reports (
  id          uuid        primary key default gen_random_uuid(),
  post_id     uuid        not null references public.posts(id) on delete cascade,
  reported_by uuid        not null references public.users(id),
  reason      text        not null
              check (reason in ('SPAM', 'INAPPROPRIATE', 'MISLEADING', 'DUPLICATE', 'OTHER')),
  detail      text,
  status      text        not null default 'PENDING'
              check (status in ('PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED')),
  reviewed_by uuid        references public.users(id),
  reviewed_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists post_reports_post_idx    on public.post_reports(post_id);
create index if not exists post_reports_status_idx  on public.post_reports(status);

-- ============================================================
-- 1d. テーブル追加: 応募・問い合わせ系 (Part 4)
-- ============================================================

-- ── application_messages ───────────────────────────────────
-- 応募・聞いてみる のメッセージスレッド。応募者と企業側が往来するチャット。
-- Phase 2: 応募詳細画面のメッセージ機能で使用。
create table if not exists public.application_messages (
  id             uuid        primary key default gen_random_uuid(),
  application_id uuid        not null references public.applications(id) on delete cascade,
  sender_user_id uuid        not null references public.users(id),
  body           text        not null,
  is_read        boolean     not null default false,
  deleted_at     timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists app_messages_app_idx    on public.application_messages(application_id);
create index if not exists app_messages_sender_idx on public.application_messages(sender_user_id);

-- ── application_status_histories ──────────────────────────
-- 応募ステータス変更履歴。誰がいつ変更したかを追記専用で記録する。
-- Phase 2: 応募管理画面の操作ログで使用。
create table if not exists public.application_status_histories (
  id             uuid        primary key default gen_random_uuid(),
  application_id uuid        not null references public.applications(id) on delete cascade,
  from_status    text        not null,
  to_status      text        not null,
  changed_by     uuid        not null references public.users(id),
  comment        text,
  created_at     timestamptz not null default now()
);

create index if not exists app_status_hist_app_idx on public.application_status_histories(application_id);

-- ── application_limits ─────────────────────────────────────
-- 会社ごとの応募上限・自己応募防止ルール。
-- Phase 2: 応募受付制御ロジックで参照。
create table if not exists public.application_limits (
  id                                  uuid    primary key default gen_random_uuid(),
  company_id                          uuid    not null unique references public.companies(id) on delete cascade,
  max_applications_per_user_per_post  int     not null default 1,
  max_applications_per_user_per_month int,
  prevent_self_application            boolean not null default true,
  created_at                          timestamptz not null default now(),
  updated_at                          timestamptz not null default now()
);

-- ── application_cancellations ──────────────────────────────
-- 応募キャンセル詳細記録。キャンセル理由を構造化して保持する。
-- Phase 2: キャンセル理由の分析・改善施策で使用。
create table if not exists public.application_cancellations (
  id             uuid        primary key default gen_random_uuid(),
  application_id uuid        not null unique references public.applications(id) on delete cascade,
  canceled_by    uuid        not null references public.users(id),
  reason_code    text        not null default 'OTHER'
                 check (reason_code in (
                   'SCHEDULE_CONFLICT', 'CHANGED_MIND',
                   'FOUND_ALTERNATIVE', 'NO_RESPONSE', 'OTHER'
                 )),
  reason_detail  text,
  created_at     timestamptz not null default now()
);

-- ── inquiries ──────────────────────────────────────────────
-- 投稿に紐付かない会社への直接問い合わせ。
-- Phase 2: 企業プロフィールページの「問い合わせ」フォームで使用。
create table if not exists public.inquiries (
  id             uuid        primary key default gen_random_uuid(),
  company_id     uuid        not null references public.companies(id) on delete cascade,
  sender_user_id uuid        not null references public.users(id),
  subject        text        not null,
  body           text        not null,
  status         text        not null default 'OPEN'
                 check (status in ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED')),
  resolved_by    uuid        references public.users(id),
  resolved_at    timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists inquiries_company_idx on public.inquiries(company_id);
create index if not exists inquiries_sender_idx  on public.inquiries(sender_user_id);

-- ── inquiry_messages ───────────────────────────────────────
-- 問い合わせのメッセージスレッド。
-- Phase 2: 問い合わせ詳細画面のメッセージ機能で使用。
create table if not exists public.inquiry_messages (
  id         uuid        primary key default gen_random_uuid(),
  inquiry_id uuid        not null references public.inquiries(id) on delete cascade,
  sender_id  uuid        not null references public.users(id),
  body       text        not null,
  is_read    boolean     not null default false,
  created_at timestamptz not null default now()
);

create index if not exists inquiry_messages_inquiry_idx on public.inquiry_messages(inquiry_id);

-- ============================================================
-- 1e. テーブル追加: 通知・メール系 (Part 5)
-- ============================================================

-- ── notifications ──────────────────────────────────────────
-- アプリ内通知。未読管理・イベント種別・関連リソースを保持する。
-- Phase 2: 通知ベルアイコン・通知一覧画面で使用。
create table if not exists public.notifications (
  id           uuid        primary key default gen_random_uuid(),
  user_id      uuid        not null references public.users(id) on delete cascade,
  type         text        not null
               check (type in (
                 'APPLICATION_RECEIVED', 'APPLICATION_STATUS_CHANGED',
                 'MESSAGE_RECEIVED', 'POST_CLOSED', 'INVITATION_RECEIVED',
                 'ANNOUNCEMENT', 'SYSTEM', 'POINT_GRANTED', 'REVIEW_RECEIVED'
               )),
  title        text        not null,
  body         text        not null,
  related_type text,
  related_id   uuid,
  is_read      boolean     not null default false,
  read_at      timestamptz,
  created_at   timestamptz not null default now()
);

create index if not exists notifications_user_idx      on public.notifications(user_id);
create index if not exists notifications_unread_idx    on public.notifications(user_id, is_read) where is_read = false;
create index if not exists notifications_created_at_idx on public.notifications(created_at desc);

-- ── notification_settings ──────────────────────────────────
-- イベント種別ごとの通知ON/OFF設定。user_settings より細かい粒度。
-- Phase 2: 通知設定画面で使用。
create table if not exists public.notification_settings (
  id         uuid    primary key default gen_random_uuid(),
  user_id    uuid    not null references public.users(id) on delete cascade,
  event_type text    not null,
  in_app     boolean not null default true,
  email      boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, event_type)
);

-- ── email_delivery_logs ────────────────────────────────────
-- Resend等による外部メール送信ログ。配信ステータスを追跡する。
-- Phase 2: メール送信管理・バウンス対応・デバッグで使用。
create table if not exists public.email_delivery_logs (
  id              uuid        primary key default gen_random_uuid(),
  to_email        text        not null,
  to_user_id      uuid        references public.users(id),
  subject         text        not null,
  template_key    text,
  status          text        not null default 'QUEUED'
                  check (status in ('QUEUED', 'SENT', 'DELIVERED', 'BOUNCED', 'FAILED', 'SPAM')),
  provider        text        not null default 'RESEND',
  provider_msg_id text,
  error_message   text,
  metadata        jsonb       not null default '{}',
  sent_at         timestamptz,
  delivered_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists email_logs_user_idx      on public.email_delivery_logs(to_user_id);
create index if not exists email_logs_status_idx    on public.email_delivery_logs(status);
create index if not exists email_logs_created_at_idx on public.email_delivery_logs(created_at desc);

-- ── email_templates ────────────────────────────────────────
-- メール文面テンプレート管理。変数プレースホルダーで動的生成。
-- Phase 2: Resend連携のメール送信処理で使用。
create table if not exists public.email_templates (
  id         uuid        primary key default gen_random_uuid(),
  key        text        not null unique,
  name       text        not null,
  subject    text        not null,
  body_html  text        not null,
  body_text  text,
  variables  text[],
  is_active  boolean     not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── notification_events ────────────────────────────────────
-- 通知イベント種別マスタ。イベントキーと表示名を管理する。
-- Phase 2: 通知設定画面のイベント一覧・通知送信処理で使用。
create table if not exists public.notification_events (
  id          uuid        primary key default gen_random_uuid(),
  event_key   text        not null unique,
  name        text        not null,
  description text,
  is_active   boolean     not null default true,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- 1f. テーブル追加: 管理画面系 (Part 6)
-- ============================================================

-- ── admin_audit_logs ───────────────────────────────────────
-- 管理者の操作ログ。変更前後のデータをJSONBで保持する。
-- Phase 2: 管理画面の操作履歴・不正操作検知で使用。
create table if not exists public.admin_audit_logs (
  id          uuid        primary key default gen_random_uuid(),
  admin_id    uuid        not null references public.users(id),
  action      text        not null,
  target_type text        not null,
  target_id   uuid        not null,
  before_data jsonb,
  after_data  jsonb,
  ip_address  text,
  user_agent  text,
  created_at  timestamptz not null default now()
);

create index if not exists admin_audit_admin_idx     on public.admin_audit_logs(admin_id);
create index if not exists admin_audit_target_idx    on public.admin_audit_logs(target_type, target_id);
create index if not exists admin_audit_created_at_idx on public.admin_audit_logs(created_at desc);

-- ── admin_notes ────────────────────────────────────────────
-- 管理者メモ。ユーザー・会社・投稿・応募に対して内部メモを残す。
-- Phase 2: 管理画面の各種詳細ページで使用。
create table if not exists public.admin_notes (
  id          uuid        primary key default gen_random_uuid(),
  admin_id    uuid        not null references public.users(id),
  target_type text        not null
              check (target_type in ('user', 'company', 'post', 'application')),
  target_id   uuid        not null,
  body        text        not null,
  is_pinned   boolean     not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists admin_notes_target_idx on public.admin_notes(target_type, target_id);

-- ── announcements ──────────────────────────────────────────
-- サービスお知らせ。ロール別・期間指定で表示制御する。
-- Phase 2: トップページのお知らせバナー・通知画面で使用。
create table if not exists public.announcements (
  id          uuid        primary key default gen_random_uuid(),
  title       text        not null,
  body        text        not null,
  type        text        not null default 'INFO'
              check (type in ('INFO', 'WARNING', 'MAINTENANCE', 'UPDATE')),
  target_role text        check (target_role in ('USER', 'ADMIN', 'MASTER_ADMIN', 'ALL')),
  is_active   boolean     not null default true,
  starts_at   timestamptz not null default now(),
  ends_at     timestamptz,
  created_by  uuid        not null references public.users(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists announcements_active_idx on public.announcements(is_active, starts_at, ends_at);

-- ── moderation_actions ─────────────────────────────────────
-- モデレーション操作記録。通報対応・非表示・アカウント停止等を記録。
-- Phase 2: 管理画面のモデレーション機能で使用。
create table if not exists public.moderation_actions (
  id           uuid        primary key default gen_random_uuid(),
  moderator_id uuid        not null references public.users(id),
  target_type  text        not null
               check (target_type in ('post', 'application', 'user', 'review')),
  target_id    uuid        not null,
  action       text        not null
               check (action in ('WARN', 'HIDE', 'DELETE', 'SUSPEND', 'UNSUSPEND', 'RESTORE')),
  reason       text        not null,
  note         text,
  created_at   timestamptz not null default now()
);

create index if not exists moderation_target_idx on public.moderation_actions(target_type, target_id);

-- ── system_settings ────────────────────────────────────────
-- システム設定KVストア。アプリ動作に影響するパラメータを管理する。
-- Phase 2: 管理画面のシステム設定・アプリ設定参照で使用。
create table if not exists public.system_settings (
  id          uuid        primary key default gen_random_uuid(),
  key         text        not null unique,
  value       text        not null,
  value_type  text        not null default 'string'
              check (value_type in ('string', 'number', 'boolean', 'json')),
  description text,
  updated_by  uuid        references public.users(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ── feature_flags ──────────────────────────────────────────
-- 機能フラグ。ロール別に機能ON/OFFを制御する。
-- Phase 2: 段階的ロールアウト・ベータ機能の制御で使用。
create table if not exists public.feature_flags (
  id           uuid    primary key default gen_random_uuid(),
  key          text    not null unique,
  is_enabled   boolean not null default false,
  description  text,
  target_roles text[],
  updated_by   uuid    references public.users(id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ============================================================
-- 1g. テーブル追加: 契約・納品・レビュー系 (Part 7)
-- ============================================================

-- ── contracts ──────────────────────────────────────────────
-- 応募成立後の契約管理。金額・期間・ステータスを保持する。
-- Phase 3: 契約管理画面・請求書発行で使用。
create table if not exists public.contracts (
  id                 uuid        primary key default gen_random_uuid(),
  application_id     uuid        not null unique references public.applications(id),
  post_id            uuid        not null references public.posts(id),
  company_id         uuid        not null references public.companies(id),
  contractor_user_id uuid        not null references public.users(id),
  title              text        not null,
  description        text,
  amount             int         not null default 0,
  currency           text        not null default 'JPY',
  status             text        not null default 'DRAFT'
                     check (status in ('DRAFT', 'PENDING', 'ACTIVE', 'COMPLETED', 'CANCELED', 'DISPUTED')),
  starts_at          timestamptz,
  ends_at            timestamptz,
  completed_at       timestamptz,
  canceled_at        timestamptz,
  deleted_at         timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists contracts_company_idx       on public.contracts(company_id);
create index if not exists contracts_contractor_idx    on public.contracts(contractor_user_id);
create index if not exists contracts_status_idx        on public.contracts(status);

-- ── contract_status_histories ──────────────────────────────
-- 契約ステータス変更履歴。追記専用。
-- Phase 3: 契約詳細画面の履歴タブで使用。
create table if not exists public.contract_status_histories (
  id          uuid        primary key default gen_random_uuid(),
  contract_id uuid        not null references public.contracts(id) on delete cascade,
  from_status text        not null,
  to_status   text        not null,
  changed_by  uuid        not null references public.users(id),
  reason      text,
  created_at  timestamptz not null default now()
);

create index if not exists contract_status_hist_idx on public.contract_status_histories(contract_id);

-- ── deliverables ───────────────────────────────────────────
-- 契約に紐付く納品物管理。承認・差し戻しフローを持つ。
-- Phase 3: 契約詳細画面の納品管理で使用。
create table if not exists public.deliverables (
  id           uuid        primary key default gen_random_uuid(),
  contract_id  uuid        not null references public.contracts(id) on delete cascade,
  submitted_by uuid        not null references public.users(id),
  title        text        not null,
  description  text,
  status       text        not null default 'PENDING'
               check (status in (
                 'PENDING', 'SUBMITTED', 'REVIEWING',
                 'APPROVED', 'REJECTED', 'REVISION_REQUESTED'
               )),
  submitted_at timestamptz,
  approved_at  timestamptz,
  rejected_at  timestamptz,
  due_at       timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists deliverables_contract_idx on public.deliverables(contract_id);

-- ── deliverable_files ──────────────────────────────────────
-- 納品物に添付されるファイル。
-- Phase 3: 納品詳細画面のファイルダウンロードで使用。
create table if not exists public.deliverable_files (
  id             uuid        primary key default gen_random_uuid(),
  deliverable_id uuid        not null references public.deliverables(id) on delete cascade,
  file_url       text        not null,
  file_name      text        not null,
  file_size      bigint      not null default 0,
  mime_type      text,
  created_at     timestamptz not null default now()
);

-- ── disputes ───────────────────────────────────────────────
-- 契約に関する紛争・異議申し立て。管理者が仲裁する。
-- Phase 3: 契約管理画面の紛争対応フローで使用。
create table if not exists public.disputes (
  id          uuid        primary key default gen_random_uuid(),
  contract_id uuid        not null references public.contracts(id),
  raised_by   uuid        not null references public.users(id),
  reason      text        not null,
  description text        not null,
  status      text        not null default 'OPEN'
              check (status in ('OPEN', 'INVESTIGATING', 'RESOLVED', 'CLOSED')),
  resolution  text,
  resolved_by uuid        references public.users(id),
  resolved_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists disputes_contract_idx on public.disputes(contract_id);

-- ── dispute_messages ───────────────────────────────────────
-- 紛争のメッセージスレッド。is_internal=true は管理者内部メモ。
-- Phase 3: 紛争対応画面のメッセージで使用。
create table if not exists public.dispute_messages (
  id          uuid        primary key default gen_random_uuid(),
  dispute_id  uuid        not null references public.disputes(id) on delete cascade,
  sender_id   uuid        not null references public.users(id),
  body        text        not null,
  is_internal boolean     not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists dispute_messages_dispute_idx on public.dispute_messages(dispute_id);

-- ── reviews ────────────────────────────────────────────────
-- 契約完了後のレビュー・評価。ユーザーまたは会社への評価を記録する。
-- Phase 3: ユーザー・会社プロフィールのレビューセクションで使用。
create table if not exists public.reviews (
  id                  uuid        primary key default gen_random_uuid(),
  contract_id         uuid        not null references public.contracts(id),
  reviewer_id         uuid        not null references public.users(id),
  reviewed_user_id    uuid        references public.users(id),
  reviewed_company_id uuid        references public.companies(id),
  rating              int         not null check (rating between 1 and 5),
  title               text,
  body                text        not null,
  is_public           boolean     not null default true,
  deleted_at          timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  check (
    (reviewed_user_id is not null and reviewed_company_id is null)
    or (reviewed_user_id is null and reviewed_company_id is not null)
  )
);

create index if not exists reviews_reviewed_user_idx    on public.reviews(reviewed_user_id);
create index if not exists reviews_reviewed_company_idx on public.reviews(reviewed_company_id);

-- ── review_replies ─────────────────────────────────────────
-- レビューへの返信。被評価者が1回だけ返信できる（unique on review_id）。
-- Phase 3: ユーザー・会社プロフィールのレビュー返信で使用。
create table if not exists public.review_replies (
  id         uuid        primary key default gen_random_uuid(),
  review_id  uuid        not null unique references public.reviews(id) on delete cascade,
  author_id  uuid        not null references public.users(id),
  body       text        not null,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── user_scores ────────────────────────────────────────────
-- ユーザーのレビュー集計スコア。レビュー追加時にアプリ層で更新する。
-- Phase 3: ユーザープロフィールの評価表示で使用。
create table if not exists public.user_scores (
  id                       uuid    primary key default gen_random_uuid(),
  user_id                  uuid    not null unique references public.users(id) on delete cascade,
  average_rating           numeric(3,2) not null default 0,
  review_count             int     not null default 0,
  completed_contract_count int     not null default 0,
  updated_at               timestamptz not null default now()
);

-- ── company_scores ─────────────────────────────────────────
-- 会社のレビュー集計スコア。レビュー追加時にアプリ層で更新する。
-- Phase 3: 会社プロフィールの評価表示で使用。
create table if not exists public.company_scores (
  id             uuid    primary key default gen_random_uuid(),
  company_id     uuid    not null unique references public.companies(id) on delete cascade,
  average_rating numeric(3,2) not null default 0,
  review_count   int     not null default 0,
  updated_at     timestamptz not null default now()
);

-- ============================================================
-- 1h. テーブル追加: ポイント・社内通貨系 (Part 8)
-- ============================================================

-- ── wallets ────────────────────────────────────────────────
-- ユーザーのポイント残高管理。balance は常に 0 以上を保証する。
-- Phase 4: ポイント残高表示・ポイント決済で使用。
create table if not exists public.wallets (
  id           uuid    primary key default gen_random_uuid(),
  user_id      uuid    not null unique references public.users(id) on delete cascade,
  balance      int     not null default 0 check (balance >= 0),
  total_earned int     not null default 0,
  total_spent  int     not null default 0,
  currency     text    not null default 'POINT',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ── point_transactions ─────────────────────────────────────
-- ポイント取引履歴。付与・消費・期限切れ・管理操作をすべて記録する。
-- Phase 4: ポイント履歴画面・残高計算で使用。
create table if not exists public.point_transactions (
  id               uuid        primary key default gen_random_uuid(),
  wallet_id        uuid        not null references public.wallets(id) on delete cascade,
  user_id          uuid        not null references public.users(id),
  transaction_type text        not null
                   check (transaction_type in (
                     'EARN', 'SPEND', 'EXPIRE', 'REFUND', 'ADMIN_GRANT', 'ADMIN_DEDUCT'
                   )),
  amount           int         not null check (amount > 0),
  balance_before   int         not null default 0,
  balance_after    int         not null default 0,
  description      text        not null,
  reference_type   text,
  reference_id     uuid,
  status           text        not null default 'COMPLETED'
                   check (status in ('PENDING', 'COMPLETED', 'FAILED', 'CANCELED')),
  expires_at       timestamptz,
  created_at       timestamptz not null default now()
);

create index if not exists point_tx_wallet_idx      on public.point_transactions(wallet_id);
create index if not exists point_tx_user_idx        on public.point_transactions(user_id);
create index if not exists point_tx_created_at_idx  on public.point_transactions(created_at desc);

-- ── point_rules ────────────────────────────────────────────
-- ポイント付与ルールマスタ。アクションキーごとに付与ポイントを定義する。
-- Phase 4: 自動ポイント付与処理・ルール管理画面で使用。
create table if not exists public.point_rules (
  id            uuid        primary key default gen_random_uuid(),
  key           text        not null unique,
  name          text        not null,
  description   text,
  point_amount  int         not null default 0,
  is_active     boolean     not null default true,
  max_per_day   int,
  max_per_month int,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ── point_expirations ──────────────────────────────────────
-- ポイント有効期限管理。取引ごとに期限を設定し期限切れを検知する。
-- Phase 4: 期限切れポイントのバッチ処理・残高表示で使用。
create table if not exists public.point_expirations (
  id             uuid        primary key default gen_random_uuid(),
  wallet_id      uuid        not null references public.wallets(id) on delete cascade,
  transaction_id uuid        not null references public.point_transactions(id),
  amount         int         not null check (amount > 0),
  expires_at     timestamptz not null,
  is_expired     boolean     not null default false,
  expired_at     timestamptz,
  created_at     timestamptz not null default now()
);

create index if not exists point_exp_wallet_idx     on public.point_expirations(wallet_id);
create index if not exists point_exp_expires_at_idx on public.point_expirations(expires_at);

-- ── point_grants ───────────────────────────────────────────
-- ポイント付与記録。ルール自動付与・管理者手動付与を区別して保持。
-- Phase 4: ポイント付与履歴・デバッグで使用。
create table if not exists public.point_grants (
  id             uuid        primary key default gen_random_uuid(),
  user_id        uuid        not null references public.users(id),
  granted_by     uuid        references public.users(id),
  rule_id        uuid        references public.point_rules(id),
  transaction_id uuid        references public.point_transactions(id),
  amount         int         not null check (amount > 0),
  reason         text        not null,
  created_at     timestamptz not null default now()
);

create index if not exists point_grants_user_idx on public.point_grants(user_id);

-- ── point_redemptions ──────────────────────────────────────
-- ポイント使用記録。注文・クーポン適用などポイント消費の詳細を保持。
-- Phase 4: ポイント使用履歴・決済処理で使用。
create table if not exists public.point_redemptions (
  id             uuid        primary key default gen_random_uuid(),
  user_id        uuid        not null references public.users(id),
  transaction_id uuid        references public.point_transactions(id),
  amount         int         not null check (amount > 0),
  reason         text        not null,
  reference_type text,
  reference_id   uuid,
  created_at     timestamptz not null default now()
);

create index if not exists point_redemptions_user_idx on public.point_redemptions(user_id);

-- ============================================================
-- 1i. テーブル追加: EC・注文系 (Part 9)
-- ============================================================

-- ── product_categories ─────────────────────────────────────
-- 商品カテゴリマスタ。親子構造で階層カテゴリに対応する。
-- Phase 5: 商品一覧・検索フィルターで使用。
create table if not exists public.product_categories (
  id          uuid        primary key default gen_random_uuid(),
  name        text        not null unique,
  slug        text        not null unique,
  description text,
  parent_id   uuid        references public.product_categories(id),
  sort_order  int         not null default 0,
  is_active   boolean     not null default true,
  created_at  timestamptz not null default now()
);

-- ── product_tags ───────────────────────────────────────────
-- 商品タグマスタ。商品に複数付与できる。
-- Phase 5: 商品検索・タグフィルターで使用。
create table if not exists public.product_tags (
  id         uuid        primary key default gen_random_uuid(),
  name       text        not null unique,
  slug       text        not null unique,
  created_at timestamptz not null default now()
);

-- ── products ───────────────────────────────────────────────
-- 商品・サービスマスタ。会社が出品し、ユーザーが購入する。
-- Phase 5: 商品一覧・商品詳細・購入フローで使用。
create table if not exists public.products (
  id            uuid        primary key default gen_random_uuid(),
  company_id    uuid        not null references public.companies(id) on delete cascade,
  category_id   uuid        references public.product_categories(id),
  name          text        not null,
  description   text,
  price         int         not null default 0 check (price >= 0),
  stock         int         not null default 0 check (stock >= 0),
  sku           text,
  status        text        not null default 'DRAFT'
                check (status in ('DRAFT', 'ACTIVE', 'OUT_OF_STOCK', 'DISCONTINUED', 'ARCHIVED')),
  thumbnail_url text,
  deleted_at    timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists products_company_idx  on public.products(company_id);
create index if not exists products_status_idx   on public.products(status);

-- ── product_files ──────────────────────────────────────────
-- 商品画像・添付ファイル。sort_order で表示順を制御する。
-- Phase 5: 商品詳細ページの画像ギャラリーで使用。
create table if not exists public.product_files (
  id         uuid        primary key default gen_random_uuid(),
  product_id uuid        not null references public.products(id) on delete cascade,
  file_url   text        not null,
  file_type  text        not null default 'IMAGE'
             check (file_type in ('IMAGE', 'DOCUMENT', 'VIDEO')),
  file_name  text        not null,
  sort_order int         not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists product_files_product_idx on public.product_files(product_id);

-- ── product_tag_relations ──────────────────────────────────
-- 商品とタグの中間テーブル。
-- Phase 5: 商品タグ管理・タグ検索で使用。
create table if not exists public.product_tag_relations (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  tag_id     uuid not null references public.product_tags(id) on delete cascade,
  unique (product_id, tag_id)
);

create index if not exists product_tag_rel_product_idx on public.product_tag_relations(product_id);

-- ── carts ──────────────────────────────────────────────────
-- ユーザーのカート。1ユーザー1カート（unique on user_id）。
-- Phase 5: カート画面・購入フローで使用。
create table if not exists public.carts (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null unique references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── cart_items ─────────────────────────────────────────────
-- カート内アイテム。商品ごとに数量を管理する。
-- Phase 5: カート画面・購入フローで使用。
create table if not exists public.cart_items (
  id         uuid        primary key default gen_random_uuid(),
  cart_id    uuid        not null references public.carts(id) on delete cascade,
  product_id uuid        not null references public.products(id),
  quantity   int         not null default 1 check (quantity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cart_id, product_id)
);

-- ── orders ─────────────────────────────────────────────────
-- 注文管理。割引・最終金額・配送先を保持する。
-- Phase 5: 注文一覧・注文詳細・管理画面で使用。
create table if not exists public.orders (
  id              uuid        primary key default gen_random_uuid(),
  user_id         uuid        not null references public.users(id),
  status          text        not null default 'PENDING'
                  check (status in (
                    'PENDING', 'CONFIRMED', 'PROCESSING',
                    'SHIPPED', 'DELIVERED', 'CANCELED', 'REFUNDED'
                  )),
  total_amount    int         not null default 0 check (total_amount >= 0),
  discount_amount int         not null default 0 check (discount_amount >= 0),
  final_amount    int         not null default 0 check (final_amount >= 0),
  shipping_address jsonb,
  note            text,
  confirmed_at    timestamptz,
  canceled_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists orders_user_idx       on public.orders(user_id);
create index if not exists orders_status_idx     on public.orders(status);
create index if not exists orders_created_at_idx on public.orders(created_at desc);

-- ── order_items ────────────────────────────────────────────
-- 注文アイテム。注文時点の商品名・単価をスナップショットで保持する。
-- Phase 5: 注文詳細・請求書生成で使用。
create table if not exists public.order_items (
  id           uuid        primary key default gen_random_uuid(),
  order_id     uuid        not null references public.orders(id) on delete cascade,
  product_id   uuid        not null references public.products(id),
  product_name text        not null,
  unit_price   int         not null default 0,
  quantity     int         not null default 1 check (quantity > 0),
  subtotal     int         not null default 0,
  created_at   timestamptz not null default now()
);

create index if not exists order_items_order_idx on public.order_items(order_id);

-- ── payments ───────────────────────────────────────────────
-- 決済記録。外部決済プロバイダのトランザクションIDを保持する。
-- Phase 5: 決済フロー・返金処理・管理画面で使用。
create table if not exists public.payments (
  id             uuid        primary key default gen_random_uuid(),
  order_id       uuid        not null references public.orders(id),
  user_id        uuid        not null references public.users(id),
  amount         int         not null default 0,
  currency       text        not null default 'JPY',
  method         text        not null default 'CREDIT_CARD'
                 check (method in ('CREDIT_CARD', 'BANK_TRANSFER', 'POINT', 'CONVENIENCE', 'OTHER')),
  status         text        not null default 'PENDING'
                 check (status in ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELED')),
  provider       text,
  provider_tx_id text,
  completed_at   timestamptz,
  failed_at      timestamptz,
  refunded_at    timestamptz,
  metadata       jsonb       not null default '{}',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists payments_order_idx  on public.payments(order_id);
create index if not exists payments_user_idx   on public.payments(user_id);
create index if not exists payments_status_idx on public.payments(status);

-- ── coupons ────────────────────────────────────────────────
-- クーポンマスタ。割引種別（金額/割合）・利用上限・有効期限を管理する。
-- Phase 5: クーポン適用フロー・管理画面で使用。
create table if not exists public.coupons (
  id               uuid        primary key default gen_random_uuid(),
  code             text        not null unique,
  name             text        not null,
  discount_type    text        not null default 'AMOUNT'
                   check (discount_type in ('AMOUNT', 'PERCENT')),
  discount_value   int         not null check (discount_value > 0),
  min_order_amount int         not null default 0,
  max_uses         int,
  used_count       int         not null default 0,
  is_active        boolean     not null default true,
  starts_at        timestamptz not null default now(),
  expires_at       timestamptz,
  created_by       uuid        references public.users(id),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ── coupon_redemptions ─────────────────────────────────────
-- クーポン使用記録。1注文1クーポンを UNIQUE 制約で保証する。
-- Phase 5: クーポン使用履歴・不正利用検知で使用。
create table if not exists public.coupon_redemptions (
  id         uuid        primary key default gen_random_uuid(),
  coupon_id  uuid        not null references public.coupons(id),
  user_id    uuid        not null references public.users(id),
  order_id   uuid        not null references public.orders(id),
  discount   int         not null,
  created_at timestamptz not null default now(),
  unique (coupon_id, order_id)
);

create index if not exists coupon_redemptions_user_idx on public.coupon_redemptions(user_id);

-- ── invoices ───────────────────────────────────────────────
-- 請求書管理。注文または契約に紐付き、PDFリンクを保持する。
-- Phase 5: 請求書発行・支払い確認で使用。
create table if not exists public.invoices (
  id             uuid        primary key default gen_random_uuid(),
  order_id       uuid        references public.orders(id),
  contract_id    uuid        references public.contracts(id),
  user_id        uuid        not null references public.users(id),
  invoice_number text        not null unique,
  amount         int         not null default 0,
  tax_amount     int         not null default 0,
  total_amount   int         not null default 0,
  status         text        not null default 'DRAFT'
                 check (status in ('DRAFT', 'ISSUED', 'PAID', 'OVERDUE', 'CANCELED')),
  issued_at      timestamptz,
  due_at         timestamptz,
  paid_at        timestamptz,
  pdf_url        text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists invoices_user_idx   on public.invoices(user_id);
create index if not exists invoices_status_idx on public.invoices(status);

-- ============================================================
-- 1j. テーブル追加: 分析・ログ系 (Part 10)
-- ============================================================

-- ── user_action_logs ───────────────────────────────────────
-- ユーザー行動ログ。ボタンクリック・閲覧・検索を記録する。
-- Phase 2: CVR分析・行動分析・機能改善で使用。
create table if not exists public.user_action_logs (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        references public.users(id),
  action_type text        not null
              check (action_type in (
                'VIEW_POST', 'BOOKMARK_POST', 'APPLY_POST', 'INQUIRY_POST',
                'CLICK_APPLICATION_BUTTON', 'CLICK_INQUIRY_BUTTON',
                'VIEW_PROFILE', 'SEARCH', 'LOGIN', 'LOGOUT'
              )),
  target_type text,
  target_id   uuid,
  metadata    jsonb       not null default '{}',
  ip_hash     text,
  created_at  timestamptz not null default now()
);

create index if not exists user_action_logs_user_idx       on public.user_action_logs(user_id);
create index if not exists user_action_logs_action_idx     on public.user_action_logs(action_type);
create index if not exists user_action_logs_created_at_idx on public.user_action_logs(created_at desc);

-- ── search_logs ────────────────────────────────────────────
-- 検索クエリ・フィルター・件数のログ。検索改善・人気キーワード分析で使用。
-- Phase 2: 検索機能の改善・おすすめキーワードで使用。
create table if not exists public.search_logs (
  id           uuid        primary key default gen_random_uuid(),
  user_id      uuid        references public.users(id),
  query        text        not null,
  filters      jsonb       not null default '{}',
  result_count int         not null default 0,
  created_at   timestamptz not null default now()
);

create index if not exists search_logs_user_idx      on public.search_logs(user_id);
create index if not exists search_logs_created_at_idx on public.search_logs(created_at desc);

-- ── page_view_logs ─────────────────────────────────────────
-- ページ閲覧ログ。パス・リファラ・UAを記録する。
-- Phase 2: PV分析・流入元分析で使用。
create table if not exists public.page_view_logs (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        references public.users(id),
  path       text        not null,
  referrer   text,
  ip_hash    text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists page_view_logs_user_idx      on public.page_view_logs(user_id);
create index if not exists page_view_logs_created_at_idx on public.page_view_logs(created_at desc);

-- ── conversion_events ──────────────────────────────────────
-- CVR分析イベント。応募開始〜完了のファネル計測に使用する。
-- Phase 2: 応募ファネル分析・LPのCVR計測で使用。
create table if not exists public.conversion_events (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        references public.users(id),
  event_type text        not null
             check (event_type in (
               'POST_VIEW', 'APPLICATION_START', 'APPLICATION_COMPLETE',
               'INQUIRY_START', 'INQUIRY_COMPLETE', 'REGISTRATION', 'PURCHASE'
             )),
  post_id    uuid        references public.posts(id),
  session_id text,
  metadata   jsonb       not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists conversion_events_user_idx       on public.conversion_events(user_id);
create index if not exists conversion_events_event_idx      on public.conversion_events(event_type);
create index if not exists conversion_events_created_at_idx on public.conversion_events(created_at desc);

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

-- Part 2: ユーザー・会社系
create trigger user_profiles_updated_at
  before update on public.user_profiles
  for each row execute function public.update_updated_at();

create trigger user_settings_updated_at
  before update on public.user_settings
  for each row execute function public.update_updated_at();

create trigger departments_updated_at
  before update on public.departments
  for each row execute function public.update_updated_at();

create trigger company_invitations_updated_at
  before update on public.company_invitations
  for each row execute function public.update_updated_at();

create trigger company_settings_updated_at
  before update on public.company_settings
  for each row execute function public.update_updated_at();

-- Part 3: 投稿・案件系
create trigger post_categories_updated_at
  before update on public.post_categories
  for each row execute function public.update_updated_at();

create trigger featured_posts_updated_at
  before update on public.featured_posts
  for each row execute function public.update_updated_at();

create trigger post_templates_updated_at
  before update on public.post_templates
  for each row execute function public.update_updated_at();

create trigger post_reports_updated_at
  before update on public.post_reports
  for each row execute function public.update_updated_at();

-- Part 4: 応募・メッセージ系
create trigger application_messages_updated_at
  before update on public.application_messages
  for each row execute function public.update_updated_at();

create trigger application_limits_updated_at
  before update on public.application_limits
  for each row execute function public.update_updated_at();

create trigger inquiries_updated_at
  before update on public.inquiries
  for each row execute function public.update_updated_at();

-- Part 5: 通知・メール系
create trigger notification_settings_updated_at
  before update on public.notification_settings
  for each row execute function public.update_updated_at();

create trigger email_delivery_logs_updated_at
  before update on public.email_delivery_logs
  for each row execute function public.update_updated_at();

create trigger email_templates_updated_at
  before update on public.email_templates
  for each row execute function public.update_updated_at();

-- Part 6: 管理・運営系
create trigger admin_notes_updated_at
  before update on public.admin_notes
  for each row execute function public.update_updated_at();

create trigger announcements_updated_at
  before update on public.announcements
  for each row execute function public.update_updated_at();

create trigger system_settings_updated_at
  before update on public.system_settings
  for each row execute function public.update_updated_at();

create trigger feature_flags_updated_at
  before update on public.feature_flags
  for each row execute function public.update_updated_at();

-- Part 7: 契約・評価系
create trigger contracts_updated_at
  before update on public.contracts
  for each row execute function public.update_updated_at();

create trigger deliverables_updated_at
  before update on public.deliverables
  for each row execute function public.update_updated_at();

create trigger disputes_updated_at
  before update on public.disputes
  for each row execute function public.update_updated_at();

create trigger reviews_updated_at
  before update on public.reviews
  for each row execute function public.update_updated_at();

create trigger review_replies_updated_at
  before update on public.review_replies
  for each row execute function public.update_updated_at();

create trigger user_scores_updated_at
  before update on public.user_scores
  for each row execute function public.update_updated_at();

create trigger company_scores_updated_at
  before update on public.company_scores
  for each row execute function public.update_updated_at();

-- Part 8: ポイント系
create trigger wallets_updated_at
  before update on public.wallets
  for each row execute function public.update_updated_at();

create trigger point_rules_updated_at
  before update on public.point_rules
  for each row execute function public.update_updated_at();

-- Part 9: EC系
create trigger products_updated_at
  before update on public.products
  for each row execute function public.update_updated_at();

create trigger carts_updated_at
  before update on public.carts
  for each row execute function public.update_updated_at();

create trigger cart_items_updated_at
  before update on public.cart_items
  for each row execute function public.update_updated_at();

create trigger orders_updated_at
  before update on public.orders
  for each row execute function public.update_updated_at();

create trigger payments_updated_at
  before update on public.payments
  for each row execute function public.update_updated_at();

create trigger coupons_updated_at
  before update on public.coupons
  for each row execute function public.update_updated_at();

create trigger invoices_updated_at
  before update on public.invoices
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

-- Part 2: ユーザー・会社系
alter table public.user_profiles         enable row level security;
alter table public.user_settings         enable row level security;
alter table public.user_status_histories  enable row level security;
alter table public.departments           enable row level security;
alter table public.company_invitations   enable row level security;
alter table public.company_settings      enable row level security;

-- Part 3: 投稿・案件系
alter table public.post_categories       enable row level security;
alter table public.post_files            enable row level security;
alter table public.post_tags             enable row level security;
alter table public.post_tag_relations    enable row level security;
alter table public.post_status_histories enable row level security;
alter table public.featured_posts        enable row level security;
alter table public.post_templates        enable row level security;
alter table public.post_bookmarks        enable row level security;
alter table public.post_view_logs        enable row level security;
alter table public.post_reports          enable row level security;

-- Part 4: 応募・メッセージ系
alter table public.application_messages        enable row level security;
alter table public.application_status_histories enable row level security;
alter table public.application_limits          enable row level security;
alter table public.application_cancellations   enable row level security;
alter table public.inquiries                   enable row level security;
alter table public.inquiry_messages            enable row level security;

-- Part 5: 通知・メール系
alter table public.notifications               enable row level security;
alter table public.notification_settings       enable row level security;
alter table public.email_delivery_logs         enable row level security;
alter table public.email_templates             enable row level security;
alter table public.notification_events         enable row level security;

-- Part 6: 管理・運営系
alter table public.admin_audit_logs            enable row level security;
alter table public.admin_notes                 enable row level security;
alter table public.announcements               enable row level security;
alter table public.moderation_actions          enable row level security;
alter table public.system_settings             enable row level security;
alter table public.feature_flags               enable row level security;

-- Part 7: 契約・評価系
alter table public.contracts                   enable row level security;
alter table public.contract_status_histories   enable row level security;
alter table public.deliverables                enable row level security;
alter table public.deliverable_files           enable row level security;
alter table public.disputes                    enable row level security;
alter table public.dispute_messages            enable row level security;
alter table public.reviews                     enable row level security;
alter table public.review_replies              enable row level security;
alter table public.user_scores                 enable row level security;
alter table public.company_scores              enable row level security;

-- Part 8: ポイント系
alter table public.wallets                     enable row level security;
alter table public.point_transactions          enable row level security;
alter table public.point_rules                 enable row level security;
alter table public.point_expirations           enable row level security;
alter table public.point_grants                enable row level security;
alter table public.point_redemptions           enable row level security;

-- Part 9: EC系
alter table public.product_categories          enable row level security;
alter table public.product_tags                enable row level security;
alter table public.products                    enable row level security;
alter table public.product_files               enable row level security;
alter table public.product_tag_relations       enable row level security;
alter table public.carts                       enable row level security;
alter table public.cart_items                  enable row level security;
alter table public.orders                      enable row level security;
alter table public.order_items                 enable row level security;
alter table public.payments                    enable row level security;
alter table public.coupons                     enable row level security;
alter table public.coupon_redemptions          enable row level security;
alter table public.invoices                    enable row level security;

-- Part 10: ログ・分析系
alter table public.user_action_logs            enable row level security;
alter table public.search_logs                 enable row level security;
alter table public.page_view_logs              enable row level security;
alter table public.conversion_events           enable row level security;

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

-- Part 2: ユーザー・会社系
GRANT ALL ON public.user_profiles         TO service_role;
GRANT ALL ON public.user_settings         TO service_role;
GRANT ALL ON public.user_status_histories  TO service_role;
GRANT ALL ON public.departments           TO service_role;
GRANT ALL ON public.company_invitations   TO service_role;
GRANT ALL ON public.company_settings      TO service_role;

-- user_profiles: 自分の参照・作成・更新 / ADMIN は閲覧可
GRANT SELECT, INSERT, UPDATE ON public.user_profiles TO authenticated;

-- user_settings: 自分の参照・作成・更新
GRANT SELECT, INSERT, UPDATE ON public.user_settings TO authenticated;

-- user_status_histories: 参照のみ（書き込みは ADMIN/MASTER_ADMIN が API 経由で service_role を使用）
GRANT SELECT ON public.user_status_histories TO authenticated;

-- departments: 参照・作成・更新（削除はアプリ動線なし）
GRANT SELECT, INSERT, UPDATE ON public.departments TO authenticated;

-- company_invitations: 招待の管理（ADMIN が発行・取消）
GRANT SELECT, INSERT, UPDATE ON public.company_invitations TO authenticated;

-- company_settings: 参照・作成・更新
GRANT SELECT, INSERT, UPDATE ON public.company_settings TO authenticated;

-- Part 3: 投稿・案件系
GRANT ALL ON public.post_categories       TO service_role;
GRANT ALL ON public.post_files            TO service_role;
GRANT ALL ON public.post_tags             TO service_role;
GRANT ALL ON public.post_tag_relations    TO service_role;
GRANT ALL ON public.post_status_histories TO service_role;
GRANT ALL ON public.featured_posts        TO service_role;
GRANT ALL ON public.post_templates        TO service_role;
GRANT ALL ON public.post_bookmarks        TO service_role;
GRANT ALL ON public.post_view_logs        TO service_role;
GRANT ALL ON public.post_reports          TO service_role;

-- post_categories / post_tags: 全員参照、MASTER_ADMINが管理（INSERT/UPDATE は service_role 経由）
GRANT SELECT ON public.post_categories    TO authenticated;
GRANT SELECT ON public.post_tags          TO authenticated;

-- post_files: 参照・追加（削除は service_role 経由）
GRANT SELECT, INSERT ON public.post_files TO authenticated;

-- post_tag_relations: 参照・追加・削除
GRANT SELECT, INSERT, DELETE ON public.post_tag_relations TO authenticated;

-- post_status_histories: 参照のみ（書き込みは ADMIN/MASTER_ADMIN が API 経由）
GRANT SELECT ON public.post_status_histories TO authenticated;

-- featured_posts: 参照（管理は service_role 経由）
GRANT SELECT ON public.featured_posts     TO authenticated;

-- post_templates: 参照・作成・更新
GRANT SELECT, INSERT, UPDATE ON public.post_templates TO authenticated;

-- post_bookmarks: 自分の参照・追加・削除
GRANT SELECT, INSERT, DELETE ON public.post_bookmarks TO authenticated;

-- post_view_logs: 追加のみ（参照は service_role 経由）
GRANT INSERT ON public.post_view_logs     TO authenticated;

-- post_reports: 参照・追加
GRANT SELECT, INSERT ON public.post_reports TO authenticated;

-- ── Part 4: 応募・メッセージ系 ──
GRANT ALL ON public.application_messages          TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.application_messages TO authenticated;

GRANT ALL ON public.application_status_histories  TO service_role;
GRANT SELECT, INSERT ON public.application_status_histories TO authenticated;

GRANT ALL ON public.application_limits            TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.application_limits TO authenticated;

GRANT ALL ON public.application_cancellations     TO service_role;
GRANT SELECT, INSERT ON public.application_cancellations TO authenticated;

GRANT ALL ON public.inquiries                     TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.inquiries  TO authenticated;

GRANT ALL ON public.inquiry_messages              TO service_role;
GRANT SELECT, INSERT ON public.inquiry_messages   TO authenticated;

-- ── Part 5: 通知・メール系 ──
GRANT ALL ON public.notifications                 TO service_role;
GRANT SELECT, UPDATE ON public.notifications      TO authenticated;

GRANT ALL ON public.notification_settings         TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.notification_settings TO authenticated;

GRANT ALL ON public.email_delivery_logs           TO service_role;
GRANT SELECT ON public.email_delivery_logs        TO authenticated;

GRANT ALL ON public.email_templates               TO service_role;
GRANT SELECT ON public.email_templates            TO authenticated;

GRANT ALL ON public.notification_events           TO service_role;
GRANT SELECT ON public.notification_events        TO authenticated;

-- ── Part 6: 管理・運営系 ──
GRANT ALL ON public.admin_audit_logs              TO service_role;
GRANT SELECT ON public.admin_audit_logs           TO authenticated;

GRANT ALL ON public.admin_notes                   TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_notes TO authenticated;

GRANT ALL ON public.announcements                 TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.announcements TO authenticated;

GRANT ALL ON public.moderation_actions            TO service_role;
GRANT SELECT, INSERT ON public.moderation_actions TO authenticated;

GRANT ALL ON public.system_settings               TO service_role;
GRANT SELECT ON public.system_settings            TO authenticated;

GRANT ALL ON public.feature_flags                 TO service_role;
GRANT SELECT ON public.feature_flags              TO authenticated;

-- ── Part 7: 契約・評価系 ──
GRANT ALL ON public.contracts                     TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.contracts  TO authenticated;

GRANT ALL ON public.contract_status_histories     TO service_role;
GRANT SELECT, INSERT ON public.contract_status_histories TO authenticated;

GRANT ALL ON public.deliverables                  TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.deliverables TO authenticated;

GRANT ALL ON public.deliverable_files             TO service_role;
GRANT SELECT, INSERT, DELETE ON public.deliverable_files TO authenticated;

GRANT ALL ON public.disputes                      TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.disputes   TO authenticated;

GRANT ALL ON public.dispute_messages              TO service_role;
GRANT SELECT, INSERT ON public.dispute_messages   TO authenticated;

GRANT ALL ON public.reviews                       TO service_role;
GRANT SELECT, INSERT ON public.reviews            TO authenticated;

GRANT ALL ON public.review_replies                TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.review_replies TO authenticated;

GRANT ALL ON public.user_scores                   TO service_role;
GRANT SELECT ON public.user_scores                TO authenticated;

GRANT ALL ON public.company_scores                TO service_role;
GRANT SELECT ON public.company_scores             TO authenticated;

-- ── Part 8: ポイント系 ──
GRANT ALL ON public.wallets                       TO service_role;
GRANT SELECT ON public.wallets                    TO authenticated;

GRANT ALL ON public.point_transactions            TO service_role;
GRANT SELECT ON public.point_transactions         TO authenticated;

GRANT ALL ON public.point_rules                   TO service_role;
GRANT SELECT ON public.point_rules                TO authenticated;

GRANT ALL ON public.point_expirations             TO service_role;
GRANT SELECT ON public.point_expirations          TO authenticated;

GRANT ALL ON public.point_grants                  TO service_role;
GRANT SELECT ON public.point_grants               TO authenticated;

GRANT ALL ON public.point_redemptions             TO service_role;
GRANT SELECT, INSERT ON public.point_redemptions  TO authenticated;

-- ── Part 9: EC系 ──
GRANT ALL ON public.product_categories            TO service_role;
GRANT SELECT ON public.product_categories         TO authenticated;

GRANT ALL ON public.product_tags                  TO service_role;
GRANT SELECT ON public.product_tags               TO authenticated;

GRANT ALL ON public.products                      TO service_role;
GRANT SELECT ON public.products                   TO authenticated;

GRANT ALL ON public.product_files                 TO service_role;
GRANT SELECT ON public.product_files              TO authenticated;

GRANT ALL ON public.product_tag_relations         TO service_role;
GRANT SELECT ON public.product_tag_relations      TO authenticated;

GRANT ALL ON public.carts                         TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.carts      TO authenticated;

GRANT ALL ON public.cart_items                    TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cart_items TO authenticated;

GRANT ALL ON public.orders                        TO service_role;
GRANT SELECT, INSERT ON public.orders             TO authenticated;

GRANT ALL ON public.order_items                   TO service_role;
GRANT SELECT ON public.order_items                TO authenticated;

GRANT ALL ON public.payments                      TO service_role;
GRANT SELECT ON public.payments                   TO authenticated;

GRANT ALL ON public.coupons                       TO service_role;
GRANT SELECT ON public.coupons                    TO authenticated;

GRANT ALL ON public.coupon_redemptions            TO service_role;
GRANT SELECT, INSERT ON public.coupon_redemptions TO authenticated;

GRANT ALL ON public.invoices                      TO service_role;
GRANT SELECT ON public.invoices                   TO authenticated;

-- ── Part 10: ログ・分析系 ──
GRANT ALL ON public.user_action_logs              TO service_role;
GRANT INSERT ON public.user_action_logs           TO authenticated;

GRANT ALL ON public.search_logs                   TO service_role;
GRANT INSERT ON public.search_logs                TO authenticated;

GRANT ALL ON public.page_view_logs                TO service_role;
GRANT INSERT ON public.page_view_logs             TO authenticated;

GRANT ALL ON public.conversion_events             TO service_role;
GRANT INSERT ON public.conversion_events          TO authenticated;

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
-- 11. RLS ポリシー: ユーザー・会社系 (Part 2)
-- ============================================================

-- ── user_profiles ──────────────────────────────────────────
-- SELECT: 自分 / ADMIN・MASTER_ADMIN は全件
-- INSERT/UPDATE: 自分のみ

create policy "user_profiles: select own" on public.user_profiles
  for select using (user_id = auth.uid());

create policy "user_profiles: admin or master select all" on public.user_profiles
  for select using (public.get_user_role() in ('ADMIN', 'MASTER_ADMIN'));

create policy "user_profiles: insert own" on public.user_profiles
  for insert with check (user_id = auth.uid());

create policy "user_profiles: update own" on public.user_profiles
  for update using (user_id = auth.uid());

-- ── user_settings ──────────────────────────────────────────
-- SELECT/INSERT/UPDATE: 自分のみ

create policy "user_settings: select own" on public.user_settings
  for select using (user_id = auth.uid());

create policy "user_settings: insert own" on public.user_settings
  for insert with check (user_id = auth.uid());

create policy "user_settings: update own" on public.user_settings
  for update using (user_id = auth.uid());

-- ── user_status_histories ──────────────────────────────────
-- SELECT: 自分 / MASTER_ADMIN は全件

create policy "user_status_histories: select own" on public.user_status_histories
  for select using (user_id = auth.uid());

create policy "user_status_histories: master_admin select all" on public.user_status_histories
  for select using (public.get_user_role() = 'MASTER_ADMIN');

-- ── departments ────────────────────────────────────────────
-- SELECT: 所属会社のメンバー全員
-- INSERT/UPDATE: 所属会社の ADMIN / MASTER_ADMIN

create policy "departments: select company members" on public.departments
  for select using (company_id = any(public.get_user_company_ids()));

create policy "departments: master_admin select all" on public.departments
  for select using (public.get_user_role() = 'MASTER_ADMIN');

create policy "departments: admin insert own company" on public.departments
  for insert with check (
    public.get_user_role() in ('ADMIN', 'MASTER_ADMIN')
    and company_id = any(public.get_user_company_ids())
  );

create policy "departments: admin update own company" on public.departments
  for update
  using (
    public.get_user_role() in ('ADMIN', 'MASTER_ADMIN')
    and company_id = any(public.get_user_company_ids())
  )
  with check (
    public.get_user_role() in ('ADMIN', 'MASTER_ADMIN')
    and company_id = any(public.get_user_company_ids())
  );

create policy "departments: master_admin all" on public.departments
  for all
  using  (public.get_user_role() = 'MASTER_ADMIN')
  with check (public.get_user_role() = 'MASTER_ADMIN');

-- ── company_invitations ────────────────────────────────────
-- SELECT/INSERT/UPDATE: 所属会社の ADMIN / MASTER_ADMIN

create policy "company_invitations: admin select own company" on public.company_invitations
  for select using (
    public.get_user_role() in ('ADMIN', 'MASTER_ADMIN')
    and company_id = any(public.get_user_company_ids())
  );

create policy "company_invitations: master_admin select all" on public.company_invitations
  for select using (public.get_user_role() = 'MASTER_ADMIN');

create policy "company_invitations: admin insert own company" on public.company_invitations
  for insert with check (
    public.get_user_role() in ('ADMIN', 'MASTER_ADMIN')
    and company_id = any(public.get_user_company_ids())
  );

create policy "company_invitations: admin update own company" on public.company_invitations
  for update
  using (
    public.get_user_role() in ('ADMIN', 'MASTER_ADMIN')
    and company_id = any(public.get_user_company_ids())
  )
  with check (
    public.get_user_role() in ('ADMIN', 'MASTER_ADMIN')
    and company_id = any(public.get_user_company_ids())
  );

-- ── company_settings ───────────────────────────────────────
-- SELECT: 所属会社のメンバー全員
-- INSERT/UPDATE: 所属会社の ADMIN / MASTER_ADMIN

create policy "company_settings: select company members" on public.company_settings
  for select using (company_id = any(public.get_user_company_ids()));

create policy "company_settings: master_admin select all" on public.company_settings
  for select using (public.get_user_role() = 'MASTER_ADMIN');

create policy "company_settings: admin insert own company" on public.company_settings
  for insert with check (
    public.get_user_role() in ('ADMIN', 'MASTER_ADMIN')
    and company_id = any(public.get_user_company_ids())
  );

create policy "company_settings: admin update own company" on public.company_settings
  for update
  using (
    public.get_user_role() in ('ADMIN', 'MASTER_ADMIN')
    and company_id = any(public.get_user_company_ids())
  )
  with check (
    public.get_user_role() in ('ADMIN', 'MASTER_ADMIN')
    and company_id = any(public.get_user_company_ids())
  );

-- ============================================================
-- 12. RLS ポリシー: 投稿・案件系 (Part 3)
-- ============================================================

-- ── post_categories ────────────────────────────────────────
-- SELECT: 全認証済み / INSERT・UPDATE: MASTER_ADMIN のみ

create policy "post_categories: select all authenticated" on public.post_categories
  for select using (auth.role() = 'authenticated');

create policy "post_categories: master_admin all" on public.post_categories
  for all
  using  (public.get_user_role() = 'MASTER_ADMIN')
  with check (public.get_user_role() = 'MASTER_ADMIN');

-- ── post_tags ──────────────────────────────────────────────
-- SELECT: 全認証済み / INSERT: MASTER_ADMIN のみ

create policy "post_tags: select all authenticated" on public.post_tags
  for select using (auth.role() = 'authenticated');

create policy "post_tags: master_admin all" on public.post_tags
  for all
  using  (public.get_user_role() = 'MASTER_ADMIN')
  with check (public.get_user_role() = 'MASTER_ADMIN');

-- ── post_files ─────────────────────────────────────────────
-- SELECT: 全認証済み（投稿に紐付く公開コンテンツ）
-- INSERT: 投稿の作成者 or 所属会社の ADMIN / MASTER_ADMIN

create policy "post_files: select all authenticated" on public.post_files
  for select using (auth.role() = 'authenticated');

create policy "post_files: insert post owner or admin" on public.post_files
  for insert with check (
    uploaded_by = auth.uid()
    and (
      public.get_user_role() in ('ADMIN', 'MASTER_ADMIN')
      or post_id in (
        select id from public.posts where created_by_user_id = auth.uid()
      )
    )
  );

-- ── post_tag_relations ─────────────────────────────────────
-- SELECT: 全認証済み
-- INSERT/DELETE: 投稿の作成者 or 所属会社の ADMIN / MASTER_ADMIN

create policy "post_tag_relations: select all authenticated" on public.post_tag_relations
  for select using (auth.role() = 'authenticated');

create policy "post_tag_relations: insert by post owner or admin" on public.post_tag_relations
  for insert with check (
    public.get_user_role() in ('ADMIN', 'MASTER_ADMIN')
    or post_id in (
      select id from public.posts where created_by_user_id = auth.uid()
    )
  );

create policy "post_tag_relations: delete by post owner or admin" on public.post_tag_relations
  for delete using (
    public.get_user_role() in ('ADMIN', 'MASTER_ADMIN')
    or post_id in (
      select id from public.posts where created_by_user_id = auth.uid()
    )
  );

-- ── post_status_histories ──────────────────────────────────
-- SELECT: 投稿の作成者 / 所属会社 ADMIN / MASTER_ADMIN

create policy "post_status_histories: select post owner" on public.post_status_histories
  for select using (
    post_id in (
      select id from public.posts where created_by_user_id = auth.uid()
    )
  );

create policy "post_status_histories: admin select own company" on public.post_status_histories
  for select using (
    public.get_user_role() = 'ADMIN'
    and post_id in (
      select id from public.posts
      where company_id = any(public.get_user_company_ids())
    )
  );

create policy "post_status_histories: master_admin all" on public.post_status_histories
  for all
  using  (public.get_user_role() = 'MASTER_ADMIN')
  with check (public.get_user_role() = 'MASTER_ADMIN');

-- ── featured_posts ─────────────────────────────────────────
-- SELECT: 全認証済み / INSERT・UPDATE・DELETE: MASTER_ADMIN のみ

create policy "featured_posts: select all authenticated" on public.featured_posts
  for select using (auth.role() = 'authenticated');

create policy "featured_posts: master_admin all" on public.featured_posts
  for all
  using  (public.get_user_role() = 'MASTER_ADMIN')
  with check (public.get_user_role() = 'MASTER_ADMIN');

-- ── post_templates ─────────────────────────────────────────
-- SELECT: 同じ会社の ADMIN（is_shared=true）or 自分が作成したもの
-- INSERT/UPDATE: 所属会社の ADMIN / MASTER_ADMIN

create policy "post_templates: select own or shared" on public.post_templates
  for select using (
    created_by_user_id = auth.uid()
    or (
      is_shared = true
      and company_id = any(public.get_user_company_ids())
    )
  );

create policy "post_templates: master_admin select all" on public.post_templates
  for select using (public.get_user_role() = 'MASTER_ADMIN');

create policy "post_templates: admin insert own company" on public.post_templates
  for insert with check (
    public.get_user_role() in ('ADMIN', 'MASTER_ADMIN')
    and company_id = any(public.get_user_company_ids())
    and created_by_user_id = auth.uid()
  );

create policy "post_templates: admin update own company" on public.post_templates
  for update
  using (
    public.get_user_role() in ('ADMIN', 'MASTER_ADMIN')
    and company_id = any(public.get_user_company_ids())
  )
  with check (
    public.get_user_role() in ('ADMIN', 'MASTER_ADMIN')
    and company_id = any(public.get_user_company_ids())
  );

-- ── post_bookmarks ─────────────────────────────────────────
-- SELECT / INSERT / DELETE: 自分のみ

create policy "post_bookmarks: select own" on public.post_bookmarks
  for select using (user_id = auth.uid());

create policy "post_bookmarks: insert own" on public.post_bookmarks
  for insert with check (user_id = auth.uid());

create policy "post_bookmarks: delete own" on public.post_bookmarks
  for delete using (user_id = auth.uid());

-- ── post_view_logs ─────────────────────────────────────────
-- INSERT: 全認証済み（閲覧ログの記録）
-- SELECT: MASTER_ADMIN のみ（分析用）

create policy "post_view_logs: insert authenticated" on public.post_view_logs
  for insert with check (auth.role() = 'authenticated');

create policy "post_view_logs: master_admin select all" on public.post_view_logs
  for select using (public.get_user_role() = 'MASTER_ADMIN');

-- ── post_reports ───────────────────────────────────────────
-- INSERT: 全認証済み（自分名義）
-- SELECT: 自分の通報 / ADMIN・MASTER_ADMIN は全件
-- UPDATE: ADMIN / MASTER_ADMIN（ステータス更新）

create policy "post_reports: insert own" on public.post_reports
  for insert with check (reported_by = auth.uid());

create policy "post_reports: select own" on public.post_reports
  for select using (reported_by = auth.uid());

create policy "post_reports: admin or master select all" on public.post_reports
  for select using (public.get_user_role() in ('ADMIN', 'MASTER_ADMIN'));

create policy "post_reports: admin or master update" on public.post_reports
  for update
  using  (public.get_user_role() in ('ADMIN', 'MASTER_ADMIN'))
  with check (public.get_user_role() in ('ADMIN', 'MASTER_ADMIN'));

-- ============================================================
-- 13. RLS ポリシー: Part 4-10 (新規テーブル群)
-- ============================================================

-- ── application_messages ────────────────────────────────────
-- 応募に関係する当事者 (応募者・投稿オーナー会社のADMIN・MASTER_ADMIN) のみ参照・送信可
create policy "application_messages: 当事者SELECT"
  on public.application_messages for select
  using (
    auth.uid() in (
      select a.applicant_user_id from public.applications a where a.id = application_id
    )
    or exists (
      select 1 from public.applications a
      join public.posts p on p.id = a.post_id
      join public.company_members cm on cm.company_id = p.company_id
      where a.id = application_id
        and cm.user_id = auth.uid()
        and cm.role in ('ADMIN', 'OWNER')
        and cm.status = 'active'
    )
    or public.get_user_role() = 'MASTER_ADMIN'
  );

create policy "application_messages: 当事者INSERT"
  on public.application_messages for insert
  with check (
    sender_user_id = auth.uid()
    and (
      auth.uid() in (
        select a.applicant_user_id from public.applications a where a.id = application_id
      )
      or exists (
        select 1 from public.applications a
        join public.posts p on p.id = a.post_id
        join public.company_members cm on cm.company_id = p.company_id
        where a.id = application_id
          and cm.user_id = auth.uid()
          and cm.role in ('ADMIN', 'OWNER')
          and cm.status = 'active'
      )
    )
  );

create policy "application_messages: 既読UPDATE"
  on public.application_messages for update
  using (
    auth.uid() in (
      select a.applicant_user_id from public.applications a where a.id = application_id
    )
    or exists (
      select 1 from public.applications a
      join public.posts p on p.id = a.post_id
      join public.company_members cm on cm.company_id = p.company_id
      where a.id = application_id
        and cm.user_id = auth.uid()
        and cm.role in ('ADMIN', 'OWNER')
        and cm.status = 'active'
    )
    or public.get_user_role() = 'MASTER_ADMIN'
  );

-- ── application_status_histories ────────────────────────────
create policy "application_status_histories: 当事者SELECT"
  on public.application_status_histories for select
  using (
    auth.uid() in (
      select a.applicant_user_id from public.applications a where a.id = application_id
    )
    or exists (
      select 1 from public.applications a
      join public.posts p on p.id = a.post_id
      join public.company_members cm on cm.company_id = p.company_id
      where a.id = application_id
        and cm.user_id = auth.uid()
        and cm.status = 'active'
    )
    or public.get_user_role() = 'MASTER_ADMIN'
  );

create policy "application_status_histories: 当事者INSERT"
  on public.application_status_histories for insert
  with check (public.get_user_role() in ('ADMIN', 'MASTER_ADMIN'));

-- ── application_limits ──────────────────────────────────────
create policy "application_limits: ADMIN以上SELECT"
  on public.application_limits for select
  using (public.get_user_role() in ('ADMIN', 'MASTER_ADMIN'));

create policy "application_limits: MASTER_ADMIN全操作"
  on public.application_limits for all
  using (public.get_user_role() = 'MASTER_ADMIN')
  with check (public.get_user_role() = 'MASTER_ADMIN');

-- ── application_cancellations ────────────────────────────────
create policy "application_cancellations: 当事者SELECT"
  on public.application_cancellations for select
  using (
    auth.uid() in (
      select a.applicant_user_id from public.applications a where a.id = application_id
    )
    or exists (
      select 1 from public.applications a
      join public.posts p on p.id = a.post_id
      join public.company_members cm on cm.company_id = p.company_id
      where a.id = application_id
        and cm.user_id = auth.uid()
        and cm.status = 'active'
    )
    or public.get_user_role() = 'MASTER_ADMIN'
  );

create policy "application_cancellations: 申請者INSERT"
  on public.application_cancellations for insert
  with check (
    canceled_by = auth.uid()
  );

-- ── inquiries ────────────────────────────────────────────────
create policy "inquiries: 本人またはADMIN SELECT"
  on public.inquiries for select
  using (
    sender_user_id = auth.uid()
    or public.get_user_role() in ('ADMIN', 'MASTER_ADMIN')
  );

create policy "inquiries: 認証ユーザーINSERT"
  on public.inquiries for insert
  with check (sender_user_id = auth.uid());

create policy "inquiries: ADMIN UPDATE"
  on public.inquiries for update
  using (public.get_user_role() in ('ADMIN', 'MASTER_ADMIN'))
  with check (public.get_user_role() in ('ADMIN', 'MASTER_ADMIN'));

-- ── inquiry_messages ─────────────────────────────────────────
create policy "inquiry_messages: 本人またはADMIN SELECT"
  on public.inquiry_messages for select
  using (
    exists (
      select 1 from public.inquiries i
      where i.id = inquiry_id
        and (i.sender_user_id = auth.uid() or public.get_user_role() in ('ADMIN', 'MASTER_ADMIN'))
    )
  );

create policy "inquiry_messages: 当事者INSERT"
  on public.inquiry_messages for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.inquiries i
      where i.id = inquiry_id
        and (i.sender_user_id = auth.uid() or public.get_user_role() in ('ADMIN', 'MASTER_ADMIN'))
    )
  );

-- ── notifications ────────────────────────────────────────────
create policy "notifications: 本人SELECT"
  on public.notifications for select
  using (user_id = auth.uid() or public.get_user_role() = 'MASTER_ADMIN');

create policy "notifications: 本人UPDATE(既読)"
  on public.notifications for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ── notification_settings ────────────────────────────────────
create policy "notification_settings: 本人SELECT"
  on public.notification_settings for select
  using (user_id = auth.uid());

create policy "notification_settings: 本人INSERT"
  on public.notification_settings for insert
  with check (user_id = auth.uid());

create policy "notification_settings: 本人UPDATE"
  on public.notification_settings for update
  using  (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ── email_delivery_logs ──────────────────────────────────────
create policy "email_delivery_logs: MASTER_ADMIN SELECT"
  on public.email_delivery_logs for select
  using (public.get_user_role() = 'MASTER_ADMIN');

-- ── email_templates ──────────────────────────────────────────
create policy "email_templates: ADMIN以上SELECT"
  on public.email_templates for select
  using (public.get_user_role() in ('ADMIN', 'MASTER_ADMIN'));

create policy "email_templates: MASTER_ADMIN全操作"
  on public.email_templates for all
  using (public.get_user_role() = 'MASTER_ADMIN')
  with check (public.get_user_role() = 'MASTER_ADMIN');

-- ── notification_events ──────────────────────────────────────
create policy "notification_events: MASTER_ADMIN SELECT"
  on public.notification_events for select
  using (public.get_user_role() = 'MASTER_ADMIN');

-- ── admin_audit_logs ─────────────────────────────────────────
create policy "admin_audit_logs: MASTER_ADMIN SELECT"
  on public.admin_audit_logs for select
  using (public.get_user_role() = 'MASTER_ADMIN');

-- ── admin_notes ──────────────────────────────────────────────
create policy "admin_notes: ADMIN以上SELECT"
  on public.admin_notes for select
  using (public.get_user_role() in ('ADMIN', 'MASTER_ADMIN'));

create policy "admin_notes: ADMIN以上INSERT"
  on public.admin_notes for insert
  with check (
    created_by = auth.uid()
    and public.get_user_role() in ('ADMIN', 'MASTER_ADMIN')
  );

create policy "admin_notes: 作成者UPDATE"
  on public.admin_notes for update
  using (created_by = auth.uid() or public.get_user_role() = 'MASTER_ADMIN')
  with check (created_by = auth.uid() or public.get_user_role() = 'MASTER_ADMIN');

create policy "admin_notes: MASTER_ADMIN DELETE"
  on public.admin_notes for delete
  using (public.get_user_role() = 'MASTER_ADMIN');

-- ── announcements ────────────────────────────────────────────
create policy "announcements: 公開済みSELECT"
  on public.announcements for select
  using (
    is_published = true
    or public.get_user_role() in ('ADMIN', 'MASTER_ADMIN')
  );

create policy "announcements: ADMIN以上INSERT"
  on public.announcements for insert
  with check (
    created_by = auth.uid()
    and public.get_user_role() in ('ADMIN', 'MASTER_ADMIN')
  );

create policy "announcements: ADMIN以上UPDATE"
  on public.announcements for update
  using  (public.get_user_role() in ('ADMIN', 'MASTER_ADMIN'))
  with check (public.get_user_role() in ('ADMIN', 'MASTER_ADMIN'));

-- ── moderation_actions ───────────────────────────────────────
create policy "moderation_actions: ADMIN以上SELECT"
  on public.moderation_actions for select
  using (public.get_user_role() in ('ADMIN', 'MASTER_ADMIN'));

create policy "moderation_actions: ADMIN以上INSERT"
  on public.moderation_actions for insert
  with check (
    actioned_by = auth.uid()
    and public.get_user_role() in ('ADMIN', 'MASTER_ADMIN')
  );

-- ── system_settings ──────────────────────────────────────────
create policy "system_settings: 認証ユーザーSELECT"
  on public.system_settings for select
  using (auth.role() = 'authenticated');

create policy "system_settings: MASTER_ADMIN全操作"
  on public.system_settings for all
  using (public.get_user_role() = 'MASTER_ADMIN')
  with check (public.get_user_role() = 'MASTER_ADMIN');

-- ── feature_flags ────────────────────────────────────────────
create policy "feature_flags: 認証ユーザーSELECT"
  on public.feature_flags for select
  using (auth.role() = 'authenticated');

create policy "feature_flags: MASTER_ADMIN全操作"
  on public.feature_flags for all
  using (public.get_user_role() = 'MASTER_ADMIN')
  with check (public.get_user_role() = 'MASTER_ADMIN');

-- ── contracts ────────────────────────────────────────────────
create policy "contracts: 当事者SELECT"
  on public.contracts for select
  using (
    client_user_id = auth.uid()
    or worker_user_id = auth.uid()
    or exists (
      select 1 from public.company_members cm
      where cm.company_id = company_id
        and cm.user_id = auth.uid()
        and cm.status = 'active'
    )
    or public.get_user_role() = 'MASTER_ADMIN'
  );

create policy "contracts: MASTER_ADMIN全操作"
  on public.contracts for all
  using (public.get_user_role() = 'MASTER_ADMIN')
  with check (public.get_user_role() = 'MASTER_ADMIN');

-- ── contract_status_histories ────────────────────────────────
create policy "contract_status_histories: 当事者SELECT"
  on public.contract_status_histories for select
  using (
    exists (
      select 1 from public.contracts c
      where c.id = contract_id
        and (c.client_user_id = auth.uid() or c.worker_user_id = auth.uid()
             or public.get_user_role() = 'MASTER_ADMIN')
    )
  );

-- ── deliverables ─────────────────────────────────────────────
create policy "deliverables: 当事者SELECT"
  on public.deliverables for select
  using (
    exists (
      select 1 from public.contracts c
      where c.id = contract_id
        and (c.client_user_id = auth.uid() or c.worker_user_id = auth.uid()
             or public.get_user_role() = 'MASTER_ADMIN')
    )
  );

create policy "deliverables: ワーカーINSERT/UPDATE"
  on public.deliverables for insert
  with check (
    exists (
      select 1 from public.contracts c
      where c.id = contract_id and c.worker_user_id = auth.uid()
    )
    or public.get_user_role() = 'MASTER_ADMIN'
  );

create policy "deliverables: 当事者UPDATE"
  on public.deliverables for update
  using (
    exists (
      select 1 from public.contracts c
      where c.id = contract_id
        and (c.client_user_id = auth.uid() or c.worker_user_id = auth.uid())
    )
    or public.get_user_role() = 'MASTER_ADMIN'
  );

-- ── deliverable_files ────────────────────────────────────────
create policy "deliverable_files: 当事者SELECT"
  on public.deliverable_files for select
  using (
    exists (
      select 1 from public.deliverables d
      join public.contracts c on c.id = d.contract_id
      where d.id = deliverable_id
        and (c.client_user_id = auth.uid() or c.worker_user_id = auth.uid()
             or public.get_user_role() = 'MASTER_ADMIN')
    )
  );

create policy "deliverable_files: アップロードINSERT"
  on public.deliverable_files for insert
  with check (uploaded_by = auth.uid());

create policy "deliverable_files: アップロード者DELETE"
  on public.deliverable_files for delete
  using (uploaded_by = auth.uid() or public.get_user_role() = 'MASTER_ADMIN');

-- ── disputes ─────────────────────────────────────────────────
create policy "disputes: 当事者SELECT"
  on public.disputes for select
  using (
    initiated_by = auth.uid()
    or exists (
      select 1 from public.contracts c
      where c.id = contract_id
        and (c.client_user_id = auth.uid() or c.worker_user_id = auth.uid())
    )
    or public.get_user_role() in ('ADMIN', 'MASTER_ADMIN')
  );

create policy "disputes: 当事者INSERT"
  on public.disputes for insert
  with check (
    initiated_by = auth.uid()
    and exists (
      select 1 from public.contracts c
      where c.id = contract_id
        and (c.client_user_id = auth.uid() or c.worker_user_id = auth.uid())
    )
  );

create policy "disputes: ADMIN UPDATE"
  on public.disputes for update
  using (public.get_user_role() in ('ADMIN', 'MASTER_ADMIN'))
  with check (public.get_user_role() in ('ADMIN', 'MASTER_ADMIN'));

-- ── dispute_messages ─────────────────────────────────────────
create policy "dispute_messages: 当事者SELECT"
  on public.dispute_messages for select
  using (
    exists (
      select 1 from public.disputes d
      join public.contracts c on c.id = d.contract_id
      where d.id = dispute_id
        and (d.initiated_by = auth.uid()
             or c.client_user_id = auth.uid()
             or c.worker_user_id = auth.uid()
             or public.get_user_role() in ('ADMIN', 'MASTER_ADMIN'))
    )
  );

create policy "dispute_messages: 当事者INSERT"
  on public.dispute_messages for insert
  with check (
    sender_user_id = auth.uid()
    and (
      not is_internal
      or public.get_user_role() in ('ADMIN', 'MASTER_ADMIN')
    )
  );

-- ── reviews ──────────────────────────────────────────────────
create policy "reviews: 全員SELECT"
  on public.reviews for select
  using (auth.role() = 'authenticated');

create policy "reviews: 本人INSERT"
  on public.reviews for insert
  with check (reviewer_user_id = auth.uid());

-- ── review_replies ───────────────────────────────────────────
create policy "review_replies: 全員SELECT"
  on public.review_replies for select
  using (auth.role() = 'authenticated');

create policy "review_replies: 本人INSERT/UPDATE"
  on public.review_replies for insert
  with check (replied_by = auth.uid());

create policy "review_replies: 本人UPDATE"
  on public.review_replies for update
  using (replied_by = auth.uid())
  with check (replied_by = auth.uid());

-- ── user_scores ──────────────────────────────────────────────
create policy "user_scores: 全員SELECT"
  on public.user_scores for select
  using (auth.role() = 'authenticated');

-- ── company_scores ───────────────────────────────────────────
create policy "company_scores: 全員SELECT"
  on public.company_scores for select
  using (auth.role() = 'authenticated');

-- ── wallets ──────────────────────────────────────────────────
create policy "wallets: 本人SELECT"
  on public.wallets for select
  using (user_id = auth.uid() or public.get_user_role() = 'MASTER_ADMIN');

-- ── point_transactions ───────────────────────────────────────
create policy "point_transactions: 本人SELECT"
  on public.point_transactions for select
  using (user_id = auth.uid() or public.get_user_role() = 'MASTER_ADMIN');

-- ── point_rules ──────────────────────────────────────────────
create policy "point_rules: 認証ユーザーSELECT"
  on public.point_rules for select
  using (auth.role() = 'authenticated');

create policy "point_rules: MASTER_ADMIN全操作"
  on public.point_rules for all
  using (public.get_user_role() = 'MASTER_ADMIN')
  with check (public.get_user_role() = 'MASTER_ADMIN');

-- ── point_expirations ────────────────────────────────────────
create policy "point_expirations: 本人SELECT"
  on public.point_expirations for select
  using (user_id = auth.uid() or public.get_user_role() = 'MASTER_ADMIN');

-- ── point_grants ─────────────────────────────────────────────
create policy "point_grants: 本人SELECT"
  on public.point_grants for select
  using (user_id = auth.uid() or public.get_user_role() = 'MASTER_ADMIN');

-- ── point_redemptions ────────────────────────────────────────
create policy "point_redemptions: 本人SELECT"
  on public.point_redemptions for select
  using (user_id = auth.uid() or public.get_user_role() = 'MASTER_ADMIN');

create policy "point_redemptions: 本人INSERT"
  on public.point_redemptions for insert
  with check (user_id = auth.uid());

-- ── product_categories ───────────────────────────────────────
create policy "product_categories: 全員SELECT"
  on public.product_categories for select
  using (auth.role() = 'authenticated');

create policy "product_categories: MASTER_ADMIN全操作"
  on public.product_categories for all
  using (public.get_user_role() = 'MASTER_ADMIN')
  with check (public.get_user_role() = 'MASTER_ADMIN');

-- ── product_tags ─────────────────────────────────────────────
create policy "product_tags: 全員SELECT"
  on public.product_tags for select
  using (auth.role() = 'authenticated');

create policy "product_tags: MASTER_ADMIN全操作"
  on public.product_tags for all
  using (public.get_user_role() = 'MASTER_ADMIN')
  with check (public.get_user_role() = 'MASTER_ADMIN');

-- ── products ─────────────────────────────────────────────────
create policy "products: 公開商品SELECT"
  on public.products for select
  using (
    status = 'ACTIVE'
    or public.get_user_role() in ('ADMIN', 'MASTER_ADMIN')
  );

create policy "product_files: 全員SELECT"
  on public.product_files for select
  using (auth.role() = 'authenticated');

-- ── product_tag_relations ────────────────────────────────────
create policy "product_tag_relations: 全員SELECT"
  on public.product_tag_relations for select
  using (auth.role() = 'authenticated');

-- ── carts ────────────────────────────────────────────────────
create policy "carts: 本人SELECT"
  on public.carts for select
  using (user_id = auth.uid());

create policy "carts: 本人INSERT"
  on public.carts for insert
  with check (user_id = auth.uid());

create policy "carts: 本人UPDATE"
  on public.carts for update
  using  (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ── cart_items ───────────────────────────────────────────────
create policy "cart_items: 本人SELECT"
  on public.cart_items for select
  using (
    exists (
      select 1 from public.carts c
      where c.id = cart_id and c.user_id = auth.uid()
    )
  );

create policy "cart_items: 本人INSERT"
  on public.cart_items for insert
  with check (
    exists (
      select 1 from public.carts c
      where c.id = cart_id and c.user_id = auth.uid()
    )
  );

create policy "cart_items: 本人UPDATE"
  on public.cart_items for update
  using (
    exists (
      select 1 from public.carts c
      where c.id = cart_id and c.user_id = auth.uid()
    )
  );

create policy "cart_items: 本人DELETE"
  on public.cart_items for delete
  using (
    exists (
      select 1 from public.carts c
      where c.id = cart_id and c.user_id = auth.uid()
    )
  );

-- ── orders ───────────────────────────────────────────────────
create policy "orders: 本人SELECT"
  on public.orders for select
  using (user_id = auth.uid() or public.get_user_role() = 'MASTER_ADMIN');

create policy "orders: 本人INSERT"
  on public.orders for insert
  with check (user_id = auth.uid());

-- ── order_items ──────────────────────────────────────────────
create policy "order_items: 本人SELECT"
  on public.order_items for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id
        and (o.user_id = auth.uid() or public.get_user_role() = 'MASTER_ADMIN')
    )
  );

-- ── payments ─────────────────────────────────────────────────
create policy "payments: 本人SELECT"
  on public.payments for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id
        and (o.user_id = auth.uid() or public.get_user_role() = 'MASTER_ADMIN')
    )
    or public.get_user_role() = 'MASTER_ADMIN'
  );

-- ── coupons ──────────────────────────────────────────────────
create policy "coupons: 認証ユーザーSELECT"
  on public.coupons for select
  using (
    is_active = true
    or public.get_user_role() in ('ADMIN', 'MASTER_ADMIN')
  );

create policy "coupons: MASTER_ADMIN全操作"
  on public.coupons for all
  using (public.get_user_role() = 'MASTER_ADMIN')
  with check (public.get_user_role() = 'MASTER_ADMIN');

-- ── coupon_redemptions ───────────────────────────────────────
create policy "coupon_redemptions: 本人SELECT"
  on public.coupon_redemptions for select
  using (user_id = auth.uid() or public.get_user_role() = 'MASTER_ADMIN');

create policy "coupon_redemptions: 本人INSERT"
  on public.coupon_redemptions for insert
  with check (user_id = auth.uid());

-- ── invoices ─────────────────────────────────────────────────
create policy "invoices: 本人SELECT"
  on public.invoices for select
  using (
    issued_to_user_id = auth.uid()
    or public.get_user_role() in ('ADMIN', 'MASTER_ADMIN')
  );

-- ── user_action_logs ─────────────────────────────────────────
create policy "user_action_logs: 本人INSERT"
  on public.user_action_logs for insert
  with check (user_id = auth.uid());

create policy "user_action_logs: MASTER_ADMIN SELECT"
  on public.user_action_logs for select
  using (public.get_user_role() = 'MASTER_ADMIN');

-- ── search_logs ──────────────────────────────────────────────
create policy "search_logs: INSERT"
  on public.search_logs for insert
  with check (
    user_id is null or user_id = auth.uid()
  );

create policy "search_logs: MASTER_ADMIN SELECT"
  on public.search_logs for select
  using (public.get_user_role() = 'MASTER_ADMIN');

-- ── page_view_logs ───────────────────────────────────────────
create policy "page_view_logs: INSERT"
  on public.page_view_logs for insert
  with check (
    user_id is null or user_id = auth.uid()
  );

create policy "page_view_logs: MASTER_ADMIN SELECT"
  on public.page_view_logs for select
  using (public.get_user_role() = 'MASTER_ADMIN');

-- ── conversion_events ────────────────────────────────────────
create policy "conversion_events: INSERT"
  on public.conversion_events for insert
  with check (
    user_id is null or user_id = auth.uid()
  );

create policy "conversion_events: MASTER_ADMIN SELECT"
  on public.conversion_events for select
  using (public.get_user_role() = 'MASTER_ADMIN');

-- ============================================================
-- 14. Storage
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
