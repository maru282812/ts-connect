"use client";

import { useState } from "react";

const PERIODS = ["今日", "7日間", "30日間", "カスタム"] as const;
type Period = (typeof PERIODS)[number];

const KPIS = [
  { label: "投稿閲覧数", value: "24,502", delta: "+12%", up: true },
  { label: "企画投稿数", value: "158", delta: "+5%", up: true },
  { label: "総いいね数", value: "8,920", delta: "-2%", up: false },
  { label: "困りごと閲覧数", value: "3,412", delta: "+20%", up: true },
  { label: "グッズ閲覧数", value: "1,280", delta: "+8%", up: true },
];

const CHART = [
  { label: "5/1", view: 40, like: 20 },
  { label: "5/5", view: 55, like: 25 },
  { label: "5/10", view: 70, like: 35 },
  { label: "5/15", view: 45, like: 15 },
  { label: "5/20", view: 85, like: 40 },
  { label: "5/24", view: 95, like: 45 },
];

const TAGS = [
  { tag: "#働き方改革", size: "text-lg font-bold" },
  { tag: "#リモートワーク", size: "text-sm" },
  { tag: "#福利厚生", size: "text-xl font-extrabold" },
  { tag: "#社内イベント", size: "text-xs" },
  { tag: "#DX推進", size: "text-base font-bold" },
  { tag: "#スキルアップ", size: "text-sm" },
  { tag: "#キャリア支援", size: "text-base font-bold" },
  { tag: "#メンタルヘルス", size: "text-xs" },
  { tag: "#ChatGPT", size: "text-sm font-bold" },
  { tag: "#新人研修", size: "text-xs" },
];

const RANKINGS: {
  title: string;
  rows: { rank: number; main: string; sub: string }[];
}[] = [
  {
    title: "困りごとランキング",
    rows: [
      {
        rank: 1,
        main: "新PCのセットアップ方法が不明",
        sub: "閲覧: 428 / 提案: 12",
      },
      { rank: 2, main: "VPN接続が頻繁に切れる", sub: "閲覧: 385 / 提案: 8" },
    ],
  },
  {
    title: "反応の多い企画",
    rows: [
      {
        rank: 1,
        main: "夏季限定アイスコーヒー導入案",
        sub: "❤ 215 / 田中 太郎",
      },
    ],
  },
  {
    title: "人気プロフィール",
    rows: [{ rank: 1, main: "高橋 亜美", sub: "閲覧: 562" }],
  },
  {
    title: "グッズ閲覧",
    rows: [
      {
        rank: 1,
        main: "ロゴ入り真空断熱タンブラー",
        sub: "閲覧: 205 / 申請: 45",
      },
    ],
  },
];

