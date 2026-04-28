-- ============================================================
-- Migration 017: ADMIN 投稿表示問題の根本修正
-- ============================================================
-- 【問題】
--   ADMIN でログインすると管理メニューの投稿が0件表示される。
--   MASTER_ADMIN では正常に表示される。
--
-- 【根本原因】
--   posts の ADMIN SELECT ポリシーが以下の条件を評価する:
--     company_id IN (
--       SELECT company_id FROM company_members
--       WHERE user_id = auth.uid() AND status = 'active'
--     )
--   このサブクエリが空を返す場合、全投稿が0件になる。
--   原因のパターン:
--     (A) ADMIN ユーザーが company_members にレコードを持っていない
--     (B) company_members.status が大文字 ('ACTIVE') で小文字チェック ('active') と不一致
--     (C) RLS ポリシー自体が正しく適用されていない
--
-- 【MASTER_ADMIN との差異】
--   MASTER_ADMIN ポリシー: get_user_role() = 'MASTER_ADMIN' のみ → company_members 不要
--   ADMIN ポリシー: company_members サブクエリが必須 → レコード欠如で0件
--
-- 【本マイグレーションの対処】
--   1. company_members.status を小文字に正規化（パターンB対策）
--   2. get_user_role() / get_user_company_ids() 関数を再定義・権限付与
--   3. 全 RLS ポリシーを確実に正しい状態に再適用
--   4. ADMIN が company_members に所属していない場合の診断クエリを提供
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. company_members.status を小文字に正規化
-- ────────────────────────────────────────────────────────────
UPDATE public.company_members
  SET status = LOWER(status)
  WHERE status <> LOWER(status);

-- Backfill public.users for existing auth users.
-- This fixes accounts that can sign in but have no public.users row, which makes
-- get_user_role() return NULL and causes every ADMIN / MASTER_ADMIN policy to fail.
INSERT INTO public.users (id, email, display_name, system_role, account_status)
SELECT
  au.id,
  au.email,
  COALESCE(
    NULLIF(TRIM(au.raw_user_meta_data->>'display_name'), ''),
    split_part(au.email, '@', 1)
  ) AS display_name,
  CASE
    WHEN au.raw_user_meta_data->>'system_role' IN ('ADMIN', 'MASTER_ADMIN')
      THEN au.raw_user_meta_data->>'system_role'
    ELSE 'USER'
  END AS system_role,
  'ACTIVE' AS account_status
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.users u WHERE u.id = au.id
);

-- Backfill company_members from auth metadata where a valid company_id exists.
-- New signups already do this through handle_new_user(); this is only for
-- historical auth users created before the trigger/schema was consistent.
WITH auth_company_ids AS (
  SELECT
    au.id,
    au.raw_user_meta_data,
    (au.raw_user_meta_data->>'company_id')::uuid AS company_id
  FROM auth.users au
  WHERE au.raw_user_meta_data ? 'company_id'
    AND au.raw_user_meta_data->>'company_id' ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
)
INSERT INTO public.company_members (user_id, company_id, role, status)
SELECT
  au.id,
  au.company_id,
  CASE
    WHEN COALESCE(u.system_role, au.raw_user_meta_data->>'system_role') IN ('ADMIN', 'MASTER_ADMIN')
      THEN 'ADMIN'
    ELSE 'USER'
  END AS role,
  'active' AS status
FROM auth_company_ids au
JOIN public.users u ON u.id = au.id
JOIN public.companies c ON c.id = au.company_id
ON CONFLICT (user_id, company_id) DO UPDATE
  SET status = 'active',
      role = EXCLUDED.role,
      updated_at = now();

-- ────────────────────────────────────────────────────────────
-- 2. get_user_role() 再定義・権限付与
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text AS $$
  SELECT system_role FROM public.users WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role() TO anon;
GRANT EXECUTE ON FUNCTION public.get_user_role() TO service_role;

-- ────────────────────────────────────────────────────────────
-- 3. get_user_company_ids() — ADMIN が所属する会社ID一覧を返すヘルパー
--    RLS ポリシー内サブクエリの代替として使用可能（デバッグにも有用）
-- ────────────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS public.get_user_company_ids() CASCADE;

CREATE FUNCTION public.get_user_company_ids()
RETURNS uuid[] AS $$
  SELECT COALESCE(array_agg(company_id), ARRAY[]::uuid[])
  FROM public.company_members
  WHERE user_id = auth.uid()
    AND status = 'active'
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

GRANT EXECUTE ON FUNCTION public.get_user_company_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_company_ids() TO anon;
GRANT EXECUTE ON FUNCTION public.get_user_company_ids() TO service_role;

