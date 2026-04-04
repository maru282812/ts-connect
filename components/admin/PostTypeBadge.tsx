import type { PostType } from "@/types/database";

const config: Record<PostType, { label: string; className: string }> = {
  OFFICIAL: {
    label: "公式",
    className: "bg-blue-100 text-blue-800 border border-blue-200",
  },
  CASUAL: {
    label: "気軽",
    className: "bg-emerald-100 text-emerald-800 border border-emerald-200",
  },
};

export function PostTypeBadge({ type }: { type: PostType }) {
  const { label, className } = config[type];
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${className}`}
    >
      {label}
    </span>
  );
}
