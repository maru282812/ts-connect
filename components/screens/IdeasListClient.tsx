"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type IdeaStatus = "PROPOSED" | "REVIEWING" | "ADOPTED" | "IN_PROGRESS" | "DONE";

interface IdeaItem {
  id: string;
  title: string;
  summary: string;
  author: string;
  linkedIssue: string | null;
  tags: string[];
  reward: string | null;
  budget: string;
  likes: number;
  bookmarks: number;
  status: IdeaStatus;
}

const STATUS_META: Record<IdeaStatus, { label: string; badge: string }> = {
  PROPOSED: { label: "提案中", badge: "bg-green-100 text-green-700" },
  REVIEWING: { label: "検討中", badge: "bg-blue-100 text-blue-700" },
  ADOPTED: { label: "採用", badge: "bg-indigo-100 text-indigo-700" },
  IN_PROGRESS: { label: "実施中", badge: "bg-amber-100 text-amber-700" },
  DONE: { label: "完了", badge: "bg-default-200 text-default-600" },
};

const TABS: { key: "ALL" | IdeaStatus; label: string }[] = [
  { key: "ALL", label: "すべて" },
  { key: "PROPOSED", label: "提案中" },
  { key: "REVIEWING", label: "検討中" },
  { key: "ADOPTED", label: "採用" },
  { key: "IN_PROGRESS", label: "実施中" },
  { key: "DONE", label: "完了" },
];

const IDEAS: IdeaItem[] = [
  {
    id: "idea-01",
    title: "経費精算SaaS『楽精算』の試験導入",
    summary:
      "営業部の10名で1ヶ月間トライアルし、効果測定の上で全社展開を判断する段階的導入案です。",
    author: "佐藤 健",
    linkedIssue: "経費精算フローの電子化・簡素化について",
    tags: ["#DX", "#業務効率化"],
    reward: "支援金 5,000円相当",
    budget: "月額 30,000円〜",
    likes: 18,
    bookmarks: 6,
    status: "PROPOSED",
  },
  {
    id: "idea-02",
    title: "4Fスペースを社内カフェ風ラウンジへ",
    summary:
      "コーヒーサーバーと可動式の什器を置き、ミーティングや雑談に使える多目的スペースに改装する案。",
    author: "田中 美咲",
    linkedIssue: "オフィス内リフレッシュスペースの活用案",
    tags: ["#福利厚生"],
    reward: "社内カフェ無料チケット",
    budget: "初期 200,000円",
    likes: 156,
    bookmarks: 42,
    status: "REVIEWING",
  },
  {
    id: "idea-03",
    title: "研修インタビューの日程調整Botを内製",
    summary:
      "Slackワークフローで候補日を収集し、自動でカレンダー登録する仕組みを内製化する提案。",
    author: "鈴木 一郎",
    linkedIssue: "新卒研修における「先輩社員インタビュー」の効率化",
    tags: ["#自動化"],
    reward: null,
    budget: "工数のみ",
    likes: 12,
    bookmarks: 3,
    status: "ADOPTED",
  },
  {
    id: "idea-04",
    title: "社内グッズのデザイン公募イベント",
    summary:
      "社員からデザイン案を募り、人気投票で採用する参加型の企画。エンゲージメント向上を狙います。",
    author: "高橋 さくら",
    linkedIssue: null,
    tags: ["#コミュニケーション", "#企画"],
    reward: "採用時にクオカード",
    budget: "製作費 100,000円",
    likes: 64,
    bookmarks: 21,
    status: "IN_PROGRESS",
  },
  {
    id: "idea-05",
    title: "ヘルプデスクFAQのナレッジベース整備",
    summary:
      "頻出の問い合わせをFAQ化し、検索可能なナレッジベースとして公開した事例。",
    author: "渡辺 涼",
    linkedIssue: "社内ヘルプデスク問い合わせの一次対応自動化",
    tags: ["#DX"],
    reward: "特別ボーナス（支給済）",
    budget: "工数のみ",
    likes: 88,
    bookmarks: 30,
    status: "DONE",
  },
];

function PlusIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      viewBox="0 0 24 24"
    >
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

export function IdeasListClient() {
  const [tab, setTab] = useState<"ALL" | IdeaStatus>("ALL");

  const counts = useMemo(() => {
    const base: Record<string, number> = { ALL: IDEAS.length };
    for (const item of IDEAS) {
      base[item.status] = (base[item.status] ?? 0) + 1;
    }
    return base;
  }, []);

  const visible = useMemo(
    () => (tab === "ALL" ? IDEAS : IDEAS.filter((i) => i.status === tab)),
    [tab],
  );

  return (
    <div className="max-w-[1400px] mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-default-900">
            企画・アイデア
          </h1>
          <p className="text-sm text-default-500 mt-1">
            社内の企画・アイデアを応援しよう
          </p>
        </div>
        <Link
          href="/app/ideas/new"
          className="inline-flex items-center justify-center gap-2 bg-primary text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-sm hover:bg-primary/90 active:scale-95 transition-all"
        >
          <PlusIcon />
          企画・アイデアを投稿
        </Link>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-xl p-4 border border-default-200 mb-6 flex flex-wrap items-center gap-3">
        <input
          className="flex-1 min-w-[200px] bg-default-50 border border-default-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
          placeholder="キーワード検索..."
          type="text"
        />
        <select className="bg-default-50 border border-default-200 rounded-lg px-3 py-2 text-sm">
          <option>すべてのタグ</option>
          <option>#DX</option>
          <option>#福利厚生</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-default-600">
          <input
            className="w-4 h-4 rounded border-default-300 text-primary focus:ring-primary"
            type="checkbox"
          />
          報酬ありのみ
        </label>
        <label className="flex items-center gap-2 text-sm text-default-600">
          <input
            className="w-4 h-4 rounded border-default-300 text-primary focus:ring-primary"
            type="checkbox"
          />
          困りごと紐づきあり
        </label>
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
              {t.label} ({counts[t.key] ?? 0})
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <div className="text-center py-16 text-default-400">
          <p className="text-sm">該当する企画・アイデアはありません</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
          {visible.map((item) => {
            const meta = STATUS_META[item.status];
            return (
              <Link
                key={item.id}
                href={`/app/ideas/${item.id}`}
                className="bg-white border border-default-200 rounded-xl p-5 flex flex-col hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-3">
                  <span
                    className={`px-2 py-0.5 text-xs rounded font-bold ${meta.badge}`}
                  >
                    {meta.label}
                  </span>
                  <div className="flex gap-3 text-xs text-default-500">
                    <span>❤ {item.likes}</span>
                    <span>🔖 {item.bookmarks}</span>
                  </div>
                </div>
                <h3 className="text-base font-semibold text-default-900 mb-2 line-clamp-2">
                  {item.title}
                </h3>
                <p className="text-sm text-default-600 mb-3 line-clamp-3 flex-1">
                  {item.summary}
                </p>
                {item.linkedIssue && (
                  <p className="text-xs text-default-500 mb-3 line-clamp-1">
                    🔗 困りごと: {item.linkedIssue}
                  </p>
                )}
                <div className="flex flex-wrap gap-2 mb-3">
                  {item.tags.map((t) => (
                    <span
                      key={t}
                      className="px-2 py-0.5 bg-primary-50 text-primary text-xs rounded border border-primary-100"
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-default-200 text-xs text-default-500">
                  <span>提案: {item.author}</span>
                  <span>予算: {item.budget}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
