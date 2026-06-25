"use client";

import { Button } from "@heroui/react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { SidebarNavigation } from "@/components/common/SidebarNavigation";
import { APP_NAME } from "@/constants/appConstants";
import { getSidebarGroups } from "@/constants/navigationParts";
import { signOut } from "@/lib/auth/actions";

const userSidebarGroups = getSidebarGroups({
  surface: "user",
  role: "USER",
  includePlanned: true,
});

function HamburgerIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function PointIcon({ className }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5" />
      <path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3" />
    </svg>
  );
}

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

function HelpIcon() {
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
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
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

  return (
    <div className="flex flex-col h-screen bg-blue-50">
      <header className="bg-white border-b border-default-100 h-16 px-4 md:px-8 flex items-center justify-between gap-3 shrink-0 z-40">
        <div className="flex items-center gap-3 md:gap-8 min-w-0">
          <button
            type="button"
            className="md:hidden p-2 -ml-1 rounded-lg text-default-500 hover:bg-default-100 min-w-[40px] min-h-[40px] flex items-center justify-center"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="メニューを開く"
          >
            <HamburgerIcon />
          </button>

          <span className="text-lg font-bold text-primary whitespace-nowrap">
            {APP_NAME}
          </span>

          <div className="relative hidden md:block w-56 lg:w-80">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-default-400" />
            <input
              type="text"
              placeholder="キーワードで検索..."
              className="w-full pl-10 pr-4 py-2 bg-default-100 rounded-lg border-none text-sm text-default-800 placeholder:text-default-400 focus:ring-2 focus:ring-primary outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4 shrink-0">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 rounded-full border border-primary-100">
            <PointIcon className="text-primary" />
            <span className="text-xs font-bold text-primary whitespace-nowrap">
              1,200 pt
            </span>
          </div>

          <button
            type="button"
            className="relative p-2 rounded-full text-default-500 hover:bg-default-100 transition-colors"
            aria-label="通知"
          >
            <BellIcon />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          <button
            type="button"
            className="hidden sm:flex p-2 rounded-full text-default-500 hover:bg-default-100 transition-colors"
            aria-label="ヘルプ"
          >
            <HelpIcon />
          </button>

          <div className="flex items-center gap-3 pl-2 md:pl-3 border-l border-default-100">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-default-800 truncate max-w-[140px] leading-tight">
                {displayName}
              </p>
              <p className="text-xs text-default-400 truncate max-w-[140px]">
                {email}
              </p>
            </div>
            <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0">
              {displayName.charAt(0)}
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        <aside className="hidden md:flex w-60 bg-white border-r border-default-100 flex-col shrink-0">
          <nav className="flex-1 p-3 overflow-y-auto">
            <SidebarNavigation
              groups={userSidebarGroups}
              pathname={pathname}
              tone="light"
            />
          </nav>
          <div className="p-3 border-t border-default-100">
            <form action={signOut}>
              <Button
                type="submit"
                variant="flat"
                color="danger"
                size="sm"
                className="w-full"
              >
                ログアウト
              </Button>
            </form>
          </div>
        </aside>

        {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <aside className="fixed left-0 top-0 bottom-0 w-72 bg-white z-50 flex flex-col shadow-xl md:hidden">
            <div className="px-4 py-3 border-b border-default-100 flex items-center justify-between">
              <span className="text-lg font-bold text-primary">
                {APP_NAME}
              </span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="メニューを閉じる"
                className="p-2 rounded-lg text-default-400 hover:text-default-700 hover:bg-default-100"
              >
                <CloseIcon />
              </button>
            </div>
            <nav className="flex-1 p-3 overflow-y-auto">
              <SidebarNavigation
                groups={userSidebarGroups}
                pathname={pathname}
                tone="light"
                onNavigate={handleNavClick}
              />
            </nav>
            <div className="p-3 border-t border-default-100">
              <form action={signOut}>
                <Button
                  type="submit"
                  variant="flat"
                  color="danger"
                  size="sm"
                  className="w-full"
                >
                  ログアウト
                </Button>
              </form>
            </div>
          </aside>
        </>
      )}

        <main className="flex-1 p-4 md:p-6 overflow-auto min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
