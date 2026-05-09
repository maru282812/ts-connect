-- ============================================================
-- Migration 006: handle_new_user trigger から metadata.system_role 依存を除去
-- ============================================================
-- 変更内容:
--   handle_new_user trigger の system_role 取得元を
--   raw_user_meta_data->>'system_role' から固定値 'USER' に変更する。
--
--   理由:
--   - users.system_role を唯一の正本とし、メタデータとの二重管理を廃止
--   - 全新規ユーザーは 'USER' で登録され、昇格は DB 直接更新で行う
--   - display_name と company_id はサインアップ時に必要なため metadata から継続取得
-- ============================================================

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
    'USER',
    'ACTIVE'
  )
  ON CONFLICT (id) DO NOTHING;

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
