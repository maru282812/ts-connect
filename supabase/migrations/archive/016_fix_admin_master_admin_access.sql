-- ============================================================
-- Migration 016: ADMIN / MASTER_ADMIN アクセス修正
-- ============================================================
-- 修正内容:
--   1. company_members.status の大文字小文字を小文字に統一
--      ('ACTIVE' → 'active', 'INACTIVE' → 'inactive' 等)
--   2. get_user_role() の EXECUTE 権限を再付与（念のため）
--   3. posts / applications / company_members の RLS を最終形に再適用
--      - ADMIN: status='active' の所属会社の投稿のみ閲覧可能
--      - MASTER_ADMIN: 全件操作可能（company_members 所属不要）
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. company_members.status を小文字に正規化
--    RLS ポリシーが status = 'active'（小文字）で判定しているため
-- ────────────────────────────────────────────────────────────
UPDATE public.company_members
  SET status = LOWER(status)
  WHERE status <> LOWER(status);

-- ────────────────────────────────────────────────────────────
-- 2. get_user_role() を CREATE OR REPLACE で再定義し EXECUTE 権限を再付与
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text AS $$
  SELECT system_role FROM public.users WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role() TO anon;
GRANT EXECUTE ON FUNCTION public.get_user_role() TO service_role;

-- ────────────────────────────────────────────────────────────
-- 3. posts RLS ポリシー最終適用
-- ────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "posts: user select open"         ON public.posts;
DROP POLICY IF EXISTS "posts: user select own casual"   ON public.posts;
DROP POLICY IF EXISTS "posts: user insert casual"       ON public.posts;
DROP POLICY IF EXISTS "posts: user update own casual"   ON public.posts;
DROP POLICY IF EXISTS "posts: master_admin all"         ON public.posts;
DROP POLICY IF EXISTS "posts: admin select own company" ON public.posts;
DROP POLICY IF EXISTS "posts: admin insert own company" ON public.posts;
DROP POLICY IF EXISTS "posts: admin update own"         ON public.posts;
DROP POLICY IF EXISTS "posts: admin delete own"         ON public.posts;

-- USER: OPEN / IN_PROGRESS の投稿を閲覧可能
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

-- ADMIN SELECT: status='active' のメンバーとして所属する会社の投稿のみ閲覧可能
CREATE POLICY "posts: admin select own company" ON public.posts
  FOR SELECT USING (
    public.get_user_role() = 'ADMIN'
    AND company_id IN (
      SELECT company_id FROM public.company_members
      WHERE user_id = auth.uid()
        AND status = 'active'
    )
  );

-- ADMIN INSERT: active 所属会社かつ自分が created_by_user_id
CREATE POLICY "posts: admin insert own company" ON public.posts
  FOR INSERT WITH CHECK (
    public.get_user_role() = 'ADMIN'
    AND company_id IN (
      SELECT company_id FROM public.company_members
      WHERE user_id = auth.uid()
        AND status = 'active'
    )
    AND created_by_user_id = auth.uid()
  );

-- ADMIN UPDATE: 自分が投稿した（かつ active 所属会社）のみ
CREATE POLICY "posts: admin update own" ON public.posts
  FOR UPDATE
  USING (
    public.get_user_role() = 'ADMIN'
    AND created_by_user_id = auth.uid()
    AND company_id IN (
      SELECT company_id FROM public.company_members
      WHERE user_id = auth.uid()
        AND status = 'active'
    )
  )
  WITH CHECK (
    public.get_user_role() = 'ADMIN'
    AND created_by_user_id = auth.uid()
    AND company_id IN (
      SELECT company_id FROM public.company_members
      WHERE user_id = auth.uid()
        AND status = 'active'
    )
  );

-- ADMIN DELETE: 自分が投稿した（かつ active 所属会社）のみ
CREATE POLICY "posts: admin delete own" ON public.posts
  FOR DELETE USING (
    public.get_user_role() = 'ADMIN'
    AND created_by_user_id = auth.uid()
    AND company_id IN (
      SELECT company_id FROM public.company_members
      WHERE user_id = auth.uid()
        AND status = 'active'
    )
  );

-- ────────────────────────────────────────────────────────────
-- 4. applications RLS ポリシー最終適用
-- ────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "applications: user select own"          ON public.applications;
DROP POLICY IF EXISTS "applications: user insert"              ON public.applications;
DROP POLICY IF EXISTS "applications: master_admin all"         ON public.applications;
DROP POLICY IF EXISTS "applications: admin select own company" ON public.applications;
DROP POLICY IF EXISTS "applications: admin update own company" ON public.applications;
DROP POLICY IF EXISTS "applications: admin delete own company" ON public.applications;

-- USER: 自分の応募のみ参照可能
CREATE POLICY "applications: user select own" ON public.applications
  FOR SELECT USING (applicant_user_id = auth.uid());

-- USER: 応募作成可能
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
      WHERE company_id IN (
        SELECT company_id FROM public.company_members
        WHERE user_id = auth.uid()
          AND status = 'active'
      )
    )
  );

