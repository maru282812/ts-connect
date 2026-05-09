-- ============================================================
-- Migration 013: ADMIN/MASTER_ADMIN RLS ポリシー確実適用
-- ============================================================
-- 背景:
--   Migration 012 に構文エラー（CREATE POLICY 重複行）があり、
--   トランザクションがロールバックされた可能性がある。
--   その場合、Migration 001 の "posts: admin all" / "applications: admin all"
--   ポリシー（ADMIN が全件参照できる）がそのまま残っており、
--   他社の投稿まで閲覧できてしまう不具合が発生する。
--
-- 修正内容:
--   ① 古い permissive なポリシーを DROP（あれば）
--   ② 012 で意図したポリシーを再 CREATE（なければ作成）
--   ③ users.system_role CHECK 制約も確実に適用
--
-- 権限ルール:
--   ADMIN       : 閲覧=所属会社のみ、INSERT/UPDATE/DELETE=自分の投稿のみ
--   MASTER_ADMIN: 全件閲覧・全件編集
-- ============================================================

-- ────────────────────────────────────────────────────
-- 1. users.system_role CHECK 制約（MASTER_ADMIN を含む）
-- ────────────────────────────────────────────────────
ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_system_role_check;

ALTER TABLE public.users
  ADD CONSTRAINT users_system_role_check
  CHECK (system_role IN ('USER', 'ADMIN', 'MASTER_ADMIN'));

-- ────────────────────────────────────────────────────
-- 2. users ポリシー
-- ────────────────────────────────────────────────────
DROP POLICY IF EXISTS "users: admin select all"       ON public.users;
DROP POLICY IF EXISTS "users: admin or master select all" ON public.users;

CREATE POLICY "users: admin or master select all" ON public.users
  FOR SELECT USING (public.get_user_role() IN ('ADMIN', 'MASTER_ADMIN'));

-- ────────────────────────────────────────────────────
-- 3. companies ポリシー
-- ────────────────────────────────────────────────────
DROP POLICY IF EXISTS "companies: admin all"          ON public.companies;
DROP POLICY IF EXISTS "companies: admin or master all" ON public.companies;

CREATE POLICY "companies: admin or master all" ON public.companies
  FOR ALL USING (public.get_user_role() IN ('ADMIN', 'MASTER_ADMIN'));

-- ────────────────────────────────────────────────────
-- 4. company_members ポリシー
-- ────────────────────────────────────────────────────
DROP POLICY IF EXISTS "company_members: admin all"          ON public.company_members;
DROP POLICY IF EXISTS "company_members: admin or master all" ON public.company_members;

CREATE POLICY "company_members: admin or master all" ON public.company_members
  FOR ALL USING (public.get_user_role() IN ('ADMIN', 'MASTER_ADMIN'));

-- ────────────────────────────────────────────────────
-- 5. posts ポリシー
-- ────────────────────────────────────────────────────
-- 旧ポリシー（001由来: ADMIN が全件操作可）を確実に削除
DROP POLICY IF EXISTS "posts: admin all"                ON public.posts;
-- 012由来（適用されている可能性があるもの）も削除してから再作成
DROP POLICY IF EXISTS "posts: master_admin all"         ON public.posts;
DROP POLICY IF EXISTS "posts: admin select own company" ON public.posts;
DROP POLICY IF EXISTS "posts: admin insert own company" ON public.posts;
DROP POLICY IF EXISTS "posts: admin update own"         ON public.posts;
DROP POLICY IF EXISTS "posts: admin delete own"         ON public.posts;

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

-- ADMIN INSERT: 所属会社かつ自分が created_by_user_id であること
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
  FOR UPDATE
  USING (
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
-- 6. applications ポリシー
-- ────────────────────────────────────────────────────
-- 旧ポリシー（001由来: ADMIN が全件操作可）を確実に削除
DROP POLICY IF EXISTS "applications: admin all"                ON public.applications;
-- 012由来も削除してから再作成
DROP POLICY IF EXISTS "applications: master_admin all"         ON public.applications;
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
  FOR UPDATE
  USING (
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
