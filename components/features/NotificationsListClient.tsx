"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  type AppNotification,
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  notificationHref,
} from "@/lib/notifications";

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function NotificationsListClient() {
  const router = useRouter();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const unreadCount = items.filter((n) => !n.is_read).length;

  useEffect(() => {
    (async () => {
      try {
        setItems(await fetchNotifications(50));
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleClick = async (n: AppNotification) => {
    if (!n.is_read) {
      setItems((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)),
      );
      try {
        await markNotificationRead(n.id);
      } catch {
        /* 遷移は妨げない */
      }
    }
    router.push(notificationHref(n));
  };

  const handleMarkAll = async () => {
    setItems((prev) => prev.map((x) => ({ ...x, is_read: true })));
    try {
      await markAllNotificationsRead();
    } catch {
      /* 次回読み込みで実態に戻る */
    }
  };

  if (loading) {
    return (
      <p className="py-16 text-center text-sm text-default-400">読み込み中…</p>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-default-100 bg-white py-16 text-center">
        <p className="text-sm text-default-400">通知はまだありません</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-default-100 bg-white">
      {unreadCount > 0 && (
        <div className="flex items-center justify-between border-b border-default-100 px-4 py-2.5">
          <span className="text-sm text-default-500">
            未読 {unreadCount} 件
          </span>
          <button
            type="button"
            onClick={handleMarkAll}
            className="text-xs font-medium text-primary hover:underline"
          >
            すべて既読
          </button>
        </div>
      )}
      <ul className="divide-y divide-default-100">
        {items.map((n) => (
          <li key={n.id}>
            <button
              type="button"
              onClick={() => handleClick(n)}
              className={`flex w-full gap-3 px-4 py-3.5 text-left transition-colors hover:bg-default-50 ${
                n.is_read ? "" : "bg-blue-50/60"
              }`}
            >
              <span
                className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                  n.is_read ? "bg-transparent" : "bg-primary"
                }`}
                aria-hidden="true"
              />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-default-800">
                  {n.title}
                </span>
                {n.body && (
                  <span className="mt-0.5 block text-sm text-default-500">
                    {n.body}
                  </span>
                )}
                <span className="mt-1 block text-xs text-default-400">
                  {formatDateTime(n.created_at)}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
