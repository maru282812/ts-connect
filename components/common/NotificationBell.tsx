"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  type AppNotification,
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  notificationHref,
} from "@/lib/notifications";
import { type AppSurface, pathsFor } from "@/lib/paths";

function BellIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "たった今";
  if (min < 60) return `${min}分前`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}時間前`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}日前`;
  return new Date(iso).toLocaleDateString("ja-JP", {
    month: "numeric",
    day: "numeric",
  });
}

const PANEL_LIMIT = 8;

interface NotificationBellProps {
  /** 今いる面。遷移先とボタンのトーンを切り替える。 */
  surface: AppSurface;
}

export function NotificationBell({ surface }: NotificationBellProps) {
  const router = useRouter();
  const paths = pathsFor(surface);
  const dark = surface === "admin";
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const wrapRef = useRef<HTMLDivElement>(null);

  const unreadCount = items.filter((n) => !n.is_read).length;

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setItems(await fetchNotifications(PANEL_LIMIT));
    } catch {
      // 取得失敗時はベルを黙って空表示にする（導線は保つ）
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // パネル外クリック / Esc で閉じる
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const handleToggle = () => {
    const next = !open;
    setOpen(next);
    if (next) load(); // 開くたびに最新化
  };

  const handleItemClick = async (n: AppNotification) => {
    setOpen(false);
    if (!n.is_read) {
      setItems((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)),
      );
      try {
        await markNotificationRead(n.id);
      } catch {
        // 既読化に失敗しても遷移は妨げない
      }
    }
    router.push(notificationHref(n, surface));
  };

  const handleMarkAll = async () => {
    setItems((prev) => prev.map((x) => ({ ...x, is_read: true })));
    try {
      await markAllNotificationsRead();
    } catch {
      // 失敗時は次回読み込みで実態に戻る
    }
  };

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={handleToggle}
        className={`relative rounded-full p-2 transition-colors ${
          dark
            ? "text-slate-300 hover:bg-slate-700"
            : "text-default-500 hover:bg-default-100"
        }`}
        aria-label={unreadCount > 0 ? `通知（未読 ${unreadCount} 件）` : "通知"}
        aria-haspopup="true"
        aria-expanded={open}
      >
        <BellIcon />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-default-100 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-default-100 px-4 py-2.5">
            <span className="text-sm font-bold text-default-800">通知</span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAll}
                className="text-xs font-medium text-primary hover:underline"
              >
                すべて既読
              </button>
            )}
          </div>

          <div className="max-h-[60vh] overflow-y-auto">
            {loading ? (
              <p className="px-4 py-8 text-center text-sm text-default-400">
                読み込み中…
              </p>
            ) : items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-default-400">
                通知はまだありません
              </p>
            ) : (
              <ul className="divide-y divide-default-100">
                {items.map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => handleItemClick(n)}
                      className={`flex w-full gap-2.5 px-4 py-3 text-left transition-colors hover:bg-default-50 ${
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
                        <span className="block truncate text-sm font-medium text-default-800">
                          {n.title}
                        </span>
                        {n.body && (
                          <span className="mt-0.5 block truncate text-xs text-default-500">
                            {n.body}
                          </span>
                        )}
                        <span className="mt-0.5 block text-[11px] text-default-400">
                          {relativeTime(n.created_at)}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <Link
            href={paths.notifications}
            onClick={() => setOpen(false)}
            className="block border-t border-default-100 px-4 py-2.5 text-center text-sm font-medium text-primary hover:bg-default-50"
          >
            すべて見る
          </Link>
        </div>
      )}
    </div>
  );
}
