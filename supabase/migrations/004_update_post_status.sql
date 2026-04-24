-- ============================================================
-- Migration 004: post_status を OPEN / IN_PROGRESS に統一
-- ============================================================
-- 変更内容:
--   1. PUBLISHED データを OPEN に移行
--   2. posts.post_status CHECK 制約を更新
--      変更前: DRAFT / PUBLISHED / CLOSED
--      変更後: DRAFT / OPEN / IN_PROGRESS / CLOSED
--   3. RLS ポリシーを OPEN / IN_PROGRESS 対応に更新
-- ============================================================

-- ① 既存の PUBLISHED データを OPEN に変換
UPDATE public.posts
  SET post_status = 'OPEN'
  WHERE post_status = 'PUBLISHED';

-- ② CHECK 制約を差し替え
--    Supabase / PostgreSQL では制約名を直接 DROP して ADD し直す
ALTER TABLE public.posts
  DROP CONSTRAINT IF EXISTS posts_post_status_check;

ALTER TABLE public.posts
  ADD CONSTRAINT posts_post_status_check
    CHECK (post_status IN ('DRAFT', 'OPEN', 'IN_PROGRESS', 'CLOSED'));

-- ③ RLS ポリシー更新
--    旧ポリシー: post_status = 'PUBLISHED' のみ閲覧可
--    新ポリシー: post_status IN ('OPEN', 'IN_PROGRESS') を閲覧可
DROP POLICY IF EXISTS "posts: user select published" ON public.posts;

CREATE POLICY "posts: user select open" ON public.posts
  FOR SELECT USING (
    public.get_user_role() = 'USER'
    AND post_status IN ('OPEN', 'IN_PROGRESS')
  );
