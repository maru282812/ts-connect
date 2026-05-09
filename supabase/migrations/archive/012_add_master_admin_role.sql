-- ============================================================
-- Migration 012: MASTER_ADMIN ロール追加と RLS ポリシー再定義
-- ============================================================
-- 変更内容:
--   1. users.system_role CHECK 制約に MASTER_ADMIN を追加
--   2. get_user_role() ヘルパーはそのまま（値を返すだけ）
--   3. 既存の admin 系ポリシーを削除し、以下ルールで再定義
--
-- 権限ルール:
--   USER        : 現行維持
--   ADMIN       : 閲覧=所属会社のみ、編集=自分が投稿したもののみ
--   MASTER_ADMIN: 全件閲覧・全件編集
-- ============================================================

-- ────────────────────────────────────────────────────
-- 1. users.system_role CHECK 制約を更新
-- ────────────────────────────────────────────────────
ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_system_role_check;

ALTER TABLE public.users
  ADD CONSTRAINT users_system_role_check
  CHECK (system_role IN ('USER', 'ADMIN', 'MASTER_ADMIN'));

-- ────────────────────────────────────────────────────
-- 2. RLS ポリシー: users
-- ────────────────────────────────────────────────────
DROP POLICY IF EXISTS "users: admin select all" ON public.users;

CREATE POLICY "users: admin or master select all" ON public.users
  FOR SELECT USING (public.get_user_role() IN ('ADMIN', 'MASTER_ADMIN'));

-- ────────────────────────────────────────────────────
-- 3. RLS ポリシー: companies
-- ────────────────────────────────────────────────────
DROP POLICY IF EXISTS "companies: admin all" ON public.companies;

CREATE POLICY "companies: admin or master all" ON public.companies
  FOR ALL USING (public.get_user_role() IN ('ADMIN', 'MASTER_ADMIN'));

-- ────────────────────────────────────────────────────
-- 4. RLS ポリシー: company_members
-- ────────────────────────────────────────────────────
DROP POLICY IF EXISTS "company_members: admin all" ON public.company_members;

CREATE POLICY "company_members: admin or master all" ON public.company_members
  FOR ALL USING (public.get_user_role() IN ('ADMIN', 'MASTER_ADMIN'));

-- ────────────────────────────────────────────────────
-- 5. RLS ポリシー: posts
-- ────────────────────────────────────────────────────
-- 既存の ADMIN 全件ポリシーを削除
DROP POLICY IF EXISTS "posts: admin all" ON public.posts;
DROP POLICY IF EXISTS "posts: master_admin all" ON public.posts;
DROP POLICY IF EXISTS "posts: admin select own company" ON public.posts;
DROP POLICY IF EXISTS "posts: admin insert own company" ON public.posts;
DROP POLICY IF EXISTS "posts: admin update own" ON public.posts;
DROP POLICY IF EXISTS "posts: admin delete own" ON public.posts;

-- MASTER_ADMIN: 全件操作
CREATE POLICY "posts: master_admin all" ON public.posts
  FOR ALL
  USING (public.get_user_role() = 'MASTER_ADMIN')
  WITH CHECK (public.get_user_role() = 'MASTER_ADMIN');

-- ADMIN SELECT: 所属会社の投稿のみ閲覧可能
CREATE POLICY "posts: admin select own company" ON public.posts
  FOR SELECT USING (
    public.get_user_role() = 'ADMIN'
    AND company_id IN (
      SELECT company_id FROM public.company_members
      WHERE user_id = auth.uid()
    )
  );

-- ADMIN INSERT: 所属会社かつ自分が created_by であること
CREATE POLICY "posts: admin insert own company" ON public.posts
  FOR INSERT WITH CHECK (
    public.get_user_role() = 'ADMIN'
    AND company_id IN (
      SELECT company_id FROM public.company_members
      WHERE user_id = auth.uid()
    )
    AND created_by_user_id = auth.uid()
  );

-- ADMIN UPDATE: 自分が投稿したもの（かつ所属会社）のみ
CREATE POLICY "posts: admin update own" ON public.posts
  FOR UPDATE USING (
    public.get_user_role() = 'ADMIN'
    AND created_by_user_id = auth.uid()
    AND company_id IN (
      SELECT company_id FROM public.company_members
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.get_user_role() = 'ADMIN'
    AND created_by_user_id = auth.uid()
    AND company_id IN (
      SELECT company_id FROM public.company_members
      WHERE user_id = auth.uid()
    )
  );

-- ADMIN DELETE: 自分が投稿したもの（かつ所属会社）のみ
CREATE POLICY "posts: admin delete own" ON public.posts
  FOR DELETE USING (
    public.get_user_role() = 'ADMIN'
    AND created_by_user_id = auth.uid()
    AND company_id IN (
      SELECT company_id FROM public.company_members
      WHERE user_id = auth.uid()
    )
  );

-- ────────────────────────────────────────────────────
-- 6. RLS ポリシー: applications
-- ────────────────────────────────────────────────────
-- 既存の ADMIN 全件ポリシーを削除
DROP POLICY IF EXISTS "applications: admin all" ON public.applications;
DROP POLICY IF EXISTS "applications: master_admin all" ON public.applications;
DROP POLICY IF EXISTS "applications: admin select own company" ON public.applications;
DROP POLICY IF EXISTS "applications: admin update own company" ON public.applications;
DROP POLICY IF EXISTS "applications: admin delete own company" ON public.applications;

-- MASTER_ADMIN: 全件操作
CREATE POLICY "applications: master_admin all" ON public.applications
  FOR ALL
  USING (public.get_user_role() = 'MASTER_ADMIN')
  WITH CHECK (public.get_user_role() = 'MASTER_ADMIN');

-- ADMIN SELECT: 所属会社の投稿への応募のみ閲覧可能
CREATE POLICY "applications: admin select own company" ON public.applications
  FOR SELECT USING (
    public.get_user_role() = 'ADMIN'
    AND post_id IN (
      SELECT id FROM public.posts
      WHERE company_id IN (
        SELECT company_id FROM public.company_members
        WHERE user_id = auth.uid()
      )
    )
  );

-- ADMIN UPDATE: 所属会社の投稿への応募ステータス変更可能
CREATE POLICY "applications: admin update own company" ON public.applications
  FOR UPDATE USING (
    public.get_user_role() = 'ADMIN'
    AND post_id IN (
      SELECT id FROM public.posts
      WHERE company_id IN (
        SELECT company_id FROM public.company_members
        WHERE user_id = auth.uid()
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
      )
    )
  );

-- ADMIN DELETE: 所属会社の投稿への応募削除可能
CREATE POLICY "applications: admin delete own company" ON public.applications
  FOR DELETE USING (
    public.get_user_role() = 'ADMIN'
    AND post_id IN (
      SELECT id FROM public.posts
      WHERE company_id IN (
        SELECT company_id FROM public.company_members
        WHERE user_id = auth.uid()
      )
    )
  );
