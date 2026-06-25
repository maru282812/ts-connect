"use client";

import { useMemo, useState } from "react";

// ============================================================
// 社内SNS（コミュニティ）Phase1 タイムライン静的スクリーン
// 設計: docs/design/community_sns_design.md
// ※ 現行ハウススタイル（Ideas/Issues/Rewards）に合わせたモックデータ実装。
//   DB/API 配線は次イテレーション（/api/community/*）で差し替える。
// ============================================================

type Visibility = "COMPANY" | "DEPARTMENT" | "PRIVATE";
type MediaType = "IMAGE" | "VIDEO";

interface Reaction {
  key: string;
  emoji: string;
  count: number;
  reacted: boolean;
}

interface Attachment {
  id: string;
  type: MediaType;
  url: string;
}

interface CommunityPost {
  id: string;
  author: string;
  department: string;
  body: string;
  visibility: Visibility;
  tags: string[];
  createdAtLabel: string;
  liked: boolean;
  likeCount: number;
  commentCount: number;
  repostCount: number;
  reactions: Reaction[];
  attachments: Attachment[];
  // 引用リポストの場合、引用元
  quoteOf?: { author: string; body: string };
  // 広報取込（社外発信の再投稿）
  sourceUrl?: string;
}

const VISIBILITY_META: Record<Visibility, { label: string; badge: string }> = {
  COMPANY: { label: "全社", badge: "bg-blue-100 text-blue-700" },
  DEPARTMENT: { label: "部署", badge: "bg-amber-100 text-amber-700" },
  PRIVATE: { label: "自分のみ", badge: "bg-slate-200 text-slate-600" },
};

const REACTION_PALETTE: { key: string; emoji: string }[] = [
  { key: "THANKS", emoji: "🙏" },
  { key: "CLAP", emoji: "👏" },
  { key: "PARTY", emoji: "🎉" },
  { key: "EYES", emoji: "👀" },
];

const INITIAL_POSTS: CommunityPost[] = [
  {
    id: "c-01",
    author: "田中 美咲",
    department: "DX推進本部",
    body: "新しい社内ナレッジベースのβ版を公開しました！検索性が大幅に改善されています。フィードバックお待ちしています 🙌",
    visibility: "COMPANY",
    tags: ["#お知らせ", "#DX"],
    createdAtLabel: "5分前",
    liked: false,
    likeCount: 12,
    commentCount: 3,
    repostCount: 2,
    reactions: [{ key: "PARTY", emoji: "🎉", count: 4, reacted: false }],
    attachments: [{ id: "c-01-att-1", type: "IMAGE", url: "" }],
  },
  {
    id: "c-02",
    author: "広報 公式",
    department: "広報部",
    body: "【プレスリリース】当社の新サービスがメディアに掲載されました。社外SNSでも発信済みです。ぜひ社内でもシェアしてください！",
    visibility: "COMPANY",
    tags: ["#広報", "#プレスリリース"],
    createdAtLabel: "1時間前",
    liked: true,
    likeCount: 48,
    commentCount: 6,
    repostCount: 15,
    reactions: [
      { key: "CLAP", emoji: "👏", count: 22, reacted: true },
      { key: "PARTY", emoji: "🎉", count: 9, reacted: false },
    ],
    attachments: [],
    sourceUrl: "https://x.com/example/status/123",
  },
  {
    id: "c-03",
    author: "佐藤 健一",
    department: "開発部",
    body: "リファクタ完了、デプロイ問題なし。お疲れさまでした！",
    visibility: "DEPARTMENT",
    tags: ["#開発"],
    createdAtLabel: "3時間前",
    liked: false,
    likeCount: 7,
    commentCount: 1,
    repostCount: 0,
    reactions: [],
    attachments: [],
    quoteOf: {
      author: "山田 花子",
      body: "本番リリースのスケジュール、今週金曜で確定しました。",
    },
  },
];

// 「更新」ボタンで先頭に差し込む新着のモック
const NEW_POSTS_QUEUE: CommunityPost[] = [
  {
    id: "c-new-1",
    author: "鈴木 一郎",
    department: "営業推進部",
    body: "（更新ボタンで取得した新着）今期の表彰式、来週開催です！皆さんぜひご参加を。",
    visibility: "COMPANY",
    tags: ["#イベント"],
    createdAtLabel: "たった今",
    liked: false,
    likeCount: 0,
    commentCount: 0,
    repostCount: 0,
    reactions: [],
    attachments: [],
  },
];

