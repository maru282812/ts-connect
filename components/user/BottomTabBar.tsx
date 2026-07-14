"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { NavigationIcon } from "@/components/common/NavigationIcon";
import type { NavigationIconName } from "@/constants/navigationParts";
import { PostActionSheet } from "@/components/user/PostActionSheet";

// ============================================================
// モバイル用ボトムタブバー（スマホ幅のみ md:hidden）
// Instagram 風: ラベルなし・フラットな5アイコン等間隔。
// 中央「＋」は投稿アクションシートを開く（角丸スクエアで強調）。
// 通知・マイページはヘッダー側に置くため含めない。PCは既存サイドバー。
// ============================================================

interface Tab {
  key: string;
  /** action(中央+) は href なし */
  href?: string;
  label: string;
  icon?: NavigationIconName;
  match?: string[];
  action?: boolean;
}

const TABS: Tab[] = [
  { key: "home", href: "/app", label: "ホーム", icon: "dashboard", match: ["/app"] },
  {
    key: "posts",
    href: "/app/posts",
    label: "案件",
    icon: "work",
    match: ["/app/posts", "/app/official-posts", "/app/casual-posts"],
  },
  { key: "post", label: "投稿", action: true },
  {
    key: "sns",
    href: "/app/community",
    label: "SNS",
    icon: "forum",
    match: ["/app/community"],
  },
  {
    key: "more",
    href: "/app/more",
    label: "もっと",
    icon: "inventory",
    match: ["/app/more"],
  },
];

function PlusIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

export function BottomTabBar() {
  const pathname = usePathname();
  const [sheetOpen, setSheetOpen] = useState(false);

  const isActive = (tab: Tab) =>
    tab.href === "/app"
      ? pathname === "/app"
      : (tab.match ?? []).some((m) => pathname.startsWith(m));

  return (
    <>
      <nav
        aria-label="メインナビゲーション"
        className="fixed inset-x-0 bottom-0 z-50 flex items-stretch justify-around border-t border-default-100 bg-white pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        {TABS.map((tab) => {
          if (tab.action) {
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setSheetOpen(true)}
                aria-label="投稿する"
                className="flex flex-1 items-center justify-center py-2.5"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-primary text-primary transition-colors active:bg-primary-50">
                  <PlusIcon />
                </span>
              </button>
            );
          }

          const active = isActive(tab);
          return (
            <Link
              key={tab.key}
              href={tab.href ?? "#"}
              aria-label={tab.label}
              aria-current={active ? "page" : undefined}
              className={`flex flex-1 items-center justify-center py-2.5 transition-colors ${
                active ? "text-primary" : "text-default-400"
              }`}
            >
              {tab.icon && (
                <NavigationIcon name={tab.icon} className="h-6 w-6" />
              )}
            </Link>
          );
        })}
      </nav>

      <PostActionSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </>
  );
}
