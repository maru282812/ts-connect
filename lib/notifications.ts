import { createClient } from "@/lib/supabase/client";

export type NotificationType =
  | "APPLICATION_RECEIVED"
  | "APPLICATION_STATUS_CHANGED"
  | "MESSAGE_RECEIVED"
  | "POST_CLOSED"
  | "INVITATION_RECEIVED"
  | "ANNOUNCEMENT"
  | "SYSTEM"
  | "POINT_GRANTED"
  | "REVIEW_RECEIVED"
  | "MENTION";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  related_type: string | null;
  related_id: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

/**
 * 自分あての通知を新しい順に取得する。RLS（user_id = auth.uid()）で
 * 自動的に本人分だけに絞られるため、user_id 条件は付けない。
 */
export async function fetchNotifications(
  limit = 30,
): Promise<AppNotification[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select(
      "id, type, title, body, related_type, related_id, is_read, read_at, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as AppNotification[];
}

/** 未読件数（バッジ用）。 */
export async function fetchUnreadCount(): Promise<number> {
  const supabase = createClient();
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("is_read", false);

  if (error) throw error;
  return count ?? 0;
}

/** 1件を既読化。 */
export async function markNotificationRead(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("id", id)
    .eq("is_read", false);

  if (error) throw error;
}

/** 自分あての未読をすべて既読化。 */
export async function markAllNotificationsRead(): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("is_read", false);

  if (error) throw error;
}

/**
 * 通知タップ時の遷移先を related_type / related_id から解決する。
 * 着地先が無い種別は通知一覧にフォールバックする。
 */
export function notificationHref(n: AppNotification): string {
  switch (n.related_type) {
    case "community_post":
      // コミュニティは投稿個別ページが無いため、フィードで該当投稿を強調する
      return n.related_id
        ? `/app/community?highlight=${n.related_id}`
        : "/app/community";
    case "application":
      return "/app/applications";
    case "post":
      return n.related_id ? `/app/posts/${n.related_id}` : "/app/posts";
    default:
      return "/app/notifications";
  }
}