-- ────────────────────────────────────────────────────────────
-- 4. posts RLS ポリシー — 全削除して再適用
-- ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "posts: user select published"    ON public.posts;
DROP POLICY IF EXISTS "posts: user select open"         ON public.posts;
DROP POLICY IF EXISTS "posts: user select own casual"   ON public.posts;
DROP POLICY IF EXISTS "posts: user insert casual"       ON public.posts;
DROP POLICY IF EXISTS "posts: user update own casual"   ON public.posts;
DROP POLICY IF EXISTS "posts: admin all"                ON public.posts;
DROP POLICY IF EXISTS "posts: master_admin all"         ON public.posts;
DROP POLICY IF EXISTS "posts: admin select own company" ON public.posts;
DROP POLICY IF EXISTS "posts: admin insert own company" ON public.posts;
DROP POLICY IF EXISTS "posts: admin update own"         ON public.posts;
DROP POLICY IF EXISTS "posts: admin delete own"         ON public.posts;

-- USER: OPEN / IN_PROGRESS の投稿を閲覧可能（全社分）
CREATE POLICY "posts: user select open" ON public.posts
  FOR SELECT USING (
    public.get_user_role() = 'USER'
    AND post_status IN ('OPEN', 'IN_PROGRESS')
  );

-- USER: 自分の CASUAL 投稿はステータスを問わず参照可能
CREATE POLICY "posts: user select own casual" ON public.posts
  FOR SELECT USING (
    public.get_user_role() = 'USER'
    AND post_type = 'CASUAL'
    AND created_by_user_id = auth.uid()
  );

-- USER: CASUAL 投稿のみ作成可能
CREATE POLICY "posts: user insert casual" ON public.posts
  FOR INSERT WITH CHECK (
    public.get_user_role() = 'USER'
    AND post_type = 'CASUAL'
    AND created_by_user_id = auth.uid()
  );

-- USER: 自分の CASUAL 投稿のみ更新可能
CREATE POLICY "posts: user update own casual" ON public.posts
  FOR UPDATE USING (
    public.get_user_role() = 'USER'
    AND post_type = 'CASUAL'
    AND created_by_user_id = auth.uid()
  );

-- MASTER_ADMIN: 全件操作（company_members 所属不要）
CREATE POLICY "posts: master_admin all" ON public.posts
  FOR ALL
  USING (public.get_user_role() = 'MASTER_ADMIN')
  WITH CHECK (public.get_user_role() = 'MASTER_ADMIN');

-- ADMIN SELECT: status='active' の所属会社の投稿のみ閲覧可能
--   ※ get_user_company_ids() は SECURITY DEFINER なので RLS をバイパスして正しく動作する
CREATE POLICY "posts: admin select own company" ON public.posts
  FOR SELECT USING (
    public.get_user_role() = 'ADMIN'
    AND company_id = ANY(public.get_user_company_ids())
  );

-- ADMIN INSERT: active 所属会社かつ自分が created_by_user_id
CREATE POLICY "posts: admin insert own company" ON public.posts
  FOR INSERT WITH CHECK (
    public.get_user_role() = 'ADMIN'
    AND company_id = ANY(public.get_user_company_ids())
    AND created_by_user_id = auth.uid()
  );

-- ADMIN UPDATE: 自分が投稿した（かつ active 所属会社）のみ
CREATE POLICY "posts: admin update own" ON public.posts
  FOR UPDATE
  USING (
    public.get_user_role() = 'ADMIN'
    AND created_by_user_id = auth.uid()
    AND company_id = ANY(public.get_user_company_ids())
  )
  WITH CHECK (
    public.get_user_role() = 'ADMIN'
    AND created_by_user_id = auth.uid()
    AND company_id = ANY(public.get_user_company_ids())
  );

-- ADMIN DELETE: 自分が投稿した（かつ active 所属会社）のみ
CREATE POLICY "posts: admin delete own" ON public.posts
  FOR DELETE USING (
    public.get_user_role() = 'ADMIN'
    AND created_by_user_id = auth.uid()
    AND company_id = ANY(public.get_user_company_ids())
  );

-- ────────────────────────────────────────────────────────────
-- 5. applications RLS ポリシー — 全削除して再適用
-- ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "applications: user select own"          ON public.applications;
DROP POLICY IF EXISTS "applications: user insert"              ON public.applications;
DROP POLICY IF EXISTS "applications: admin all"                ON public.applications;
DROP POLICY IF EXISTS "applications: master_admin all"         ON public.applications;
DROP POLICY IF EXISTS "applications: admin select own company" ON public.applications;
DROP POLICY IF EXISTS "applications: admin update own company" ON public.applications;
DROP POLICY IF EXISTS "applications: admin delete own company" ON public.applications;

