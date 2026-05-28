"use client";

import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  Input,
  useDisclosure,
} from "@heroui/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { PostDetailPane } from "@/components/features/PostDetailPane";
import { PostListItem } from "@/components/features/PostListItem";
import { AppButton } from "@/components/ui/AppButton";
import { createClient } from "@/lib/supabase/client";
import type {
  ApplicationType,
  PostType,
  PostWithRelations,
} from "@/types/database";

type TabType = "ALL" | PostType;

const TABS: { key: TabType; label: string }[] = [
  { key: "ALL", label: "すべて" },
  { key: "OFFICIAL", label: "公式案件" },
  { key: "CASUAL", label: "気軽に投稿" },
];

interface PostsPageClientProps {
  newPostHref?: string;
  initialTab?: TabType;
}

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

function PlusIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      viewBox="0 0 24 24"
    >
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

export function PostsPageClient({
  newPostHref,
  initialTab = "ALL",
}: PostsPageClientProps) {
  const searchParams = useSearchParams();
  const { isOpen: isDrawerOpen, onOpen: openDrawer, onClose: closeDrawer } =
    useDisclosure();

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
  const [applicationsByPostId, setApplicationsByPostId] = useState<
    Map<string, Set<ApplicationType>>
  >(new Map());

  const initialPostId = useRef(searchParams.get("post"));
  useEffect(() => {
    if (initialPostId.current) {
      openDrawer();
    }
  }, [openDrawer]);

  useEffect(() => {
    const fetchPosts = async () => {
      setIsLoading(true);
      const supabase = createClient();

      let query = supabase
        .from("posts")
        .select(
          "*, companies(id, name), users:created_by_user_id(id, display_name, email)",
        )
        .in("post_status", ["OPEN", "IN_PROGRESS"])
        .order("created_at", { ascending: false });

      if (tab !== "ALL") {
        query = query.eq("post_type", tab);
      }
      if (search.trim()) {
        query = query.or(
          `title.ilike.%${search.trim()}%,body.ilike.%${search.trim()}%,requirements.ilike.%${search.trim()}%`,
        );
      }

      const { data } = await query;
      const newPosts = (data as PostWithRelations[]) ?? [];
      setPosts(newPosts);

      setSelectedPostId((prev) => {
        if (prev && newPosts.some((p) => p.id === prev)) return prev;
        return null;
      });

      setIsLoading(false);

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
    const fetchSingle = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("posts")
        .select(
          "*, companies(id, name), users:created_by_user_id(id, display_name, email)",
        )
        .eq("id", selectedPostId)
        .single();
      setSelectedPost((data as PostWithRelations) ?? null);
    };
    fetchSingle();
  }, [selectedPostId, posts]);

  const handleSelectPost = useCallback(
    (post: PostWithRelations) => {
      setSelectedPostId(post.id);
      openDrawer();
      const url = new URL(window.location.href);
      url.searchParams.set("post", post.id);
      window.history.pushState({}, "", url.toString());
    },
    [openDrawer],
  );

  const handleCloseDrawer = useCallback(() => {
    closeDrawer();
    setSelectedPostId(null);
    setSelectedPost(null);
    const url = new URL(window.location.href);
    url.searchParams.delete("post");
    window.history.pushState({}, "", url.toString());
  }, [closeDrawer]);

  const handleTabChange = (newTab: TabType) => {
    setTab(newTab);
  };

  const handleClearSearch = () => {
    setSearch("");
    setTab("ALL");
  };

  const hasActiveFilter = search.trim() !== "" || tab !== "ALL";

  return (
    <>
      {/* ============================================================
          コンテナ: デスクトップは固定高さ内スクロール、モバイルは自然スクロール
      ============================================================ */}
      <div className="flex flex-col max-w-[1400px] mx-auto w-full md:h-[calc(100vh-6rem)] md:overflow-hidden">

        {/* ============================================================
            検索・フィルターバー
        ============================================================ */}
        <div className="shrink-0 border-b border-default-200/60 pb-3 mb-2">
          {/* 1行目: タイトル + 検索 (デスクトップ) / タイトルのみ (モバイル) */}
          <div className="flex items-center gap-2 mb-2">
            <div className="shrink-0">
              <h1 className="text-sm font-bold text-default-800 leading-tight">案件一覧</h1>
              <p className="text-[11px] text-default-400">
                {isLoading ? "読み込み中..." : `${posts.length}件`}
              </p>
            </div>

            {/* デスクトップ: 区切り + 検索バー */}
            <div className="w-px h-6 bg-default-200 shrink-0 hidden md:block" />
            <div className="hidden md:block flex-1 min-w-[140px] max-w-[260px]">
              <Input
                placeholder="キーワード検索..."
                value={search}
                onValueChange={setSearch}
                size="sm"
                variant="bordered"
                isClearable
                onClear={() => setSearch("")}
                startContent={<SearchIcon />}
                classNames={{ inputWrapper: "bg-white h-8", input: "text-xs" }}
              />
            </div>

            {/* 新規投稿ボタン: デスクトップのみ右端 */}
            {newPostHref && (
              <div className="ml-auto hidden md:block">
                <AppButton as={Link} href={newPostHref} className="shrink-0" startContent={<PlusIcon />}>
                  気軽に投稿
                </AppButton>
              </div>
            )}
          </div>

          {/* モバイル: 検索バー (全幅) */}
          <div className="md:hidden mb-2">
            <Input
              placeholder="キーワード検索..."
              value={search}
              onValueChange={setSearch}
              size="sm"
              variant="bordered"
              isClearable
              onClear={() => setSearch("")}
              startContent={<SearchIcon />}
              classNames={{ inputWrapper: "bg-white h-10", input: "text-sm" }}
            />
          </div>

          {/* タブフィルター: モバイルは横スクロール */}
          <div className="flex items-center gap-2">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide flex-1 pb-0.5">
              {TABS.map((t) => (
                <button
                  type="button"
                  key={t.key}
                  onClick={() => handleTabChange(t.key)}
                  className={`shrink-0 px-3 py-2 rounded-full text-xs font-medium transition-all min-h-[36px] ${
                    tab === t.key
                      ? "bg-primary text-white shadow-sm"
                      : "bg-white border border-default-200 text-default-600 hover:bg-default-50 hover:border-default-300"
                  }`}
                >
                  {t.label}
                </button>
              ))}
              {hasActiveFilter && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="shrink-0 px-3 py-2 rounded-full text-xs font-medium transition-all min-h-[36px] bg-white border border-default-200 text-default-500 hover:bg-default-50"
                >
                  クリア
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ============================================================
            案件グリッド: デスクトップは内部スクロール、モバイルは自然スクロール
        ============================================================ */}
        <div className="md:flex-1 md:overflow-y-auto pt-2">
          <div className="pb-24 md:pb-6">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {["sk-a", "sk-b", "sk-c", "sk-d", "sk-e", "sk-f"].map((key) => (
                  <div
                    key={key}
                    className="bg-white rounded-xl animate-pulse border border-default-100"
                    style={{ height: "220px" }}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
      </div>

      {/* ============================================================
          フローティング投稿ボタン (モバイルのみ)
      ============================================================ */}
      {newPostHref && (
        <Link
          href={newPostHref}
          className="fixed bottom-6 right-4 z-30 md:hidden w-14 h-14 bg-primary text-white rounded-full shadow-lg flex items-center justify-center hover:bg-primary/90 active:scale-95 transition-transform"
          aria-label="気軽に投稿"
        >
          <PlusIcon />
        </Link>
      )}

      {/* ============================================================
          案件詳細ドロワー (右からスライド)
      ============================================================ */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        placement="right"
        size="lg"
        backdrop="opaque"
        scrollBehavior="inside"
        classNames={{
          closeButton:
            "right-4 top-4 h-8 w-8 min-w-8 rounded-full text-default-400 hover:text-default-700 hover:bg-default-100",
        }}
      >
        <DrawerContent>
          {() => (
            <>
              <DrawerHeader className="flex items-center border-b border-default-100 pb-3 pr-14">
                <span className="text-base font-bold text-default-900">案件詳細</span>
              </DrawerHeader>
              <DrawerBody className="p-0">
                {selectedPost ? (
                  <PostDetailPane
                    post={selectedPost}
                    onApplicationSuccess={handleApplicationSuccess}
                  />
                ) : (
                  <div className="flex items-center justify-center h-48 text-default-400">
                    <p className="text-sm">読み込み中...</p>
                  </div>
                )}
              </DrawerBody>
            </>
          )}
        </DrawerContent>
      </Drawer>
    </>
  );
}
