-- ============================================================
-- Migration 014: スキーマ全件検証・補完
-- ============================================================
-- 目的:
--   001〜013 の migration が全て適用済みであることを保証する。
--   既にカラム・制約・ポリシーが存在する場合は IF NOT EXISTS / IF EXISTS で
--   安全にスキップする。既存データは一切削除しない。
--
-- 適用方針:
--   1. 追加カラム（thumbnail_url / requirements / reference_url）の確認
--   2. post_status CHECK 制約を DRAFT/OPEN/IN_PROGRESS/CLOSED に統一
--   3. company_members.membership_role → role リネーム + status 追加
--   4. users.system_role CHECK 制約に MASTER_ADMIN を追加
--   5. RLS ポリシーをコード想定の最新形に統一
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. posts テーブルの追加カラム
-- ────────────────────────────────────────────────────────────

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS thumbnail_url  text;

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS requirements   text;

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS reference_url  text;

-- ────────────────────────────────────────────────────────────
-- 2. post_status CHECK 制約を最新形へ
--    PUBLISHED を持つデータを OPEN に移行してから制約を更新
-- ────────────────────────────────────────────────────────────

-- 旧ステータス PUBLISHED をデータ移行
UPDATE public.posts
  SET post_status = 'OPEN'
  WHERE post_status = 'PUBLISHED';

-- NULL を DRAFT に
UPDATE public.posts
  SET post_status = 'DRAFT'
  WHERE post_status IS NULL;

-- CHECK 制約を差し替え
ALTER TABLE public.posts
  DROP CONSTRAINT IF EXISTS posts_post_status_check;

ALTER TABLE public.posts
  ADD CONSTRAINT posts_post_status_check
    CHECK (post_status IN ('DRAFT', 'OPEN', 'IN_PROGRESS', 'CLOSED'));

-- ────────────────────────────────────────────────────────────
-- 3. company_members: membership_role → role / status 追加
-- ────────────────────────────────────────────────────────────

-- membership_role → role リネーム（既に role があればスキップ）
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'company_members'
      AND column_name  = 'membership_role'
  ) THEN
    ALTER TABLE public.company_members
      RENAME COLUMN membership_role TO role;
  END IF;
END $$;

-- role カラムが存在しなければ追加
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'company_members'
      AND column_name  = 'role'
  ) THEN
    ALTER TABLE public.company_members
      ADD COLUMN role text NOT NULL DEFAULT 'USER'
        CHECK (role IN ('ADMIN', 'USER'));
  END IF;
END $$;

-- status カラムが存在しなければ追加
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'company_members'
      AND column_name  = 'status'
  ) THEN
    ALTER TABLE public.company_members
      ADD COLUMN status text NOT NULL DEFAULT 'active';
  END IF;
END $$;

-- ────────────────────────────────────────────────────────────
-- 4. users.system_role CHECK 制約に MASTER_ADMIN を追加
-- ────────────────────────────────────────────────────────────

ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_system_role_check;

ALTER TABLE public.users
  ADD CONSTRAINT users_system_role_check
  CHECK (system_role IN ('USER', 'ADMIN', 'MASTER_ADMIN'));

-- ────────────────────────────────────────────────────────────
-- 5. get_user_role() ヘルパー
--    重複シグネチャが存在する場合に 42725 エラーが出るため、
--    既存の全バージョンを DROP してから再作成する
-- ────────────────────────────────────────────────────────────

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT oid, pg_get_function_identity_arguments(oid) AS args
    FROM pg_proc
    WHERE proname = 'get_user_role'
      AND pronamespace = 'public'::regnamespace
  LOOP
    EXECUTE format(
      'DROP FUNCTION IF EXISTS public.get_user_role(%s) CASCADE',
      r.args
    );
  END LOOP;
END $$;

CREATE FUNCTION public.get_user_role()
RETURNS text AS $$
  SELECT system_role FROM public.users WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ────────────────────────────────────────────────────────────
-- 6. RLS ポリシー: users
-- ────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "users: select own"                ON public.users;
DROP POLICY IF EXISTS "users: admin select all"          ON public.users;
DROP POLICY IF EXISTS "users: admin or master select all" ON public.users;
DROP POLICY IF EXISTS "users: update own"                ON public.users;

CREATE POLICY "users: select own" ON public.users
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "users: admin or master select all" ON public.users
  FOR SELECT USING (public.get_user_role() IN ('ADMIN', 'MASTER_ADMIN'));