-- USER: 自分の応募のみ参照可能
CREATE POLICY "applications: user select own" ON public.applications
  FOR SELECT USING (applicant_user_id = auth.uid());

-- USER: 応募作成可能（自分名義のみ）
CREATE POLICY "applications: user insert" ON public.applications
  FOR INSERT WITH CHECK (applicant_user_id = auth.uid());

-- MASTER_ADMIN: 全件操作
CREATE POLICY "applications: master_admin all" ON public.applications
  FOR ALL
  USING (public.get_user_role() = 'MASTER_ADMIN')
  WITH CHECK (public.get_user_role() = 'MASTER_ADMIN');

-- ADMIN SELECT: active 所属会社の投稿への応募のみ閲覧可能
CREATE POLICY "applications: admin select own company" ON public.applications
  FOR SELECT USING (
    public.get_user_role() = 'ADMIN'
    AND post_id IN (
      SELECT id FROM public.posts
      WHERE company_id = ANY(public.get_user_company_ids())
    )
  );

-- ADMIN UPDATE: active 所属会社の投稿への応募ステータス変更可能
CREATE POLICY "applications: admin update own company" ON public.applications
  FOR UPDATE
  USING (
    public.get_user_role() = 'ADMIN'
    AND post_id IN (
      SELECT id FROM public.posts
      WHERE company_id = ANY(public.get_user_company_ids())
    )
  )
  WITH CHECK (
    public.get_user_role() = 'ADMIN'
    AND post_id IN (
      SELECT id FROM public.posts
      WHERE company_id = ANY(public.get_user_company_ids())
    )
  );

-- ADMIN DELETE: active 所属会社の投稿への応募削除可能
CREATE POLICY "applications: admin delete own company" ON public.applications
  FOR DELETE USING (
    public.get_user_role() = 'ADMIN'
    AND post_id IN (
      SELECT id FROM public.posts
      WHERE company_id = ANY(public.get_user_company_ids())
    )
  );

-- ────────────────────────────────────────────────────────────
-- 6. users / companies / company_members ポリシー — 再適用
-- ────────────────────────────────────────────────────────────

-- users
DROP POLICY IF EXISTS "users: select own"                 ON public.users;
DROP POLICY IF EXISTS "users: admin select all"           ON public.users;
DROP POLICY IF EXISTS "users: admin or master select all" ON public.users;
DROP POLICY IF EXISTS "users: update own"                 ON public.users;

CREATE POLICY "users: select own" ON public.users
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "users: admin or master select all" ON public.users
  FOR SELECT USING (public.get_user_role() IN ('ADMIN', 'MASTER_ADMIN'));

CREATE POLICY "users: update own" ON public.users
  FOR UPDATE USING (id = auth.uid());

-- companies
DROP POLICY IF EXISTS "companies: select all authenticated" ON public.companies;
DROP POLICY IF EXISTS "companies: admin all"                ON public.companies;
DROP POLICY IF EXISTS "companies: admin or master all"      ON public.companies;

CREATE POLICY "companies: select all authenticated" ON public.companies
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "companies: admin or master all" ON public.companies
  FOR ALL USING (public.get_user_role() IN ('ADMIN', 'MASTER_ADMIN'));

-- company_members
DROP POLICY IF EXISTS "company_members: select own"          ON public.company_members;
DROP POLICY IF EXISTS "company_members: admin all"           ON public.company_members;
DROP POLICY IF EXISTS "company_members: admin or master all" ON public.company_members;
DROP POLICY IF EXISTS "company_members: master_admin all"    ON public.company_members;
DROP POLICY IF EXISTS "company_members: admin own company"   ON public.company_members;
DROP POLICY IF EXISTS "company_members: user insert own"     ON public.company_members;
DROP POLICY IF EXISTS "company_members: user update own"     ON public.company_members;
DROP POLICY IF EXISTS "company_members: user delete own"     ON public.company_members;

CREATE POLICY "company_members: select own" ON public.company_members
  FOR SELECT USING (user_id = auth.uid());

-- MASTER_ADMIN: all company memberships.
CREATE POLICY "company_members: master_admin all" ON public.company_members
  FOR ALL
  USING (public.get_user_role() = 'MASTER_ADMIN')
  WITH CHECK (public.get_user_role() = 'MASTER_ADMIN');

