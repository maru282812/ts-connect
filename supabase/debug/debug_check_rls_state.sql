-- ============================================================
-- 診断用 SQL: RLS 状態・データ確認
-- Supabase SQL Editor で postgres/service_role として実行してください
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- A. get_user_role() 関数の定義確認
-- ────────────────────────────────────────────────────────────
SELECT
  p.proname                                          AS function_name,
  pg_get_function_identity_arguments(p.oid)          AS arguments,
  pg_get_functiondef(p.oid)                          AS definition,
  p.prosecdef                                        AS security_definer
FROM pg_proc p
WHERE p.proname = 'get_user_role'
  AND p.pronamespace = 'public'::regnamespace;

-- ────────────────────────────────────────────────────────────
-- B. get_user_role() の EXECUTE 権限確認
--    authenticated / anon に EXECUTE がなければ権限消失が原因
-- ────────────────────────────────────────────────────────────
SELECT
  r.rolname,
  has_function_privilege(r.rolname, 'public.get_user_role()', 'EXECUTE') AS can_execute
FROM pg_roles r
WHERE r.rolname IN ('authenticated', 'anon', 'service_role', 'postgres');

-- ────────────────────────────────────────────────────────────
-- C. posts テーブルの RLS ポリシー一覧
-- ────────────────────────────────────────────────────────────
SELECT
  policyname,
  cmd,
  qual::text  AS using_expr,
  with_check::text AS with_check_expr
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename  = 'posts'
ORDER BY policyname;

-- ────────────────────────────────────────────────────────────
-- D. applications テーブルの RLS ポリシー一覧
-- ────────────────────────────────────────────────────────────
SELECT
  policyname,
  cmd,
  qual::text AS using_expr,
  with_check::text AS with_check_expr
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename  = 'applications'
ORDER BY policyname;

-- ────────────────────────────────────────────────────────────
-- E. company_members テーブルの RLS ポリシー一覧
-- ────────────────────────────────────────────────────────────
SELECT
  policyname,
  cmd,
  qual::text AS using_expr,
  with_check::text AS with_check_expr
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename  = 'company_members'
ORDER BY policyname;

-- ────────────────────────────────────────────────────────────
-- F. users テーブルの RLS ポリシー一覧
-- ────────────────────────────────────────────────────────────
SELECT
  policyname,
  cmd,
  qual::text AS using_expr
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename  = 'users'
ORDER BY policyname;

-- ────────────────────────────────────────────────────────────
-- G. users レコード確認（admin / MASTER_ADMIN ユーザー）
--    ※ <対象ユーザーのemail> を実際のメールアドレスに置換してください
-- ────────────────────────────────────────────────────────────
SELECT
  u.id,
  u.email,
  u.display_name,
  u.system_role,
  u.account_status
FROM public.users u
WHERE u.system_role IN ('ADMIN', 'MASTER_ADMIN')
ORDER BY u.system_role, u.email;

-- ────────────────────────────────────────────────────────────
-- H. company_members の所属・role・status 確認
-- ────────────────────────────────────────────────────────────
SELECT
  u.email,
  u.system_role,
  cm.company_id,
  c.name AS company_name,
  cm.role       AS member_role,
  cm.status     AS member_status
FROM public.company_members cm
JOIN public.users    u ON u.id = cm.user_id
JOIN public.companies c ON c.id = cm.company_id
WHERE u.system_role IN ('ADMIN', 'MASTER_ADMIN')
ORDER BY u.email;

-- ────────────────────────────────────────────────────────────
-- I. posts の company_id / created_by / post_status 確認
-- ────────────────────────────────────────────────────────────
SELECT
  p.id,
  p.title,
  p.post_type,
  p.post_status,
  p.company_id,
  c.name AS company_name,
  p.created_by_user_id,
  u.email AS created_by_email
FROM public.posts p
LEFT JOIN public.companies c ON c.id = p.company_id
LEFT JOIN public.users     u ON u.id = p.created_by_user_id
ORDER BY p.updated_at DESC
LIMIT 20;

-- ────────────────────────────────────────────────────────────
-- J. ADMIN として本来見えるべき posts 件数シミュレーション
--    ※ <ADMIN_USER_ID> を実際の UUID に置換してください
-- ────────────────────────────────────────────────────────────
-- （service_role で実行するため RLS をバイパスして手動で条件を再現）
/*
SELECT COUNT(*) AS admin_visible_posts
FROM public.posts p
WHERE p.company_id IN (
  SELECT cm.company_id
  FROM public.company_members cm
  WHERE cm.user_id = '<ADMIN_USER_ID>'::uuid
    AND cm.status = 'active'
);
*/

-- ────────────────────────────────────────────────────────────
-- K. MASTER_ADMIN として本来見えるべき posts 件数
-- ────────────────────────────────────────────────────────────
SELECT COUNT(*) AS total_posts FROM public.posts;

-- ────────────────────────────────────────────────────────────
-- L. company_members の status 値の分布確認
--    'active' 以外の値が混在していないかチェック
-- ────────────────────────────────────────────────────────────
SELECT status, COUNT(*) AS cnt
FROM public.company_members
GROUP BY status
ORDER BY cnt DESC;

-- ────────────────────────────────────────────────────────────
-- M. posts に company_id が NULL のレコードがないか確認
-- ────────────────────────────────────────────────────────────
SELECT COUNT(*) AS posts_with_null_company
FROM public.posts
WHERE company_id IS NULL;

-- ────────────────────────────────────────────────────────────
-- N. get_user_role() を特定ユーザーとしてシミュレーション
--    ※ <USER_UUID> を実際の UUID に置換してください
-- ────────────────────────────────────────────────────────────
/*
SELECT public.get_user_role()
FROM (SELECT set_config('request.jwt.claims',
       json_build_object('sub', '<USER_UUID>')::text, true)) AS _setup
LIMIT 1;
*/
