// ============================================================
// 案件レコメンド（あなたへのオススメ）データアクセス層
// 提案書で確定した「ルールベース推薦（プロフィールのスキル × 案件タグの一致 + 新着ボーナス）」。
// ML・外部APIは使わない。プロフィール未登録 / タグ未付与 / エラー時は空配列。
//
// 並び順の方針:
//   1. score（タグ一致数 + 新着ボーナス）降順 … 関連度を最優先
//   2. 日替わりシード降順 … 同スコア内を日単位でローテーション
//      → 「毎回変わる」でも「ずっと同じ」でもなく、1日単位で入れ替わる
// さらに、すでに APPLY 済みの案件は候補から除外する（応募後も勧め続けない）。
// ============================================================
import { createClient } from "@/lib/supabase/client";
import type { PostWithRelations } from "@/types/database";

export interface RecommendedPost {
  post: PostWithRelations;
  matchedTags: string[];
  score: number;
}

/** 大文字小文字・全半角の揺れを吸収して比較キーにする */
function normalize(s: string): string {
  return s.trim().toLowerCase().normalize("NFKC");
}

/**
 * 案件IDと「その日」を混ぜた決定論ハッシュ → 0..1。
 * 同じ日は同じ値、日付が変わると変わる（クライアント実行なのでユーザーのローカル日付＝JST基準）。
 * これを同スコア内のタイブレークに使い、日替わりで並びをローテーションさせる。
 */
function dailyJitter(id: string): number {
  const d = new Date();
  const seed = `${id}:${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  let h = 2166136261; // FNV-1a
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

export async function fetchRecommendedPosts(
  limit = 5,
): Promise<RecommendedPost[]> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    // 自分のスキル（skills + special_skills）
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("skills, special_skills")
      .eq("user_id", user.id)
      .maybeSingle();

    const mySkills = new Set(
      [
        ...((profile?.skills as string[] | null) ?? []),
        ...((profile?.special_skills as string[] | null) ?? []),
      ].map(normalize),
    );
    if (mySkills.size === 0) return [];

    // すでに応募（APPLY）済みの案件はオススメから外す（問い合わせ INQUIRY は対象外）
    const { data: myApplications } = await supabase
      .from("applications")
      .select("post_id")
      .eq("applicant_user_id", user.id)
      .eq("application_type", "APPLY");
    const appliedPostIds = new Set(
      (myApplications ?? []).map((a) => a.post_id as string),
    );

    // 公開中の公式案件 + 付与タグ
    const { data: posts } = await supabase
      .from("posts")
      .select("*, companies(id, name), post_tag_relations(post_tags(name))")
      .eq("post_type", "OFFICIAL")
      .eq("post_status", "OPEN")
      .order("created_at", { ascending: false })
      .limit(50);

    if (!posts) return [];

    const results: RecommendedPost[] = [];
    for (const p of posts as (PostWithRelations & {
      post_tag_relations?: { post_tags: { name: string } | null }[];
      created_at: string;
    })[]) {
      if (appliedPostIds.has(p.id)) continue;

      const matched: string[] = [];
      for (const rel of p.post_tag_relations ?? []) {
        const name = rel.post_tags?.name;
        if (name && mySkills.has(normalize(name))) matched.push(name);
      }
      if (matched.length === 0) continue;

      const days = (Date.now() - new Date(p.created_at).getTime()) / 86_400_000;
      const score = matched.length + (days <= 7 ? 1 : 0);
      results.push({ post: p, matchedTags: matched, score });
    }

    // 関連度(score)優先、同点は日替わりシードでローテーション
    results.sort(
      (a, b) =>
        b.score - a.score || dailyJitter(b.post.id) - dailyJitter(a.post.id),
    );
    return results.slice(0, limit);
  } catch {
    return [];
  }
}
