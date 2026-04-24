import { POST_STATUS_BADGE_CONFIG } from "@/lib/postStatus";
import type { PostStatus } from "@/types/database";

export function PostStatusBadge({ status }: { status: PostStatus }) {
  const c = POST_STATUS_BADGE_CONFIG[status] ?? POST_STATUS_BADGE_CONFIG.DRAFT;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${c.className}`}
    >
      {c.label}
    </span>
  );
}
