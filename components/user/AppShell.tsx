"use client";

import { Button } from "@heroui/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { GlobalSearch } from "@/components/common/GlobalSearch";
import { SidebarNavigation } from "@/components/common/SidebarNavigation";
import { BottomTabBar } from "@/components/user/BottomTabBar";
import { APP_NAME } from "@/constants/appConstants";
import { getSidebarGroups } from "@/constants/navigationParts";
import { signOut } from "@/lib/auth/actions";

const userSidebarGroups = getSidebarGroups({
  surface: "user",
  role: "USER",
  includePlanned: true,
});

interface AppShellProps {
  displayName: string;
  email: string;
  children: React.ReactNode;
}

export function AppShell({ displayName, email, children }: AppShellProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen flex-col bg-blue-50">
      <header className="z-40 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-default-100 bg-white px-4 md:px-8">
        <div className="flex min-w-0 items-center gap-3 md:gap-8">
          <span className="whitespace-nowrap text-lg font-bold text-primary">
            {APP_NAME}
          </span>

          <GlobalSearch surface="user" />
        </div>

        <div className="flex shrink-0 items-center gap-2 md:gap-4">
          {/* ポイント表示は第1弾リリースでは非表示（memory/release_scope_phase1.md） */}
          {/* 通知ベルは通知機能が入るまで保留（実体のないダミー導線を作らない） */}

          <Link
            href="/app/settings"
            aria-label="マイページ"
            className="flex items-center gap-3 border-l border-default-100 pl-2 md:pl-3"
          >
            <div className="hidden text-right sm:block">
              <p className="max-w-[140px] truncate text-sm font-medium leading-tight text-default-800">
                {displayName}
              </p>
              <p className="max-w-[140px] truncate text-xs text-default-400">
                {email}
              </p>
            </div>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
              {displayName.charAt(0)}
            </div>
          </Link>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-60 shrink-0 flex-col border-r border-default-100 bg-white md:flex">
          <nav className="flex-1 overflow-y-auto p-3">
            <SidebarNavigation
              groups={userSidebarGroups}
              pathname={pathname}
              tone="light"
            />
          </nav>
          <div className="border-t border-default-100 p-3">
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

        {/* メイン。スマホは下タブ分の余白を確保（PCは従来通り） */}
        <main className="min-w-0 flex-1 overflow-auto p-4 pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:p-6 md:pb-6">
          {children}
        </main>
      </div>

      {/* モバイル用ボトムタブ（md:hidden）。PCは上のサイドバーがナビ。 */}
      <BottomTabBar />
    </div>
  );
}
