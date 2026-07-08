"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { WeeklyThemePanel } from "@/components/features/WeeklyThemePanel";
import {
  createComment,
  createCommunityPost,
  EMOJI_REACTIONS,
  type FeedComment,
  type FeedPoll,
  type FeedPost,
  type FeedReaction,
  type FeedVisibility,
  fetchComments,
  fetchFeed,
  fetchPopularTags,
  fetchWeeklyThemes,
  getActiveTheme,
  type MemberSuggestion,
  normalizeTagName,
  type PopularTag,
  repost as repostPost,
  searchMembers,
  searchTags,
  setLike,
  setReaction,
  type UploadedMedia,
  uploadCommunityImage,
  uploadCommunityVideo,
  votePoll,
} from "@/lib/community";
import type { CommunityWeeklyTheme } from "@/types/database";

// ============================================================
// 社内SNS（コミュニティ）Phase1 タイムライン
// 設計: docs/design/community_sns_design.md
// データ層: lib/community.ts（client-side Supabase + RLS）
//   migration 020(本体) / 021(週替わりテーマ) / 022(カウンタ) 対応。
// ============================================================

type Visibility = FeedVisibility;
type CommunityPost = FeedPost;
type Reaction = FeedReaction;

const VISIBILITY_META: Record<Visibility, { label: string; badge: string }> = {
  COMPANY: { label: "全社", badge: "bg-blue-100 text-blue-700" },
  DEPARTMENT: { label: "部署", badge: "bg-amber-100 text-amber-700" },
  PRIVATE: { label: "自分のみ", badge: "bg-slate-200 text-slate-600" },
};

const REACTION_PALETTE = EMOJI_REACTIONS;

