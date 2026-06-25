"use client";

import Link from "next/link";
import { useState } from "react";

type IssueStatus = "RECRUITING" | "REVIEWING" | "ADOPTED" | "RESOLVED";

interface AdminIssue {
  id: string;
  title: string;
  department: string;
  tags: string[];
  proposals: number;
  likes: number;
  reward: string | null;
  deadline: string;
  published: boolean;
  updatedAt: string;
  status: IssueStatus;
  summary: string;
}

const STATUS_META: Record<IssueStatus, { label: string; badge: string }> = {
  RECRUITING: { label: "募集中", badge: "bg-green-100 text-green-700" },
  REVIEWING: { label: "検討中", badge: "bg-blue-100 text-blue-700" },
  ADOPTED: { label: "採用済み", badge: "bg-indigo-100 text-indigo-700" },
  RESOLVED: { label: "解決済み", badge: "bg-default-200 text-default-600" },
};

const ROWS: AdminIssue[] = [
  {
    id: "issue-01",
    title: "経費精算フローの電子化・簡素化について",
    department: "営業部",
    tags: ["#業務効率化", "#DX"],
    proposals: 12,
    likes: 24,
    reward: "5,000円相当",
    deadline: "2026/07/20",
    published: true,
    updatedAt: "2026/06/18",
    status: "RECRUITING",
    summary:
      "手書きの領収書貼付と承認印が必要な状況で、リモートワーク時のボトルネックになっています。",
  },
  {
    id: "issue-02",
    title: "オフィス内リフレッシュスペースの活用案",
    department: "人事総務部",
    tags: ["#福利厚生"],
    proposals: 45,
    likes: 156,
    reward: "カフェチケット",
    deadline: "受付終了",
    published: true,
    updatedAt: "2026/06/10",
    status: "REVIEWING",
    summary:
      "あまり使われていない4Fリフレッシュスペースを、交流が生まれる場所に作り替えたい。",
  },
  {
    id: "issue-03",
    title: "新卒研修における先輩社員インタビューの効率化",
    department: "開発部",
    tags: ["#教育研修", "#自動化"],
    proposals: 8,
    likes: 12,
    reward: "特別ボーナス",
    deadline: "2026/07/01",
    published: false,
    updatedAt: "2026/06/20",
    status: "RECRUITING",
    summary: "毎年の研修で発生するインタビューのアサイン調整が手動で大変です。",
  },
  {
    id: "issue-04",
    title: "会議室の備品管理ルールの策定",
    department: "人事総務部",
    tags: ["#運用ルール"],
    proposals: 21,
    likes: 89,
    reward: "3,000円（贈呈済）",
    deadline: "贈呈済",
    published: true,
    updatedAt: "2026/05/30",
    status: "ADOPTED",
    summary: "ホワイトボードのマーカー切れが頻発し、補充ルールが不明確です。",
  },
];

const FILTERS: { label: string; options: string[] }[] = [
  {
    label: "状態",
    options: ["すべて", "募集中", "検討中", "採用済み", "解決済み"],
  },
  { label: "部署", options: ["すべて", "営業部", "開発部", "人事総務部"] },
  { label: "公開状態", options: ["すべて", "公開", "非公開"] },
  { label: "期限", options: ["指定なし", "1週間以内", "1ヶ月以内"] },
];

export function IssuesAdminClient() {
  const [selectedId, setSelectedId] = useState<string>(ROWS[0].id);
  const selected = ROWS.find((r) => r.id === selectedId) ?? ROWS[0];
  const selectedMeta = STATUS_META[selected.status];

  return (
    <div className="max-w-[1500px] mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-default-900">困りごと管理</h1>
          <p className="text-sm text-default-500 mt-1">
            社内の困りごとの登録状況・状態を管理します
          </p>
        </div>
        <Link
          href="/company/issues/new"
          className="inline-flex items-center justify-center gap-2 bg-primary text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-sm hover:bg-primary/90"
        >
          ＋ 新規作成
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white border border-default-200 rounded-xl p-4 mb-5 flex flex-wrap gap-4">
        {FILTERS.map((f) => (
          <div key={f.label} className="min-w-[150px]">
            <span className="block text-xs font-bold text-default-600 mb-1">
              {f.label}
            </span>
            <select className="w-full bg-default-50 border border-default-200 rounded-lg px-3 py-2 text-sm">
              {f.options.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Table */}
        <div className="lg:col-span-2 bg-white border border-default-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-default-50 text-left text-xs text-default-500">
                  <th className="px-4 py-3 font-bold">タイトル</th>
                  <th className="px-4 py-3 font-bold">状態</th>
                  <th className="px-4 py-3 font-bold">提案</th>
                  <th className="px-4 py-3 font-bold">公開</th>
                  <th className="px-4 py-3 font-bold">更新日</th>
                </tr>
              </thead>
              <tbody>
                {ROWS.map((row) => {
                  const meta = STATUS_META[row.status];
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
                        <p className="font-semibold text-default-800 line-clamp-1">
                          {row.title}
                        </p>
                        <p className="text-xs text-default-500">
                          {row.department}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 text-xs rounded font-bold ${meta.badge}`}
                        >
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-default-700">
                        {row.proposals}
                      </td>
                      <td className="px-4 py-3">
                        {row.published ? (
                          <span className="text-green-700 text-xs font-bold">
                            公開
                          </span>
                        ) : (
                          <span className="text-default-400 text-xs font-bold">
                            非公開
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-default-500">
                        {row.updatedAt}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Preview pane */}
        <div className="bg-white border border-default-200 rounded-xl p-5 lg:sticky lg:top-6 h-fit">
          <div className="flex items-center justify-between mb-3">
            <span
              className={`px-2 py-0.5 text-xs rounded font-bold ${selectedMeta.badge}`}
            >
              {selectedMeta.label}
            </span>
            <span className="text-xs text-default-500">
              期限: {selected.deadline}
            </span>
          </div>
          <h2 className="text-base font-bold text-default-900 mb-2">
            {selected.title}
          </h2>
          <p className="text-sm text-default-600 mb-4">{selected.summary}</p>
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="px-2 py-0.5 bg-default-100 text-default-600 text-xs rounded">
              {selected.department}
            </span>
            {selected.tags.map((t) => (
              <span
                key={t}
                className="px-2 py-0.5 bg-primary-50 text-primary text-xs rounded border border-primary-100"
              >
                {t}
              </span>
            ))}
          </div>
          <dl className="space-y-2 text-sm mb-4">
            <div className="flex justify-between">
              <dt className="text-default-500">提案数</dt>
              <dd className="font-semibold text-default-800">
                {selected.proposals}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-default-500">いいね</dt>
              <dd className="font-semibold text-default-800">
                {selected.likes}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-default-500">報酬条件</dt>
              <dd className="font-semibold text-default-800">
                {selected.reward ?? "なし"}
              </dd>
            </div>
          </dl>
          <div className="flex flex-col gap-2">
            <Link
              href="/company/issues/new"
              className="text-center bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-primary/90"
            >
              編集する
            </Link>
            <button
              type="button"
              className="border border-default-300 text-default-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-default-50"
            >
              関連企画を見る
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
