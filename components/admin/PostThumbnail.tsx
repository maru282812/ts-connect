import type { PostType } from "@/types/database";

interface PostThumbnailProps {
  thumbnailUrl?: string | null;
  title: string;
  type: PostType;
  size?: "sm" | "md";
}

export function PostThumbnail({
  thumbnailUrl,
  title,
  type,
  size = "sm",
}: PostThumbnailProps) {
  const sizeClass = size === "sm" ? "w-12 h-12" : "w-20 h-20";
  const colorClass =
    type === "OFFICIAL"
      ? "bg-blue-50 text-blue-700"
      : "bg-green-50 text-green-700";
  const textSize = size === "sm" ? "text-[10px]" : "text-xs";

  if (thumbnailUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={thumbnailUrl}
        alt={title}
        className={`${sizeClass} object-cover rounded-lg flex-shrink-0`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} ${colorClass} rounded-lg shadow-sm flex flex-col items-center justify-center flex-shrink-0 gap-0.5`}
    >
      <span className={`${textSize} font-medium`}>
        {type === "OFFICIAL" ? "公式" : "気軽"}
      </span>
      <span
        className={`font-bold ${textSize} text-center px-1 line-clamp-2 leading-tight`}
      >
        {title.slice(0, 8)}
      </span>
    </div>
  );
}
