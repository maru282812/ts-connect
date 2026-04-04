"use client";

import { Chip } from "@heroui/react";
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
    ? new Date(post.deadline_at).toLocaleDateString("ja-JP")
    : null;
  const createdAt = new Date(post.created_at).toLocaleDateString("ja-JP");
  const companyName = post.companies?.name ?? "会社不明";
  const userName = post.users?.display_name ?? "匿名";

  return (
    <div
      onClick={onClick}
      className={`
        flex flex-col rounded-xl cursor-pointer overflow-hidden select-none
        transition-all duration-200
        ${
          isSelected
            ? "border-2 border-blue-600 bg-blue-50 shadow-md"
            : "border border-default-100 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(0,0,0,0.12)]"
        }
      `}
      style={{ minHeight: "320px" }}
    >
      {/* ── サムネイル（高さ固定 80px） ─────────────────── */}
      <div
        className="w-full overflow-hidden shrink-0"
        style={{ height: "80px" }}
      >
        {post.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.thumbnail_url}
            alt={post.title}
            className="w-full h-full object-cover"
            style={{ borderRadius: "12px 12px 0 0" }}
          />
        ) : (
          <div
            className={`w-full h-full flex flex-col items-center justify-center gap-1 px-3
              ${isOfficial ? "bg-blue-700" : "bg-emerald-500"}`}
            style={{ borderRadius: "12px 12px 0 0" }}
          >
            <span
              className="text-white/60 font-medium"
              style={{ fontSize: "10px" }}
            >
              {isOfficial ? "公式案件" : "気軽に投稿"}
            </span>
            <span className="text-white font-bold text-xs text-center line-clamp-2 leading-snug">
              {post.title}
            </span>
          </div>
        )}
      </div>

      {/* ── テキストエリア ──────────────────────────────── */}
      <div className="flex flex-col flex-1 p-3 overflow-hidden">
        {/* 種別バッジ */}
        <div className="mb-2">
          <Chip
            size="sm"
            color={isOfficial ? "primary" : "success"}
            variant="flat"
            className="h-5"
            style={{ fontSize: "11px", padding: "2px 6px" }}
          >
            {isOfficial ? "公式" : "気軽"}
          </Chip>
        </div>

        {/* タイトル */}
        <h3
          className={`line-clamp-2 mb-2 ${
            isSelected ? "text-blue-700" : "text-default-800"
          }`}
          style={{
            fontSize: "16px",
            fontWeight: 600,
            lineHeight: 1.4,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {post.title}
        </h3>

        {/* 報酬・締切 / 投稿日 */}
        <div className="flex flex-col gap-1 flex-1">
          {isOfficial ? (
            <>
              {post.price_text && (
                <p className="text-sm font-bold text-primary">
                  {post.price_text}
                </p>
              )}
              {deadline && (
                <p
                  className="text-warning-600"
                  style={{ fontSize: "12px", color: "#d97706" }}
                >
                  締切: {deadline}
                </p>
              )}
            </>
          ) : (
            <p style={{ fontSize: "12px", color: "#6b7280" }}>{createdAt}</p>
          )}
        </div>

        {/* 会社名 / 投稿者名 + 補足 */}
        <div className="mt-auto pt-2 border-t border-default-100">
          <p
            className="truncate"
            style={{ fontSize: "12px", color: "#6b7280" }}
          >
            {isOfficial ? companyName : userName}
          </p>
          {isOfficial &&
            post.is_application_limit_enabled &&
            post.application_limit && (
              <p
                className="mt-0.5 text-default-400"
                style={{ fontSize: "10px" }}
              >
                {post.application_limit}名募集
              </p>
            )}
          {/* 応募済みバッジ */}
          {appliedTypes && appliedTypes.size > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {appliedTypes.has("APPLY") && (
                <span className="inline-block text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium leading-none">
                  {isOfficial ? "応募済み" : "参加希望済み"}
                </span>
              )}
              {appliedTypes.has("INQUIRY") && (
                <span className="inline-block text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full font-medium leading-none">
                  聞いてみる済み
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
