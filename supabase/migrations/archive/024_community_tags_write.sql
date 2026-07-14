-- ============================================================
-- 024_community_tags_write.sql
-- 社内SNS タグ機能を「クライアントから付与できる」状態にする（追加のみ・非破壊）
--
-- 背景:
--   020_community_sns.sql / 023_community_grants.sql では
--   community_post_tags / community_post_tag_relations は authenticated に
--   SELECT しか許可していなかった（付与は service_role 経由想定）。
--   第1弾で投稿者本人がタグを付けられるようにするため、INSERT を解放する。
--
-- 方針:
--   - タグ master(community_post_tags): 認証ユーザーは新規作成可（重複は name/slug 一意制約で吸収）。
--   - 紐付け(community_post_tag_relations): 自分の投稿に対してのみ付与/削除可。
--   - GRANT は冪等。RLS ポリシーは存在時 drop してから作成。
--   - 本ファイル適用後、プロジェクト規約に従い 001_schema.sql / 020 へ反映すること。
-- ============================================================

-- ── GRANT 追加 ──
grant select, insert on public.community_post_tags to authenticated;
grant select, insert, delete on public.community_post_tag_relations to authenticated;

-- ── community_post_tags: 認証ユーザーは新規タグ作成可 ──
drop policy if exists "community_tags: insert authenticated" on public.community_post_tags;
create policy "community_tags: insert authenticated" on public.community_post_tags
  for insert with check (auth.uid() is not null);

-- ── community_post_tag_relations: 自分の投稿に限り付与/削除可 ──
drop policy if exists "community_tag_relations: insert via own post" on public.community_post_tag_relations;
create policy "community_tag_relations: insert via own post" on public.community_post_tag_relations
  for insert with check (
    exists (
      select 1 from public.community_posts p
      where p.id = post_id and p.author_user_id = auth.uid()
    )
  );

drop policy if exists "community_tag_relations: delete via own post" on public.community_post_tag_relations;
create policy "community_tag_relations: delete via own post" on public.community_post_tag_relations
  for delete using (
    exists (
      select 1 from public.community_posts p
      where p.id = post_id and p.author_user_id = auth.uid()
    )
  );
