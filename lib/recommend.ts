// ============================================================
// 案件レコメンド（あなたへのオススメ）データアクセス層
// 提案書で確定した「ルールベース推薦（プロフィールのスキル × 案件タグの一致 + 新着ボーナス）」。
// ML・外部APIは使わない。プロフィール未登録 / タグ未付与 / エラー時は空配列。
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

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, limit);
  } catch {
    return [];
  }
}
