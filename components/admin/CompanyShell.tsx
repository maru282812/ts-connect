"use client";

import { Button } from "@heroui/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOut } from "@/lib/auth/actions";
import { APP_NAME } from "@/constants/appConstants";

const userNavItems = [
  {
    href: "/company/official-posts",
    matchHrefs: ["/company/official-posts"],
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
    href: "/company/my-posts",
    matchHrefs: ["/company/my-posts"],
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
    href: "/company/casual-posts/new",
    matchHrefs: ["/company/casual-posts/new"],
    label: "気軽に投稿",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    ),
  },
  {
    href: "/company/my-applications",
    matchHrefs: ["/company/my-applications"],
    label: "自分の応募",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="9 11 12 14 22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
  },
  {
    href: "/company/my-page",
    matchHrefs: ["/company/my-page"],
    label: "マイページ",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
];

const adminNavItems = [
  {
    href: "/company/posts",
    matchHrefs: ["/company/posts"],
    label: "投稿管理",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
  },
  {
    href: "/company/applications",
    matchHrefs: ["/company/applications"],
    label: "応募管理",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    href: "/company/archive",
    matchHrefs: ["/company/archive"],
    label: "過去案件",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="21 8 21 21 3 21 3 8" />
        <rect x="1" y="3" width="22" height="5" />
        <line x1="10" y1="12" x2="14" y2="12" />
      </svg>
    ),
  },
  {
    href: "/company/settings",
    matchHrefs: ["/company/settings"],
    label: "管理設定",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
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

interface CompanyShellProps {
  displayName: string;
  email: string;
  children: React.ReactNode;
}

export function CompanyShell({ displayName, email, children }: CompanyShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const handleNavClick = () => {
    setMobileMenuOpen(false);
  };

  const isOfficialRoute =
    pathname.startsWith("/company/posts/new/official");

  const renderNavItem = (item: (typeof userNavItems)[0], dark = false) => {
    const isActive = item.matchHrefs.some((h) => pathname.startsWith(h));
    if (dark) {
      return (
        <Link
          key={item.href}
          href={item.href}
          onClick={handleNavClick}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${
            isActive
              ? "bg-slate-700 text-white"
              : "text-slate-300 hover:bg-slate-700 hover:text-white"
          }`}
        >
          <span className={`flex-shrink-0 ${isActive ? "text-blue-400" : "text-slate-500"}`}>
            {item.icon}
          </span>
          <span className="truncate">{item.label}</span>
        </Link>
      );
    }
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={handleNavClick}
        className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${
          isActive
            ? "bg-slate-100 text-slate-900"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        }`}
      >
        <span className={`flex-shrink-0 ${isActive ? "text-blue-600" : "text-slate-400"}`}>
          {item.icon}
        </span>
        <span className="truncate">{item.label}</span>
      </Link>
    );
  };

  const sidebarContent = (dark: boolean) => (
    <>
      <p className={`px-4 mb-2 text-[11px] font-semibold uppercase tracking-wider ${dark ? "text-slate-500" : "text-slate-400"}`}>
        利用メニュー
      </p>
      <div className="space-y-0.5">{userNavItems.map((item) => renderNavItem(item, dark))}</div>
      <div className={`my-4 border-t ${dark ? "border-slate-700" : "border-slate-200"}`} />
      <p className={`px-4 mb-2 text-[11px] font-semibold uppercase tracking-wider ${dark ? "text-slate-500" : "text-slate-400"}`}>
        管理メニュー
      </p>
      <div className="space-y-0.5">{adminNavItems.map((item) => renderNavItem(item, dark))}</div>
    </>
  );

  const headerBg = isOfficialRoute ? "bg-blue-950 border-blue-900" : "bg-slate-800";
  const headerTextSub = isOfficialRoute ? "text-blue-400" : "text-slate-400";
  const headerLabel = isOfficialRoute ? "公式案件 管理" : "管理画面";
  const avatarBg = isOfficialRoute ? "bg-blue-700" : "bg-blue-500";

  return (
    <div className="min-h-screen md:h-screen md:overflow-hidden bg-slate-100 flex">
      {/* ── デスクトップ サイドバー */}
      <aside className="hidden md:flex w-64 bg-slate-800 flex-col flex-shrink-0">
        <div className="px-5 py-4 border-b border-slate-700">
          <span className="text-lg font-bold text-white">{APP_NAME}</span>
          <span className="ml-2 text-xs text-slate-400">管理画面</span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {sidebarContent(true)}
        </nav>
        <div className="px-3 py-4 border-t border-slate-700">
          <form action={signOut}>
            <Button type="submit" variant="flat" size="sm" className="w-full text-slate-300 hover:text-white">
              ログアウト
            </Button>
          </form>
        </div>
      </aside>

      {/* ── モバイル ドロワー */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <aside className="fixed left-0 top-0 bottom-0 w-72 bg-white z-50 flex flex-col shadow-xl md:hidden">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-800">
              <div>
                <span className="text-base font-bold text-white">{APP_NAME}</span>
                <span className="ml-2 text-xs text-slate-400">管理画面</span>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="メニューを閉じる"
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700"
              >
                <CloseIcon />
              </button>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {sidebarContent(false)}
            </nav>
            <div className="p-3 border-t border-slate-200">
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
        <header className={`${headerBg} px-4 md:px-6 py-3 flex items-center gap-3 sticky top-0 z-10 border-b border-slate-700`}>
          {/* ハンバーガーボタン (モバイルのみ) */}
          <button
            type="button"
            className="md:hidden p-2 -ml-1 rounded-lg text-slate-300 hover:bg-slate-700 min-w-[40px] min-h-[40px] flex items-center justify-center"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="メニューを開く"
          >
            <HamburgerIcon />
          </button>

          <div className="flex-1 min-w-0 text-sm">
            <span className="font-semibold text-white">{APP_NAME}</span>
            <span className={`ml-2 ${headerTextSub} hidden sm:inline`}>{headerLabel}</span>
          </div>

          <div className="flex items-center gap-2 md:gap-3 shrink-0">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-white truncate max-w-[140px]">{displayName}</p>
              <p className={`text-xs truncate max-w-[140px] ${headerTextSub}`}>{email}</p>
            </div>
            <div className={`w-9 h-9 ${avatarBg} rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0`}>
              {displayName.charAt(0)}
            </div>
          </div>
        </header>

        {/* メインコンテンツ */}
        <main className="flex-1 p-4 md:p-6 md:overflow-auto">{children}</main>
      </div>
    </div>
  );
}
