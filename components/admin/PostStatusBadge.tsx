import type { PostStatus } from "@/types/database";

const config: Record<string, { label: string; className: string }> = {
  DRAFT: {
    label: "下書き",
    className: "bg-gray-100 text-gray-600 border border-gray-200",
  },
  OPEN: {
    label: "公開中",
    className: "bg-green-100 text-green-700 border border-green-200",
  },
  PUBLISHED: {
    label: "公開中",
    className: "bg-green-100 text-green-700 border border-green-200",
  },
  IN_PROGRESS: {
    label: "対応中",
    className: "bg-amber-100 text-amber-700 border border-amber-200",
  },
  CLOSED: {
    label: "終了",
    className: "bg-red-100 text-red-700 border border-red-200",
  },
};

export function PostStatusBadge({ status }: { status: PostStatus }) {
  const c = config[status] ?? config.DRAFT;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${c.className}`}
    >
      {c.label}
    </span>
  );
}
