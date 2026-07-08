"use client";

import { useMemo, useState } from "react";

type ModStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "NG_WORD";

interface Report {
  id: string;
  target: string;
  targetId: string;
  kind: string;
  reason: string;
  reasonTone: string;
  severity: "高" | "中" | "低";
  severityTone: string;
  status: ModStatus;
  statusLabel: string;
  receivedAt: string;
}

const TABS: { key: ModStatus; label: string; badge?: string }[] = [
  { key: "OPEN", label: "未対応", badge: "12" },
  { key: "IN_PROGRESS", label: "対応中", badge: "3" },
  { key: "RESOLVED", label: "対応済み" },
  { key: "NG_WORD", label: "NGワード検知" },
];

const REPORTS: Report[] = [
  {
    id: "r-1",
    target: "昨日のプロジェクト会議について...",
    targetId: "#POST-9023",
    kind: "SNS投稿",
    reason: "不適切な表現",
    reasonTone: "bg-red-100 text-red-700",
    severity: "高",
    severityTone: "bg-red-500 text-white",
    status: "OPEN",
    statusLabel: "未対応",
    receivedAt: "2023/10/24 14:20",
  },
  {
    id: "r-2",
    target: "佐藤 健二 (プロフィール)",
    targetId: "#USER-5582",
    kind: "プロフィール",
    reason: "スパム疑い",
    reasonTone: "bg-amber-100 text-amber-700",
    severity: "中",
    severityTone: "bg-amber-500 text-white",
    status: "IN_PROGRESS",
    statusLabel: "保留中",
    receivedAt: "2023/10/24 12:45",
  },
  {
    id: "r-3",
    target: "秋のオフィス改善案について",
    targetId: "#PLAN-302",
    kind: "企画・アイデア",
    reason: "NGワード検知",
    reasonTone: "bg-default-100 text-default-700 border border-default-300",
    severity: "低",
    severityTone: "bg-green-500 text-white",
    status: "NG_WORD",
    statusLabel: "未対応",
    receivedAt: "2023/10/24 09:12",
  },
];

