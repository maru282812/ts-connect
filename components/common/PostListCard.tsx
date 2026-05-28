"use client";

import type { ReactNode } from "react";
import { PostStatusBadge } from "@/components/admin/PostStatusBadge";
import { PostThumbnail } from "@/components/admin/PostThumbnail";
import { PostTypeBadge } from "@/components/admin/PostTypeBadge";
import type { PostStatus, PostType } from "@/types/database";

interface MetaItem {
  label: string;
  value: ReactNode;
}

interface PostListCardProps {
  title: string;
  post_type: PostType;
  post_status?: PostStatus;
  thumbnail_url?: string | null;
  metaItems?: MetaItem[];
  actions?: ReactNode;
}

export function PostListCard({
  title,
  post_type,
  post_status,
  thumbnail_url,
  metaItems = [],
  actions,
}: PostListCardProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
      {/* Top: Thumbnail + Badges + Title */}
      <div className="flex gap-3">
        <PostThumbnail
          thumbnailUrl={thumbnail_url}
          title={title}
          type={post_type}
          size="md"
        />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap gap-1.5 mb-1.5">
            <PostTypeBadge type={post_type} />
            {post_status && <PostStatusBadge status={post_status} />}
          </div>
          <h3 className="font-medium text-sm text-slate-900 line-clamp-2 leading-snug">
            {title}
          </h3>
        </div>
      </div>

      {/* Middle: Meta info */}
      {metaItems.length > 0 && (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 pt-3 mt-3 border-t border-slate-100">
          {metaItems.map(({ label, value }) => (
            <div key={label}>
              <dt className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">
                {label}
              </dt>
              <dd className="text-xs font-medium text-slate-700">{value}</dd>
            </div>
          ))}
        </dl>
      )}

      {/* Bottom: Actions */}
      {actions && (
        <div className="flex flex-wrap gap-2 pt-3 mt-3 border-t border-slate-100">
          {actions}
        </div>
      )}
    </div>
  );
}
