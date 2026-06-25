"use client";

import { useState } from "react";

type TabKey = "CANDIDATES" | "PENDING" | "CONFIRMED" | "RULES";

const TABS: { key: TabKey; label: string }[] = [
  { key: "CANDIDATES", label: "支援候補" },
  { key: "PENDING", label: "報酬確定待ち" },
  { key: "CONFIRMED", label: "確定済み" },
  { key: "RULES", label: "ルール" },
];

const KPIS = [
  { label: "支援候補数", value: "12", hint: "いいね閾値を超えた企画" },
  { label: "報酬確定待ち", value: "4", hint: "承認待ち" },
  { label: "今月の支援額相当", value: "¥86,000", hint: "確定見込み含む" },
  { label: "完了企画数", value: "9", hint: "今期累計" },
];

interface RewardRow {
  id: string;
  idea: string;
  author: string;
  likes: number;
  amount: string;
  condition: string;
  status: string;
  confirmedBy: string;
  confirmedAt: string;
}

const ROWS_BY_TAB: Record<Exclude<TabKey, "RULES">, RewardRow[]> = {
  CANDIDATES: [
    {
      id: "r1",
      idea: "4Fスペースを社内カフェ風ラウンジへ",
      author: "田中 美咲",
      likes: 156,
      amount: "¥15,600 相当",
      condition: "いいね換算",
      status: "候補",
      confirmedBy: "-",
      confirmedAt: "-",
    },
    {
      id: "r2",
      idea: "ヘルプデスクFAQのナレッジベース整備",
      author: "渡辺 涼",
      likes: 88,
      amount: "¥8,800 相当",
      condition: "いいね換算",
      status: "候補",
      confirmedBy: "-",
      confirmedAt: "-",
    },
  ],
  PENDING: [
    {
      id: "r3",
      idea: "経費精算SaaS『楽精算』の試験導入",
      author: "佐藤 健",
      likes: 18,
      amount: "¥5,000 相当",
      condition: "採用報酬",
      status: "確定待ち",
      confirmedBy: "-",
      confirmedAt: "-",
    },
  ],
  CONFIRMED: [
    {
      id: "r4",
      idea: "会議室の備品管理ルールの策定",
      author: "高橋 さくら",
      likes: 89,
      amount: "¥3,000",
      condition: "採用報酬",
      status: "確定済み",
      confirmedBy: "管理部 山田",
      confirmedAt: "2026/05/30",
    },
  ],
};

const RULES = [
  { label: "1いいねあたりの換算額", value: "¥100" },
  { label: "月次上限", value: "¥100,000" },
  { label: "対象投稿種別", value: "企画・アイデア / 困りごと提案" },
];

export function RewardsClient() {
  const [tab, setTab] = useState<TabKey>("CANDIDATES");

  return (
    <div className="max-w-[1500px] mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-default-900">
          報酬・企画支援管理
        </h1>
        <p className="text-sm text-default-500 mt-1">
          いいね換算・支援額相当・報酬確定状態を管理します
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {KPIS.map((kpi) => (
          <div
            key={kpi.label}
            className="bg-white border border-default-200 rounded-xl p-4"
          >
            <p className="text-xs text-default-500">{kpi.label}</p>
            <p className="text-2xl font-bold text-default-900 mt-1">
              {kpi.value}
            </p>
            <p className="text-[11px] text-default-400 mt-1">{kpi.hint}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="mb-5 flex border-b border-default-200 overflow-x-auto">
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`px-5 py-3 text-sm whitespace-nowrap border-b-2 transition-colors ${
                active
                  ? "border-primary text-primary font-bold"
                  : "border-transparent text-default-500 font-medium hover:text-default-800"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {tab === "RULES" ? (
        <div className="bg-white border border-default-200 rounded-xl p-6 max-w-2xl">
          <h2 className="text-base font-bold text-default-900 mb-4">
            換算・支給ルール
          </h2>
          <dl className="divide-y divide-default-100">
            {RULES.map((r) => (
              <div
                key={r.label}
                className="flex items-center justify-between py-3"
              >
                <dt className="text-sm text-default-600">{r.label}</dt>
                <dd className="text-sm font-bold text-default-900">
                  {r.value}
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-xs text-default-400">
            ※ 決済や自動支給ではなく、表示・確定記録の管理です。
          </p>
        </div>
      ) : (
        <div className="bg-white border border-default-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-default-50 text-left text-xs text-default-500">
                  <th className="px-4 py-3 font-bold">企画名</th>
                  <th className="px-4 py-3 font-bold">提案者</th>
                  <th className="px-4 py-3 font-bold">いいね</th>
                  <th className="px-4 py-3 font-bold">換算額相当</th>
                  <th className="px-4 py-3 font-bold">条件</th>
                  <th className="px-4 py-3 font-bold">状態</th>
                  <th className="px-4 py-3 font-bold">操作</th>
                </tr>
              </thead>
              <tbody>
                {ROWS_BY_TAB[tab].map((row) => (
                  <tr
                    key={row.id}
                    className="border-t border-default-100 hover:bg-default-50"
                  >
                    <td className="px-4 py-3 font-semibold text-default-800">
                      {row.idea}
                    </td>
                    <td className="px-4 py-3 text-default-700">{row.author}</td>
                    <td className="px-4 py-3 text-default-700">{row.likes}</td>
                    <td className="px-4 py-3 font-bold text-default-900">
                      {row.amount}
                    </td>
                    <td className="px-4 py-3 text-default-600">
                      {row.condition}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 text-xs rounded font-bold bg-amber-100 text-amber-700">
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary/90"
                      >
                        {tab === "CONFIRMED" ? "詳細" : "確定する"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
