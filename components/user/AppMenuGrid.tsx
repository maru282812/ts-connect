"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavigationIcon } from "@/components/common/NavigationIcon";
import { getSidebarGroups } from "@/constants/navigationParts";

// ============================================================
// 全機能への遷移先グリッド（アイコンタイル）
// 「もっと」ページとホーム画面下部で共用する。
// 表示項目は navigationParts の user グループ × CURRENT_RELEASE_ITEM_IDS。
// サイドバーと同じ getSidebarGroups を使い、リリース制御を二重管理しない。
// ============================================================

// 従業員向けメニューは全ロール共通（各項目の roles に USER を含む）。
const menuGroups = getSidebarGroups({ surface: "user", role: "USER" });

interface AppMenuGridProps {
  /** グループ見出し（利用メニュー/コミュニティ/コンテンツ）を表示するか */
  showGroupLabels?: boolean;
}

export function AppMenuGrid({ showGroupLabels = true }: AppMenuGridProps) {
  const pathname = usePathname();

  return (
    <div className="space-y-5">
      {menuGroups.map((group) => (
        <section key={group.id}>
          {showGroupLabels && (
            <h3 className="mb-2 px-1 text-[11px] font-bold uppercase tracking-wider text-default-400">
              {group.label}
            </h3>
          )}
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {group.items.map((item) => {
              const active = item.matchHrefs.some((href) =>
                pathname.startsWith(href),
              );
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-colors ${
                    active
                      ? "border-primary bg-primary-50 text-primary"
                      : "border-default-200 bg-white text-default-600 hover:bg-default-50"
                  }`}
                >
                  <NavigationIcon name={item.icon} className="h-6 w-6" />
                  <span className="text-[11px] font-medium leading-tight">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
