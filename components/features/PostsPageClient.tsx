"use client";

import { Button, Input } from "@heroui/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { PostDetailPane } from "@/components/features/PostDetailPane";
import { PostListItem } from "@/components/features/PostListItem";
import { createClient } from "@/lib/supabase/client";
import type {
  ApplicationType,
  PostType,
  PostWithRelations,
} from "@/types/database";

type TabType = "ALL" | PostType;

const TABS: { key: TabType; label: string; color: string }[] = [
  { key: "ALL", label: "すべて", color: "bg-default-300" },
  { key: "OFFICIAL", label: "公式案件", color: "bg-blue-500" },
  { key: "CASUAL", label: "気軽に投稿", color: "bg-emerald-500" },
];

interface PostsPageClientProps {
  /** 新規投稿ボタンのリンク先。省略時はボタン非表示 */
  newPostHref?: string;
  /** 初期タブ。省略時は "ALL" */
  initialTab?: TabType;
}

// SearchIcon component
function SearchIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="text-default-400 shrink-0"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

// FilterIcon component
function FilterIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="text-default-500 shrink-0"
    >
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}

// CheckIcon component
function CheckIcon() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export function PostsPageClient({
  newPostHref,
  initialTab = "ALL",
}: PostsPageClientProps) {
  const searchParams = useSearchParams();

  const [posts, setPosts] = useState<PostWithRelations[]>([]);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<TabType>(initialTab);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(
    searchParams.get("post"),
  );
  const [selectedPost, setSelectedPost] = useState<PostWithRelations | null>(
    null,
  );
  const [isMobileDetail, setIsMobileDetail] = useState(
    !!searchParams.get("post"),
  );
  const [applicationsByPostId, setApplicationsByPostId] = useState<
    Map<string, Set<ApplicationType>>
  >(new Map());

  // Fetch posts list
  useEffect(() => {
    const fetchPosts = async () => {
      setIsLoading(true);
      const supabase = createClient();

      let query = supabase
        .from("posts")
        .select(
          "*, companies(id, name), users:created_by_user_id(id, display_name, email)",
        )
        .eq("post_status", "PUBLISHED")
        .order("created_at", { ascending: false });

      if (tab !== "ALL") {
        query = query.eq("post_type", tab);
      }
      if (search.trim()) {
        query = query.or(
          `title.ilike.%${search.trim()}%,body.ilike.%${search.trim()}%`,
        );
      }

      const { data } = await query;
      const newPosts = (data as PostWithRelations[]) ?? [];
      setPosts(newPosts);

      // 現在の選択が新しい一覧にあれば維持、なければ先頭を選択
      setSelectedPostId((prev) => {
        if (prev && newPosts.some((p) => p.id === prev)) return prev;
        return newPosts[0]?.id ?? null;
      });

      setIsLoading(false);

      // 現在ユーザーの応募状態を取得してカードに反映
      const postIds = newPosts.map((p) => p.id);
      if (postIds.length === 0) return;
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data: apps } = await supabase
        .from("applications")
        .select("post_id, application_type")
        .eq("applicant_user_id", user.id)
        .in("post_id", postIds);
      if (apps) {
        const map = new Map<string, Set<ApplicationType>>();
        for (const app of apps) {
          if (!map.has(app.post_id)) map.set(app.post_id, new Set());
          map.get(app.post_id)?.add(app.application_type as ApplicationType);
        }
        setApplicationsByPostId(map);
      }
    };

    const debounce = setTimeout(fetchPosts, 300);
    return () => clearTimeout(debounce);
  }, [search, tab]);

  const handleApplicationSuccess = useCallback(
    (postId: string, type: ApplicationType) => {
      setApplicationsByPostId((prev) => {
        const next = new Map(prev);
        if (!next.has(postId)) next.set(postId, new Set());
        next.get(postId)?.add(type);
        return next;
      });
    },
    [],
  );

  // Resolve selectedPost from list or fetch individually
  useEffect(() => {
    if (!selectedPostId) {
      setSelectedPost(null);
      return;
    }
    const found = posts.find((p) => p.id === selectedPostId);
    if (found) {
      setSelectedPost(found);
      return;
    }
    // Not in current list (e.g. loaded from URL param) — fetch directly
    const fetchSingle = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("posts")
        .select(
          "*, companies(id, name), users:created_by_user_id(id, display_name, email)",
        )
        .eq("id", selectedPostId)
        .eq("post_status", "PUBLISHED")
        .single();
      setSelectedPost((data as PostWithRelations) ?? null);
    };
    fetchSingle();
  }, [selectedPostId, posts]);

  const handleSelectPost = useCallback((post: PostWithRelations) => {
    setSelectedPostId(post.id);
    setIsMobileDetail(true);
    const url = new URL(window.location.href);
    url.searchParams.set("post", post.id);
    window.history.pushState({}, "", url.toString());
  }, []);

  const handleBackToList = useCallback(() => {
    setIsMobileDetail(false);
    setSelectedPostId(null);
    setSelectedPost(null);
    const url = new URL(window.location.href);
    url.searchParams.delete("post");
    window.history.pushState({}, "", url.toString());
  }, []);

  const handleTabChange = (newTab: TabType) => {
    setTab(newTab);
  };

  const handleClearSearch = () => {
    setSearch("");
    setTab("ALL");
  };

  const hasActiveFilter = search.trim() !== "" || tab !== "ALL";

  return (
    <div className="flex gap-0 h-[calc(100vh-6rem)] overflow-hidden">
      {/* ============================================================
          左カラム: 検索条件エリア (27%)
      ============================================================ */}
      <div className="hidden lg:block w-[27%] min-w-[180px] shrink-0 pr-4 overflow-y-auto h-full">
        <div className="bg-white rounded-xl border border-default-100 shadow-sm p-4">
          {/* ヘッダー */}
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-default-100">
            <FilterIcon />
            <h2 className="text-sm font-bold text-default-700">検索条件</h2>
            {hasActiveFilter && (
              <span className="ml-auto w-2 h-2 rounded-full bg-primary shrink-0" />
            )}
          </div>

          {/* キーワード */}
          <div className="mb-5">
            <p className="text-[11px] font-semibold text-default-400 uppercase tracking-wider mb-2">
              キーワード
            </p>
            <Input
              placeholder="タイトル・本文で検索"
              value={search}
              onValueChange={setSearch}
              size="sm"
              variant="bordered"
              isClearable
              onClear={() => setSearch("")}
              startContent={<SearchIcon />}
            />
          </div>

          {/* 種別 */}
          <div className="mb-5">
            <p className="text-[11px] font-semibold text-default-400 uppercase tracking-wider mb-2">
              種別
            </p>
            <div className="flex flex-col gap-1">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => handleTabChange(t.key)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-left transition-all ${
                    tab === t.key
                      ? "bg-primary-50 text-primary-700 border border-primary-200"
                      : "text-default-600 hover:bg-default-50 border border-transparent"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${t.color}`}
                  />
                  <span className="flex-1">{t.label}</span>
                  {tab === t.key && <CheckIcon />}
                </button>
              ))}
            </div>
          </div>

          {/* クリアボタン */}
          <Button
            variant="flat"
            size="sm"
            className="w-full text-default-500"
            onPress={handleClearSearch}
            isDisabled={!hasActiveFilter}
          >
            条件をクリア
          </Button>
        </div>
      </div>

      {/* ============================================================
          中央カラム: 案件一覧エリア (36%)
      ============================================================ */}
      <div
        className={`
          shrink-0 flex flex-col
          h-full overflow-y-auto
          w-full lg:w-[36%]
          border-x border-default-100 px-4
          ${isMobileDetail ? "hidden lg:flex" : "flex"}
        `}
      >
        {/* カラムヘッダー */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <h1 className="text-base font-bold text-default-900">案件一覧</h1>
            <p className="text-xs text-default-400 mt-0.5">
              {isLoading ? "読み込み中..." : `${posts.length}件`}
            </p>
          </div>
          {newPostHref && (
            <Button
              as={Link}
              href={newPostHref}
              color="primary"
              size="sm"
              className="shrink-0"
            >
              + 気軽に投稿
            </Button>
          )}
        </div>

        {/* モバイル用: 検索 + タブ */}
        <div className="lg:hidden mb-3 space-y-2">
          <Input
            placeholder="検索..."
            value={search}
            onValueChange={setSearch}
            size="sm"
            isClearable
            onClear={() => setSearch("")}
            startContent={<SearchIcon />}
          />
          <div className="flex gap-1 border-b border-default-100">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => handleTabChange(t.key)}
                className={`px-3 py-1.5 text-xs font-medium border-b-2 transition-colors ${
                  tab === t.key
                    ? "border-primary text-primary"
                    : "border-transparent text-default-500 hover:text-default-800"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* 案件リスト: 2カラムグリッド */}
        <div className="pb-6">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl animate-pulse border border-default-100"
                  style={{ minHeight: "320px" }}
                />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16 text-default-400">
              <div className="text-4xl mb-3 select-none">🔍</div>
              <p className="text-sm">案件が見つかりませんでした</p>
              {search && (
                <p className="text-xs mt-1">キーワードを変えてみてください</p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {posts.map((post) => (
                <PostListItem
                  key={post.id}
                  post={post}
                  isSelected={post.id === selectedPostId}
                  onClick={() => handleSelectPost(post)}
                  appliedTypes={applicationsByPostId.get(post.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ============================================================
          右カラム: 案件詳細エリア (37%)
      ============================================================ */}
      <div
        className={`
          flex-1 min-w-0 pl-4 pb-6
          h-full overflow-y-auto
          ${isMobileDetail ? "block" : "hidden lg:block"}
        `}
      >
        {/* モバイル: 一覧に戻るボタン */}
        {isMobileDetail && (
          <Button
            variant="flat"
            size="sm"
            onPress={handleBackToList}
            className="mb-4 lg:hidden"
          >
            ← 一覧に戻る
          </Button>
        )}

        {selectedPost ? (
          <PostDetailPane
            post={selectedPost}
            onApplicationSuccess={handleApplicationSuccess}
          />
        ) : (
          <div className="hidden lg:flex items-center justify-center h-64 bg-white rounded-xl border border-default-100 text-default-400">
            <div className="text-center">
              <div className="text-5xl mb-3 select-none">📋</div>
              <p className="text-sm">左の一覧から案件を選択してください</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
