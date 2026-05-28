"use client";

import { Button } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PostStatusBadge } from "@/components/admin/PostStatusBadge";
import { PostThumbnail } from "@/components/admin/PostThumbnail";
import { PostTypeBadge } from "@/components/admin/PostTypeBadge";
import { PostListCard } from "@/components/common/PostListCard";
import { createClient } from "@/lib/supabase/client";
import type { PostWithRelations } from "@/types/database";

interface MyPostsContentProps {
  /** 編集ページのベースパス。例: "/app/posts" → /app/posts/{id}/edit。未指定時は編集リンクを非表示 */
  editBasePath?: string;
  /** URLの ?success=updated から渡される成功メッセージフラグ */
  successParam?: string;
}

export function MyPostsContent({ editBasePath, successParam }: MyPostsContentProps) {
  const router = useRouter();
  const [posts, setPosts] = useState<PostWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState<string | null>(
    successParam === "updated" ? "更新しました" : null,
  );

  useEffect(() => {
    const fetchPosts = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      const { data } = await supabase
        .from("posts")
        .select(
          "*, companies(id, name), users:created_by_user_id(id, display_name, email)",
        )
        .eq("created_by_user_id", user.id)
        .order("updated_at", { ascending: false });

      setPosts((data as PostWithRelations[]) ?? []);
      setIsLoading(false);
    };

    fetchPosts();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {["s1", "s2", "s3", "s4", "s5"].map((k) => (
          <div key={k} className="bg-white rounded-lg h-16 animate-pulse" />
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-16 text-default-400">
        <div className="text-5xl mb-3 select-none">📝</div>
        <p className="text-sm">まだ投稿がありません</p>
      </div>
    );
  }

  return (
    <div>
      {successMessage && (
        <div className="mb-4 flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2.5">
          <p className="text-sm text-emerald-700 font-medium">✓ {successMessage}</p>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-500 hover:text-emerald-700 text-xl leading-none ml-4"
            aria-label="閉じる"
          >
            ×
          </button>
        </div>
      )}

      {/* PC テーブル (lg 以上) */}
      <div className="hidden lg:block bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm table-fixed">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="text-left px-3 py-3 text-xs font-medium text-default-500 w-14">
                サムネ
              </th>
              <th className="text-left px-3 py-3 text-xs font-medium text-default-500">
                タイトル
              </th>
              <th className="text-left px-2 py-3 text-xs font-medium text-default-500 w-20">
                種別
              </th>
              <th className="text-left px-2 py-3 text-xs font-medium text-default-500 w-24">
                ステータス
              </th>
              <th className="text-left px-2 py-3 text-xs font-medium text-default-500 w-24">
                更新日
              </th>
              {editBasePath && (
                <th className="text-center px-2 py-3 text-xs font-medium text-default-500 w-16">
                  操作
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr
                key={post.id}
                className="border-b last:border-0 hover:bg-slate-50 transition-colors border-slate-100"
              >
                <td className="px-3 py-3 align-middle">
                  <PostThumbnail
                    thumbnailUrl={post.thumbnail_url}
                    title={post.title}
                    type={post.post_type}
                    size="sm"
                  />
                </td>
                <td className="px-3 py-3 align-middle">
                  <span className="font-medium text-default-800 line-clamp-2">
                    {post.title}
                  </span>
                  <p className="text-xs text-default-400 mt-0.5">
                    {post.companies?.name ?? "未設定"}
                  </p>
                </td>
                <td className="px-2 py-3 align-middle">
                  <PostTypeBadge type={post.post_type} />
                </td>
                <td className="px-2 py-3 align-middle">
                  <PostStatusBadge status={post.post_status} />
                </td>
                <td className="px-2 py-3 align-middle text-xs text-default-400 whitespace-nowrap">
                  {new Date(post.updated_at).toLocaleDateString("ja-JP")}
                </td>
                {editBasePath && (
                  <td className="px-2 py-3 align-middle text-center">
                    <Button
                      size="sm"
                      variant="ghost"
                      onPress={() =>
                        router.push(`${editBasePath}/${post.id}/edit`)
                      }
                      className="whitespace-nowrap"
                    >
                      編集
                    </Button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* モバイル / タブレット カード (lg 未満) */}
      <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-3">
        {posts.map((post) => (
          <PostListCard
            key={post.id}
            title={post.title}
            post_type={post.post_type}
            post_status={post.post_status}
            thumbnail_url={post.thumbnail_url}
            metaItems={[
              {
                label: "更新日",
                value: new Date(post.updated_at).toLocaleDateString("ja-JP"),
              },
            ]}
            actions={
              editBasePath ? (
                <button
                  type="button"
                  onClick={() =>
                    router.push(`${editBasePath}/${post.id}/edit`)
                  }
                  className="flex-1 text-center px-4 rounded-lg text-sm font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors min-h-[44px]"
                >
                  編集
                </button>
              ) : undefined
            }
          />
        ))}
      </div>
    </div>
  );
}
