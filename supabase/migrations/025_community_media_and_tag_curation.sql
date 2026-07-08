-- ============================================================
-- 025_community_media_and_tag_curation.sql
-- 社内SNS: ①動画投稿を可能にする ②タグを「乱立させず代表的に扱う」基盤（追加のみ・非破壊）
--
-- 背景:
--   - 動画: 投稿の添付は実際には storage バケット `thumbnails` を再利用している
--     （lib/community.ts）。020 で作った community-media は未使用。thumbnails は
--     画像のみ・5MB 制限のため動画が上げられない。→ thumbnails を動画対応に拡張する。
--   - タグ: 各自が自由入力 → 表記揺れでタグが乱立し機能していない。
--     一般的なタグ運用手法（正規化 + 利用回数 + 人気/代表タグ + サジェスト + 検索）の
--     基盤として、利用回数 usage_count を集計トリガーで保持する。
--     （正規化・サジェスト・検索はアプリ層 lib/community.ts で実装）
--
-- 方針:
--   - GRANT / ALTER は冪等。トリガーは drop してから作成。
--   - 本ファイル適用後、プロジェクト規約に従い 001_schema.sql / 020 へ反映すること。
-- ============================================================

-- ============================================================
-- 1. 動画: thumbnails バケットを画像+動画 / 50MB に拡張
--    （既存画像のパス・URL はそのまま。許可 mime と上限のみ広げる非破壊更新）
-- ============================================================
update storage.buckets
   set file_size_limit = 52428800, -- 50MB
       allowed_mime_types = array[
         'image/png','image/jpeg','image/webp','image/gif',
         'video/mp4','video/webm','video/quicktime'
       ]
 where id = 'thumbnails';

-- ============================================================
-- 2. タグ: 利用回数 usage_count（人気/代表タグの並び替え用）
-- ============================================================
alter table public.community_post_tags
  add column if not exists usage_count int not null default 0;

create index if not exists community_tags_usage_idx
  on public.community_post_tags(usage_count desc);

-- ── 紐付けの増減に合わせて usage_count を自動同期 ──
-- 集計のため SECURITY DEFINER + search_path 固定（RLS をバイパスして正確に数える）。
create or replace function public.community_sync_tag_usage()
returns trigger as $$
begin
  update public.community_post_tags t
     set usage_count = (
       select count(*) from public.community_post_tag_relations r
        where r.tag_id = t.id
     )
   where t.id = coalesce(new.tag_id, old.tag_id);
  return null;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists trg_community_tag_usage on public.community_post_tag_relations;
create trigger trg_community_tag_usage
  after insert or delete on public.community_post_tag_relations
  for each row execute function public.community_sync_tag_usage();

-- ── 既存データの usage_count をバックフィル ──
update public.community_post_tags t
   set usage_count = (
     select count(*) from public.community_post_tag_relations r
      where r.tag_id = t.id
   );
