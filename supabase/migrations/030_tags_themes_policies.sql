-- ============================================================
-- 030_tags_themes_policies.sql
-- フェーズ2「案件オススメ（タグ一致）」向け post_tags 書き込みポリシー補完（追加のみ・非破壊）
--
-- 背景:
--   - 案件（OFFICIAL posts）にマッチング用タグを付与するため、company surface の
--     ADMIN が案件作成・編集時に新規タグを作れる必要がある。
--     001_schema.sql の post_tags は「MASTER_ADMIN のみ管理」かつ authenticated へ
--     SELECT のみ GRANT のため、ADMIN では INSERT/UPDATE できない。
--   - post_tag_relations は 001 で「投稿作成者 or ADMIN/MASTER_ADMIN が INSERT/DELETE」
--     ポリシー + authenticated への SELECT/INSERT/DELETE GRANT が既にあるため対応不要。
--   - 週替わりテーマ(community_weekly_themes)は 021（ADMIN manage ポリシー）+
--     023（authenticated への insert/update/delete GRANT）で既に完備のため対応不要。
-- 方針:
--   - 追加・冪等。既存 "post_tags: master_admin all" は残し、ADMIN 用ポリシーを追加。
--   - 本ファイル適用後、プロジェクト規約に従い 001_schema.sql へ反映すること。
-- ============================================================

-- post_tags: ADMIN / MASTER_ADMIN が作成・更新・削除可能に
-- （既存の master_admin all ポリシーは温存。role 条件を ADMIN まで広げる別ポリシーを追加）
drop policy if exists "post_tags: admin manage" on public.post_tags;
create policy "post_tags: admin manage" on public.post_tags
  for all
  using  (public.get_user_role() in ('ADMIN', 'MASTER_ADMIN'))
  with check (public.get_user_role() in ('ADMIN', 'MASTER_ADMIN'));

-- authenticated へ INSERT/UPDATE を追加付与（DELETE は当面付与しない）
-- （行レベルの制御は上記 RLS が担う。テーブル権限が無いと RLS 到達前に弾かれるため）
grant insert, update on public.post_tags to authenticated;
