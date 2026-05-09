-- ============================================================
-- Migration 008: handle_new_user() を堅牢化
-- ============================================================
-- 変更内容:
--   1. public.users INSERT で email 重複（孤立レコード残存）を捕捉し
--      原因が分かるメッセージで明示的に失敗させる
--   2. company_members INSERT で FK 違反（company_id 不正）を捕捉し
--      原因が分かるメッセージで明示的に失敗させる
--      ※ ON CONFLICT (user_id, company_id) DO NOTHING は維持し
--        正常系の重複（再試行等）は問題なく処理する
--   3. company_id の UUID キャスト失敗時に RAISE WARNING を追加し
--      Supabase ログで原因追跡可能にする
--
-- 各 INSERT を個別の BEGIN...EXCEPTION ブロックで包むことで
-- 「どの INSERT で失敗したか」がログから特定できる。
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_company_id uuid;
BEGIN

  -- ──────────────────────────────────────────────────────────
  -- ① public.users への INSERT
  --
  -- ON CONFLICT (id) DO NOTHING: 同一 auth.users.id の重複を無視
  -- email UNIQUE 制約の違反（孤立レコード残存）は別例外で捕捉し
  -- 握りつぶさず明示的に失敗させる
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
  --
  -- 不正文字列は EXCEPTION で捕捉し RAISE WARNING を残す。
  -- 握りつぶして NULL 扱いにするが、ログには出力する。
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
  -- ③ company_members への INSERT
  --
  -- company_id が NULL の場合はスキップ（company 未設定扱い）。
  -- FK 違反（company が存在しない）は明示的に失敗させる。
  --   → auth.users が作成されても company_members が欠落した
  --     半端な状態にならないようにする
  -- ──────────────────────────────────────────────────────────
  IF v_company_id IS NOT NULL THEN
    BEGIN
      INSERT INTO public.company_members (user_id, company_id, membership_role)
      VALUES (new.id, v_company_id, 'USER')
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