export function AnalyticsClient() {
  const [period, setPeriod] = useState<Period>("30日間");

  return (
    <div className="max-w-7xl mx-auto w-full space-y-6">
      {/* Title */}
      <div className="flex flex-wrap items-center gap-4">
        <h1 className="text-xl font-bold text-default-900">分析・行動ログ</h1>
        <span className="bg-primary-50 text-primary px-3 py-0.5 rounded-full text-xs font-bold">
          A-13
        </span>
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="h-9 px-4 border border-default-200 text-default-600 font-bold rounded-lg hover:bg-default-50 text-sm"
          >
            CSVエクスポート
          </button>
          <button
            type="button"
            className="h-9 px-4 border border-default-200 text-default-600 font-bold rounded-lg hover:bg-default-50 text-sm"
          >
            CSVインポート
          </button>
        </div>
      </div>

      {/* Filters */}
      <section className="bg-white p-6 rounded-xl border border-default-200 flex flex-wrap items-end gap-6">
        <div className="space-y-1.5">
          <span className="block text-xs text-default-500">分析期間</span>
          <div className="flex bg-default-100 rounded-lg p-1">
            {PERIODS.map((p) => {
              const active = period === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriod(p)}
                  className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
                    active
                      ? "bg-white shadow-sm text-primary"
                      : "hover:bg-white/50"
                  }`}
                >
                  {p}
                </button>
              );
            })}
          </div>
        </div>
        <div className="space-y-1.5 flex-1 min-w-[200px]">
          <span className="block text-xs text-default-500">会社/部署</span>
          <select className="w-full h-10 px-4 rounded-lg border border-default-200 text-sm focus:ring-2 focus:ring-primary outline-none">
            <option>全社一括</option>
            <option>開発本部</option>
            <option>営業推進部</option>
            <option>人事総務部</option>
          </select>
        </div>
        <div className="space-y-1.5 flex-1 min-w-[200px]">
          <span className="block text-xs text-default-500">カテゴリ</span>
          <select className="w-full h-10 px-4 rounded-lg border border-default-200 text-sm focus:ring-2 focus:ring-primary outline-none">
            <option>全カテゴリ</option>
            <option>投稿</option>
            <option>困りごと</option>
            <option>企画・アイデア</option>
            <option>社員検索</option>
            <option>グッズ</option>
          </select>
        </div>
        <button
          type="button"
          className="h-10 px-6 bg-primary text-white font-bold rounded-lg hover:bg-primary/90"
        >
          適用する
        </button>
      </section>

      {/* KPI cards */}
      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {KPIS.map((k) => (
          <div
            key={k.label}
            className="bg-white p-5 rounded-xl border border-default-200"
          >
            <div className="flex justify-end mb-2">
              <span
                className={`font-bold text-xs ${
                  k.up ? "text-green-600" : "text-red-500"
                }`}
              >
                {k.delta}
              </span>
            </div>
            <p className="text-sm text-default-500">{k.label}</p>
            <h3 className="text-2xl font-bold text-default-900 mt-1">
              {k.value}
            </h3>
            <p className="text-[10px] text-default-400 mt-2 italic">
              vs 前月同期
            </p>
          </div>
        ))}
      </section>

      {/* Chart + tag cloud */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-default-200">
          <div className="flex justify-between items-center mb-8">
            <h4 className="font-bold text-default-800 flex items-center gap-2">
              <span className="w-1 h-5 bg-primary rounded-full" />
              日別アクション推移
            </h4>
            <div className="flex gap-4 text-sm text-default-500">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-primary" />
                閲覧
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-pink-400" />
                いいね
              </span>
            </div>
          </div>
          <div className="h-64 w-full flex items-end justify-between gap-2 border-b border-l border-default-200 pb-2 pl-2">
            {CHART.map((c) => (
              <div
                key={c.label}
                className="flex-1 flex flex-col items-center justify-end group cursor-pointer h-full"
              >
                <div
                  className="w-full bg-primary/30 group-hover:bg-primary/50 rounded-t-sm transition-all"
                  style={{ height: `${c.view}%` }}
                />
                <div
                  className="w-full bg-pink-400/30 group-hover:bg-pink-400/50 rounded-t-sm transition-all"
                  style={{ height: `${c.like}%` }}
                />
                <p className="text-[10px] text-default-400 mt-2">{c.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-default-200">
          <h4 className="font-bold text-default-800 flex items-center gap-2 mb-6">
            <span className="w-1 h-5 bg-teal-500 rounded-full" />
            人気タグ分布
          </h4>
          <div className="flex flex-wrap gap-2 content-start">
            {TAGS.map((t) => (
              <span
                key={t.tag}
                className={`px-3 py-1.5 bg-primary-50 text-primary rounded-full cursor-default ${t.size}`}
              >
                {t.tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Rankings */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {RANKINGS.map((r) => (
          <div
            key={r.title}
            className="bg-white rounded-xl border border-default-200 overflow-hidden flex flex-col"
          >
            <div className="p-4 border-b border-default-200 bg-default-50 flex items-center justify-between">
              <h5 className="font-bold text-default-700 text-sm">{r.title}</h5>
              <button
                type="button"
                className="text-primary text-xs hover:underline"
              >
                詳細
              </button>
            </div>
            <div className="divide-y divide-default-100">
              {r.rows.map((row) => (
                <div
                  key={row.rank}
                  className="p-4 hover:bg-default-50 transition-colors flex items-center gap-3"
                >
                  <div className="font-bold text-primary w-5">{row.rank}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate font-bold text-default-800">
                      {row.main}
                    </p>
                    <p className="text-[10px] text-default-500 mt-1">
                      {row.sub}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
