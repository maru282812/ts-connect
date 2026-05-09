"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { PostStatus, PostType } from "@/types/database";
import { PostStatusBadge } from "./PostStatusBadge";
import { PostThumbnail } from "./PostThumbnail";
import { PostTypeBadge } from "./PostTypeBadge";

export interface PostRow {
  id: string;
  title: string;
  post_type: PostType;
  post_status: PostStatus;
  thumbnail_url: string | null;
  application_count: number;
  updated_at: string;
  created_by_user_id: string;
}

type TabKey = "all" | "official" | "casual" | "in_progress" | "draft";

interface PostsManagementClientProps {
  posts: PostRow[];
  currentUserId: string;
  isMasterAdmin: boolean;
}

export function PostsManagementClient({
  posts: initialPosts,
  currentUserId,
  isMasterAdmin,
}: PostsManagementClientProps) {
  const [activeTab] = useState<TabKey>("all");
  const [showClosed] = useState(false);
  const [posts] = useState<PostRow[]>(initialPosts);

  const filteredPosts = useMemo(() => {
    return posts.filter((p) => {
      if (!showClosed && p.post_status === "CLOSED") return false;

      switch (activeTab) {
        case "official":
          return p.post_type === "OFFICIAL";
        case "casual":
          return p.post_type === "CASUAL";
        case "in_progress":
          return p.post_status === "IN_PROGRESS";
        case "draft":
          return p.post_status === "DRAFT";
        default:
          return true;
      }
    });
  }, [posts, activeTab, showClosed]);

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-default-900">投稿管理</h1>
          <p className="text-sm text-default-500 mt-0.5">
            運用中の案件を管理します
          </p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl">
        <table className="w-full text-sm table-fixed">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left px-3 py-3 text-xs w-14">サムネ</th>
              <th className="text-left px-3 py-3 text-xs">タイトル</th>
              <th className="text-left px-2 py-3 text-xs w-20">種別</th>
              <th className="text-left px-2 py-3 text-xs w-24">ステータス</th>
              <th className="text-left px-2 py-3 text-xs w-14">応募数</th>
              <th className="text-left px-2 py-3 text-xs w-24">更新日</th>
              <th className="text-center px-2 py-3 text-xs w-16">操作</th>
            </tr>
          </thead>

          <tbody>
            {filteredPosts.map((post) => {
              const canEdit =
                isMasterAdmin || post.created_by_user_id === currentUserId;

              return (
                <tr
                  key={post.id}
                  className="border-b last:border-0 hover:bg-slate-50"
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
                    <span className="font-medium line-clamp-2">
                      {post.title}
                    </span>
                  </td>

                  <td className="px-2 py-3 align-middle">
                    <PostTypeBadge type={post.post_type} />
                  </td>

                  <td className="px-2 py-3 align-middle">
                    <PostStatusBadge status={post.post_status} />
                  </td>

                  <td className="px-2 py-3 align-middle">
                    <Link
                      href={`/company/applications?postId=${post.id}`}
                      className="text-primary hover:underline whitespace-nowrap"
                    >
                      {post.application_count}件
                    </Link>
                  </td>

                  <td className="px-2 py-3 align-middle">
                    <span className="text-xs text-default-400 whitespace-nowrap">
                      {new Date(post.updated_at).toLocaleDateString("ja-JP")}
                    </span>
                  </td>

                  <td className="px-2 py-3 align-middle text-center">
                    {canEdit && (
                      <Link
                        href={`/company/posts/${post.id}/edit`}
                        className="text-xs text-blue-600 hover:underline whitespace-nowrap"
                      >
                        編集
                      </Link>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
