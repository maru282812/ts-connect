"use client";

import { Button } from "@heroui/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { PostStatusBadge } from "@/components/admin/PostStatusBadge";
import { PageHeader } from "@/components/common/PageHeader";
import { PostCard } from "@/components/common/PostCard";
import { SearchBar } from "@/components/common/SearchBar";
import { createClient } from "@/lib/supabase/client";
import type { PostWithRelations } from "@/types/database";

interface CasualPostsListProps {
  mode: "user" | "admin";
  /** 詳細ページのベースパス */
  postDetailBasePath?: string;
  /** 新規投稿ページのパス */
  newPostPath?: string;
  /** 投稿成功時のメッセージ表示（URLパラメータ経由で渡す） */
  successParam?: string;
}

export function CasualPostsList({
  mode,
  postDetailBasePath,
  newPostPath,
  successParam,
}: CasualPostsListProps) {
  const resolvedDetailPath =
    postDetailBasePath ??
    (mode === "admin" ? "/app/casual-posts" : "/app/casual-posts");
  const resolvedNewPath =
    newPostPath ??
    (mode === "admin" ? "/company/casual-posts/new" : "/app/casual-posts/new");

  const [posts, setPosts] = useState<PostWithRelations[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(!!successParam);

  useEffect(() => {
    const fetchPosts = async () => {
      setIsLoading(true);
      const supabase = createClient();

      let query = supabase
        .from("posts")
        .select(
          "*, companies(id, name), users:created_by_user_id(id, display_name, email)",
        )
        .eq("post_type", "CASUAL")
        .order("created_at", { ascending: false });

      // userモードはOPEN/IN_PROGRESSを表示（RLSポリシーと同期）
      if (mode === "user") {
        query = query.in("post_status", ["OPEN", "IN_PROGRESS"]);
      }

      if (search.trim()) {
        query = query.or(
          `title.ilike.%${search.trim()}%,body.ilike.%${search.trim()}%`,
        );
      }

      const { data } = await query;
      setPosts((data as PostWithRelations[]) ?? []);
      setIsLoading(false);
    };

    const debounce = setTimeout(fetchPosts, 300);
    return () => clearTimeout(debounce);
  }, [search, mode]);

  const successMessage =
    successParam === "updated" ? "投稿を更新しました" : "投稿しました";

  return (
    <div>
      <PageHeader
        title="気軽に投稿"
        description="ユーザーが気軽に投稿・共有するコーナー"
        actions={
          <Button as={Link} href={resolvedNewPath} color="primary" size="sm">
            + 新規作成
          </Button>
        }
      />

      {showSuccess && (
        <div className="mb-4 flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">
          <p className="text-sm text-emerald-700 font-medium">
            ✓ {successMessage}
          </p>
          <button
            type="button"
            onClick={() => setShowSuccess(false)}
            className="text-emerald-500 hover:text-emerald-700 text-xl leading-none ml-4"
            aria-label="閉じる"
          >
            ×
          </button>
        </div>
      )}

      <div className="mb-6">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="タイトル・本文で検索"
        />
      </div>

      {isLoading ? (
        <div
          className={
            mode === "admin"
              ? "flex flex-col gap-2"
              : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          }
        >
          {Array.from({ length: 6 }).map((_, i) => (
            // eslint-disable-next-line react/no-array-index-key
            <div key={i} className="bg-white rounded-xl h-12 animate-pulse" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 text-default-400">
          <p className="text-lg">投稿が見つかりませんでした</p>
          <Button
            as={Link}
            href={resolvedNewPath}
            color="primary"
            variant="flat"
            className="mt-4"
          >
            最初の投稿を作成する
          </Button>
        </div>
      ) : mode === "user" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              href={`${resolvedDetailPath}/${post.id}`}
            />
          ))}
        </div>
      ) : (
        // adminモード: テーブル表示
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-4 py-3 text-xs font-medium text-default-500">
                  タイトル
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-default-500 w-32">
                  投稿者
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-default-500 w-28">
                  作成日
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-default-500 w-24">
                  ステータス
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-default-500 w-32">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr
                  key={post.id}
                  className="border-b last:border-0 hover:bg-slate-50 transition-colors border-slate-100"
                >
                  <td className="px-4 py-3">
                    <span className="font-medium text-default-800 line-clamp-2 max-w-xs">
                      {post.title}
                    </span>
                    <p className="text-xs text-default-400 mt-0.5">
                      {post.companies?.name ?? "未設定"}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-xs text-default-500">
                    {post.users?.display_name ?? "匿名"}
                  </td>
                  <td className="px-4 py-3 text-xs text-default-400">
                    {new Date(post.created_at).toLocaleDateString("ja-JP")}
                  </td>
                  <td className="px-4 py-3">
                    <PostStatusBadge status={post.post_status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`${resolvedDetailPath}/${post.id}`}
                        className="text-xs text-primary hover:underline"
                      >
                        詳細
                      </Link>
                      <span className="text-slate-200">|</span>
                      <Link
                        href={`/company/posts/${post.id}/edit`}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        編集
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
