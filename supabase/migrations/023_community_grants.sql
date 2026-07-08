-- ============================================================
-- 023_community_grants.sql
-- 社内SNS（コミュニティ）テーブルへの GRANT 補完（追加のみ・非破壊）
--
-- 背景:
--   020_community_sns.sql / 021_community_weekly_themes.sql は RLS 有効化と
--   ポリシー作成は行っているが、テーブルへの GRANT が抜けていた。
--   そのため authenticated ロール（クライアント）が RLS に到達する前に
--   "permission denied for table community_posts" で弾かれていた。
--   （001 Section 5 の切り分け: permission denied → GRANT 不足）
--
-- 方針:
--   - GRANT は冪等なので何度実行しても安全。
--   - 付与範囲は 020/021 の各 RLS ポリシー（行レベル制御）に合わせる。
--   - anon には付与しない。service_role には ALL を付与（管理用）。
--   - 本ファイル適用後、プロジェクト規約に従い 001_schema.sql / 020 / 021 へ反映すること。
-- ============================================================

-- service_role: 全コミュニティテーブルへの全操作（RLS バイパスの管理用）
grant all on public.community_posts              to service_role;
grant all on public.community_post_attachments   to service_role;
grant all on public.community_post_comments      to service_role;
grant all on public.community_post_reactions     to service_role;
grant all on public.community_post_tags          to service_role;
grant all on public.community_post_tag_relations to service_role;
grant all on public.community_post_reports       to service_role;
grant all on public.community_external_drafts    to service_role;
grant all on public.community_weekly_themes      to service_role;

-- community_posts: 参照・作成・更新（論理削除/編集は update、DELETE 動線なし）
grant select, insert, update on public.community_posts to authenticated;

-- community_post_attachments: 参照・追加（添付）
grant select, insert on public.community_post_attachments to authenticated;

-- community_post_comments: 参照・作成・更新（本人編集）
grant select, insert, update on public.community_post_comments to authenticated;

-- community_post_reactions: 参照・追加・削除（いいね/絵文字 ON/OFF）
grant select, insert, delete on public.community_post_reactions to authenticated;

-- community_post_tags: 参照のみ（管理は service_role 経由）
grant select on public.community_post_tags to authenticated;

-- community_post_tag_relations: 参照（付与/削除は当面 service_role 経由）
grant select on public.community_post_tag_relations to authenticated;

-- community_post_reports: 参照（自分/管理者）・通報追加・管理者によるステータス更新
grant select, insert, update on public.community_post_reports to authenticated;

-- community_external_drafts: 参照・作成・更新・削除（own or admin の for all ポリシーに対応）
grant select, insert, update, delete on public.community_external_drafts to authenticated;

-- community_weekly_themes: 参照（全員）＋ 管理（ADMIN/MASTER の for all ポリシーに対応）
grant select, insert, update, delete on public.community_weekly_themes to authenticated;
