// ============================================================
// 案件タグ（post_tags / post_tag_relations）データアクセス層
// マッチング用タグの取得・付与に使う。ADMIN 書き込みは migration 030 前提。
// client-side Supabase + RLS（030 未適用時は書き込みが RLS で弾かれる）。
// ============================================================
import { createClient } from "@/lib/supabase/client";

export interface PostTag {
  id: string;
  name: string;
}

/** タグ名 → slug（衝突回避のため作成時のみランダム接尾辞を付ける） */
function makeSlug(name: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-ぁ-んァ-ヶ一-龠ー]/g, "");
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${base || "tag"}-${suffix}`;
}

/** 有効なタグ候補（サジェスト用） */
export async function fetchActiveTags(): Promise<PostTag[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("post_tags")
      .select("id, name")
      .eq("is_active", true)
      .order("name");
    if (error || !data) return [];
    return data as PostTag[];
  } catch {
    return [];
  }
}

/** 指定案件に付いているタグ名の一覧（編集時の初期値） */
export async function fetchPostTagNames(postId: string): Promise<string[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("post_tag_relations")
      .select("post_tags(name)")
      .eq("post_id", postId);
    if (error || !data) return [];
    // 埋め込み post_tags は環境により object / array いずれにも推論されるため両対応。
    const rows = data as unknown as {
      post_tags: { name: string } | { name: string }[] | null;
    }[];
    return rows
      .flatMap((r) => {
        const pt = r.post_tags;
        if (!pt) return [];
        return Array.isArray(pt) ? pt.map((x) => x.name) : [pt.name];
      })
      .filter((n): n is string => Boolean(n));
  } catch {
    return [];
  }
}

/** タグ名を id に解決（無ければ作成）。失敗した名前はスキップ。 */
async function resolveTagIds(names: string[]): Promise<string[]> {
  const supabase = createClient();
  const ids: string[] = [];
  for (const raw of names) {
    const name = raw.trim();
    if (!name) continue;
    const { data: existing } = await supabase
      .from("post_tags")
      .select("id")
      .eq("name", name)
      .maybeSingle();
    if (existing?.id) {
      ids.push(existing.id as string);
      continue;
    }
    const { data: created } = await supabase
      .from("post_tags")
      .insert({ name, slug: makeSlug(name), is_active: true })
      .select("id")
      .single();
    if (created?.id) ids.push(created.id as string);
  }
  return ids;
}

/**
 * 案件のタグを洗い替えする（delete → insert）。
 * 030 未適用でタグ作成/付与が RLS で弾かれても、案件本体の保存は成功済みのため
 * 呼び出し側は握りつぶしてよい（{ ok } を返す）。
 */
export async function syncPostTags(
  postId: string,
  names: string[],
): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = createClient();
    const ids = await resolveTagIds(names);
    await supabase.from("post_tag_relations").delete().eq("post_id", postId);
    if (ids.length > 0) {
      const { error } = await supabase
        .from("post_tag_relations")
        .insert(ids.map((tag_id) => ({ post_id: postId, tag_id })));
      if (error) return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "タグの保存に失敗しました",
    };
  }
}
