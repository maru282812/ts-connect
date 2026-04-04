"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PostStatusBadge } from "@/components/admin/PostStatusBadge";
import { PostTypeBadge } from "@/components/admin/PostTypeBadge";
import { createClient } from "@/lib/supabase/client";
import type { PostWithRelations } from "@/types/database";

interface MyPostsContentProps {
  /** 編集ページのベースパス。例: "/company/posts" → /company/posts/{id}/edit。未指定時は編集リンクを非表示 */
  editBasePath?: string;
}

export function MyPostsContent({ editBasePath }: MyPostsContentProps) {
  const [posts, setPosts] = useState<PostWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg h-16 animate-pulse" />
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
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50">
            <th className="text-left px-4 py-3 text-xs font-medium text-default-500">
              タイトル
            </th>
            <th className="text-left px-4 py-3 text-xs font-medium text-default-500 w-20">
              種別
            </th>
            <th className="text-left px-4 py-3 text-xs font-medium text-default-500 w-24">
              ステータス
            </th>
            <th className="text-left px-4 py-3 text-xs font-medium text-default-500 w-28">
              更新日
            </th>
            {editBasePath && (
              <th className="text-left px-4 py-3 text-xs font-medium text-default-500 w-20">
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
              <td className="px-4 py-3">
                <span className="font-medium text-default-800 line-clamp-2">
                  {post.title}
                </span>
                <p className="text-xs text-default-400 mt-0.5">
                  {post.companies?.name ?? "未設定"}
                </p>
              </td>
              <td className="px-4 py-3">
                <PostTypeBadge type={post.post_type} />
              </td>
              <td className="px-4 py-3">
                <PostStatusBadge status={post.post_status} />
              </td>
              <td className="px-4 py-3 text-xs text-default-400">
                {new Date(post.updated_at).toLocaleDateString("ja-JP")}
              </td>
              {editBasePath && (
                <td className="px-4 py-3">
                  <Link
                    href={`${editBasePath}/${post.id}/edit`}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    編集
                  </Link>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
