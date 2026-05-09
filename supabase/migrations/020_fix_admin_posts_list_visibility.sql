-- ============================================================
-- Migration 020: ADMIN の案件一覧表示件数を USER / MASTER_ADMIN と同じにする
-- ============================================================
-- 【問題】
--   ADMIN でログインすると案件一覧 (/company/official-posts) に
--   自社案件 (4件) しか表示されず、USER / MASTER_ADMIN の 15件と差が出る。
--
-- 【根本原因】
--   "posts: admin select own company" ポリシーが
--   company_id = ANY(get_user_company_ids()) のみを条件としていたため、
--   ADMIN は自社投稿しか SELECT できなかった。
--
-- 【修正内容】
--   ADMIN の SELECT ポリシーを以下の OR 条件に変更する:
--     (A) OPEN / IN_PROGRESS の投稿 → 全社分閲覧可能 (案件一覧用)
--     (B) 自社の投稿              → ステータス不問で閲覧可能 (投稿管理用)
--   INSERT / UPDATE / DELETE は引き続き自社 + 自分の投稿のみ。
-- ============================================================

DROP POLICY IF EXISTS "posts: admin select own company" ON public.posts;

-- ADMIN SELECT:
--   (A) post_status が OPEN/IN_PROGRESS なら全社分閲覧可能（案件一覧）
--   (B) 自社投稿はステータスを問わず閲覧可能（投稿管理）
CREATE POLICY "posts: admin select" ON public.posts
  FOR SELECT USING (
    public.get_user_role() = 'ADMIN'
    AND (
      post_status IN ('OPEN', 'IN_PROGRESS')
      OR company_id = ANY(public.get_user_company_ids())
    )
  );
