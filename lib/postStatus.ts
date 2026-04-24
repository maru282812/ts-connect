import type { PostStatus } from "@/types/database";

/** ステータス表示ラベル */
export const POST_STATUS_LABELS: Record<PostStatus, string> = {
  DRAFT: "下書き",
  OPEN: "公開中",
  IN_PROGRESS: "対応中",
  CLOSED: "終了",
};

/** POST_STATUS_LABELS の別名（単数形） */
export const POST_STATUS_LABEL = POST_STATUS_LABELS;

/** PostStatusBadge 用スタイル設定 */
export const POST_STATUS_BADGE_CONFIG: Record<
  PostStatus,
  { label: string; className: string }
> = {
  DRAFT: {
    label: "下書き",
    className: "bg-gray-100 text-gray-600 border border-gray-200",
  },
  OPEN: {
    label: "公開中",
    className: "bg-blue-100 text-blue-700 border border-blue-200",
  },
  IN_PROGRESS: {
    label: "対応中",
    className: "bg-amber-100 text-amber-700 border border-amber-200",
  },
  CLOSED: {
    label: "終了",
    className: "bg-gray-100 text-gray-500 border border-gray-200",
  },
};

/** HeroUI Chip の color 属性マップ */
export const POST_STATUS_CHIP_COLOR: Record<
  PostStatus,
  "primary" | "warning" | "default"
> = {
  OPEN: "primary",
  IN_PROGRESS: "warning",
  DRAFT: "default",
  CLOSED: "default",
};

/** 全ステータス選択肢（管理者フォーム用） */
export const POST_STATUSES: { value: PostStatus; label: string }[] = [
  { value: "DRAFT", label: "下書き" },
  { value: "OPEN", label: "公開中" },
  { value: "IN_PROGRESS", label: "対応中" },
  { value: "CLOSED", label: "終了" },
];

/** 気軽投稿用ステータス選択肢（全ステータス） */
export const CASUAL_POST_STATUSES: { value: PostStatus; label: string }[] = [
  { value: "OPEN", label: "公開中" },
  { value: "IN_PROGRESS", label: "対応中" },
  { value: "CLOSED", label: "終了" },
  { value: "DRAFT", label: "下書き" },
];

/**
 * ユーザー向け一覧に表示されるステータス（OPEN のみ）。
 * 「公開中一覧は OPEN のみ」仕様に従う。
 */
export const PUBLIC_POST_STATUSES: PostStatus[] = ["OPEN"];

/**
 * ユーザーがアクセス・応募できるステータス（OPEN / IN_PROGRESS）。
 * RLS ポリシー（migrations/004）の post_status IN ('OPEN', 'IN_PROGRESS') と同期している。
 */
export const ACTIVE_POST_STATUSES: PostStatus[] = ["OPEN", "IN_PROGRESS"];

/**
 * ユーザー向け一覧に表示されるか。
 * 公開中一覧は OPEN のみ。IN_PROGRESS は別扱い。
 */
export function isPublicStatus(status: PostStatus): boolean {
  return status === "OPEN";
}

/**
 * 新規応募・問い合わせが可能なステータスか。
 */
export function isRecruitableStatus(status: PostStatus): boolean {
  return status === "OPEN";
}

/**
 * ユーザーがアクセス・応募できるアクティブなステータスか（OPEN または IN_PROGRESS）。
 */
export function isActiveStatus(status: PostStatus): boolean {
  return status === "OPEN" || status === "IN_PROGRESS";
}
