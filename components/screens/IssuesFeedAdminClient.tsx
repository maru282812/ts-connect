"use client";

import Link from "next/link";
import { useState } from "react";

type FeedTab = "LIST" | "REQUESTS";

const TABS: { key: FeedTab; label: string; badge?: string }[] = [
  { key: "LIST", label: "困りごと一覧" },
  { key: "REQUESTS", label: "相談リクエスト", badge: "12" },
];

const KPIS = [
  { label: "総案件数", value: "128", accent: "border-primary", delta: "+5" },
  { label: "募集中", value: "42", accent: "border-green-500" },
  { label: "検討中・未着手", value: "18", accent: "border-amber-500" },
  {
    label: "今月の解決数",
    value: "24",
    accent: "border-indigo-500",
    note: "達成率 80%",
  },
  {
    label: "相談リクエスト数",
    value: "12",
    accent: "border-red-500",
    badge: "3",
  },
];

interface IssueRow {
  id: string;
  status: string;
  statusTone: string;
  title: string;
  code: string;
  area: string;
  vendor: string;
  proposals: number;
  proposalTone?: string;
  likes: number;
  reward: string;
  deadline: string;
  deadlineTone?: string;
  published: boolean;
}

const ISSUE_ROWS: IssueRow[] = [
  {
    id: "WM-2024-001",
    status: "募集中",
    statusTone: "bg-blue-100 text-blue-700",
    title: "新規事業の市場調査代行",
    code: "WM-2024-001",
    area: "営業・マーケティング",
    vendor: "株式会社リードコンサル",
    proposals: 12,
    likes: 45,
    reward: "50,000円〜",
    deadline: "2024/11/30",
    published: true,
  },
  {
    id: "WM-2024-005",
    status: "提案確認中",
    statusTone: "bg-default-200 text-default-700",
    title: "社内Wikiの構築と運用整備",
    code: "WM-2024-005",
    area: "情報システム",
    vendor: "ワークスソリューション",
    proposals: 3,
    proposalTone: "text-primary",
    likes: 12,
    reward: "成果報酬型",
    deadline: "2024/10/25",
    deadlineTone: "text-red-500",
    published: true,
  },
  {
    id: "WM-2023-098",
    status: "解決済み",
    statusTone: "bg-green-100 text-green-700",
    title: "英語圏向け契約書のリーガルチェック",
    code: "WM-2023-098",
    area: "法務・知財",
    vendor: "グローバル法務事務所",
    proposals: 1,
    likes: 8,
    reward: "150,000円",
    deadline: "2023/12/20",
    published: false,
  },
  {
    id: "WM-2024-012",
    status: "募集中",
    statusTone: "bg-blue-100 text-blue-700",
    title: "技術広報用のブログ記事執筆",
    code: "WM-2024-012",
    area: "広報・テックPR",
    vendor: "-",
    proposals: 0,
    proposalTone: "text-red-500",
    likes: 5,
    reward: "10,000円/件",
    deadline: "2024/11/15",
    published: true,
  },
];

type ReqStatus = "OPEN" | "REVIEWING" | "CONVERTED" | "DISMISSED";

interface ReqRow {
  id: string;
  status: ReqStatus;
  title: string;
  area: string;
  requester: string;
  company: string;
  urgency: "高" | "中" | "低";
  urgencyTone: string;
  receivedAt: string;
}

const REQ_STATUS_META: Record<ReqStatus, { label: string; badge: string }> = {
  OPEN: { label: "未対応", badge: "bg-red-100 text-red-700" },
  REVIEWING: { label: "確認中", badge: "bg-blue-100 text-blue-700" },
  CONVERTED: {
    label: "困りごと化済み",
    badge: "bg-indigo-100 text-indigo-700",
  },
  DISMISSED: { label: "見送り", badge: "bg-default-200 text-default-600" },
};

const REQ_ROWS: ReqRow[] = [
  {
    id: "REQ-20231024-001",
    status: "OPEN",
    title: "基幹システムのパフォーマンス劣化",
    area: "ITインフラ / サーバー",
    requester: "田中 太郎",
    company: "株式会社テクノロジー",
    urgency: "高",
    urgencyTone: "text-red-600",
    receivedAt: "2023/10/24",
  },
  {
    id: "REQ-20231022-002",
    status: "REVIEWING",
    title: "新卒採用におけるミスマッチの解消",
    area: "人事・労務 / 採用",
    requester: "佐藤 美咲",
    company: "キャリア・パートナーズ",
    urgency: "中",
    urgencyTone: "text-amber-600",
    receivedAt: "2023/10/22",
  },
  {
    id: "REQ-20231020-003",
    status: "CONVERTED",
    title: "リモートワーク下での情報セキュリティ",
    area: "セキュリティ / 運用",
    requester: "鈴木 一郎",
    company: "デジタル・フロンティア",
    urgency: "低",
    urgencyTone: "text-default-500",
    receivedAt: "2023/10/20",
  },
];