export function ModerationClient() {
  const [tab, setTab] = useState<ModStatus>("OPEN");

  const visible = useMemo(() => REPORTS.filter((r) => r.status === tab), [tab]);

  return (
    <div className="max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-end gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-default-900">
              通報・モデレーション管理
            </h1>
            <span className="bg-default-200 text-default-600 px-2 py-0.5 rounded text-[10px] font-bold">
              A-11
            </span>
          </div>
          <p className="text-default-500 text-sm">
            ユーザー投稿およびプロフィールの健全性を維持するための管理コンソール
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="bg-white border border-default-300 px-4 py-2 rounded-lg text-xs font-bold hover:bg-default-50 shadow-sm"
          >
            一括更新
          </button>
          <button
            type="button"
            className="bg-primary text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-primary/90 shadow-sm"
          >
            レポート出力
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-8 mb-6 border-b border-default-200">
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`pb-3 border-b-2 text-sm flex items-center gap-2 transition-colors ${
                active
                  ? "border-primary text-primary font-bold"
                  : "border-transparent text-default-500 hover:text-default-800"
              }`}
            >
              {t.label}
              {t.badge && (
                <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                  {t.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Table */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-default-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-default-50 border-b border-default-200">
                <tr>
                  <th className="p-3 text-[11px] font-bold text-default-500 uppercase">
                    対象
                  </th>
                  <th className="p-3 text-[11px] font-bold text-default-500 uppercase">
                    種別
                  </th>
                  <th className="p-3 text-[11px] font-bold text-default-500 uppercase">
                    通報理由
                  </th>
                  <th className="p-3 text-[11px] font-bold text-default-500 uppercase text-center">
                    重要度
                  </th>
                  <th className="p-3 text-[11px] font-bold text-default-500 uppercase">
                    状態
                  </th>
                  <th className="p-3 text-[11px] font-bold text-default-500 uppercase">
                    受付日時
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-default-100">
                {visible.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-8 text-center text-sm text-default-400"
                    >
                      該当する通報はありません
                    </td>
                  </tr>
                ) : (
                  visible.map((r) => (
                    <tr
                      key={r.id}
                      className="hover:bg-default-50 transition-colors cursor-pointer"
                    >
                      <td className="p-3">
                        <p className="text-xs font-bold truncate max-w-[200px]">
                          {r.target}
                        </p>
                        <p className="text-[10px] text-default-400">
                          ID: {r.targetId}
                        </p>
                      </td>
                      <td className="p-3 text-xs">{r.kind}</td>
                      <td className="p-3">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-bold ${r.reasonTone}`}
                        >
                          {r.reason}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${r.severityTone}`}
                        >
                          {r.severity}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="text-xs text-default-600">
                          {r.statusLabel}
                        </span>
                      </td>
                      <td className="p-3 text-[11px] text-default-500">
                        {r.receivedAt}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="p-3 bg-default-50 border-t border-default-200 flex items-center justify-between text-[11px] text-default-500">
            <span>表示中: 1-{visible.length} / 合計 15件</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="px-2 py-1 border border-default-300 rounded bg-white hover:bg-default-100"
              >
                前へ
              </button>
              <button
                type="button"
                className="px-2 py-1 border border-default-300 rounded bg-white hover:bg-default-100"
              >
                次へ
              </button>
            </div>
          </div>
        </div>

        {/* Detail preview */}
        <aside className="bg-white rounded-xl border border-default-200 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-default-200 bg-default-50">
            <h3 className="font-bold text-sm text-default-800">
              詳細プレビュー
            </h3>
          </div>
          <div className="p-5 flex flex-col gap-6 flex-grow">
            <section>
              <span className="block text-[10px] font-bold text-default-500 uppercase mb-2">
                投稿内容
              </span>
              <div className="p-4 bg-default-50 rounded-lg border border-default-100 text-xs leading-relaxed text-default-800">
                <p className="mb-2">
                  昨日のプロジェクト会議についてですが、ハッキリ言って方針がゴミすぎて話になりません。こんなリーダーシップでは会社が潰れるのも時間の問題だと思います。
                </p>
                <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded border border-red-200 font-bold">
                  検知ワード: ゴミ
                </span>
              </div>
            </section>
            <section className="grid grid-cols-2 gap-4">
              <div>
                <span className="block text-[10px] font-bold text-default-500 uppercase mb-1">
                  通報者
                </span>
                <span className="text-xs font-medium">田中 結衣</span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-default-500 uppercase mb-1">
                  投稿者
                </span>
                <span className="text-xs font-medium text-red-500">
                  山本 駿介
                </span>
              </div>
              <div className="col-span-2">
                <span className="block text-[10px] font-bold text-default-500 uppercase mb-1">
                  通報理由
                </span>
                <p className="text-xs text-default-600">
                  誹謗中傷、不適切な表現が含まれているため
                </p>
              </div>
            </section>
            <section className="mt-auto">
              <span className="block text-[10px] font-bold text-default-500 uppercase mb-2">
                対応メモ (内部用)
              </span>
              <textarea
                className="w-full h-24 border border-default-300 rounded-lg text-xs p-3 focus:ring-2 focus:ring-primary outline-none resize-none"
                placeholder="対応の経緯や理由を入力してください..."
              />
            </section>
          </div>
          <div className="p-4 bg-default-50 border-t border-default-200 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                className="bg-white border border-default-300 text-default-700 px-3 py-2 rounded text-xs font-bold hover:bg-default-100 shadow-sm"
              >
                注意を送信
              </button>
              <button
                type="button"
                className="bg-white border border-default-300 text-default-700 px-3 py-2 rounded text-xs font-bold hover:bg-default-100 shadow-sm"
              >
                問題なし(閉じる)
              </button>
            </div>
            <button
              type="button"
              className="w-full bg-red-500 text-white px-3 py-2 rounded text-xs font-bold hover:opacity-90"
            >
              この投稿を非表示にする
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
