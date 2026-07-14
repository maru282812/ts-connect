// ============================================================
// 社内SNS（コミュニティ）データアクセス層
// client-side Supabase + RLS（既存パターン踏襲）。
// 画面(CommunityFeedClient)はこの view-model(FeedPost) を描画するだけにする。
// 対応 migration: 020_community_sns / 021_community_weekly_themes / 022_community_counters
// ============================================================
import { createClient } from "@/lib/supabase/client";
import type {
  CommunityPostRow,
  CommunityVisibility,
  CommunityWeeklyTheme,
} from "@/types/database";

// 絵文字リアクション（LIKE はハートで別扱い）
export const EMOJI_REACTIONS: { key: string; emoji: string }[] = [
  { key: "THANKS", emoji: "🙏" },
  { key: "CLAP", emoji: "👏" },
  { key: "PARTY", emoji: "🎉" },
  { key: "EYES", emoji: "👀" },
];
const EMOJI_BY_KEY = new Map(EMOJI_REACTIONS.map((r) => [r.key, r.emoji]));

// 投稿フォームで選べる公開範囲（画面の3択に対応）
export type FeedVisibility = "COMPANY" | "DEPARTMENT" | "PRIVATE";

export interface FeedReaction {
  key: string;
  emoji: string;
  count: number;
  reacted: boolean;
}
export interface FeedAttachment {
  id: string;
  type: "IMAGE" | "VIDEO";
  url: string;
}
export interface FeedComment {
  id: string;
  author: string;
  body: string;
  createdAtLabel: string;
}
export interface FeedMention {
  id: string;
  name: string;
}
export interface FeedPollOption {
  id: string;
  label: string;
  voteCount: number;
}
export interface FeedPoll {
  id: string;
  options: FeedPollOption[];
  totalVotes: number;
  myOptionId: string | null;
  closesAt: string | null;
  closed: boolean;
}
export interface FeedPost {
  id: string;
  author: string;
  department: string;
  body: string;
  visibility: FeedVisibility;
  tags: string[];
  mentions: FeedMention[];
  mentionsMe: boolean;
  poll: FeedPoll | null;
  createdAtLabel: string;
  liked: boolean;
  likeCount: number;
  commentCount: number;
  repostCount: number;
  reactions: FeedReaction[];
  attachments: FeedAttachment[];
  quoteOf?: { author: string; body: string };
  sourceUrl?: string;
}

export interface MemberSuggestion {
  id: string;
  name: string;
}

