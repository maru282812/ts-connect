-- ============================================================
-- Migration 010: ユーザーが自分の気軽投稿を全ステータスで参照可能にする
-- ============================================================
-- 背景:
--   Migration 004 の "posts: user select open" は
--   post_status IN ('OPEN', 'IN_PROGRESS') のみ許可。
--   ユーザーが自分の DRAFT / CLOSED 投稿を編集画面や
--   マイ投稿一覧で参照できるよう、専用ポリシーを追加する。
-- ============================================================

-- 自分の CASUAL 投稿はステータスに関わらず参照可能
CREATE POLICY "posts: user select own casual" ON public.posts
  FOR SELECT USING (
    public.get_user_role() = 'USER'
    AND post_type = 'CASUAL'
    AND created_by_user_id = auth.uid()
  );

-- ============================================================
-- 既存データ補正:
--   CASUAL 投稿で post_status が NULL の場合は OPEN に設定
--   (実際には INSERT 時に必ず指定されているため通常は不要だが念のため)
-- ============================================================
UPDATE public.posts
  SET post_status = 'OPEN'
  WHERE post_type = 'CASUAL'
    AND post_status IS NULL;
