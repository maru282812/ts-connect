-- ============================================================
-- 027_community_resolve_display_names.sql
-- 社内SNS: フィード/コメントで他人の著者名が「不明」になる不具合の修正（追加のみ・非破壊）
--
-- 背景:
--   public.users の RLS は「自分の行のみ SELECT 可」のため、社内SNS のフィードや
--   コメントで join した他人の display_name が NULL になり「不明」と表示されていた。
--   users の RLS を全社的に緩めると email / system_role 等まで同僚に晒れてしまう。
--
-- 方針:
--   - users の RLS は変更しない。
--   - 「呼び出し元と会社を共有する同僚の表示名だけ」を返す SECURITY DEFINER RPC を追加し、
--     アプリ層(lib/community.ts)は author_user_id の集合をこの RPC で名前解決する。
--   - 026 の community_member_directory と同じ安全方針（最小列のみ・自社スコープ）。
--   - 本ファイル適用後、プロジェクト規約に従い 001_schema.sql / 020 へ反映すること。
-- ============================================================

-- ── 表示名の一括解決（自社の同僚に限る・最小列のみ） ──
create or replace function public.community_resolve_display_names(ids uuid[])
returns table (user_id uuid, display_name text)
language sql
security definer
set search_path = public
as $$
  select u.id, u.display_name
    from public.users u
   where u.id = any(ids)
     and exists (
       select 1
         from public.company_members cm
        where cm.user_id = u.id
          and cm.company_id = any(public.get_user_company_ids())
     );
$$;

grant execute on function public.community_resolve_display_names(uuid[]) to authenticated;
