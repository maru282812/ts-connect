"use client";

import { Button } from "@heroui/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOut } from "@/lib/auth/actions";
import { APP_NAME } from "@/constants/appConstants";

const navItems = [
  {
    href: "/app/posts",
    matchHrefs: ["/app/posts"],
    label: "案件一覧",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
  },
  {
    href: "/app/my-posts",
    matchHrefs: ["/app/my-posts"],
    label: "投稿一覧",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
  {
    href: "/app/casual-posts/new",
    matchHrefs: ["/app/casual-posts/new"],
    label: "気軽に投稿",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    ),
  },
  {
    href: "/app/applications",
    matchHrefs: ["/app/applications"],
    label: "自分の応募",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="9 11 12 14 22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
  },
  {
    href: "/app/settings",
    matchHrefs: ["/app/settings"],
    label: "マイページ",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
];

function HamburgerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

interface AppShellProps {
  displayName: string;
  email: string;
  children: React.ReactNode;
}

export function AppShell({ displayName, email, children }: AppShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const handleNavClick = () => {
    setMobileMenuOpen(false);
  };

  const renderNavItem = (item: (typeof navItems)[0]) => {
    const isActive = item.matchHrefs.some((h) => pathname.startsWith(h));
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={handleNavClick}
        className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${
          isActive
            ? "bg-primary-50 text-primary"
            : "text-default-600 hover:bg-default-100 hover:text-default-900"
        }`}
      >
        <span className={isActive ? "text-primary" : "text-default-400"}>
          {item.icon}
        </span>
        {item.label}
      </Link>
    );
  };

  return (
    /* デスクトップ: h-screen overflow-hidden / モバイル: 自然な高さ */
    <div className="min-h-screen md:h-screen md:overflow-hidden bg-blue-50 flex">
      {/* ── デスクトップ サイドバー (md以上で表示) */}
      <aside className="hidden md:flex w-60 min-h-screen bg-white border-r border-default-100 flex-col shrink-0">
        <div className="p-4 border-b border-default-100">
          <span className="text-lg font-bold text-primary">{APP_NAME}</span>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(renderNavItem)}
        </nav>
        <div className="p-3 border-t border-default-100">
          <form action={signOut}>
            <Button type="submit" variant="flat" color="danger" size="sm" className="w-full">
              ログアウト
            </Button>
          </form>
        </div>
      </aside>

      {/* ── モバイル ドロワー */}
      {mobileMenuOpen && (
        <>
          {/* overlay */}
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          {/* drawer */}
          <aside className="fixed left-0 top-0 bottom-0 w-72 bg-white z-50 flex flex-col shadow-xl md:hidden">
            <div className="px-4 py-3 border-b border-default-100 flex items-center justify-between">
              <span className="text-lg font-bold text-primary">{APP_NAME}</span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="メニューを閉じる"
                className="p-2 rounded-lg text-default-400 hover:text-default-700 hover:bg-default-100"
              >
                <CloseIcon />
              </button>
            </div>
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {navItems.map(renderNavItem)}
            </nav>
            <div className="p-3 border-t border-default-100">
              <form action={signOut}>
                <Button type="submit" variant="flat" color="danger" size="sm" className="w-full">
                  ログアウト
                </Button>
              </form>
            </div>
          </aside>
        </>
      )}

      {/* ── メインコンテンツエリア */}
      <div className="flex-1 flex flex-col min-w-0 md:min-h-0">
        {/* ヘッダー */}
        <header className="bg-white border-b border-default-100 px-4 md:px-6 py-3 flex items-center gap-3 shrink-0 z-10 sticky top-0">
          {/* ハンバーガーボタン (モバイルのみ) */}
          <button
            type="button"
            className="md:hidden p-2 -ml-1 rounded-lg text-default-500 hover:bg-default-100 min-w-[40px] min-h-[40px] flex items-center justify-center"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="メニューを開く"
          >
            <HamburgerIcon />
          </button>

          <div className="text-sm text-default-500 flex-1 min-w-0">
            <span className="font-medium text-default-700 truncate">{APP_NAME}</span>
          </div>

          {/* ユーザー情報 */}
          <div className="flex items-center gap-2 md:gap-3 shrink-0">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-default-800 truncate max-w-[140px]">{displayName}</p>
              <p className="text-xs text-default-400 truncate max-w-[140px]">{email}</p>
            </div>
            <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0">
              {displayName.charAt(0)}
            </div>
          </div>
        </header>

        {/* メインコンテンツ */}
        <main className="flex-1 p-4 md:p-6 md:overflow-auto md:min-h-0">{children}</main>
      </div>
    </div>
  );
}
