-- ============================================================
-- Migration 005: サインアップ時 company_member 自動作成
-- ============================================================
-- 変更内容:
--   1. handle_new_user trigger を拡張し、
--      メタデータに company_id があれば company_members も作成する
--   2. company_members に一般ユーザー向け INSERT / UPDATE / DELETE
--      RLS ポリシーを追加し、マイページからの所属変更を可能にする
-- ============================================================

-- ① handle_new_user trigger 更新
--    company_id が raw_user_meta_data に含まれる場合のみ company_members を INSERT
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_company_id uuid;
BEGIN
  INSERT INTO public.users (id, email, display_name, system_role, account_status)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'system_role', 'USER'),
    'ACTIVE'
  )
  ON CONFLICT (id) DO NOTHING;

  -- company_id がメタデータに含まれる場合のみ所属を作成
  BEGIN
    v_company_id := (new.raw_user_meta_data->>'company_id')::uuid;
  EXCEPTION WHEN OTHERS THEN
    v_company_id := NULL;
  END;

  IF v_company_id IS NOT NULL THEN
    INSERT INTO public.company_members (user_id, company_id, membership_role)
    VALUES (new.id, v_company_id, 'USER')
    ON CONFLICT (user_id, company_id) DO NOTHING;
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ② company_members RLS: 一般ユーザーが自分の所属を管理できるポリシーを追加
--    INSERT: 自分の user_id でのみ挿入可
CREATE POLICY "company_members: user insert own" ON public.company_members
  FOR INSERT WITH CHECK (user_id = auth.uid());

--    UPDATE: 自分のレコードのみ更新可
CREATE POLICY "company_members: user update own" ON public.company_members
  FOR UPDATE USING (user_id = auth.uid());

--    DELETE: 自分のレコードのみ削除可（会社変更時に旧レコードを削除するため）
CREATE POLICY "company_members: user delete own" ON public.company_members
  FOR DELETE USING (user_id = auth.uid());