export function CommunityFeedClient() {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [composeBody, setComposeBody] = useState("");
  const [composeVisibility, setComposeVisibility] =
    useState<Visibility>("COMPANY");
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [showImporter, setShowImporter] = useState(false);
  const [themes, setThemes] = useState<CommunityWeeklyTheme[]>([]);
  const [themeForPost, setThemeForPost] = useState<CommunityWeeklyTheme | null>(
    null,
  );
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [composeTags, setComposeTags] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState("");
  const [showTagInput, setShowTagInput] = useState(false);
  const [tagSuggestions, setTagSuggestions] = useState<PopularTag[]>([]);
  const [popularTags, setPopularTags] = useState<PopularTag[]>([]);
  const [composeAttachments, setComposeAttachments] = useState<UploadedMedia[]>(
    [],
  );
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  // メンション（@補完で選んだ相手を保持し、投稿時に本文の @名前 が残っている人だけ確定）
  const [mentioned, setMentioned] = useState<MemberSuggestion[]>([]);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionSuggestions, setMentionSuggestions] = useState<
    MemberSuggestion[]
  >([]);

  // アンケート
  const [showPoll, setShowPoll] = useState(false);
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);

  // タイムラインのタブ（すべて / 自分宛て）
  const [feedTab, setFeedTab] = useState<"all" | "mine">("all");

  const addTag = (raw: string) => {
    const t = normalizeTagName(raw);
    if (!t) return;
    setComposeTags((prev) =>
      prev.some((x) => x.toLowerCase() === t.toLowerCase())
        ? prev
        : [...prev, t],
    );
    setTagDraft("");
    setTagSuggestions([]);
  };

  // 入力中のタグサジェスト（既存タグの再利用を促す・デバウンス）
  useEffect(() => {
    const q = normalizeTagName(tagDraft);
    if (!q) {
      setTagSuggestions([]);
      return;
    }
    const id = setTimeout(() => {
      searchTags(q)
        .then((tags) =>
          setTagSuggestions(
            tags.filter(
              (t) =>
                !composeTags.some(
                  (c) => c.toLowerCase() === t.name.toLowerCase(),
                ),
            ),
          ),
        )
        .catch(() => setTagSuggestions([]));
    }, 200);
    return () => clearTimeout(id);
  }, [tagDraft, composeTags]);

  // 本文入力: カーソル直前の @キーワード を検出してメンション候補を出す
  const handleBodyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setComposeBody(value);
    const caret = e.target.selectionStart ?? value.length;
    const before = value.slice(0, caret);
    const m = before.match(/@([^\s@　]*)$/);
    setMentionQuery(m ? m[1] : null);
  };

  // メンション候補の取得（@キーワードのデバウンス検索）
  useEffect(() => {
    if (mentionQuery === null) {
      setMentionSuggestions([]);
      return;
    }
    const id = setTimeout(() => {
      searchMembers(mentionQuery)
        .then(setMentionSuggestions)
        .catch(() => setMentionSuggestions([]));
    }, 150);
    return () => clearTimeout(id);
  }, [mentionQuery]);

  // 候補を選択 → 本文の @キーワード を @表示名 に置換し、相手を確定リストへ
  const selectMention = (member: MemberSuggestion) => {
    const el = bodyRef.current;
    const caret = el?.selectionStart ?? composeBody.length;
    const before = composeBody.slice(0, caret);
    const after = composeBody.slice(caret);
    const replaced = before.replace(/@([^\s@　]*)$/, `@${member.name} `);
    const nextBody = replaced + after;
    setComposeBody(nextBody);
    setMentioned((prev) =>
      prev.some((p) => p.id === member.id) ? prev : [...prev, member],
    );
    setMentionQuery(null);
    setMentionSuggestions([]);
    // 置換後のカーソル位置を末尾(@表示名 の直後)へ
    requestAnimationFrame(() => {
      if (!el) return;
      const pos = replaced.length;
      el.focus();
      el.setSelectionRange(pos, pos);
    });
  };

  const handlePickImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadingMedia(true);
    setError(null);
    try {
      const media = await uploadCommunityImage(file);
      setComposeAttachments((prev) => [...prev, media]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "画像のアップロードに失敗しました",
      );
    } finally {
      setUploadingMedia(false);
    }
  };

  const handlePickVideo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadingMedia(true);
    setError(null);
    try {
      const media = await uploadCommunityVideo(file);
      setComposeAttachments((prev) => [...prev, media]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "動画のアップロードに失敗しました",
      );
    } finally {
      setUploadingMedia(false);
    }
  };

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [feed, th, pop] = await Promise.all([
        fetchFeed(),
        fetchWeeklyThemes(),
        fetchPopularTags(),
      ]);
      setPosts(feed);
      setThemes(th);
      setPopularTags(pop);
    } catch (e) {
      setError(e instanceof Error ? e.message : "読み込みに失敗しました");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // ヘッダーの全体検索などから #community-post-<id> 付きで遷移してきたとき、
  // フィード読み込み完了後に該当投稿までスクロールし、一瞬ハイライトして位置を示す。
  useEffect(() => {
    if (isLoading || typeof window === "undefined") return;
    const hash = window.location.hash;
    if (!hash.startsWith("#community-post-")) return;
    const el = document.getElementById(hash.slice(1));
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("ring-2", "ring-blue-400", "ring-offset-2");
    const timer = setTimeout(() => {
      el.classList.remove("ring-2", "ring-blue-400", "ring-offset-2");
    }, 2000);
    return () => clearTimeout(timer);
  }, [isLoading]);

  // 自動更新（20秒ごとにフィードのみ再取得）
  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => {
      fetchFeed()
        .then(setPosts)
        .catch(() => {});
    }, 20000);
    return () => clearInterval(id);
  }, [autoRefresh]);

  const activeTheme = useMemo(() => getActiveTheme(themes), [themes]);
  const upcomingThemes = useMemo(
    () => themes.filter((t) => t.id !== activeTheme?.id).slice(0, 3),
    [themes, activeTheme],
  );

  // フィルタ用のタグ一覧: まず代表的な人気タグ、続いて読み込み済み投稿のタグ。
  const allTags = useMemo(() => {
    const ordered: string[] = [];
    const seen = new Set<string>();
    const push = (t: string) => {
      const key = t.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      ordered.push(t);
    };
    for (const t of popularTags) push(t.name);
    for (const p of posts) for (const t of p.tags) push(t);
    return ordered;
  }, [posts, popularTags]);

  const filtered = useMemo(() => {
    const tag = activeTag?.toLowerCase() ?? null;
    return posts.filter((p) => {
      if (feedTab === "mine" && !p.mentionsMe) return false;
      if (tag && !p.tags.some((t) => t.toLowerCase() === tag)) return false;
      if (query && !`${p.body} ${p.tags.join(" ")} ${p.author}`.includes(query))
        return false;
      return true;
    });
  }, [posts, activeTag, query, feedTab]);

  const mineCount = useMemo(
    () => posts.filter((p) => p.mentionsMe).length,
    [posts],
  );

  const handlePost = async () => {
    const body = composeBody.trim();
    const validPollOptions = pollOptions.map((o) => o.trim()).filter(Boolean);
    const hasPoll = showPoll && validPollOptions.length >= 2;
    if ((!body && composeAttachments.length === 0 && !hasPoll) || posting)
      return;
    setPosting(true);
    setError(null);
    try {
      // 本文に @表示名 が残っている相手だけ確定（削除された @ は送らない）
      const finalMentions = mentioned.filter((m) =>
        composeBody.includes(`@${m.name}`),
      );
      await createCommunityPost({
        body,
        visibility: composeVisibility,
        weeklyThemeId: themeForPost?.id ?? null,
        tags: composeTags,
        attachments: composeAttachments,
        mentions: finalMentions,
        poll: hasPoll ? { options: validPollOptions } : undefined,
      });
      setComposeBody("");
      setThemeForPost(null);
      setComposeTags([]);
      setTagDraft("");
      setTagSuggestions([]);
      setShowTagInput(false);
      setComposeAttachments([]);
      setMentioned([]);
      setMentionQuery(null);
      setShowPoll(false);
      setPollOptions(["", ""]);
      const [feed, pop] = await Promise.all([fetchFeed(), fetchPopularTags()]);
      setPosts(feed);
      setPopularTags(pop);
    } catch (e) {
      setError(e instanceof Error ? e.message : "投稿に失敗しました");
    } finally {
      setPosting(false);
    }
  };

  // アンケート投票（楽観更新 → 失敗時は再取得で戻す）
  const handleVote = async (
    postId: string,
    pollId: string,
    optionId: string,
  ) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId || !p.poll) return p;
        const prevChoice = p.poll.myOptionId;
        if (prevChoice === optionId) return p;
        const options = p.poll.options.map((o) => {
          let delta = 0;
          if (o.id === optionId) delta += 1;
          if (o.id === prevChoice) delta -= 1;
          return { ...o, voteCount: o.voteCount + delta };
        });
        const totalVotes = p.poll.totalVotes + (prevChoice ? 0 : 1);
        return {
          ...p,
          poll: { ...p.poll, options, totalVotes, myOptionId: optionId },
        };
      }),
    );
    try {
      await votePoll(pollId, optionId);
    } catch {
      const feed = await fetchFeed();
      setPosts(feed);
    }
  };

  const toggleLike = async (id: string) => {
    const target = posts.find((p) => p.id === id);
    if (!target) return;
    const next = !target.liked;
    setPosts((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, liked: next, likeCount: p.likeCount + (next ? 1 : -1) }
          : p,
      ),
    );
    try {
      await setLike(id, next);
    } catch {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === id
            ? { ...p, liked: target.liked, likeCount: target.likeCount }
            : p,
        ),
      );
    }
  };

  const toggleReaction = async (postId: string, key: string, emoji: string) => {
    const target = posts.find((p) => p.id === postId);
    const on = !(
      target?.reactions.find((r) => r.key === key)?.reacted ?? false
    );
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const existing = p.reactions.find((r) => r.key === key);
        let reactions: Reaction[];
        if (existing) {
          reactions = p.reactions
            .map((r) =>
              r.key === key
                ? {
                    ...r,
                    reacted: !r.reacted,
                    count: r.count + (r.reacted ? -1 : 1),
                  }
                : r,
            )
            .filter((r) => r.count > 0);
        } else {
          reactions = [...p.reactions, { key, emoji, count: 1, reacted: true }];
        }
        return { ...p, reactions };
      }),
    );
    try {
      await setReaction(postId, key, on);
    } catch {
      load();
    }
  };

  const handleRepost = async (id: string, comment: string) => {
    await repostPost(id, comment);
    const feed = await fetchFeed();
    setPosts(feed);
  };

  const handleUseTheme = () => {
    if (!activeTheme) return;
    setThemeForPost(activeTheme);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl p-4 md:p-8">
      {/* ============================================================
          2カラム: 中央タイムライン（主） + 右 週替わりテーマ（補助）
      ============================================================ */}
      <div className="flex justify-center gap-8">
        <div className="w-full min-w-0 max-w-2xl">
          {/* ヘッダー + 更新コントロール */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">社内SNS</h1>
              <p className="text-sm text-slate-500">
                社内のお知らせ・雑談・広報発信のタイムライン
              </p>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex cursor-pointer items-center gap-1.5 text-xs text-slate-500">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-slate-300"
                />
                自動更新
              </label>
              <button
                type="button"
                onClick={load}
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700"
              >
                <RefreshIcon />
                更新
              </button>
            </div>
          </div>

          {/* コンポーザ */}
          <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            {themeForPost && (
              <div className="mb-2 flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-1.5 text-xs text-blue-700">
                <span className="font-bold">テーマ:</span>
                <span className="truncate">{themeForPost.title}</span>
                <button
                  type="button"
                  onClick={() => setThemeForPost(null)}
                  className="ml-auto text-blue-400 hover:text-blue-600"
                  aria-label="テーマ指定を解除"
                >
                  ✕
                </button>
              </div>
            )}
            <div className="relative">
              <textarea
                ref={bodyRef}
                value={composeBody}
                onChange={handleBodyChange}
                placeholder={
                  themeForPost
                    ? `「${themeForPost.title}」について共有しよう`
                    : "いまどうしてる？ 社内に共有しよう（@で同僚にメンション）"
                }
                rows={3}
                className="w-full resize-none rounded-lg border border-slate-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
              {/* メンション候補 */}
              {mentionQuery !== null && mentionSuggestions.length > 0 && (
                <div className="absolute left-2 right-2 z-20 mt-1 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
                  {mentionSuggestions.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        selectMention(m);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50"
                    >
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-[11px] font-bold text-slate-600">
                        {m.name.charAt(0)}
                      </span>
                      <span className="font-medium text-slate-700">
                        @{m.name}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* アンケート作成 */}
            {showPoll && (
              <div className="mt-2 space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-500">
                    アンケート（単一選択）
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPoll(false);
                      setPollOptions(["", ""]);
                    }}
                    className="text-xs text-slate-400 hover:text-slate-600"
                  >
                    削除
                  </button>
                </div>
                {pollOptions.map((opt, i) => (
                  <div
                    // biome-ignore lint/suspicious/noArrayIndexKey: 選択肢は順序で管理する一時入力
                    key={i}
                    className="flex items-center gap-2"
                  >
                    <input
                      value={opt}
                      onChange={(e) =>
                        setPollOptions((prev) =>
                          prev.map((p, idx) =>
                            idx === i ? e.target.value : p,
                          ),
                        )
                      }
                      placeholder={`選択肢 ${i + 1}`}
                      className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                    />
                    {pollOptions.length > 2 && (
                      <button
                        type="button"
                        onClick={() =>
                          setPollOptions((prev) =>
                            prev.filter((_, idx) => idx !== i),
                          )
                        }
                        aria-label={`選択肢 ${i + 1} を削除`}
                        className="shrink-0 text-slate-400 hover:text-slate-600"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                {pollOptions.length < 6 && (
                  <button
                    type="button"
                    onClick={() => setPollOptions((prev) => [...prev, ""])}
                    className="text-xs font-medium text-blue-600 hover:text-blue-700"
                  >
                    ＋ 選択肢を追加
                  </button>
                )}
              </div>
            )}

            {/* 添付プレビュー（画像 / 動画） */}
            {(composeAttachments.length > 0 || uploadingMedia) && (
              <div className="mt-2 flex flex-wrap gap-2">
                {composeAttachments.map((a) => (
                  <div
                    key={a.storagePath}
                    className="relative h-20 w-20 overflow-hidden rounded-lg border border-slate-200 bg-black"
                  >
                    {a.mediaType === "VIDEO" ? (
                      <video
                        src={a.url}
                        muted
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={a.url}
                        alt={a.fileName}
                        className="h-full w-full object-cover"
                      />
                    )}
                    {a.mediaType === "VIDEO" && (
                      <span className="pointer-events-none absolute bottom-1 left-1 rounded bg-black/60 px-1 text-[9px] font-bold text-white">
                        動画
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        setComposeAttachments((prev) =>
                          prev.filter((x) => x.storagePath !== a.storagePath),
                        )
                      }
                      aria-label="添付を削除"
                      className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-[10px] leading-none text-white hover:bg-black/80"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                {uploadingMedia && (
                  <div className="flex h-20 w-20 items-center justify-center rounded-lg border border-dashed border-slate-200 text-[11px] text-slate-400">
                    アップロード中...
                  </div>
                )}
              </div>
            )}

            {/* タグ入力 */}
            {showTagInput && (
              <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
                {composeTags.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    {composeTags.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700"
                      >
                        #{t}
                        <button
                          type="button"
                          onClick={() =>
                            setComposeTags((prev) =>
                              prev.filter((x) => x !== t),
                            )
                          }
                          aria-label={`タグ ${t} を削除`}
                          className="text-blue-400 hover:text-blue-600"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="relative">
                  <input
                    value={tagDraft}
                    onChange={(e) => setTagDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault();
                        addTag(tagDraft);
                      }
                    }}
                    placeholder="タグを入力（例: 広報, お知らせ）"
                    className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-slate-300"
                  />
                  {/* サジェスト: 既存タグの再利用を促す */}
                  {tagSuggestions.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg">
                      {tagSuggestions.map((s) => (
                        <button
                          key={s.slug}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            addTag(s.name);
                          }}
                          className="flex w-full items-center justify-between px-2.5 py-1.5 text-left text-xs hover:bg-slate-50"
                        >
                          <span className="font-medium text-slate-700">
                            #{s.name}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {s.usageCount}件
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 代表的な人気タグ（クリックで追加） */}
                {popularTags.length > 0 && (
                  <div className="mt-2">
                    <p className="mb-1 text-[10px] font-bold text-slate-400">
                      よく使われるタグ
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {popularTags
                        .filter(
                          (t) =>
                            !composeTags.some(
                              (c) => c.toLowerCase() === t.name.toLowerCase(),
                            ),
                        )
                        .slice(0, 10)
                        .map((t) => (
                          <button
                            key={t.slug}
                            type="button"
                            onClick={() => addTag(t.name)}
                            className="rounded-full bg-white px-2 py-0.5 text-xs text-slate-600 ring-1 ring-slate-200 hover:bg-blue-50 hover:text-blue-700 hover:ring-blue-200"
                          >
                            #{t.name}
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {error && (
              <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
                {error}
              </p>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={handlePickImage}
              className="hidden"
            />
            <input
              ref={videoInputRef}
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              onChange={handlePickVideo}
              className="hidden"
            />
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-1 text-slate-400">
                <ComposerIconButton
                  title="画像を追加"
                  icon={<ImageIcon />}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingMedia}
                />
                <ComposerIconButton
                  title="動画を追加（MP4 / WebM / MOV・最大50MB）"
                  icon={<VideoIcon />}
                  onClick={() => videoInputRef.current?.click()}
                  disabled={uploadingMedia}
                />
                <ComposerIconButton
                  title="タグを追加"
                  icon={<TagIcon />}
                  active={showTagInput}
                  onClick={() => setShowTagInput((v) => !v)}
                />
                <ComposerIconButton
                  title="アンケートを追加"
                  icon={<PollIcon />}
                  active={showPoll}
                  onClick={() => setShowPoll((v) => !v)}
                />
                <ComposerIconButton
                  title="広報：社外SNSから取り込み"
                  icon={<LinkIcon />}
                  onClick={() => setShowImporter((v) => !v)}
                />
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={composeVisibility}
                  onChange={(e) =>
                    setComposeVisibility(e.target.value as Visibility)
                  }
                  className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-slate-600 focus:outline-none"
                >
                  <option value="COMPANY">全社公開</option>
                  <option value="DEPARTMENT">部署のみ</option>
                  <option value="PRIVATE">自分のみ</option>
                </select>
                <button
                  type="button"
                  onClick={handlePost}
                  disabled={
                    (!composeBody.trim() &&
                      composeAttachments.length === 0 &&
                      !(
                        showPoll &&
                        pollOptions.filter((o) => o.trim()).length >= 2
                      )) ||
                    posting ||
                    uploadingMedia
                  }
                  className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                >
                  {posting ? "投稿中..." : "投稿"}
                </button>
              </div>
            </div>

            {/* 広報：社外SNS取り込みパネル（UIのみ・次フェーズ） */}
            {showImporter && (
              <div className="mt-3 rounded-lg border border-dashed border-amber-300 bg-amber-50 p-3">
                <p className="mb-2 text-xs font-bold text-amber-800">
                  社外SNSから取り込み（広報補助）
                </p>
                <input
                  type="url"
                  placeholder="https://x.com/... の投稿URLを貼り付け"
                  className="w-full rounded-lg border border-amber-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                />
                <p className="mt-2 text-[11px] text-amber-700">
                  URLからOGP（タイトル・本文・画像）を取得し、社内向け下書きを自動生成します。内容を確認してから投稿できます。
                </p>
              </div>
            )}
          </div>

          {/* タブ: すべて / 自分宛て */}
          <div className="mb-4 flex items-center gap-1 border-b border-slate-200">
            <FeedTabButton
              label="すべて"
              active={feedTab === "all"}
              onClick={() => setFeedTab("all")}
            />
            <FeedTabButton
              label="自分宛て"
              count={mineCount}
              active={feedTab === "mine"}
              onClick={() => setFeedTab("mine")}
            />
          </div>

          {/* 検索 + タグフィルタ */}
          <div className="mb-4 space-y-3">
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <SearchIcon />
              </span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="投稿を検索..."
                className="w-full rounded-lg border border-slate-200 py-2 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
            </div>
            {allTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <TagChip
                  label="すべて"
                  active={activeTag === null}
                  onClick={() => setActiveTag(null)}
                />
                {allTags.map((t) => (
                  <TagChip
                    key={t}
                    label={t}
                    active={activeTag === t}
                    onClick={() => setActiveTag(t)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* タイムライン */}
          <div className="space-y-4">
            {isLoading ? (
              <p className="py-12 text-center text-sm text-slate-400">
                読み込み中...
              </p>
            ) : filtered.length === 0 ? (
              <p className="py-12 text-center text-sm text-slate-400">
                {feedTab === "mine"
                  ? "自分宛て（メンション）の投稿はまだありません"
                  : "投稿がありません"}
              </p>
            ) : (
              filtered.map((p) => (
                <PostCard
                  key={p.id}
                  post={p}
                  onLike={() => toggleLike(p.id)}
                  onReact={(key, emoji) => toggleReaction(p.id, key, emoji)}
                  onRepost={(comment) => handleRepost(p.id, comment)}
                  onVote={(optionId) =>
                    p.poll && handleVote(p.id, p.poll.id, optionId)
                  }
                  onCommented={() =>
                    setPosts((prev) =>
                      prev.map((x) =>
                        x.id === p.id
                          ? { ...x, commentCount: x.commentCount + 1 }
                          : x,
                      ),
                    )
                  }
                />
              ))
            )}
          </div>
        </div>
        {/* /中央タイムライン列 */}

        {/* 右カラム: 週替わりテーマ（xl 以上で表示・sticky風） */}
        <aside className="hidden w-80 shrink-0 xl:block">
          <div className="sticky top-0">
            <WeeklyThemePanel
              active={activeTheme}
              upcoming={upcomingThemes}
              onUse={handleUseTheme}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}

// ── 投稿カード ──────────────────────────────────────────────
function PostCard({
  post,
  onLike,
  onReact,
  onRepost,
  onVote,
  onCommented,
}: {
  post: CommunityPost;
  onLike: () => void;
  onReact: (key: string, emoji: string) => void;
  onRepost: (comment: string) => Promise<void>;
  onVote: (optionId: string) => void;
  onCommented: () => void;
}) {
  const [showReactionBar, setShowReactionBar] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<FeedComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentBody, setCommentBody] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [showQuote, setShowQuote] = useState(false);
  const [quoteBody, setQuoteBody] = useState("");
  const [quoteSubmitting, setQuoteSubmitting] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const vis = VISIBILITY_META[post.visibility];

  const submitQuote = async () => {
    const body = quoteBody.trim();
    if (!body || quoteSubmitting) return;
    setQuoteSubmitting(true);
    setQuoteError(null);
    try {
      await onRepost(body);
      setQuoteBody("");
      setShowQuote(false);
    } catch (e) {
      setQuoteError(
        e instanceof Error ? e.message : "引用リポストに失敗しました",
      );
    } finally {
      setQuoteSubmitting(false);
    }
  };

  const toggleComments = async () => {
    const next = !showComments;
    setShowComments(next);
    if (next && comments.length === 0) {
      setCommentsLoading(true);
      try {
        setComments(await fetchComments(post.id));
      } catch (e) {
        setCommentError(
          e instanceof Error ? e.message : "コメントの取得に失敗しました",
        );
      } finally {
        setCommentsLoading(false);
      }
    }
  };

  const submitComment = async () => {
    const body = commentBody.trim();
    if (!body || commentSubmitting) return;
    setCommentSubmitting(true);
    setCommentError(null);
    try {
      await createComment(post.id, body);
      setCommentBody("");
      setComments(await fetchComments(post.id));
      onCommented();
    } catch (e) {
      setCommentError(
        e instanceof Error ? e.message : "コメントの投稿に失敗しました",
      );
    } finally {
      setCommentSubmitting(false);
    }
  };

  return (
    <article
      id={`community-post-${post.id}`}
      className="scroll-mt-24 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-slate-200 text-sm font-bold text-slate-600">
          {post.author.charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-bold text-slate-900">
              {post.author}
            </span>
            {post.department && (
              <span className="truncate text-xs text-slate-400">
                {post.department}
              </span>
            )}
            <span className="text-xs text-slate-300">·</span>
            <span className="text-xs text-slate-400">
              {post.createdAtLabel}
            </span>
            <span
              className={`ml-auto rounded px-1.5 py-0.5 text-[10px] font-bold ${vis.badge}`}
            >
              {vis.label}
            </span>
          </div>

          {post.body && (
            <p className="mt-1 whitespace-pre-wrap text-sm text-slate-800">
              {renderBodyWithMentions(post.body, post.mentions)}
            </p>
          )}

          {/* アンケート */}
          {post.poll && <PollView poll={post.poll} onVote={onVote} />}

          {post.sourceUrl && (
            <a
              href={post.sourceUrl}
              className="mt-1 inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
            >
              <LinkIcon /> 社外SNSの元投稿
            </a>
          )}

          {/* 引用リポスト / リポスト元 */}
          {post.quoteOf && (
            <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-bold text-slate-600">
                {post.quoteOf.author}
              </p>
              <p className="mt-0.5 text-sm text-slate-700">
                {post.quoteOf.body}
              </p>
            </div>
          )}

          {/* メディア */}
          {post.attachments.length > 0 && (
            <div
              className={`mt-2 grid gap-2 ${
                post.attachments.length === 1 ? "grid-cols-1" : "grid-cols-2"
              }`}
            >
              {post.attachments.map((a) => {
                const single = post.attachments.length === 1;
                return a.type === "IMAGE" ? (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setLightboxUrl(a.url)}
                    className={`group relative block overflow-hidden rounded-lg border border-slate-200 bg-slate-50 ${
                      single ? "" : "aspect-square"
                    }`}
                    aria-label="画像を拡大表示"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={a.url}
                      alt=""
                      className={
                        single
                          ? "max-h-80 w-full object-contain"
                          : "h-full w-full object-cover transition-transform group-hover:scale-105"
                      }
                    />
                  </button>
                ) : (
                  // biome-ignore lint/a11y/useMediaCaption: ユーザー投稿動画のため字幕トラックは提供できない
                  <video
                    key={a.id}
                    src={a.url}
                    controls
                    preload="metadata"
                    playsInline
                    className={`w-full rounded-lg border border-slate-200 bg-black object-contain ${
                      single ? "max-h-80" : "aspect-square h-full"
                    }`}
                  />
                );
              })}
            </div>
          )}

          {/* タグ */}
          {post.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {post.tags.map((t) => (
                <span key={t} className="text-xs font-medium text-blue-600">
                  #{t}
                </span>
              ))}
            </div>
          )}

          {/* リアクション集計 */}
          {post.reactions.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {post.reactions.map((r) => (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => onReact(r.key, r.emoji)}
                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors ${
                    r.reacted
                      ? "border-blue-300 bg-blue-50 text-blue-700"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span>{r.emoji}</span>
                  <span>{r.count}</span>
                </button>
              ))}
            </div>
          )}

          {/* アクションバー */}
          <div className="mt-3 flex items-center gap-1 text-slate-500">
            <ActionButton
              active={post.liked}
              onClick={onLike}
              icon={<HeartIcon filled={post.liked} />}
              label={post.likeCount > 0 ? String(post.likeCount) : "いいね"}
            />
            <ActionButton
              icon={<CommentIcon />}
              onClick={toggleComments}
              label={
                post.commentCount > 0 ? String(post.commentCount) : "コメント"
              }
            />
            <ActionButton
              active={showQuote}
              icon={<RepostIcon />}
              onClick={() => setShowQuote((v) => !v)}
              label={
                post.repostCount > 0 ? String(post.repostCount) : "引用リポスト"
              }
            />
            <div className="relative">
              <ActionButton
                icon={<EmojiIcon />}
                label="リアクション"
                onClick={() => setShowReactionBar((v) => !v)}
              />
              {showReactionBar && (
                <div className="absolute bottom-full left-0 mb-1 flex gap-1 rounded-full border border-slate-200 bg-white p-1 shadow-lg">
                  {REACTION_PALETTE.map((r) => (
                    <button
                      key={r.key}
                      type="button"
                      onClick={() => {
                        onReact(r.key, r.emoji);
                        setShowReactionBar(false);
                      }}
                      className="rounded-full px-1.5 py-0.5 text-lg hover:bg-slate-100"
                    >
                      {r.emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 引用リポスト・コンポーザ */}
          {showQuote && (
            <div className="mt-3 space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <textarea
                value={quoteBody}
                onChange={(e) => setQuoteBody(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                    e.preventDefault();
                    submitQuote();
                  }
                }}
                placeholder="コメントを添えてリポスト..."
                rows={2}
                className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
              {/* 引用元プレビュー */}
              <div className="rounded-lg border border-slate-200 bg-white p-2.5">
                <p className="text-xs font-bold text-slate-600">
                  {post.author}
                </p>
                <p className="mt-0.5 line-clamp-3 text-xs text-slate-500">
                  {post.body || "（本文なし）"}
                </p>
              </div>
              {quoteError && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
                  {quoteError}
                </p>
              )}
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowQuote(false);
                    setQuoteBody("");
                    setQuoteError(null);
                  }}
                  className="rounded-lg px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100"
                >
                  キャンセル
                </button>
                <button
                  type="button"
                  onClick={submitQuote}
                  disabled={!quoteBody.trim() || quoteSubmitting}
                  className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                >
                  {quoteSubmitting ? "リポスト中..." : "引用リポスト"}
                </button>
              </div>
            </div>
          )}

          {/* コメントスレッド */}
          {showComments && (
            <div className="mt-3 space-y-3 border-t border-slate-100 pt-3">
              {commentsLoading ? (
                <p className="text-xs text-slate-400">
                  コメントを読み込み中...
                </p>
              ) : comments.length === 0 ? (
                <p className="text-xs text-slate-400">
                  まだコメントはありません
                </p>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="flex items-start gap-2">
                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-slate-200 text-[11px] font-bold text-slate-600">
                      {c.author.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1 rounded-lg bg-slate-50 px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-xs font-bold text-slate-700">
                          {c.author}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {c.createdAtLabel}
                        </span>
                      </div>
                      <p className="mt-0.5 whitespace-pre-wrap text-sm text-slate-700">
                        {c.body}
                      </p>
                    </div>
                  </div>
                ))
              )}

              {commentError && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
                  {commentError}
                </p>
              )}

              <div className="flex items-end gap-2">
                <textarea
                  value={commentBody}
                  onChange={(e) => setCommentBody(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                      e.preventDefault();
                      submitComment();
                    }
                  }}
                  placeholder="コメントを入力..."
                  rows={1}
                  className="min-h-[38px] w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                />
                <button
                  type="button"
                  onClick={submitComment}
                  disabled={!commentBody.trim() || commentSubmitting}
                  className="shrink-0 rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                >
                  {commentSubmitting ? "送信中..." : "送信"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 画像ライトボックス（タップで全体表示） */}
      {lightboxUrl && (
        <button
          type="button"
          onClick={() => setLightboxUrl(null)}
          className="fixed inset-0 z-50 flex cursor-zoom-out items-center justify-center bg-black/80 p-4"
          aria-label="画像を閉じる"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxUrl}
            alt=""
            className="max-h-full max-w-full rounded-lg object-contain"
          />
          <span className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-xl leading-none text-white">
            ×
          </span>
        </button>
      )}
    </article>
  );
}

// ── 本文中の @表示名 を青ハイライト表示 ──
// メンションした相手の表示名（長い順）で分割し、一致部分を色付けする。
function renderBodyWithMentions(
  body: string,
  mentions: { id: string; name: string }[],
): React.ReactNode {
  if (mentions.length === 0) return body;
  const uniqueNames = Array.from(new Set(mentions.map((m) => m.name))).filter(
    Boolean,
  );
  if (uniqueNames.length === 0) return body;
  const mentionTokens = new Set(uniqueNames.map((n) => `@${n}`));
  const escaped = uniqueNames
    .sort((a, b) => b.length - a.length)
    .map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const re = new RegExp(`(@(?:${escaped.join("|")}))`, "g");
  const parts = body.split(re);
  return parts.map((part, i) =>
    mentionTokens.has(part) ? (
      // biome-ignore lint/suspicious/noArrayIndexKey: 分割結果は順序固定の表示専用
      <span key={i} className="font-medium text-blue-600">
        {part}
      </span>
    ) : (
      part
    ),
  );
}

// ── アンケート表示（未投票=投票UI / 投票済 or 締切=結果バー） ──
function PollView({
  poll,
  onVote,
}: {
  poll: FeedPoll;
  onVote: (optionId: string) => void;
}) {
  const voted = poll.myOptionId !== null;
  const showResults = voted || poll.closed;
  return (
    <div className="mt-2 space-y-1.5">
      {poll.options.map((o) => {
        const pct =
          poll.totalVotes > 0
            ? Math.round((o.voteCount / poll.totalVotes) * 100)
            : 0;
        const mine = poll.myOptionId === o.id;
        if (showResults) {
          return (
            <div
              key={o.id}
              className="relative overflow-hidden rounded-lg border border-slate-200"
            >
              <div
                className={`absolute inset-y-0 left-0 ${
                  mine ? "bg-blue-100" : "bg-slate-100"
                }`}
                style={{ width: `${pct}%` }}
              />
              <div className="relative flex items-center justify-between px-3 py-1.5 text-sm">
                <span
                  className={`truncate ${
                    mine ? "font-bold text-blue-700" : "text-slate-700"
                  }`}
                >
                  {mine && "✓ "}
                  {o.label}
                </span>
                <span className="ml-2 shrink-0 text-xs text-slate-500">
                  {pct}%（{o.voteCount}）
                </span>
              </div>
            </div>
          );
        }
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onVote(o.id)}
            className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-left text-sm text-blue-700 transition-colors hover:border-blue-300 hover:bg-blue-50"
          >
            {o.label}
          </button>
        );
      })}
      <p className="text-[11px] text-slate-400">
        {poll.totalVotes}票
        {poll.closed ? "・締め切りました" : voted ? "・タップで投票変更" : ""}
      </p>
    </div>
  );
}

// ── タイムラインのタブ（すべて / 自分宛て） ──
function FeedTabButton({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
        active
          ? "border-blue-600 text-blue-600"
          : "border-transparent text-slate-500 hover:text-slate-700"
      }`}
    >
      {label}
      {count !== undefined && count > 0 && (
        <span className="ml-1.5 rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-700">
          {count}
        </span>
      )}
    </button>
  );
}

// ── 小物 ────────────────────────────────────────────────────
function TagChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
        active
          ? "bg-slate-800 text-white"
          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
      }`}
    >
      {label}
    </button>
  );
}

function ActionButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs transition-colors hover:bg-slate-100 ${
        active ? "text-red-500" : "text-slate-500"
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function ComposerIconButton({
  icon,
  title,
  onClick,
  disabled,
  active,
}: {
  icon: React.ReactNode;
  title: string;
  onClick?: () => void;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-full p-2 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent ${
        active ? "bg-blue-50 text-blue-600" : ""
      }`}
    >
      {icon}
    </button>
  );
}

// ── アイコン（インラインSVG / ハウススタイル踏襲） ───────────
function RefreshIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
  );
}
function SearchIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );
}
function ImageIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  );
}
function VideoIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
      />
    </svg>
  );
}
function TagIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7 7h.01M7 3h5a2 2 0 011.414.586l7 7a2 2 0 010 2.828l-5 5a2 2 0 01-2.828 0l-7-7A2 2 0 014 9V4a1 1 0 011-1z"
      />
    </svg>
  );
}
function PollIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 19v-6m4 6V5m4 14v-9M5 19h14"
      />
    </svg>
  );
}
function LinkIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13.828 10.172a4 4 0 010 5.656l-3 3a4 4 0 11-5.656-5.656l1.5-1.5m6.656-6.656l1.5-1.5a4 4 0 115.656 5.656l-3 3a4 4 0 01-5.656 0"
      />
    </svg>
  );
}
function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      className="h-4 w-4"
      fill={filled ? "currentColor" : "none"}
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
      />
    </svg>
  );
}
function CommentIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
      />
    </svg>
  );
}
function RepostIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 4v5h5M20 20v-5h-5M4 9a8 8 0 0114-3m2 9a8 8 0 01-14 3"
      />
    </svg>
  );
}
function EmojiIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}
