// ============================================================
// 社内報（Newsletter）データアクセス層
// client-side Supabase + RLS。対応 migration: 029_newsletter。
// **未適用時は取得系が null を返し、画面は従来の仮データにフォールバックする。**
// ============================================================
import { createClient } from "@/lib/supabase/client";

export type NewsletterStatus = "DRAFT" | "PUBLISHED" | "SCHEDULED";
export type NewsletterCategory = "MONTHLY" | "FEATURE" | "PEOPLE" | "NOTICE";

export const NEWSLETTER_CATEGORIES: {
  value: NewsletterCategory;
  label: string;
}[] = [
  { value: "MONTHLY", label: "月次号" },
  { value: "FEATURE", label: "特集" },
  { value: "PEOPLE", label: "ピープル" },
  { value: "NOTICE", label: "お知らせ" },
];

export const NEWSLETTER_CATEGORY_LABEL: Record<NewsletterCategory, string> = {
  MONTHLY: "月次",
  FEATURE: "特集",
  PEOPLE: "ピープル",
  NOTICE: "お知らせ",
};

export const NEWSLETTER_STATUSES: { value: NewsletterStatus; label: string }[] =
  [
    { value: "DRAFT", label: "下書きとして保存" },
    { value: "PUBLISHED", label: "すぐに公開" },
    { value: "SCHEDULED", label: "予約投稿" },
  ];

export interface NewsletterIssue {
  id: string;
  title: string;
  category: NewsletterCategory;
  summary: string;
  body: string;
  coverImageUrl: string | null;
  imageUrls: string[];
  status: NewsletterStatus;
  publishedAt: string | null;
  isPickup: boolean;
  viewCount: number;
  createdAt: string;
}

export interface NewsletterInput {
  title: string;
  category: NewsletterCategory;
  summary: string;
  body: string;
  coverImageUrl: string | null;
  imageUrls: string[];
  status: NewsletterStatus;
  publishedAt: string | null;
  isPickup: boolean;
}

interface IssueRow {
  id: string;
  title: string;
  category: NewsletterCategory;
  summary: string | null;
  body: string | null;
  cover_image_url: string | null;
  image_urls: string[] | null;
  status: NewsletterStatus;
  published_at: string | null;
  is_pickup: boolean;
  view_count: number;
  created_at: string;
}

const COLUMNS =
  "id, title, category, summary, body, cover_image_url, image_urls, status, published_at, is_pickup, view_count, created_at";

function mapRow(r: IssueRow): NewsletterIssue {
  return {
    id: r.id,
    title: r.title,
    category: r.category,
    summary: r.summary ?? "",
    body: r.body ?? "",
    coverImageUrl: r.cover_image_url,
    imageUrls: r.image_urls ?? [],
    status: r.status,
    publishedAt: r.published_at,
    isPickup: r.is_pickup,
    viewCount: r.view_count,
    createdAt: r.created_at,
  };
}

function toPayload(input: NewsletterInput) {
  return {
    title: input.title,
    category: input.category,
    summary: input.summary.trim() || null,
    body: input.body,
    cover_image_url: input.coverImageUrl || null,
    image_urls: input.imageUrls.length > 0 ? input.imageUrls : null,
    status: input.status,
    published_at: input.publishedAt,
    is_pickup: input.isPickup,
  };
}

/** 管理一覧（下書き含む全件）。029 未適用/失敗時は null（＝仮データにフォールバック）。 */
export async function fetchIssuesForAdmin(): Promise<NewsletterIssue[] | null> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("newsletter_issues")
      .select(COLUMNS)
      .order("created_at", { ascending: false });
    if (error) return null;
    return (data as IssueRow[]).map(mapRow);
  } catch {
    return null;
  }
}

/** 公開済みの号（発行日降順）。029 未適用/失敗時は null。 */
export async function fetchPublishedIssues(): Promise<
  NewsletterIssue[] | null
> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("newsletter_issues")
      .select(COLUMNS)
      .eq("status", "PUBLISHED")
      .order("published_at", { ascending: false, nullsFirst: false });
    if (error) return null;
    return (data as IssueRow[]).map(mapRow);
  } catch {
    return null;
  }
}

/** 号を1件取得。見つからない/失敗時は null。 */
export async function fetchIssue(id: string): Promise<NewsletterIssue | null> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("newsletter_issues")
      .select(COLUMNS)
      .eq("id", id)
      .maybeSingle();
    if (error || !data) return null;
    return mapRow(data as IssueRow);
  } catch {
    return null;
  }
}

export async function createIssue(
  input: NewsletterInput,
): Promise<{ ok: boolean; id?: string; error?: string }> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "ログインが必要です" };

    const { data, error } = await supabase
      .from("newsletter_issues")
      .insert({ ...toPayload(input), created_by: user.id })
      .select("id")
      .single();
    if (error) return { ok: false, error: error.message };
    return { ok: true, id: (data as { id: string }).id };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "作成に失敗しました",
    };
  }
}

export async function updateIssue(
  id: string,
  input: NewsletterInput,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from("newsletter_issues")
      .update(toPayload(input))
      .eq("id", id);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "更新に失敗しました",
    };
  }
}

export async function deleteIssue(
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from("newsletter_issues")
      .delete()
      .eq("id", id);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "削除に失敗しました",
    };
  }
}

/** 閲覧数を加算する（既読は二重計上しない・SECURITY DEFINER RPC）。 */
export async function recordView(id: string): Promise<void> {
  try {
    const supabase = createClient();
    await supabase.rpc("increment_newsletter_view", { p_issue_id: id });
  } catch {
    // 閲覧数の記録失敗は無視（本文表示を優先）
  }
}
