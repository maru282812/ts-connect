-- ============================================================
-- Migration 009: company_members スキーマを実 DB に合わせて修正
-- ============================================================
-- 変更内容:
--   1. membership_role カラムを role にリネーム（存在する場合のみ）
--   2. status カラムを追加（存在しない場合のみ）
--   3. handle_new_user() を role / status を使う形に更新
--
-- 背景:
--   実 DB の company_members は membership_role ではなく role を持ち、
--   さらに status カラムが存在する。
--   migration 005〜008 は membership_role を使っており不一致が生じていた。
--   本 migration で repo 側を実 DB スキーマに合わせる。
-- ============================================================

-- ① membership_role → role へリネーム（既に role があればスキップ）
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
    RAISE NOTICE '[009] company_members.membership_role を role にリネームしました。';
  ELSE
    RAISE NOTICE '[009] membership_role は存在しないためリネームをスキップしました。';
  END IF;
END $$;

-- ② role カラムが存在しない場合に追加（上記リネームが不要だった環境向け）
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
    RAISE NOTICE '[009] company_members.role カラムを追加しました。';
  END IF;
END $$;

-- ③ status カラムが存在しない場合に追加
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
    RAISE NOTICE '[009] company_members.status カラムを追加しました。';
  ELSE
    RAISE NOTICE '[009] status カラムは既に存在するためスキップしました。';
  END IF;
END $$;

-- ④ handle_new_user() を role / status を使う形に再定義
--
--   変更点:
--   - INSERT カラムを membership_role → role に変更
--   - status = 'active' を追加
--   - ON CONFLICT (user_id, company_id) DO NOTHING を維持
--   - users INSERT / company_id キャスト失敗 / FK 違反の各エラー処理は 008 の実装を継承
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_company_id uuid;
BEGIN

  -- ──────────────────────────────────────────────────────────
  -- ① public.users への INSERT
  --    email UNIQUE 違反（孤立レコード残存）は明示的に失敗させる
  -- ──────────────────────────────────────────────────────────
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
      '[handle_new_user] users INSERT 失敗: email "%" は既に public.users に存在します。'
      '孤立レコードが残っている可能性があります (auth.user_id=%)',
      new.email, new.id
      USING ERRCODE = 'unique_violation';
  END;

  -- ──────────────────────────────────────────────────────────
  -- ② company_id を UUID としてキャスト
  --    不正文字列は WARNING を残して NULL 扱いにする
  -- ──────────────────────────────────────────────────────────
  BEGIN
    v_company_id := (new.raw_user_meta_data->>'company_id')::uuid;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING
      '[handle_new_user] company_id のキャストに失敗しました。'
      'company_members は作成しません (auth.user_id=%, raw_value="%", error=%)',
      new.id,
      COALESCE(new.raw_user_meta_data->>'company_id', '(null)'),
      SQLERRM;
    v_company_id := NULL;
  END;

  -- ──────────────────────────────────────────────────────────
  -- ③ company_members への INSERT（role / status を使用）
  --    company_id が NULL の場合はスキップ
  --    FK 違反（company が存在しない）は明示的に失敗させる
  -- ──────────────────────────────────────────────────────────
  IF v_company_id IS NOT NULL THEN
    BEGIN
      INSERT INTO public.company_members (user_id, company_id, role, status)
      VALUES (new.id, v_company_id, 'USER', 'active')
      ON CONFLICT (user_id, company_id) DO NOTHING;
    EXCEPTION WHEN foreign_key_violation THEN
      RAISE EXCEPTION
        '[handle_new_user] company_members INSERT 失敗: company_id "%" は'
        ' public.companies に存在しません。有効な会社 ID を指定してください (auth.user_id=%)',
        v_company_id, new.id
        USING ERRCODE = 'foreign_key_violation';
    END;
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
