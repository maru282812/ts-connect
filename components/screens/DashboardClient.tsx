"use client";

import Link from "next/link";

type KpiTone = "alert" | "normal";

const KPIS: {
  label: string;
  value: string;
  tone: KpiTone;
  href: string;
  note: string;
}[] = [
  {
    label: "公開中の困りごと",
    value: "32",
    tone: "normal",
    href: "/company/issues",
    note: "募集中の総数",
  },
  {
    label: "新着の提案",
    value: "18",
    tone: "normal",
    href: "/company/ideas-feed",
    note: "未確認の提案",
  },
  {
    label: "採用待ち",
    value: "5",
    tone: "alert",
    href: "/company/ideas-feed?status=review",
    note: "採否判断が必要",
  },
  {
    label: "報酬確定待ち",
    value: "3",
    tone: "alert",
    href: "/company/rewards",
    note: "支給処理が必要",
  },
  {
    label: "通報 未対応",
    value: "7",
    tone: "alert",
    href: "/company/moderation",
    note: "確認が必要",
  },
];

const TODOS: {
  category: string;
  title: string;
  meta: string;
  href: string;
  tone: KpiTone;
}[] = [
  {
    category: "通報",
    title: "不適切な投稿として通報されたコメント",
    meta: "2時間前 / 社内SNS",
    href: "/company/moderation",
    tone: "alert",
  },
  {
    category: "採用判断",
    title: "夏季限定アイスコーヒー導入案",
    meta: "提案 12 / ❤ 215",
    href: "/company/ideas-feed",
    tone: "alert",
  },
  {
    category: "報酬確定",
    title: "VPN自動再接続ツールの企画",
    meta: "採用済み / 支給未処理",
    href: "/company/rewards",
    tone: "alert",
  },
  {
    category: "承認待ち",
    title: "新オフィスレイアウト提案の公開申請",
    meta: "昨日 / 田中 太郎",
    href: "/company/posts",
    tone: "normal",
  },
];

const POPULAR_IDEAS: { rank: number; title: string; meta: string }[] = [
  { rank: 1, title: "夏季限定アイスコーヒー導入案", meta: "❤ 215 / 提案 12" },
  { rank: 2, title: "リモート部活の補助制度", meta: "❤ 188 / 提案 9" },
  { rank: 3, title: "社内表彰のオンライン化", meta: "❤ 142 / 提案 6" },
];

const DEADLINE_ISSUES: { title: string; due: string; urgent: boolean }[] = [
  { title: "新PCのセットアップ手順の整備", due: "あと2日", urgent: true },
  { title: "VPN接続が頻繁に切れる", due: "あと4日", urgent: true },
  { title: "会議室予約システムの改善", due: "あと9日", urgent: false },
];

const RECENT_ACTIONS: { actor: string; action: string; at: string }[] = [
  { actor: "管理者A", action: "「VPN接続」企画を採用済みに変更", at: "10分前" },
  { actor: "管理者B", action: "通報コメントを非公開に設定", at: "1時間前" },
  { actor: "管理者A", action: "夏季ノベルティグッズを公開", at: "3時間前" },
];

const NG_WORD_HITS: { word: string; where: string; at: string }[] = [
  { word: "（伏字）", where: "社内SNSコメント", at: "30分前" },
  { word: "（伏字）", where: "困りごと本文", at: "2時間前" },
];