-- ADMIN UPDATE: active 所属会社の投稿への応募ステータス変更可能
CREATE POLICY "applications: admin update own company" ON public.applications
  FOR UPDATE
  USING (
    public.get_user_role() = 'ADMIN'
    AND post_id IN (
      SELECT id FROM public.posts
      WHERE company_id IN (
        SELECT company_id FROM public.company_members
        WHERE user_id = auth.uid()
          AND status = 'active'
      )
    )
  )
  WITH CHECK (
    public.get_user_role() = 'ADMIN'
    AND post_id IN (
      SELECT id FROM public.posts
      WHERE company_id IN (
        SELECT company_id FROM public.company_members
        WHERE user_id = auth.uid()
          AND status = 'active'
      )
    )
  );

-- ADMIN DELETE: active 所属会社の投稿への応募削除可能
CREATE POLICY "applications: admin delete own company" ON public.applications
  FOR DELETE USING (
    public.get_user_role() = 'ADMIN'
    AND post_id IN (
      SELECT id FROM public.posts
      WHERE company_id IN (
        SELECT company_id FROM public.company_members
        WHERE user_id = auth.uid()
          AND status = 'active'
      )
    )
  );

-- ────────────────────────────────────────────────────────────
-- 5. users / companies / company_members ポリシー最終適用
-- ────────────────────────────────────────────────────────────

-- users
DROP POLICY IF EXISTS "users: select own"                 ON public.users;
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
DROP POLICY IF EXISTS "companies: admin or master all"      ON public.companies;

CREATE POLICY "companies: select all authenticated" ON public.companies
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "companies: admin or master all" ON public.companies
  FOR ALL USING (public.get_user_role() IN ('ADMIN', 'MASTER_ADMIN'));

-- company_members
DROP POLICY IF EXISTS "company_members: select own"          ON public.company_members;
DROP POLICY IF EXISTS "company_members: admin or master all" ON public.company_members;
DROP POLICY IF EXISTS "company_members: user insert own"     ON public.company_members;
DROP POLICY IF EXISTS "company_members: user update own"     ON public.company_members;
DROP POLICY IF EXISTS "company_members: user delete own"     ON public.company_members;

CREATE POLICY "company_members: select own" ON public.company_members
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "company_members: admin or master all" ON public.company_members
  FOR ALL USING (public.get_user_role() IN ('ADMIN', 'MASTER_ADMIN'));

CREATE POLICY "company_members: user insert own" ON public.company_members
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "company_members: user update own" ON public.company_members
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "company_members: user delete own" ON public.company_members
  FOR DELETE USING (user_id = auth.uid());

-- ────────────────────────────────────────────────────────────
-- 確認用クエリ（コメントアウト済み、SQL Editor で個別実行可能）
-- ────────────────────────────────────────────────────────────

/*
-- A. users.system_role 一覧
SELECT id, email, display_name, system_role, account_status
FROM public.users
ORDER BY system_role, email;

-- B. MASTER_ADMIN ユーザーのレコード
SELECT id, email, display_name, system_role, account_status
FROM public.users
WHERE system_role = 'MASTER_ADMIN';

-- C. ADMIN ユーザーのレコード
SELECT id, email, display_name, system_role, account_status
FROM public.users
WHERE system_role = 'ADMIN';

-- D. ADMIN ユーザーの company_members レコード
SELECT u.email, u.system_role, cm.company_id, c.name, cm.role, cm.status
FROM public.company_members cm
JOIN public.users    u ON u.id = cm.user_id
JOIN public.companies c ON c.id = cm.company_id
WHERE u.system_role = 'ADMIN'
ORDER BY u.email, cm.status;

-- E. company_members.status の値一覧
SELECT status, COUNT(*) AS cnt
FROM public.company_members
GROUP BY status
ORDER BY cnt DESC;

-- F. posts 一覧（company_id / created_by / post_status）
SELECT p.id, p.title, p.post_type, p.post_status,
       p.company_id, c.name AS company_name,
       p.created_by_user_id, u.email AS created_by_email
FROM public.posts p
LEFT JOIN public.companies c ON c.id = p.company_id
LEFT JOIN public.users     u ON u.id = p.created_by_user_id
ORDER BY p.updated_at DESC;

-- G. ADMIN が閲覧可能な posts 件数（<ADMIN_UUID> を置換）
SELECT COUNT(*) AS admin_visible_posts
FROM public.posts p
WHERE p.company_id IN (
  SELECT cm.company_id
  FROM public.company_members cm
  WHERE cm.user_id = '<ADMIN_UUID>'::uuid
    AND cm.status = 'active'
);

-- H. MASTER_ADMIN が閲覧可能な posts 件数（全件）
SELECT COUNT(*) AS total_posts FROM public.posts;

-- I. RLS policy 一覧
SELECT tablename, policyname, cmd, qual::text AS using_expr
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- J. get_user_role() EXECUTE 権限確認
SELECT r.rolname,
       has_function_privilege(r.rolname, 'public.get_user_role()', 'EXECUTE') AS can_execute
FROM pg_roles r
WHERE r.rolname IN ('authenticated', 'anon', 'service_role', 'postgres');
*/