export function CommunityFeedClient() {
  const [posts, setPosts] = useState<CommunityPost[]>(INITIAL_POSTS);
  const [queue, setQueue] = useState<CommunityPost[]>(NEW_POSTS_QUEUE);
  const [composeBody, setComposeBody] = useState("");
  const [composeVisibility, setComposeVisibility] =
    useState<Visibility>("COMPANY");
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [showImporter, setShowImporter] = useState(false);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const p of posts) for (const t of p.tags) set.add(t);
    return Array.from(set);
  }, [posts]);

  const filtered = useMemo(() => {
    return posts.filter((p) => {
      if (activeTag && !p.tags.includes(activeTag)) return false;
      if (query && !`${p.body} ${p.tags.join(" ")} ${p.author}`.includes(query))
        return false;
      return true;
    });
  }, [posts, activeTag, query]);

  // 「更新」: キューにある新着を先頭に差し込む（差分取得のモック）
  const handleRefresh = () => {
    if (queue.length === 0) return;
    setPosts((prev) => [...queue, ...prev]);
    setQueue([]);
  };

  const handlePost = () => {
    const body = composeBody.trim();
    if (!body) return;
    const newPost: CommunityPost = {
      id: `c-local-${Date.now()}`,
      author: "あなた",
      department: "自分の部署",
      body,
      visibility: composeVisibility,
      tags: [],
      createdAtLabel: "たった今",
      liked: false,
      likeCount: 0,
      commentCount: 0,
      repostCount: 0,
      reactions: [],
      attachments: [],
    };
    setPosts((prev) => [newPost, ...prev]);
    setComposeBody("");
  };

  const toggleLike = (id: string) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              liked: !p.liked,
              likeCount: p.likeCount + (p.liked ? -1 : 1),
            }
          : p,
      ),
    );
  };

  const toggleReaction = (postId: string, key: string, emoji: string) => {
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
  };

  return (
    <div className="mx-auto w-full max-w-2xl p-4 md:p-8">
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
            onClick={handleRefresh}
            className="relative inline-flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700"
          >
            <RefreshIcon />
            更新
            {queue.length > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {queue.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 新着通知バー */}
      {queue.length > 0 && (
        <button
          type="button"
          onClick={handleRefresh}
          className="mb-4 w-full rounded-lg border border-blue-200 bg-blue-50 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100"
        >
          新着 {queue.length} 件を表示
        </button>
      )}

      {/* コンポーザ */}
      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <textarea
          value={composeBody}
          onChange={(e) => setComposeBody(e.target.value)}
          placeholder="いまどうしてる？ 社内に共有しよう"
          rows={3}
          className="w-full resize-none rounded-lg border border-slate-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
        />
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-1 text-slate-400">
            <ComposerIconButton title="画像" icon={<ImageIcon />} />
            <ComposerIconButton title="動画" icon={<VideoIcon />} />
            <ComposerIconButton title="タグ" icon={<TagIcon />} />
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
              disabled={!composeBody.trim()}
              className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              投稿
            </button>
          </div>
        </div>

        {/* 広報：社外SNS取り込みパネル */}
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
        {filtered.length === 0 && (
          <p className="py-12 text-center text-sm text-slate-400">
            投稿がありません
          </p>
        )}
        {filtered.map((p) => (
          <PostCard
            key={p.id}
            post={p}
            onLike={() => toggleLike(p.id)}
            onReact={(key, emoji) => toggleReaction(p.id, key, emoji)}
          />
        ))}
      </div>
    </div>
  );
}

// ── 投稿カード ──────────────────────────────────────────────
function PostCard({
  post,
  onLike,
  onReact,
}: {
  post: CommunityPost;
  onLike: () => void;
  onReact: (key: string, emoji: string) => void;
}) {
  const [showReactionBar, setShowReactionBar] = useState(false);
  const vis = VISIBILITY_META[post.visibility];

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-slate-200 text-sm font-bold text-slate-600">
          {post.author.charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-bold text-slate-900">
              {post.author}
            </span>
            <span className="truncate text-xs text-slate-400">
              {post.department}
            </span>
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

          <p className="mt-1 whitespace-pre-wrap text-sm text-slate-800">
            {post.body}
          </p>

          {post.sourceUrl && (
            <a
              href={post.sourceUrl}
              className="mt-1 inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
            >
              <LinkIcon /> 社外SNSの元投稿
            </a>
          )}

          {/* 引用リポスト */}
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
            <div className="mt-2 grid grid-cols-2 gap-2">
              {post.attachments.map((a) => (
                <div
                  key={a.id}
                  className="flex aspect-video items-center justify-center rounded-lg bg-slate-100 text-slate-400"
                >
                  {a.type === "VIDEO" ? <VideoIcon /> : <ImageIcon />}
                </div>
              ))}
            </div>
          )}

          {/* タグ */}
          {post.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {post.tags.map((t) => (
                <span key={t} className="text-xs font-medium text-blue-600">
                  {t}
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
              label={
                post.commentCount > 0 ? String(post.commentCount) : "コメント"
              }
            />
            <ActionButton
              icon={<RepostIcon />}
              label={
                post.repostCount > 0 ? String(post.repostCount) : "リポスト"
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
        </div>
      </div>
    </article>
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
}: {
  icon: React.ReactNode;
  title: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="rounded-full p-2 transition-colors hover:bg-slate-100 hover:text-slate-600"
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