-- ADMIN: only memberships that belong to one of the admin's active companies.
CREATE POLICY "company_members: admin own company" ON public.company_members
  FOR ALL
  USING (
    public.get_user_role() = 'ADMIN'
    AND company_id = ANY(public.get_user_company_ids())
  )
  WITH CHECK (
    public.get_user_role() = 'ADMIN'
    AND company_id = ANY(public.get_user_company_ids())
  );

-- USER: 自分のレコードのみ INSERT / UPDATE / DELETE
CREATE POLICY "company_members: user insert own" ON public.company_members
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "company_members: user update own" ON public.company_members
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "company_members: user delete own" ON public.company_members
  FOR DELETE USING (user_id = auth.uid());

-- ============================================================
-- 診断 SQL（Supabase SQL Editor で postgres ロールとして実行）
-- ============================================================

/*
-- ─────────────────────────────────────────────────────────────
-- [DIAG-1] ADMIN ユーザー一覧と company_members の確認
-- ─────────────────────────────────────────────────────────────
SELECT
  u.id          AS user_id,
  u.email,
  u.display_name,
  u.system_role,
  u.account_status,
  cm.company_id,
  c.name        AS company_name,
  cm.role       AS member_role,
  cm.status     AS member_status
FROM public.users u
LEFT JOIN public.company_members cm ON cm.user_id = u.id AND cm.status = 'active'
LEFT JOIN public.companies        c  ON c.id = cm.company_id
WHERE u.system_role IN ('ADMIN', 'MASTER_ADMIN')
ORDER BY u.system_role, u.email;

-- ─────────────────────────────────────────────────────────────
-- [DIAG-2] ADMIN で company_members が空のユーザーを特定
-- ─────────────────────────────────────────────────────────────
SELECT
  u.id,
  u.email,
  u.system_role,
  '所属なし（company_members レコードが存在しない）' AS problem
FROM public.users u
WHERE u.system_role = 'ADMIN'
  AND NOT EXISTS (
    SELECT 1 FROM public.company_members cm
    WHERE cm.user_id = u.id AND cm.status = 'active'
  );

-- ─────────────────────────────────────────────────────────────
-- [DIAG-3] company_members.status の分布確認
-- ─────────────────────────────────────────────────────────────
SELECT status, COUNT(*) AS cnt
FROM public.company_members
GROUP BY status
ORDER BY cnt DESC;

-- ─────────────────────────────────────────────────────────────
-- [DIAG-4] 現在の posts RLS ポリシー一覧
-- ─────────────────────────────────────────────────────────────
SELECT policyname, cmd, qual::text AS using_expr, with_check::text
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'posts'
ORDER BY policyname;

-- ─────────────────────────────────────────────────────────────
-- [DIAG-5] get_user_role() の EXECUTE 権限確認
-- ─────────────────────────────────────────────────────────────
SELECT
  r.rolname,
  has_function_privilege(r.rolname, 'public.get_user_role()', 'EXECUTE') AS can_execute
FROM pg_roles r
WHERE r.rolname IN ('authenticated', 'anon', 'service_role', 'postgres');

-- ─────────────────────────────────────────────────────────────
-- [DIAG-6] get_user_company_ids() の EXECUTE 権限確認
-- ─────────────────────────────────────────────────────────────
SELECT
  r.rolname,
  has_function_privilege(r.rolname, 'public.get_user_company_ids()', 'EXECUTE') AS can_execute
FROM pg_roles r
WHERE r.rolname IN ('authenticated', 'anon', 'service_role', 'postgres');

-- ─────────────────────────────────────────────────────────────
-- [DIAG-7] ADMIN ユーザーが見えるべき投稿数シミュレーション
--   ※ <ADMIN_UUID> を実際の UUID に置換して実行
-- ─────────────────────────────────────────────────────────────
SELECT COUNT(*) AS admin_visible_count
FROM public.posts
WHERE company_id IN (
  SELECT company_id FROM public.company_members
  WHERE user_id = '<ADMIN_UUID>'::uuid
    AND status = 'active'
);

-- ─────────────────────────────────────────────────────────────
-- [FIX] ADMIN ユーザーを会社に追加する場合のテンプレート
--   ※ <ADMIN_UUID>、<COMPANY_UUID> を実際の値に置換して実行
-- ─────────────────────────────────────────────────────────────
INSERT INTO public.company_members (user_id, company_id, role, status)
VALUES ('<ADMIN_UUID>'::uuid, '<COMPANY_UUID>'::uuid, 'ADMIN', 'active')
ON CONFLICT (user_id, company_id) DO UPDATE
  SET status = 'active',
      role   = 'ADMIN',
      updated_at = now();
*/