CREATE POLICY "users: update own" ON public.users
  FOR UPDATE USING (id = auth.uid());

-- ────────────────────────────────────────────────────────────
-- 7. RLS ポリシー: companies
-- ────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "companies: select all authenticated"  ON public.companies;
DROP POLICY IF EXISTS "companies: admin all"                 ON public.companies;
DROP POLICY IF EXISTS "companies: admin or master all"       ON public.companies;

CREATE POLICY "companies: select all authenticated" ON public.companies
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "companies: admin or master all" ON public.companies
  FOR ALL USING (public.get_user_role() IN ('ADMIN', 'MASTER_ADMIN'));

-- ────────────────────────────────────────────────────────────
-- 8. RLS ポリシー: company_members
-- ────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "company_members: select own"          ON public.company_members;
DROP POLICY IF EXISTS "company_members: admin all"           ON public.company_members;
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
-- 9. RLS ポリシー: posts
-- ────────────────────────────────────────────────────────────

-- 古いポリシーをすべて削除
DROP POLICY IF EXISTS "posts: user select published"    ON public.posts;
DROP POLICY IF EXISTS "posts: user select open"         ON public.posts;
DROP POLICY IF EXISTS "posts: user select own casual"   ON public.posts;
DROP POLICY IF EXISTS "posts: admin all"                ON public.posts;
DROP POLICY IF EXISTS "posts: master_admin all"         ON public.posts;
DROP POLICY IF EXISTS "posts: admin select own company" ON public.posts;
DROP POLICY IF EXISTS "posts: admin insert own company" ON public.posts;
DROP POLICY IF EXISTS "posts: admin update own"         ON public.posts;
DROP POLICY IF EXISTS "posts: admin delete own"         ON public.posts;
DROP POLICY IF EXISTS "posts: user insert casual"       ON public.posts;
DROP POLICY IF EXISTS "posts: user update own casual"   ON public.posts;

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

-- ADMIN SELECT: 所属会社の投稿のみ閲覧可能
CREATE POLICY "posts: admin select own company" ON public.posts
  FOR SELECT USING (
    public.get_user_role() = 'ADMIN'
    AND company_id IN (
      SELECT company_id FROM public.company_members
      WHERE user_id = auth.uid()
    )
  );

-- ADMIN INSERT: 所属会社かつ自分が created_by_user_id
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

-- ────────────────────────────────────────────────────────────
-- 10. RLS ポリシー: applications
-- ────────────────────────────────────────────────────────────

-- 古いポリシーをすべて削除
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

-- USER: 応募作成可能
CREATE POLICY "applications: user insert" ON public.applications
  FOR INSERT WITH CHECK (applicant_user_id = auth.uid());

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

-- ────────────────────────────────────────────────────────────
-- 11. handle_new_user() を最新形に更新（role / status 使用）
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_company_id uuid;
BEGIN
  BEGIN
    INSERT INTO public.users (id, email, display_name, system_role, account_status)
    VALUES (
      new.id,
      new.email,
      COALESCE(NULLIF(TRIM(new.raw_user_meta_data->>'display_name'), ''), split_part(new.email, '@', 1)),
      'USER',
      'ACTIVE'
    )
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION WHEN unique_violation THEN
    RAISE EXCEPTION
      '[handle_new_user] users INSERT 失敗: email "%" は既に public.users に存在します (auth.user_id=%)',
      new.email, new.id
      USING ERRCODE = 'unique_violation';
  END;

  BEGIN
    v_company_id := (new.raw_user_meta_data->>'company_id')::uuid;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING
      '[handle_new_user] company_id のキャストに失敗しました (auth.user_id=%, raw_value="%", error=%)',
      new.id,
      COALESCE(new.raw_user_meta_data->>'company_id', '(null)'),
      SQLERRM;
    v_company_id := NULL;
  END;

  IF v_company_id IS NOT NULL THEN
    BEGIN
      INSERT INTO public.company_members (user_id, company_id, role, status)
      VALUES (new.id, v_company_id, 'USER', 'active')
      ON CONFLICT (user_id, company_id) DO NOTHING;
    EXCEPTION WHEN foreign_key_violation THEN
      RAISE EXCEPTION
        '[handle_new_user] company_members INSERT 失敗: company_id "%" は public.companies に存在しません (auth.user_id=%)',
        v_company_id, new.id
        USING ERRCODE = 'foreign_key_violation';
    END;
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
