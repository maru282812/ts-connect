-- ============================================================
-- 020_community_sns.sql
-- 社内SNS（コミュニティ）Phase1 追加マイグレーション（追加のみ・非破壊）
--
-- 設計: docs/design/community_sns_design.md
-- 方針:
--   - 既存 posts/post_files/post_tags/post_reports（案件モデル）とは衝突させず
--     community_ 接頭辞で完全分離する。
--   - 画像/動画の本体は DB に保存せず Storage バケット community-media に置き、
--     DB にはパス/メタのみを保持する。
--   - 既存の RLS ヘルパー public.get_user_role() / public.get_user_company_ids()
--     を再利用する。
--   - 本ファイル適用後、プロジェクト規約に従い 001_schema.sql へ反映すること。
-- ============================================================

-- ============================================================
-- 1. テーブル
-- ============================================================

-- ── community_posts: 投稿本体（ORIGINAL/REPOST/QUOTE を自己参照で表現） ──
create table if not exists public.community_posts (
  id             uuid        primary key default gen_random_uuid(),
  company_id     uuid        not null references public.companies(id) on delete cascade,
  author_user_id uuid        not null references public.users(id)     on delete cascade,
  body           text        not null default '',
  visibility     text        not null default 'COMPANY'
                 check (visibility in ('COMPANY','DEPARTMENT','GROUP','ADMIN_ONLY','PRIVATE')),
  department_id  uuid        references public.departments(id),
  post_kind      text        not null default 'ORIGINAL'
                 check (post_kind in ('ORIGINAL','REPOST','QUOTE')),
  repost_of_id   uuid        references public.community_posts(id) on delete set null,
  source_kind    text        not null default 'INTERNAL'
                 check (source_kind in ('INTERNAL','EXTERNAL_IMPORT')),
  source_url     text,
  is_draft       boolean     not null default false,
  is_hidden      boolean     not null default false,
  hidden_by      uuid        references public.users(id),
  hidden_reason  text,
  like_count     int         not null default 0,
  comment_count  int         not null default 0,
  repost_count   int         not null default 0,
  edited_at      timestamptz,
  deleted_at     timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists community_posts_company_idx   on public.community_posts(company_id);
create index if not exists community_posts_author_idx    on public.community_posts(author_user_id);
create index if not exists community_posts_created_idx    on public.community_posts(created_at desc);
create index if not exists community_posts_repost_idx     on public.community_posts(repost_of_id);
create index if not exists community_posts_deleted_idx    on public.community_posts(deleted_at) where deleted_at is null;
create index if not exists community_posts_search_idx     on public.community_posts using gin(to_tsvector('simple', body));

-- ── community_post_attachments: 添付（Storage パス + メタのみ） ──
create table if not exists public.community_post_attachments (
  id               uuid        primary key default gen_random_uuid(),
  post_id          uuid        not null references public.community_posts(id) on delete cascade,
  uploaded_by      uuid        not null references public.users(id),
  media_type       text        not null check (media_type in ('IMAGE','VIDEO')),
  storage_path     text        not null,
  thumbnail_path   text,
  file_name        text        not null,
  file_size        bigint      not null default 0,
  mime_type        text,
  width            int,
  height           int,
  duration_seconds int,
  sort_order       int         not null default 0,
  created_at       timestamptz not null default now()
);
create index if not exists community_attachments_post_idx on public.community_post_attachments(post_id);

-- ── community_post_comments: コメント（1段返信） ──
create table if not exists public.community_post_comments (
  id                uuid        primary key default gen_random_uuid(),
  post_id           uuid        not null references public.community_posts(id) on delete cascade,
  author_user_id    uuid        not null references public.users(id) on delete cascade,
  parent_comment_id uuid        references public.community_post_comments(id) on delete cascade,
  body              text        not null,
  is_hidden         boolean     not null default false,
  deleted_at        timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists community_comments_post_idx on public.community_post_comments(post_id);

-- ── community_post_reactions: いいね + 絵文字リアクション統合 ──
create table if not exists public.community_post_reactions (
  id         uuid        primary key default gen_random_uuid(),
  post_id    uuid        not null references public.community_posts(id) on delete cascade,
  user_id    uuid        not null references public.users(id) on delete cascade,
  reaction   text        not null default 'LIKE',  -- 'LIKE' / 'THANKS' / 'CLAP' / 'EYES' ...
  created_at timestamptz not null default now(),
  unique (post_id, user_id, reaction)
);
create index if not exists community_reactions_post_idx on public.community_post_reactions(post_id);

-- ── community_post_tags / relations ──
create table if not exists public.community_post_tags (
  id         uuid        primary key default gen_random_uuid(),
  name       text        not null unique,
  slug       text        not null unique,
  created_at timestamptz not null default now()
);
create table if not exists public.community_post_tag_relations (
  post_id uuid not null references public.community_posts(id)     on delete cascade,
  tag_id  uuid not null references public.community_post_tags(id) on delete cascade,
  primary key (post_id, tag_id)
);

-- ── community_post_reports: 通報 ──
create table if not exists public.community_post_reports (
  id          uuid        primary key default gen_random_uuid(),
  post_id     uuid        not null references public.community_posts(id) on delete cascade,
  reported_by uuid        not null references public.users(id),
  reason      text        not null
              check (reason in ('SPAM','INAPPROPRIATE','HARASSMENT','MISLEADING','OTHER')),
  detail      text,
  status      text        not null default 'PENDING'
              check (status in ('PENDING','REVIEWED','RESOLVED','DISMISSED')),
  reviewed_by uuid        references public.users(id),
  reviewed_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists community_reports_post_idx   on public.community_post_reports(post_id);
create index if not exists community_reports_status_idx on public.community_post_reports(status);

-- ── community_external_drafts: 広報の社外発信→社内SNS下書き ──
create table if not exists public.community_external_drafts (
  id                uuid        primary key default gen_random_uuid(),
  company_id        uuid        not null references public.companies(id) on delete cascade,
  created_by        uuid        not null references public.users(id),
  source_url        text        not null,
  og_title          text,
  og_description    text,
  og_image_url      text,
  og_site_name      text,
  draft_body        text,
  status            text        not null default 'DRAFT'
                    check (status in ('DRAFT','PUBLISHED','DISCARDED')),
  published_post_id uuid        references public.community_posts(id) on delete set null,
  fetched_at        timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists community_external_drafts_company_idx on public.community_external_drafts(company_id);

-- ============================================================
-- 2. RLS（既存ヘルパー get_user_role() / get_user_company_ids() を再利用）
-- ============================================================
alter table public.community_posts              enable row level security;
alter table public.community_post_attachments   enable row level security;
alter table public.community_post_comments      enable row level security;
alter table public.community_post_reactions     enable row level security;
alter table public.community_post_tags          enable row level security;
alter table public.community_post_tag_relations enable row level security;
alter table public.community_post_reports       enable row level security;
alter table public.community_external_drafts    enable row level security;

-- community_posts: 自社・非削除・非ドラフト（または本人）を閲覧
create policy "community_posts: select visible" on public.community_posts
  for select using (
    deleted_at is null
    and company_id = any(public.get_user_company_ids())
    and (
      author_user_id = auth.uid()
      or (is_draft = false and visibility <> 'PRIVATE')
    )
  );
create policy "community_posts: master select all" on public.community_posts
  for select using (public.get_user_role() = 'MASTER_ADMIN');

create policy "community_posts: insert own" on public.community_posts
  for insert with check (
    author_user_id = auth.uid()
    and company_id = any(public.get_user_company_ids())
  );
create policy "community_posts: update own" on public.community_posts
  for update using (author_user_id = auth.uid());
create policy "community_posts: admin moderate" on public.community_posts
  for update using (
    public.get_user_role() in ('ADMIN','MASTER_ADMIN')
    and company_id = any(public.get_user_company_ids())
  );

-- 子テーブル: 親投稿が見えれば見える / 本人のみ書込
create policy "community_attachments: select via post" on public.community_post_attachments
  for select using (
    exists (select 1 from public.community_posts p where p.id = post_id)
  );
create policy "community_attachments: insert own" on public.community_post_attachments
  for insert with check (uploaded_by = auth.uid());

create policy "community_comments: select" on public.community_post_comments
  for select using (deleted_at is null);
create policy "community_comments: insert own" on public.community_post_comments
  for insert with check (author_user_id = auth.uid());
create policy "community_comments: update own" on public.community_post_comments
  for update using (author_user_id = auth.uid());

create policy "community_reactions: select" on public.community_post_reactions
  for select using (true);
create policy "community_reactions: insert own" on public.community_post_reactions
  for insert with check (user_id = auth.uid());
create policy "community_reactions: delete own" on public.community_post_reactions
  for delete using (user_id = auth.uid());

create policy "community_tags: select" on public.community_post_tags
  for select using (true);
create policy "community_tag_relations: select" on public.community_post_tag_relations
  for select using (true);

create policy "community_reports: insert own" on public.community_post_reports
  for insert with check (reported_by = auth.uid());
create policy "community_reports: admin select" on public.community_post_reports
  for select using (public.get_user_role() in ('ADMIN','MASTER_ADMIN'));
create policy "community_reports: admin update" on public.community_post_reports
  for update using (public.get_user_role() in ('ADMIN','MASTER_ADMIN'));

create policy "community_drafts: own or admin" on public.community_external_drafts
  for all
  using (
    created_by = auth.uid()
    or (public.get_user_role() in ('ADMIN','MASTER_ADMIN')
        and company_id = any(public.get_user_company_ids()))
  )
  with check (created_by = auth.uid());

-- ============================================================
-- 3. Storage バケット community-media（画像/動画）
--    画像 5MB / 動画 50MB（Phase1。要確認）。パスは {company_id}/{user_id}/...
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'community-media',
  'community-media',
  true,
  52428800, -- 50MB
  array[
    'image/png','image/jpeg','image/webp','image/gif',
    'video/mp4','video/webm'
  ]
)
on conflict (id) do nothing;

-- 認証ユーザーは自分の user_id フォルダ配下のみ書込可（パス: {company_id}/{user_id}/...）
create policy "community-media: insert own folder"
  on storage.objects for insert
  with check (
    bucket_id = 'community-media'
    and auth.uid() is not null
    and (storage.foldername(name))[2] = auth.uid()::text
  );
create policy "community-media: update own"
  on storage.objects for update
  using (
    bucket_id = 'community-media'
    and auth.uid() is not null
    and (storage.foldername(name))[2] = auth.uid()::text
  );
create policy "community-media: delete own"
  on storage.objects for delete
  using (
    bucket_id = 'community-media'
    and auth.uid() is not null
    and (storage.foldername(name))[2] = auth.uid()::text
  );
create policy "community-media: public select"
  on storage.objects for select
  using (bucket_id = 'community-media');
