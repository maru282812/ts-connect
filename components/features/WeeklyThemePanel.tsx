"use client";

import type { CommunityWeeklyTheme } from "@/types/database";

// ============================================================
// 週替わりテーマパネル（社内SNS 右カラム）
// 「何を書けばいいか分からない」を解消し投稿のきっかけを提供する。
// 第1弾リリースでは旧・社内報パネルの代わりにこれを表示する。
// ============================================================

function formatPeriod(startsOn: string, endsOn: string): string {
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("ja-JP", {
      month: "numeric",
      day: "numeric",
    });
  return `${fmt(startsOn)} 〜 ${fmt(endsOn)}`;
}

interface WeeklyThemePanelProps {
  active: CommunityWeeklyTheme | null;
  upcoming: CommunityWeeklyTheme[];
  onUse: () => void;
}

export function WeeklyThemePanel({
  active,
  upcoming,
  onUse,
}: WeeklyThemePanelProps) {
  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-blue-100 bg-blue-100/60 px-4 py-2.5">
          <span className="text-base">✨</span>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
            今週のテーマ
          </span>
        </div>
        <div className="p-4">
          {active ? (
            <>
              <h3 className="text-base font-bold text-slate-900">
                {active.title}
              </h3>
              <p className="mt-1 text-xs text-slate-400">
                {formatPeriod(active.starts_on, active.ends_on)}
              </p>
              {active.description && (
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {active.description}
                </p>
              )}
              <button
                type="button"
                onClick={onUse}
                className="mt-4 w-full rounded-lg bg-blue-600 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
              >
                このテーマで投稿する
              </button>
            </>
          ) : (
            <p className="py-4 text-center text-sm text-slate-400">
              今週のテーマはまだ設定されていません
            </p>
          )}
        </div>
      </div>

      {upcoming.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">
            次回以降のテーマ
          </p>
          <ul className="space-y-3">
            {upcoming.map((t) => (
              <li key={t.id} className="flex flex-col">
                <span className="text-sm font-medium text-slate-700">
                  {t.title}
                </span>
                <span className="text-[11px] text-slate-400">
                  {formatPeriod(t.starts_on, t.ends_on)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
