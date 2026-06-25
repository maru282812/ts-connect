"use client";

import { useState } from "react";

type IdeaStatus =
  | "PROPOSED"
  | "REVIEWING"
  | "ADOPTED"
  | "IN_PROGRESS"
  | "DONE"
  | "REJECTED";

interface AdminIdea {
  id: string;
  title: string;
  linkedIssue: string | null;
  author: string;
  likes: number;
  bookmarks: number;
  budget: string;
  rewardTarget: boolean;
  updatedAt: string;
  status: IdeaStatus;
  summary: string;
}

const STATUS_META: Record<IdeaStatus, { label: string; badge: string }> = {
  PROPOSED: { label: "提案中", badge: "bg-green-100 text-green-700" },
  REVIEWING: { label: "検討中", badge: "bg-blue-100 text-blue-700" },
  ADOPTED: { label: "採用", badge: "bg-indigo-100 text-indigo-700" },
  IN_PROGRESS: { label: "実施中", badge: "bg-amber-100 text-amber-700" },
  DONE: { label: "完了", badge: "bg-default-200 text-default-600" },
  REJECTED: { label: "見送り", badge: "bg-rose-100 text-rose-700" },
};

const ROWS: AdminIdea[] = [
  {
    id: "idea-01",
    title: "経費精算SaaS『楽精算』の試験導入",
    linkedIssue: "経費精算フローの電子化",
    author: "佐藤 健",
    likes: 18,
    bookmarks: 6,
    budget: "月額 30,000円〜",
    rewardTarget: true,
    updatedAt: "2026/06/18",
    status: "PROPOSED",
    summary:
      "営業部10名で1ヶ月トライアルし、効果測定の上で全社展開を判断する案。",
  },
  {
    id: "idea-02",
    title: "4Fスペースを社内カフェ風ラウンジへ",
    linkedIssue: "リフレッシュスペース活用",
    author: "田中 美咲",
    likes: 156,
    bookmarks: 42,
    budget: "初期 200,000円",
    rewardTarget: true,
    updatedAt: "2026/06/12",
    status: "REVIEWING",
    summary: "コーヒーサーバーと可動什器で多目的スペースに改装する案。",
  },
  {
    id: "idea-03",
    title: "研修インタビューの日程調整Botを内製",
    linkedIssue: "研修インタビュー効率化",
    author: "鈴木 一郎",
    likes: 12,
    bookmarks: 3,
    budget: "工数のみ",
    rewardTarget: false,
    updatedAt: "2026/06/15",
    status: "ADOPTED",
    summary:
      "Slackワークフローで候補日を収集し自動でカレンダー登録する仕組み。",
  },
  {
    id: "idea-04",
    title: "社内グッズのデザイン公募イベント",
    linkedIssue: null,
    author: "高橋 さくら",
    likes: 64,
    bookmarks: 21,
    budget: "製作費 100,000円",
    rewardTarget: true,
    updatedAt: "2026/06/08",
    status: "IN_PROGRESS",
    summary: "社員からデザイン案を募り人気投票で採用する参加型企画。",
  },
];

const ACTIONS = ["採用", "見送り", "実施中に変更", "完了", "報酬対象にする"];

export function IdeasAdminClient() {
  const [selectedId, setSelectedId] = useState<string>(ROWS[0].id);
  const selected = ROWS.find((r) => r.id === selectedId) ?? ROWS[0];
  const meta = STATUS_META[selected.status];

  return (
    <div className="max-w-[1500px] mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-default-900">
          企画・アイデア管理
        </h1>
        <p className="text-sm text-default-500 mt-1">
          投稿された企画・アイデアを審査し、状態を管理します
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white border border-default-200 rounded-xl p-4 mb-5 flex flex-wrap gap-4">
        {[
          {
            label: "状態",
            options: ["すべて", "提案中", "検討中", "採用", "実施中", "完了"],
          },
          { label: "報酬対象", options: ["すべて", "対象", "対象外"] },
          {
            label: "並び替え",
            options: ["更新日", "いいね数", "ブックマーク数"],
          },
        ].map((f) => (
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
                  <th className="px-4 py-3 font-bold">企画タイトル</th>
                  <th className="px-4 py-3 font-bold">状態</th>
                  <th className="px-4 py-3 font-bold">いいね</th>
                  <th className="px-4 py-3 font-bold">報酬対象</th>
                  <th className="px-4 py-3 font-bold">更新日</th>
                </tr>
              </thead>
              <tbody>
                {ROWS.map((row) => {
                  const rowMeta = STATUS_META[row.status];
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
                        <p className="text-xs text-default-500 line-clamp-1">
                          {row.linkedIssue
                            ? `🔗 ${row.linkedIssue}`
                            : "単独企画"}
                          ・{row.author}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 text-xs rounded font-bold ${rowMeta.badge}`}
                        >
                          {rowMeta.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-default-700">
                        {row.likes}
                      </td>
                      <td className="px-4 py-3">
                        {row.rewardTarget ? (
                          <span className="text-amber-700 text-xs font-bold">
                            対象
                          </span>
                        ) : (
                          <span className="text-default-400 text-xs font-bold">
                            対象外
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
              className={`px-2 py-0.5 text-xs rounded font-bold ${meta.badge}`}
            >
              {meta.label}
            </span>
            <span className="text-xs text-default-500">
              {selected.updatedAt}
            </span>
          </div>
          <h2 className="text-base font-bold text-default-900 mb-2">
            {selected.title}
          </h2>
          <p className="text-sm text-default-600 mb-4">{selected.summary}</p>
          <dl className="space-y-2 text-sm mb-4">
            <div className="flex justify-between">
              <dt className="text-default-500">提案者</dt>
              <dd className="font-semibold text-default-800">
                {selected.author}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-default-500">紐づく困りごと</dt>
              <dd className="font-semibold text-default-800 text-right">
                {selected.linkedIssue ?? "なし"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-default-500">必要予算</dt>
              <dd className="font-semibold text-default-800">
                {selected.budget}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-default-500">いいね / 保存</dt>
              <dd className="font-semibold text-default-800">
                {selected.likes} / {selected.bookmarks}
              </dd>
            </div>
          </dl>
          <div className="pt-3 border-t border-default-200">
            <p className="text-xs font-bold text-default-600 mb-2">状態変更</p>
            <div className="flex flex-wrap gap-2">
              {ACTIONS.map((a) => (
                <button
                  key={a}
                  type="button"
                  className="px-3 py-1.5 rounded-lg border border-default-300 text-default-700 text-xs font-bold hover:bg-default-50"
                >
                  {a}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
