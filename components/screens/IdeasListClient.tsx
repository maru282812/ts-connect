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

function SearchIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-[18px] w-[18px] text-default-400"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

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

interface IdeasListClientProps {
  /** 企画・アイデア詳細のベースパス（例: /app/ideas, /company/ideas-feed） */
  ideasBasePath?: string;
  /** 「企画・アイデアを投稿」導線のリンク先 */
  newHref?: string;
}

export function IdeasListClient({
  ideasBasePath = "/app/ideas",
  newHref = "/app/ideas/new",
}: IdeasListClientProps = {}) {
  return (
    <div className="max-w-[1400px] mx-auto w-full">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-default-900">
            企画・アイデア一覧
          </h1>
          <p className="text-sm text-default-500 mt-1">
            社内の企画・アイデアを応援しよう
          </p>
        </div>
        <Link
          href={newHref}
          className="inline-flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 rounded-lg text-sm font-bold shadow-sm hover:bg-primary/90 active:scale-95 transition-all whitespace-nowrap"
        >
          <PlusIcon />
          企画・アイデアを投稿
        </Link>
      </div>

      <IdeaListView ideasBasePath={ideasBasePath} newHref={newHref} />
    </div>
  );
}

function IdeaListView({
  ideasBasePath,
  newHref,
}: {
  ideasBasePath: string;
  newHref: string;
}) {
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
    <>
      {/* Filter card */}
      <div className="bg-white rounded-xl p-5 border border-default-200 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <span className="block text-xs font-bold text-default-600 mb-1.5">
              キーワード検索
            </span>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2">
                <SearchIcon />
              </span>
              <input
                className="w-full bg-default-50 border border-default-200 rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                placeholder="例: 経費精算, 福利厚生..."
                type="text"
              />
            </div>
          </div>
          <div>
            <span className="block text-xs font-bold text-default-600 mb-1.5">
              タグ
            </span>
            <select className="w-full bg-default-50 border border-default-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none">
              <option>すべてのタグ</option>
              <option>#DX</option>
              <option>#福利厚生</option>
              <option>#業務効率化</option>
              <option>#自動化</option>
            </select>
          </div>
          <div>
            <span className="block text-xs font-bold text-default-600 mb-1.5">
              状態
            </span>
            <select className="w-full bg-default-50 border border-default-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none">
              <option>すべての状態</option>
              <option>提案中</option>
              <option>検討中</option>
              <option>採用</option>
              <option>実施中</option>
              <option>完了</option>
            </select>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-default-200">
          <label className="flex items-center gap-2 cursor-pointer text-sm text-default-600">
            <input
              className="w-4 h-4 rounded border-default-300 text-primary focus:ring-primary"
              type="checkbox"
            />
            報酬ありのみ表示
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-sm text-default-600">
            <input
              className="w-4 h-4 rounded border-default-300 text-primary focus:ring-primary"
              type="checkbox"
            />
            困りごと紐づきあり
          </label>
          <div className="flex flex-wrap gap-2">
            {["#DX", "#福利厚生", "#業務効率化"].map((t) => (
              <span
                key={t}
                className="px-3 py-1 bg-default-100 text-default-600 text-xs rounded-full cursor-pointer hover:bg-primary-50 hover:text-primary"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
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

      {/* Cards grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
        {visible.map((item) => {
          const meta = STATUS_META[item.status];
          return (
            <Link
              key={item.id}
              href={`${ideasBasePath}/${item.id}`}
              className="bg-white border border-default-200 rounded-xl overflow-hidden flex flex-col hover:shadow-md transition-shadow"
            >
              <div className="p-5 flex-1">
                <div className="flex justify-between items-start mb-3">
                  <span
                    className={`px-2 py-0.5 text-xs rounded font-bold ${meta.badge}`}
                  >
                    {meta.label}
                  </span>
                  <span className="text-xs text-default-500">
                    予算: {item.budget}
                  </span>
                </div>
                <h3 className="text-base font-semibold text-default-900 mb-2 line-clamp-2">
                  {item.title}
                </h3>
                <p className="text-sm text-default-600 mb-4 line-clamp-3">
                  {item.summary}
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-2 py-0.5 bg-default-100 text-default-600 text-xs rounded">
                    提案: {item.author}
                  </span>
                  {item.tags.map((t) => (
                    <span
                      key={t}
                      className="px-2 py-0.5 bg-primary-50 text-primary text-xs rounded border border-primary-100"
                    >
                      {t}
                    </span>
                  ))}
                </div>
                {item.linkedIssue && (
                  <p className="text-xs text-default-500 mb-4 line-clamp-1">
                    🔗 困りごと: {item.linkedIssue}
                  </p>
                )}
                {item.reward ? (
                  <div className="p-3 bg-amber-50 rounded-lg">
                    <p className="text-xs text-amber-700 font-bold">報酬条件</p>
                    <p className="text-sm font-bold text-default-800">
                      {item.reward}
                    </p>
                  </div>
                ) : (
                  <div className="p-3 bg-default-100 rounded-lg">
                    <p className="text-xs text-default-500 font-bold">
                      報酬条件
                    </p>
                    <p className="text-sm font-bold text-default-700">
                      報酬なし
                    </p>
                  </div>
                )}
              </div>
              <div className="px-5 py-3 bg-default-50 border-t border-default-200 flex items-center justify-between">
                <div className="flex gap-4 text-xs text-default-500">
                  <span>❤ {item.likes}</span>
                </div>
                <span className="text-primary text-sm font-bold">
                  詳細を見る →
                </span>
              </div>
            </Link>
          );
        })}

        {/* 企画・アイデアを投稿する */}
        <Link
          href={newHref}
          className="border-2 border-dashed border-default-300 rounded-xl flex flex-col items-center justify-center text-center p-8 min-h-[260px] hover:border-primary hover:bg-primary-50/40 transition-colors group"
        >
          <span className="w-12 h-12 rounded-full bg-default-100 group-hover:bg-primary-100 flex items-center justify-center mb-4 text-default-500 group-hover:text-primary">
            <PlusIcon />
          </span>
          <span className="text-base font-bold text-default-800">
            企画・アイデアを投稿する
          </span>
          <span className="text-sm text-default-500 mt-1">
            あなたの企画・アイデアを全社へ提案できます
          </span>
        </Link>
      </div>
    </>
  );
}
