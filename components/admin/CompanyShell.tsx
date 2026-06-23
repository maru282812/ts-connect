"use client";

import { Button } from "@heroui/react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { SidebarNavigation } from "@/components/common/SidebarNavigation";
import { APP_NAME } from "@/constants/appConstants";
import { getSidebarGroups } from "@/constants/navigationParts";
import { signOut } from "@/lib/auth/actions";
import type { SystemRole } from "@/types/database";

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

interface CompanyShellProps {
  displayName: string;
  email: string;
  systemRole: Extract<SystemRole, "ADMIN" | "MASTER_ADMIN">;
  children: React.ReactNode;
}

export function CompanyShell({
  displayName,
  email,
  systemRole,
  children,
}: CompanyShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const isOfficialRoute = pathname.startsWith("/company/posts/new/official");
  const sidebarGroups = getSidebarGroups({
    surface: "admin",
    role: systemRole,
    includePlannedGroupIds:
      systemRole === "MASTER_ADMIN" ? ["master-admin"] : [],
  });

  const handleNavClick = () => {
    setMobileMenuOpen(false);
  };

  const headerBg = isOfficialRoute
    ? "bg-blue-950 border-blue-900"
    : "bg-slate-800 border-slate-700";
  const headerTextSub = isOfficialRoute ? "text-blue-400" : "text-slate-400";
  const headerLabel = isOfficialRoute ? "公式案件 管理" : "管理画面";
  const avatarBg = isOfficialRoute ? "bg-blue-700" : "bg-blue-500";

  return (
    <div className="min-h-screen md:h-screen md:overflow-hidden bg-slate-100 flex">
      <aside className="hidden md:flex w-64 bg-slate-800 flex-col flex-shrink-0">
        <div className="px-5 py-4 border-b border-slate-700">
          <span className="text-lg font-bold text-white">{APP_NAME}</span>
          <span className="ml-2 text-xs text-slate-400">管理画面</span>
        </div>
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <SidebarNavigation
            groups={sidebarGroups}
            pathname={pathname}
            tone="dark"
          />
        </nav>
        <div className="px-3 py-4 border-t border-slate-700">
          <form action={signOut}>
            <Button
              type="submit"
              variant="flat"
              size="sm"
              className="w-full text-slate-300 hover:text-white"
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
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-800">
              <div>
                <span className="text-base font-bold text-white">
                  {APP_NAME}
                </span>
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
            <nav className="flex-1 px-3 py-4 overflow-y-auto bg-slate-800">
              <SidebarNavigation
                groups={sidebarGroups}
                pathname={pathname}
                tone="dark"
                onNavigate={handleNavClick}
              />
            </nav>
            <div className="p-3 border-t border-slate-700 bg-slate-800">
              <form action={signOut}>
                <Button
                  type="submit"
                  variant="flat"
                  size="sm"
                  className="w-full text-slate-300 hover:text-white"
                >
                  ログアウト
                </Button>
              </form>
            </div>
          </aside>
        </>
      )}

      <div className="flex-1 flex flex-col min-w-0 md:min-h-0">
        <header
          className={`${headerBg} px-4 md:px-6 py-3 flex items-center gap-3 sticky top-0 z-10 border-b`}
        >
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
            <span className={`ml-2 ${headerTextSub} hidden sm:inline`}>
              {headerLabel}
            </span>
          </div>

          <div className="flex items-center gap-2 md:gap-3 shrink-0">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-white truncate max-w-[140px]">
                {displayName}
              </p>
              <p className={`text-xs truncate max-w-[140px] ${headerTextSub}`}>
                {email}
              </p>
            </div>
            <div
              className={`w-9 h-9 ${avatarBg} rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0`}
            >
              {displayName.charAt(0)}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 md:overflow-auto">{children}</main>
      </div>
    </div>
  );
}