function SectionCard({
  title,
  accent,
  href,
  children,
}: {
  title: string;
  accent: string;
  href?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-default-200 overflow-hidden flex flex-col">
      <div className="p-4 border-b border-default-200 flex items-center justify-between">
        <h4 className="font-bold text-default-800 flex items-center gap-2 text-sm">
          <span className={`w-1 h-5 rounded-full ${accent}`} />
          {title}
        </h4>
        {href ? (
          <Link href={href} className="text-primary text-xs hover:underline">
            すべて見る
          </Link>
        ) : null}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

export function DashboardClient() {
  return (
    <div className="max-w-7xl mx-auto w-full space-y-6">
      {/* Title */}
      <div className="flex flex-wrap items-center gap-4">
        <h1 className="text-xl font-bold text-default-900">管理ダッシュボード</h1>
        <span className="bg-primary-50 text-primary px-3 py-0.5 rounded-full text-xs font-bold">
          A-01
        </span>
        <div className="flex-1" />
        <p className="text-xs text-default-400">運営状況の俯瞰と要対応の入口</p>
      </div>

      {/* KPI cards */}
      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {KPIS.map((k) => (
          <Link
            key={k.label}
            href={k.href}
            className={`block bg-white p-5 rounded-xl border transition-all hover:shadow-sm ${
              k.tone === "alert"
                ? "border-red-200 hover:border-red-300"
                : "border-default-200 hover:border-primary/40"
            }`}
          >
            <p className="text-sm text-default-500">{k.label}</p>
            <h3
              className={`text-3xl font-bold mt-1 ${
                k.tone === "alert" ? "text-red-500" : "text-default-900"
              }`}
            >
              {k.value}
            </h3>
            <p className="text-[10px] text-default-400 mt-2">{k.note}</p>
          </Link>
        ))}
      </section>

      {/* Main grid */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 対応が必要な項目（最重要・2カラム分） */}
        <div className="lg:col-span-2">
          <SectionCard title="対応が必要な項目" accent="bg-red-500">
            <div className="divide-y divide-default-100">
              {TODOS.map((t) => (
                <Link
                  key={t.title}
                  href={t.href}
                  className="flex items-center gap-4 p-4 hover:bg-default-50 transition-colors"
                >
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap ${
                      t.tone === "alert"
                        ? "bg-red-50 text-red-500"
                        : "bg-primary-50 text-primary"
                    }`}
                  >
                    {t.category}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-default-800 truncate">
                      {t.title}
                    </p>
                    <p className="text-[10px] text-default-500 mt-1">{t.meta}</p>
                  </div>
                  <span className="text-default-300 text-lg">›</span>
                </Link>
              ))}
            </div>
          </SectionCard>
        </div>

        {/* 期限が近い困りごと */}
        <SectionCard
          title="期限が近い困りごと"
          accent="bg-amber-500"
          href="/company/issues"
        >
          <div className="divide-y divide-default-100">
            {DEADLINE_ISSUES.map((d) => (
              <div key={d.title} className="p-4 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-default-800 truncate">
                    {d.title}
                  </p>
                </div>
                <span
                  className={`text-xs font-bold whitespace-nowrap ${
                    d.urgent ? "text-red-500" : "text-default-500"
                  }`}
                >
                  {d.due}
                </span>
              </div>
            ))}
          </div>
        </SectionCard>
      </section>

      {/* Secondary grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 反応の多い企画 */}
        <SectionCard
          title="反応の多い企画"
          accent="bg-primary"
          href="/company/ideas-feed"
        >
          <div className="divide-y divide-default-100">
            {POPULAR_IDEAS.map((p) => (
              <div key={p.rank} className="p-4 flex items-center gap-3">
                <span className="font-bold text-primary w-5">{p.rank}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-default-800 truncate">
                    {p.title}
                  </p>
                  <p className="text-[10px] text-default-500 mt-1">{p.meta}</p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* NGワード検知ログ */}
        <SectionCard
          title="NGワード検知ログ"
          accent="bg-rose-500"
          href="/company/ng-words"
        >
          <div className="divide-y divide-default-100">
            {NG_WORD_HITS.map((n, i) => (
              <div key={i} className="p-4 flex items-center gap-3">
                <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-500 text-xs font-bold">
                  {n.word}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-default-700 truncate">{n.where}</p>
                </div>
                <span className="text-[10px] text-default-400 whitespace-nowrap">
                  {n.at}
                </span>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* 最近の管理操作 */}
        <SectionCard
          title="最近の管理操作"
          accent="bg-teal-500"
          href="/company/analytics"
        >
          <div className="divide-y divide-default-100">
            {RECENT_ACTIONS.map((r, i) => (
              <div key={i} className="p-4">
                <p className="text-sm text-default-700">
                  <span className="font-bold text-default-800">{r.actor}</span>{" "}
                  が{r.action}
                </p>
                <p className="text-[10px] text-default-400 mt-1">{r.at}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      </section>
    </div>
  );
}