export function IssuesFeedAdminClient({
  basePath = "/company/issues-feed",
}: {
  basePath?: string;
}) {
  const [tab, setTab] = useState<FeedTab>("LIST");

  return (
    <div className="max-w-[1600px] mx-auto w-full space-y-8">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-default-900">困りごと</h1>
          <p className="text-sm text-default-500 mt-1">
            投稿された困りごとのステータス管理、提案状況の確認、相談リクエストの対応が行えます。
          </p>
        </div>
        <Link
          href={`${basePath}/new`}
          className="bg-primary text-white px-6 py-2.5 rounded-lg font-bold text-sm hover:bg-primary/90 shadow-sm"
        >
          ＋ 新規困りごと作成
        </Link>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {KPIS.map((k) => (
          <div
            key={k.label}
            className={`bg-white p-6 rounded-xl border border-default-200 border-l-4 ${k.accent}`}
          >
            <p className="text-sm text-default-500 mb-2">{k.label}</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-default-900">
                {k.value}
              </span>
              {k.note && (
                <span className="text-xs text-default-500">{k.note}</span>
              )}
              {k.badge && (
                <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                  {k.badge}
                </span>
              )}
            </div>
            {k.delta && (
              <div className="mt-3 text-green-600 text-xs font-bold">
                ↑ {k.delta}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-default-200">
        <nav className="flex gap-8">
          {TABS.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`pb-4 text-base transition-colors flex items-center gap-2 ${
                  active
                    ? "text-primary border-b-2 border-primary font-bold"
                    : "text-default-500 hover:text-default-800 font-medium"
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
        </nav>
      </div>

      {tab === "LIST" ? (
        <IssueListTab basePath={basePath} />
      ) : (
        <RequestsTab basePath={basePath} />
      )}

      {/* あなたの困りごとを相談する（右下固定・U-02r へ遷移） */}
      <Link
        href={`${basePath}/consult`}
        className="fixed bottom-6 right-6 z-30 inline-flex items-center gap-2 bg-primary text-white pl-5 pr-6 py-3.5 rounded-full text-sm font-bold shadow-lg hover:bg-primary/90 active:scale-95 transition-all"
      >
        <ChatIcon />
        あなたの困りごとを相談する
      </Link>
    </div>
  );
}

function ChatIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function IssueListTab({ basePath }: { basePath: string }) {
  return (
    <div className="space-y-6">
      {/* Search panel */}
      <div className="bg-default-50 p-6 rounded-xl border border-default-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            className="w-full px-4 py-2 bg-white border border-default-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
            placeholder="キーワードで検索"
            type="text"
          />
          <select className="w-full px-4 py-2 bg-white border border-default-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none">
            <option>全てのステータス</option>
            <option>募集中</option>
            <option>提案確認中</option>
            <option>解決済み</option>
          </select>
          <select className="w-full px-4 py-2 bg-white border border-default-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none">
            <option>部署/業務領域</option>
            <option>人事・採用</option>
            <option>エンジニアリング</option>
            <option>営業・販促</option>
          </select>
          <div className="flex gap-2">
            <button
              type="button"
              className="flex-1 bg-default-200 text-default-700 px-4 py-2 rounded-lg font-bold text-sm hover:bg-default-300"
            >
              クリア
            </button>
            <button
              type="button"
              className="flex-1 bg-primary text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-primary/90"
            >
              検索
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-default-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-default-50 border-b border-default-200">
              <tr className="text-xs text-default-500">
                <th className="px-4 py-4 font-bold">状態</th>
                <th className="px-4 py-4 font-bold">タイトル</th>
                <th className="px-4 py-4 font-bold">部署/業務領域</th>
                <th className="px-4 py-4 font-bold">対応会社</th>
                <th className="px-4 py-4 font-bold text-center">提案数</th>
                <th className="px-4 py-4 font-bold text-center">いいね</th>
                <th className="px-4 py-4 font-bold">報酬条件</th>
                <th className="px-4 py-4 font-bold">募集期限</th>
                <th className="px-4 py-4 font-bold">公開状態</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-default-100">
              {ISSUE_ROWS.map((r) => (
                <tr
                  key={r.id}
                  className="hover:bg-default-50 transition-colors"
                >
                  <td className="px-4 py-4">
                    <span
                      className={`px-2 py-1 text-[11px] font-bold rounded ${r.statusTone}`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <Link
                      href={`${basePath}/${r.id}`}
                      className="text-sm font-bold text-default-800 hover:text-primary"
                    >
                      {r.title}
                    </Link>
                    <p className="text-[11px] text-default-400 mt-0.5">
                      ID: {r.code}
                    </p>
                  </td>
                  <td className="px-4 py-4 text-sm text-default-600">
                    {r.area}
                  </td>
                  <td className="px-4 py-4 text-sm text-default-600">
                    {r.vendor}
                  </td>
                  <td
                    className={`px-4 py-4 text-center text-sm font-bold ${r.proposalTone ?? "text-default-800"}`}
                  >
                    {r.proposals}
                  </td>
                  <td className="px-4 py-4 text-center text-sm text-default-500">
                    ❤ {r.likes}
                  </td>
                  <td className="px-4 py-4 text-sm font-medium text-default-700">
                    {r.reward}
                  </td>
                  <td
                    className={`px-4 py-4 text-sm ${r.deadlineTone ?? "text-default-600"}`}
                  >
                    {r.deadline}
                  </td>
                  <td className="px-4 py-4">
                    <span className="flex items-center gap-2 text-sm text-default-600">
                      <span
                        className={`w-2 h-2 rounded-full ${r.published ? "bg-green-500" : "bg-default-300"}`}
                      />
                      {r.published ? "公開" : "非公開"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-default-100 flex items-center justify-between">
          <p className="text-sm text-default-500">全 124 件中 1-10 件を表示</p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="w-8 h-8 flex items-center justify-center rounded bg-primary text-white font-bold text-sm"
            >
              1
            </button>
            <button
              type="button"
              className="w-8 h-8 flex items-center justify-center rounded border border-default-200 hover:bg-default-50 text-sm"
            >
              2
            </button>
            <button
              type="button"
              className="w-8 h-8 flex items-center justify-center rounded border border-default-200 hover:bg-default-50 text-sm"
            >
              3
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function RequestsTab({ basePath }: { basePath: string }) {
  const [selectedId, setSelectedId] = useState<string>(REQ_ROWS[0].id);
  const selected = REQ_ROWS.find((r) => r.id === selectedId) ?? REQ_ROWS[0];
  const meta = REQ_STATUS_META[selected.status];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Table */}
      <div className="lg:col-span-2 bg-white border border-default-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-default-50 text-xs text-default-500">
                <th className="px-4 py-3 font-bold">状態</th>
                <th className="px-4 py-3 font-bold">タイトル</th>
                <th className="px-4 py-3 font-bold">相談者</th>
                <th className="px-4 py-3 font-bold">緊急度</th>
                <th className="px-4 py-3 font-bold">受信日</th>
                <th className="px-4 py-3 font-bold text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {REQ_ROWS.map((row) => {
                const rowMeta = REQ_STATUS_META[row.status];
                const active = row.id === selectedId;
                return (
                  <tr
                    key={row.id}
                    onClick={() => setSelectedId(row.id)}
                    className={`border-t border-default-100 cursor-pointer transition-colors ${
                      active ? "bg-primary-50" : "hover:bg-default-50"
                    }`}
                  >
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 text-[11px] rounded font-bold ${rowMeta.badge}`}
                      >
                        {rowMeta.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-default-800 line-clamp-1">
                        {row.title}
                      </p>
                      <p className="text-[11px] text-default-500">{row.area}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-default-700">{row.requester}</p>
                      <p className="text-[11px] text-default-500">
                        {row.company}
                      </p>
                    </td>
                    <td className={`px-4 py-3 font-bold ${row.urgencyTone}`}>
                      {row.urgency}
                    </td>
                    <td className="px-4 py-3 text-xs text-default-500">
                      {row.receivedAt}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`${basePath}/requests/${row.id}`}
                        className="text-primary text-sm font-bold hover:underline"
                      >
                        詳細
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick preview pane */}
      <div className="bg-white border border-default-200 rounded-xl p-5 lg:sticky lg:top-6 h-fit space-y-5">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span
              className={`px-2 py-0.5 text-[11px] rounded font-bold ${meta.badge}`}
            >
              {meta.label}
            </span>
            <span className="text-xs text-default-500">ID: {selected.id}</span>
          </div>
          <h2 className="text-base font-bold text-default-900">
            {selected.title}
          </h2>
        </div>
        <section>
          <h3 className="text-xs font-bold text-default-600 border-b border-default-200 pb-1 mb-2">
            相談者情報
          </h3>
          <dl className="grid grid-cols-3 gap-1 text-sm">
            <dt className="text-default-500">氏名</dt>
            <dd className="col-span-2 font-medium">{selected.requester}</dd>
            <dt className="text-default-500">会社名</dt>
            <dd className="col-span-2 font-medium">{selected.company}</dd>
            <dt className="text-default-500">領域</dt>
            <dd className="col-span-2 font-medium">{selected.area}</dd>
          </dl>
        </section>
        <Link
          href={`${basePath}/requests/${selected.id}`}
          className="block text-center bg-primary text-white py-2.5 rounded-lg text-sm font-bold hover:bg-primary/90"
        >
          詳細・困りごと化
        </Link>
      </div>
    </div>
  );
}
