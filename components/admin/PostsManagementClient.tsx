"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PostListCard } from "@/components/common/PostListCard";
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
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-default-900 sm:text-2xl">
            投稿管理
          </h1>
          <p className="text-sm text-default-500 mt-0.5">
            運用中の案件を管理します
          </p>
        </div>
        <Link
          href="/company/posts/new/official"
          className="inline-flex items-center gap-1.5 px-3 py-2 sm:px-4 bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            aria-hidden="true"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span className="hidden sm:inline">公式案件作成</span>
          <span className="sm:hidden">作成</span>
        </Link>
      </div>

      {/* ── PC テーブル (lg 以上) ── */}
      <div className="hidden lg:block bg-white border border-slate-200 rounded-xl">
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
                    <span className="font-medium line-clamp-2">{post.title}</span>
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
            {filteredPosts.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="text-center py-12 text-sm text-default-400"
                >
                  投稿がありません
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── モバイル / タブレット カード (lg 未満) ── */}
      <div className="lg:hidden">
        {filteredPosts.length === 0 ? (
          <p className="text-center py-12 text-sm text-default-400">
            投稿がありません
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredPosts.map((post) => {
              const canEdit =
                isMasterAdmin || post.created_by_user_id === currentUserId;
              return (
                <PostListCard
                  key={post.id}
                  title={post.title}
                  post_type={post.post_type}
                  post_status={post.post_status}
                  thumbnail_url={post.thumbnail_url}
                  metaItems={[
                    {
                      label: "応募数",
                      value: (
                        <Link
                          href={`/company/applications?postId=${post.id}`}
                          className="text-primary hover:underline"
                        >
                          {post.application_count}件
                        </Link>
                      ),
                    },
                    {
                      label: "更新日",
                      value: new Date(post.updated_at).toLocaleDateString(
                        "ja-JP",
                      ),
                    },
                  ]}
                  actions={
                    canEdit ? (
                      <Link
                        href={`/company/posts/${post.id}/edit`}
                        className="flex-1 text-center px-4 py-2.5 rounded-lg text-sm font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                      >
                        編集
                      </Link>
                    ) : undefined
                  }
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
