-- ============================================================
-- Migration 011: Storage バケット thumbnails の作成と RLS 設定
-- ============================================================

-- バケット作成（既存の場合はスキップ）
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'thumbnails',
  'thumbnails',
  true,
  5242880, -- 5MB
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- ────────────────────────────────────────────────────
-- RLS ポリシー
-- ────────────────────────────────────────────────────

-- 認証済みユーザーは自分のフォルダにアップロード可能
-- パス形式: thumbnails/{user_id}/{filename}
CREATE POLICY "thumbnails: authenticated upload own folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'thumbnails'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 認証済みユーザーは自分のファイルを更新・削除可能
CREATE POLICY "thumbnails: authenticated update own"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'thumbnails'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "thumbnails: authenticated delete own"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'thumbnails'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 全員が閲覧可能（public バケット補助）
CREATE POLICY "thumbnails: public select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'thumbnails');