function toFeedVisibility(v: CommunityVisibility): FeedVisibility {
  if (v === "COMPANY") return "COMPANY";
  if (v === "DEPARTMENT") return "DEPARTMENT";
  return "PRIVATE";
}

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "たった今";
  if (min < 60) return `${min}分前`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `${hours}時間前`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}日前`;
  return new Date(iso).toLocaleDateString("ja-JP", {
    month: "numeric",
    day: "numeric",
  });
}

async function getMembership(): Promise<{
  userId: string;
  companyId: string | null;
}> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("ログインが必要です");
  const { data: member } = await supabase
    .from("company_members")
    .select("company_id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1)
    .single();
  return { userId: user.id, companyId: member?.company_id ?? null };
}

// ── 表示名の一括解決 ──
// users の RLS は「自分のみ SELECT」のため join では他人の名前が取れない。
// 自社の同僚に限り表示名を返す RPC(community_resolve_display_names) で名前解決する。
async function resolveDisplayNames(
  ids: string[],
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const uniqueIds = Array.from(new Set(ids.filter(Boolean)));
  if (uniqueIds.length === 0) return map;
  const supabase = createClient();
  const { data } = await supabase.rpc("community_resolve_display_names", {
    ids: uniqueIds,
  });
  for (const r of (data as { user_id: string; display_name: string }[]) ?? []) {
    map.set(r.user_id, r.display_name);
  }
  return map;
}

// ── フィード取得（投稿 + 著者 + 自分のリアクション + 引用元） ──
export async function fetchFeed(): Promise<FeedPost[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: rows } = await supabase
    .from("community_posts")
    .select("*")
    .is("deleted_at", null)
    .eq("is_draft", false)
    .order("created_at", { ascending: false })
    .limit(50);

  const posts = (rows as CommunityPostRow[]) ?? [];
  if (posts.length === 0) return [];
  const ids = posts.map((p) => p.id);

  // リアクション集計（LIKE + 絵文字）
  const { data: reacts } = await supabase
    .from("community_post_reactions")
    .select("post_id, user_id, reaction")
    .in("post_id", ids);
  const reactionAgg = new Map<
    string,
    Map<string, { count: number; reacted: boolean }>
  >();
  for (const r of reacts ?? []) {
    if (!reactionAgg.has(r.post_id)) reactionAgg.set(r.post_id, new Map());
    const m = reactionAgg.get(r.post_id);
    if (!m) continue;
    const cur = m.get(r.reaction) ?? { count: 0, reacted: false };
    cur.count += 1;
    if (user && r.user_id === user.id) cur.reacted = true;
    m.set(r.reaction, cur);
  }

  // タグ（relation + tag name）
  const { data: tagRels } = await supabase
    .from("community_post_tag_relations")
    .select("post_id, tag:tag_id(name)")
    .in("post_id", ids);
  const tagsByPost = new Map<string, string[]>();
  for (const rel of (tagRels as unknown as {
    post_id: string;
    tag: { name: string } | null;
  }[]) ?? []) {
    if (!rel.tag?.name) continue;
    const list = tagsByPost.get(rel.post_id) ?? [];
    list.push(rel.tag.name);
    tagsByPost.set(rel.post_id, list);
  }

  // 添付（storage_path → public URL）
  const { data: atts } = await supabase
    .from("community_post_attachments")
    .select("id, post_id, media_type, storage_path")
    .in("post_id", ids)
    .order("sort_order", { ascending: true });
  const attByPost = new Map<string, FeedAttachment[]>();
  for (const a of (atts as unknown as {
    id: string;
    post_id: string;
    media_type: "IMAGE" | "VIDEO";
    storage_path: string;
  }[]) ?? []) {
    const {
      data: { publicUrl },
    } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(a.storage_path);
    const list = attByPost.get(a.post_id) ?? [];
    list.push({ id: a.id, type: a.media_type, url: publicUrl });
    attByPost.set(a.post_id, list);
  }

  // メンション（表示名スナップショットをそのまま使う）
  const { data: mentionRows } = await supabase
    .from("community_post_mentions")
    .select("post_id, mentioned_user_id, mentioned_display_name")
    .in("post_id", ids);
  const mentionsByPost = new Map<string, FeedMention[]>();
  for (const m of (mentionRows as unknown as {
    post_id: string;
    mentioned_user_id: string;
    mentioned_display_name: string;
  }[]) ?? []) {
    const list = mentionsByPost.get(m.post_id) ?? [];
    list.push({ id: m.mentioned_user_id, name: m.mentioned_display_name });
    mentionsByPost.set(m.post_id, list);
  }

  // アンケート（poll + options + 自分の票）
  const { data: pollRows } = await supabase
    .from("community_polls")
    .select("id, post_id, closes_at")
    .in("post_id", ids);
  const pollList =
    (pollRows as unknown as {
      id: string;
      post_id: string;
      closes_at: string | null;
    }[]) ?? [];
  const pollByPost = new Map<string, FeedPoll>();
  if (pollList.length > 0) {
    const pollIds = pollList.map((p) => p.id);
    const { data: optRows } = await supabase
      .from("community_poll_options")
      .select("id, poll_id, label, vote_count")
      .in("poll_id", pollIds)
      .order("sort_order", { ascending: true });
    const optionsByPoll = new Map<string, FeedPollOption[]>();
    const totalByPoll = new Map<string, number>();
    for (const o of (optRows as unknown as {
      id: string;
      poll_id: string;
      label: string;
      vote_count: number;
    }[]) ?? []) {
      const list = optionsByPoll.get(o.poll_id) ?? [];
      list.push({ id: o.id, label: o.label, voteCount: o.vote_count });
      optionsByPoll.set(o.poll_id, list);
      totalByPoll.set(
        o.poll_id,
        (totalByPoll.get(o.poll_id) ?? 0) + o.vote_count,
      );
    }
    const myVoteByPoll = new Map<string, string>();
    if (user) {
      const { data: myVotes } = await supabase
        .from("community_poll_votes")
        .select("poll_id, option_id")
        .in("poll_id", pollIds)
        .eq("user_id", user.id);
      for (const v of (myVotes as unknown as {
        poll_id: string;
        option_id: string;
      }[]) ?? []) {
        myVoteByPoll.set(v.poll_id, v.option_id);
      }
    }
    const now = Date.now();
    for (const p of pollList) {
      pollByPost.set(p.post_id, {
        id: p.id,
        options: optionsByPoll.get(p.id) ?? [],
        totalVotes: totalByPoll.get(p.id) ?? 0,
        myOptionId: myVoteByPoll.get(p.id) ?? null,
        closesAt: p.closes_at,
        closed: p.closes_at ? new Date(p.closes_at).getTime() < now : false,
      });
    }
  }

  // 引用元・リポスト元の本文/著者
  const refIds = Array.from(
    new Set(
      posts.map((p) => p.repost_of_id).filter((v): v is string => Boolean(v)),
    ),
  );
  const origRows = new Map<string, { authorId: string; body: string }>();
  if (refIds.length > 0) {
    const { data: origs } = await supabase
      .from("community_posts")
      .select("id, body, author_user_id")
      .in("id", refIds);
    for (const o of (origs as unknown as {
      id: string;
      body: string;
      author_user_id: string;
    }[]) ?? []) {
      origRows.set(o.id, { authorId: o.author_user_id, body: o.body });
    }
  }

  // 著者の表示名を一括解決（投稿 + 引用元の著者）
  const nameById = await resolveDisplayNames([
    ...posts.map((p) => p.author_user_id),
    ...Array.from(origRows.values()).map((o) => o.authorId),
  ]);
  const originals = new Map<string, { author: string; body: string }>();
  for (const [id, o] of origRows) {
    originals.set(id, {
      author: nameById.get(o.authorId) ?? "不明",
      body: o.body,
    });
  }

  return posts.map((p) => {
    const agg = reactionAgg.get(p.id);
    const like = agg?.get("LIKE");
    const reactions: FeedReaction[] = [];
    if (agg) {
      for (const [key, val] of agg) {
        if (key === "LIKE") continue;
        reactions.push({
          key,
          emoji: EMOJI_BY_KEY.get(key) ?? "👍",
          count: val.count,
          reacted: val.reacted,
        });
      }
    }
    const mentions = mentionsByPost.get(p.id) ?? [];
    return {
      id: p.id,
      author: nameById.get(p.author_user_id) ?? "不明",
      department: "",
      body: p.body,
      visibility: toFeedVisibility(p.visibility),
      tags: tagsByPost.get(p.id) ?? [],
      mentions,
      mentionsMe: user ? mentions.some((m) => m.id === user.id) : false,
      poll: pollByPost.get(p.id) ?? null,
      createdAtLabel: formatRelativeTime(p.created_at),
      liked: like?.reacted ?? false,
      likeCount: like?.count ?? 0,
      commentCount: p.comment_count,
      repostCount: p.repost_count,
      reactions,
      attachments: attByPost.get(p.id) ?? [],
      quoteOf: p.repost_of_id ? originals.get(p.repost_of_id) : undefined,
      sourceUrl: p.source_url ?? undefined,
    };
  });
}

// 画像/動画は既存の public バケット thumbnails を再利用（migration 011 / 025 で動画対応へ拡張）。
// パスを {user_id}/community/... に名前空間化し、thumbnails の RLS（先頭フォルダ=uid）を満たす。
const MEDIA_BUCKET = "thumbnails";
const IMAGE_MIME_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const VIDEO_MIME_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
const IMAGE_MAX_BYTES = 5 * 1024 * 1024; // 5MB
const VIDEO_MAX_BYTES = 50 * 1024 * 1024; // 50MB（バケット上限と一致）

export interface UploadedMedia {
  storagePath: string;
  url: string;
  mediaType: "IMAGE" | "VIDEO";
  fileName: string;
  fileSize: number;
  mimeType: string;
}

// ── Storage へ実体を上げて添付メタを返す共通処理 ──
async function uploadToBucket(
  file: File,
  mediaType: "IMAGE" | "VIDEO",
): Promise<UploadedMedia> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("ログインが必要です");

  const ext =
    file.name.split(".").pop() ?? (mediaType === "VIDEO" ? "mp4" : "jpg");
  const storagePath = `${user.id}/community/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}.${ext}`;

  const { error: uploadErr } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(storagePath, file, { upsert: false, contentType: file.type });
  if (uploadErr) throw new Error(uploadErr.message);

  const {
    data: { publicUrl },
  } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(storagePath);

  return {
    storagePath,
    url: publicUrl,
    mediaType,
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type,
  };
}

// ── 画像アップロード（投稿前に Storage へ上げ、添付メタを返す） ──
export async function uploadCommunityImage(file: File): Promise<UploadedMedia> {
  if (!IMAGE_MIME_TYPES.includes(file.type)) {
    throw new Error("対応形式は PNG / JPEG / WebP / GIF です");
  }
  if (file.size > IMAGE_MAX_BYTES) {
    throw new Error("画像サイズは 5MB 以下にしてください");
  }
  return uploadToBucket(file, "IMAGE");
}

// ── 動画アップロード（MP4 / WebM / MOV・最大 50MB） ──
export async function uploadCommunityVideo(file: File): Promise<UploadedMedia> {
  if (!VIDEO_MIME_TYPES.includes(file.type)) {
    throw new Error("対応形式は MP4 / WebM / MOV です");
  }
  if (file.size > VIDEO_MAX_BYTES) {
    throw new Error("動画サイズは 50MB 以下にしてください");
  }
  return uploadToBucket(file, "VIDEO");
}

// ── タグ正規化 ──────────────────────────────────────────────
// 表記揺れによるタグ乱立を防ぐため、見た目用の name と照合用の slug を分ける。
// slug は NFKC 正規化（全角→半角・互換文字を統一）+ 先頭#除去 + 小文字化 + 空白を - に。
// 例: "＃広報 "→"広報" / "Koho" と "koho" → 同一 slug に統合される。

// 入力タグの表示名を整える（先頭#除去・全角空白統一・前後空白除去）。
export function normalizeTagName(raw: string): string {
  return raw.normalize("NFKC").replace(/^#+/, "").replace(/\s+/g, " ").trim();
}

// 表示名 → 照合用 slug（同義タグを1つに寄せるキー）。
function toTagSlug(name: string): string {
  return normalizeTagName(name).toLowerCase().replace(/\s+/g, "-");
}

// タグを取得 or 作成して id を返す。
// name と slug の両方が unique 制約。既存タグの slug は name から導出できない場合がある
// （seed は英語 slug 例: 業務効率化→'efficiency'）。そのため name 一致を優先し、
// 無ければ slug 一致（表記揺れ吸収）で再利用し、どちらも無ければ作成する。
async function findTagId(
  displayName: string,
  slug: string,
): Promise<string | null> {
  const supabase = createClient();
  const { data: byName } = await supabase
    .from("community_post_tags")
    .select("id")
    .eq("name", displayName)
    .maybeSingle();
  if (byName?.id) return byName.id as string;
  const { data: bySlug } = await supabase
    .from("community_post_tags")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  return (bySlug?.id as string) ?? null;
}

async function getOrCreateTagId(name: string): Promise<string> {
  const supabase = createClient();
  const displayName = normalizeTagName(name);
  const slug = toTagSlug(name);

  const existingId = await findTagId(displayName, slug);
  if (existingId) return existingId;

  const { data: created, error } = await supabase
    .from("community_post_tags")
    .insert({ name: displayName, slug })
    .select("id")
    .single();
  // name / slug の競合（既存タグ or 同時作成）時は再取得して既存を返す。
  if (error) {
    const againId = await findTagId(displayName, slug);
    if (againId) return againId;
    throw new Error(error.message);
  }
  return created.id as string;
}

export interface PopularTag {
  name: string;
  slug: string;
  usageCount: number;
}

// ── 人気/代表タグ（利用回数の多い順） ──
// 各自バラバラのタグではなく「よく使われている代表的なタグ」を出すための一覧。
export async function fetchPopularTags(limit = 12): Promise<PopularTag[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("community_post_tags")
    .select("name, slug, usage_count")
    .gt("usage_count", 0)
    .order("usage_count", { ascending: false })
    .order("name", { ascending: true })
    .limit(limit);
  return (
    (data as { name: string; slug: string; usage_count: number }[]) ?? []
  ).map((t) => ({ name: t.name, slug: t.slug, usageCount: t.usage_count }));
}

// ── タグ・サジェスト（入力中のオートコンプリート） ──
// 入力した文字に前方/部分一致する既存タグを利用回数順で返し、新規作成より再利用を促す。
export async function searchTags(
  keyword: string,
  limit = 8,
): Promise<PopularTag[]> {
  const q = normalizeTagName(keyword);
  if (!q) return [];
  const supabase = createClient();
  const { data } = await supabase
    .from("community_post_tags")
    .select("name, slug, usage_count")
    .ilike("name", `%${q}%`)
    .order("usage_count", { ascending: false })
    .order("name", { ascending: true })
    .limit(limit);
  return (
    (data as { name: string; slug: string; usage_count: number }[]) ?? []
  ).map((t) => ({ name: t.name, slug: t.slug, usageCount: t.usage_count }));
}

// ── 投稿作成（ORIGINAL） ──
export async function createCommunityPost(input: {
  body: string;
  visibility: FeedVisibility;
  weeklyThemeId?: string | null;
  tags?: string[];
  attachments?: UploadedMedia[];
  mentions?: MemberSuggestion[];
  poll?: { options: string[]; closesAt?: string | null };
}): Promise<void> {
  const supabase = createClient();
  const { userId, companyId } = await getMembership();
  if (!companyId) throw new Error("所属会社が設定されていません");
  const { data: post, error } = await supabase
    .from("community_posts")
    .insert({
      company_id: companyId,
      author_user_id: userId,
      body: input.body,
      visibility: input.visibility,
      post_kind: "ORIGINAL",
      weekly_theme_id: input.weeklyThemeId ?? null,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  const postId = post.id as string;

  // タグ付け（master を get-or-create → relation を作成）
  const tags = Array.from(
    new Set((input.tags ?? []).map((t) => t.trim()).filter(Boolean)),
  );
  if (tags.length > 0) {
    const tagIds = await Promise.all(tags.map(getOrCreateTagId));
    const { error: relErr } = await supabase
      .from("community_post_tag_relations")
      .insert(tagIds.map((tagId) => ({ post_id: postId, tag_id: tagId })));
    if (relErr) throw new Error(relErr.message);
  }

  // 添付（Storage へは uploadCommunityImage 済み・メタ行を作成）
  const attachments = input.attachments ?? [];
  if (attachments.length > 0) {
    const { error: attErr } = await supabase
      .from("community_post_attachments")
      .insert(
        attachments.map((a, i) => ({
          post_id: postId,
          uploaded_by: userId,
          media_type: a.mediaType,
          storage_path: a.storagePath,
          file_name: a.fileName,
          file_size: a.fileSize,
          mime_type: a.mimeType,
          sort_order: i,
        })),
      );
    if (attErr) throw new Error(attErr.message);
  }

  // メンション（本文に @表示名 が残っている人だけ・表示名スナップショット付き）
  const mentions = (input.mentions ?? []).filter(
    (m, i, arr) => arr.findIndex((x) => x.id === m.id) === i,
  );
  if (mentions.length > 0) {
    const { error: mentionErr } = await supabase
      .from("community_post_mentions")
      .insert(
        mentions.map((m) => ({
          post_id: postId,
          mentioned_user_id: m.id,
          mentioned_display_name: m.name,
        })),
      );
    if (mentionErr) throw new Error(mentionErr.message);
  }

  // アンケート（poll + options。2件以上の有効な選択肢があるときのみ）
  const pollOptions = (input.poll?.options ?? [])
    .map((o) => o.trim())
    .filter(Boolean);
  if (pollOptions.length >= 2) {
    const { data: poll, error: pollErr } = await supabase
      .from("community_polls")
      .insert({ post_id: postId, closes_at: input.poll?.closesAt ?? null })
      .select("id")
      .single();
    if (pollErr) throw new Error(pollErr.message);
    const { error: optErr } = await supabase
      .from("community_poll_options")
      .insert(
        pollOptions.map((label, i) => ({
          poll_id: poll.id as string,
          label,
          sort_order: i,
        })),
      );
    if (optErr) throw new Error(optErr.message);
  }
}

// ── 同僚名簿（@メンション補完用・自社の active メンバー） ──
export async function searchMembers(
  keyword: string,
): Promise<MemberSuggestion[]> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("community_member_directory", {
    keyword: keyword.trim(),
    lim: 8,
  });
  if (error) return [];
  return ((data as { user_id: string; display_name: string }[]) ?? []).map(
    (m) => ({ id: m.user_id, name: m.display_name }),
  );
}

// ── アンケート投票（単一選択: 既存票を消してから入れ直す） ──
export async function votePoll(
  pollId: string,
  optionId: string,
): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("ログインが必要です");
  await supabase
    .from("community_poll_votes")
    .delete()
    .eq("poll_id", pollId)
    .eq("user_id", user.id);
  const { error } = await supabase
    .from("community_poll_votes")
    .insert({ poll_id: pollId, option_id: optionId, user_id: user.id });
  if (error) throw new Error(error.message);
}

// ── いいね（LIKE）ON/OFF ──
export async function setLike(postId: string, on: boolean): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("ログインが必要です");
  if (on) {
    await supabase
      .from("community_post_reactions")
      .upsert(
        { post_id: postId, user_id: user.id, reaction: "LIKE" },
        { onConflict: "post_id,user_id,reaction", ignoreDuplicates: true },
      );
  } else {
    await supabase
      .from("community_post_reactions")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", user.id)
      .eq("reaction", "LIKE");
  }
}

// ── 絵文字リアクション ON/OFF ──
export async function setReaction(
  postId: string,
  reaction: string,
  on: boolean,
): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("ログインが必要です");
  if (on) {
    await supabase
      .from("community_post_reactions")
      .upsert(
        { post_id: postId, user_id: user.id, reaction },
        { onConflict: "post_id,user_id,reaction", ignoreDuplicates: true },
      );
  } else {
    await supabase
      .from("community_post_reactions")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", user.id)
      .eq("reaction", reaction);
  }
}

// ── 引用リポスト（QUOTE 行を作成） ──
// 社内SNS ではコメントを添えて広める「引用リポスト」を標準とする。
// comment が空のときは従来どおりのリポスト（REPOST）として扱う。
export async function repost(postId: string, comment = ""): Promise<void> {
  const supabase = createClient();
  const { userId, companyId } = await getMembership();
  if (!companyId) throw new Error("所属会社が設定されていません");
  const body = comment.trim();
  const { error } = await supabase.from("community_posts").insert({
    company_id: companyId,
    author_user_id: userId,
    body,
    post_kind: body ? "QUOTE" : "REPOST",
    repost_of_id: postId,
  });
  if (error) throw new Error(error.message);
}

// ── コメント取得（1投稿ぶん・古い順） ──
export async function fetchComments(postId: string): Promise<FeedComment[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("community_post_comments")
    .select("id, body, created_at, author_user_id")
    .eq("post_id", postId)
    .eq("is_hidden", false)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  const rows =
    (data as unknown as {
      id: string;
      body: string;
      created_at: string;
      author_user_id: string;
    }[]) ?? [];
  const nameById = await resolveDisplayNames(rows.map((c) => c.author_user_id));
  return rows.map((c) => ({
    id: c.id,
    author: nameById.get(c.author_user_id) ?? "不明",
    body: c.body,
    createdAtLabel: formatRelativeTime(c.created_at),
  }));
}

// ── コメント作成 ──
export async function createComment(
  postId: string,
  body: string,
): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("ログインが必要です");
  const { error } = await supabase.from("community_post_comments").insert({
    post_id: postId,
    author_user_id: user.id,
    body,
  });
  if (error) throw new Error(error.message);
}

// ── 週替わりテーマ取得 + 現在アクティブなテーマ ──
export async function fetchWeeklyThemes(): Promise<CommunityWeeklyTheme[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("community_weekly_themes")
    .select("*")
    .order("starts_on", { ascending: true });
  return (data as CommunityWeeklyTheme[]) ?? [];
}

export function getActiveTheme(
  themes: CommunityWeeklyTheme[],
): CommunityWeeklyTheme | null {
  const today = new Date().toISOString().slice(0, 10);
  const inRange = themes.find(
    (t) => t.is_active && t.starts_on <= today && t.ends_on >= today,
  );
  if (inRange) return inRange;
  return themes.find((t) => t.is_active) ?? null;
}

// ── 週替わりテーマ管理（ADMIN。書き込みは migration 021/023 の ADMIN ポリシー前提） ──
export interface WeeklyThemeInput {
  title: string;
  description: string;
  startsOn: string; // YYYY-MM-DD
  endsOn: string; // YYYY-MM-DD
  isActive: boolean;
}

/** 過去分を含む全テーマ（開始日の新しい順）。管理一覧用。 */
export async function fetchAllThemes(): Promise<CommunityWeeklyTheme[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("community_weekly_themes")
    .select("*")
    .order("starts_on", { ascending: false });
  return (data as CommunityWeeklyTheme[]) ?? [];
}

function themePayload(input: WeeklyThemeInput) {
  return {
    title: input.title,
    description: input.description.trim() || null,
    starts_on: input.startsOn,
    ends_on: input.endsOn,
    is_active: input.isActive,
  };
}

export async function createTheme(
  input: WeeklyThemeInput,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("community_weekly_themes")
      .insert({ ...themePayload(input), created_by: user?.id ?? null });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "作成に失敗しました",
    };
  }
}

export async function updateTheme(
  id: string,
  input: WeeklyThemeInput,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from("community_weekly_themes")
      .update(themePayload(input))
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

export async function deleteTheme(
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from("community_weekly_themes")
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
