"use client";

import { Chip } from "@heroui/react";
import { useState } from "react";
import type { ApplicationType, PostWithRelations } from "@/types/database";

interface PostListItemProps {
  post: PostWithRelations;
  isSelected: boolean;
  onClick: () => void;
  appliedTypes?: Set<ApplicationType>;
}

export function PostListItem({
  post,
  isSelected,
  onClick,
  appliedTypes,
}: PostListItemProps) {
  const isOfficial = post.post_type === "OFFICIAL";
  const deadline = post.deadline_at
    ? new Date(post.deadline_at).toLocaleDateString("ja-JP", {
        month: "numeric",
        day: "numeric",
      })
    : null;
  const companyName = post.companies?.name ?? "会社不明";
  const userName = post.users?.display_name ?? "匿名";
  const [imgError, setImgError] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex flex-col rounded-lg cursor-pointer overflow-hidden select-none text-left w-full
        transition-all duration-200
        ${
          isSelected
            ? "border-2 border-blue-500 bg-blue-50 shadow-md"
            : "border border-default-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.07)] hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(0,0,0,0.1)] hover:border-blue-200"
        }
      `}
    >
      {/* ── サムネイル */}
      <div className="w-full overflow-hidden shrink-0 h-[110px] md:h-[140px]">
        {post.thumbnail_url && !imgError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.thumbnail_url}
            alt={post.title}
            className="w-full h-full object-cover"
            style={{ borderRadius: "8px 8px 0 0" }}
            onError={() => setImgError(true)}
          />
        ) : (
          <div
            className={`w-full h-full flex items-center justify-center px-4
              ${isOfficial ? "bg-blue-50 text-blue-700" : "bg-green-50 text-green-700"}`}
            style={{ borderRadius: "8px 8px 0 0" }}
          >
            <span className="font-semibold text-sm line-clamp-2 text-center leading-snug">
              {post.title}
            </span>
          </div>
        )}
      </div>

      {/* ── コンテンツエリア */}
      <div className="flex flex-col flex-1 p-3 md:p-4 gap-2 overflow-hidden">
        {/* タイトル */}
        <h3
          className={`text-sm md:text-base font-semibold line-clamp-2 leading-snug ${
            isSelected ? "text-blue-700" : "text-default-800"
          }`}
        >
          {post.title}
        </h3>

        {/* 報酬・タグ */}
        <div className="flex items-center gap-2 flex-wrap">
          <Chip size="sm" color={isOfficial ? "primary" : "success"} variant="flat">
            {isOfficial ? "公式" : "気軽"}
          </Chip>
          {post.post_status === "IN_PROGRESS" && (
            <Chip size="sm" color="warning" variant="flat">
              対応中
            </Chip>
          )}
          {isOfficial && post.price_text && (
            <span className="text-sm font-bold text-primary">{post.price_text}</span>
          )}
        </div>

        {/* 本文: モバイルは2行、デスクトップは3行 */}
        {post.body && (
          <p className="text-xs text-default-400 line-clamp-2 md:line-clamp-3 leading-relaxed">
            {post.body}
          </p>
        )}

        {/* 会社名・期限 */}
        <div className="mt-auto pt-2 border-t border-default-100 flex items-center justify-between gap-2">
          <p className="text-xs text-default-400 truncate">
            {isOfficial ? companyName : userName}
          </p>
          <div className="flex items-center gap-2 shrink-0">
            {deadline && (
              <span className="text-[11px] text-amber-600">{deadline}まで</span>
            )}
            {isOfficial &&
              post.is_application_limit_enabled &&
              post.application_limit && (
                <span className="text-[11px] text-default-400 hidden sm:inline">
                  {post.application_limit}名募集
                </span>
              )}
          </div>
        </div>

        {/* 応募済みバッジ */}
        {appliedTypes && appliedTypes.size > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {appliedTypes.has("APPLY") && (
              <span className="inline-block text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium leading-none">
                {isOfficial ? "応募済み" : "参加希望済み"}
              </span>
            )}
            {appliedTypes.has("INQUIRY") && (
              <span className="inline-block text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium leading-none">
                聞いてみる済み
              </span>
            )}
          </div>
        )}
      </div>
    </button>
  );
}
