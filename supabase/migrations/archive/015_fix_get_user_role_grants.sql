-- ============================================================
-- Migration 015: get_user_role() 権限再付与 + RLS ポリシー確実適用
-- ============================================================
-- 原因:
--   Migration 014 が DROP FUNCTION ... CASCADE を使用し、その後
--   CREATE FUNCTION（OR REPLACE でなく）で関数を作り直したことで、
--   authenticated ロールへの EXECUTE 権限が消失した。
--   これにより get_user_role() を参照する全 RLS ポリシーが false を返し、
--   ADMIN・MASTER_ADMIN を含む全ユーザーで案件が 0件になった。
--
-- 修正方針:
--   1. get_user_role() を CREATE OR REPLACE で再定義（権限を保持）
--   2. authenticated / anon / service_role への EXECUTE 権限を明示付与
--   3. posts / applications の RLS ポリシーを正しい形で再適用
--   4. 既存データへの変更は一切行わない
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. get_user_role() を CREATE OR REPLACE で再定義
--    DROP CASCADE は使わず、権限・依存関係を保持する
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text AS $$
  SELECT system_role FROM public.users WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- authenticated / anon / service_role への EXECUTE 権限を明示付与
-- （DROP+CREATE で権限が消えた場合の救済、冪等なので安全）
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role() TO anon;
GRANT EXECUTE ON FUNCTION public.get_user_role() TO service_role;

-- ────────────────────────────────────────────────────────────
-- 2. posts RLS ポリシーを再適用
--    既存ポリシーを DROP → CREATE で確実に最新化
-- ────────────────────────────────────────────────────────────

-- 全ポリシー削除（IF EXISTS で安全にスキップ）
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

-- MASTER_ADMIN: 全件操作
CREATE POLICY "posts: master_admin all" ON public.posts
  FOR ALL
  USING (public.get_user_role() = 'MASTER_ADMIN')
  WITH CHECK (public.get_user_role() = 'MASTER_ADMIN');

-- ADMIN SELECT: active メンバーとして所属する会社の投稿のみ閲覧可能
CREATE POLICY "posts: admin select own company" ON public.posts
  FOR SELECT USING (
    public.get_user_role() = 'ADMIN'
    AND company_id IN (
      SELECT company_id FROM public.company_members
      WHERE user_id = auth.uid()
        AND status = 'active'
    )
  );

-- ADMIN INSERT: 所属会社かつ自分が created_by_user_id
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
-- 3. applications RLS ポリシーを再適用
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
-- 4. users / companies / company_members ポリシーを再適用
-- ────────────────────────────────────────────────────────────

-- users
DROP POLICY IF EXISTS "users: select own"                   ON public.users;
DROP POLICY IF EXISTS "users: admin or master select all"   ON public.users;
DROP POLICY IF EXISTS "users: update own"                   ON public.users;

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

-- ADMIN/MASTER_ADMIN は全 company_members を参照・操作可能
CREATE POLICY "company_members: admin or master all" ON public.company_members
  FOR ALL USING (public.get_user_role() IN ('ADMIN', 'MASTER_ADMIN'));

-- 一般ユーザーは自分のレコードのみ操作可能
CREATE POLICY "company_members: user insert own" ON public.company_members
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "company_members: user update own" ON public.company_members
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "company_members: user delete own" ON public.company_members
  FOR DELETE USING (user_id = auth.uid());
