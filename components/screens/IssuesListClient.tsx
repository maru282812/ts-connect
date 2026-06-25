"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type IssueStatus = "RECRUITING" | "REVIEWING" | "ADOPTED" | "RESOLVED";

interface IssueItem {
  id: string;
  title: string;
  summary: string;
  department: string;
  tags: string[];
  deadline: string;
  reward: string | null;
  proposals: number;
  likes: number;
  status: IssueStatus;
}

const STATUS_META: Record<IssueStatus, { label: string; badge: string }> = {
  RECRUITING: { label: "募集中", badge: "bg-green-100 text-green-700" },
  REVIEWING: { label: "検討中", badge: "bg-blue-100 text-blue-700" },
  ADOPTED: { label: "採用済み", badge: "bg-indigo-100 text-indigo-700" },
  RESOLVED: { label: "解決済み", badge: "bg-default-200 text-default-600" },
};

const TABS: { key: "ALL" | IssueStatus; label: string }[] = [
  { key: "ALL", label: "すべて" },
  { key: "RECRUITING", label: "募集中" },
  { key: "REVIEWING", label: "検討中" },
  { key: "ADOPTED", label: "採用済み" },
  { key: "RESOLVED", label: "解決済み" },
];

const ISSUES: IssueItem[] = [
  {
    id: "issue-01",
    title: "経費精算フローの電子化・簡素化について",
    summary:
      "手書きの領収書貼付と承認印が必要な状況で、リモートワーク時のボトルネックになっています。SaaS導入や承認フローの最適化アイデアを募集します。",
    department: "営業部",
    tags: ["#業務効率化", "#DX"],
    deadline: "2026/07/20",
    reward: "支援金 5,000円相当（Amazonギフト券）",
    proposals: 12,
    likes: 24,
    status: "RECRUITING",
  },
  {
    id: "issue-02",
    title: "オフィス内リフレッシュスペースの活用案",
    summary:
      "あまり使われていない4Fリフレッシュスペースを、社員同士の偶発的なコミュニケーションが生まれる場所に作り替えたいと考えています。",
    department: "人事総務部",
    tags: ["#福利厚生", "#コミュニケーション"],
    deadline: "受付終了",
    reward: "社内カフェ無料チケット（1ヶ月分）",
    proposals: 45,
    likes: 156,
    status: "REVIEWING",
  },
  {
    id: "issue-03",
    title: "新卒研修における「先輩社員インタビュー」の効率化",
    summary:
      "毎年の研修で発生するインタビューのアサイン調整が手動で大変です。自動化ツールやスケジュールの工夫、仕組み化の提案を求めます。",
    department: "開発部",
    tags: ["#教育研修", "#自動化"],
    deadline: "あと3日で締切",
    reward: "成果反映時に特別ボーナス支給",
    proposals: 8,
    likes: 12,
    status: "RECRUITING",
  },
  {
    id: "issue-04",
    title: "会議室の備品管理ルールの策定",
    summary:
      "ホワイトボードのマーカー切れなどが頻発しており、補充のルールが不明確です。運用コストのかからない管理手法が必要です。",
    department: "人事総務部",
    tags: ["#運用ルール"],
    deadline: "贈呈済",
    reward: "Amazonギフト券 3,000円（贈呈済）",
    proposals: 21,
    likes: 89,
    status: "ADOPTED",
  },
  {
    id: "issue-05",
    title: "SNS広告のクリエイティブ・マンネリ化解消",
    summary:
      "自社製品の広告画像が似たり寄ったりになっています。非デザイナー視点での、斬新な切り口やコピーのアイデアを広く募集します。",
    department: "マーケティング部",
    tags: ["#クリエイティブ", "#広告"],
    deadline: "2026/08/30",
    reward: "採用時にクオカード1万円分",
    proposals: 3,
    likes: 5,
    status: "RECRUITING",
  },
  {
    id: "issue-06",
    title: "社内ヘルプデスク問い合わせの一次対応自動化",
    summary:
      "情シスへの定型的な問い合わせが多く、対応工数がかさんでいます。FAQ整備やチャットボット活用などの提案を募集します。",
    department: "情報システム部",
    tags: ["#DX", "#自動化"],
    deadline: "解決済み",
    reward: null,
    proposals: 30,
    likes: 64,
    status: "RESOLVED",
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

export function IssuesListClient() {
  const [tab, setTab] = useState<"ALL" | IssueStatus>("ALL");

  const counts = useMemo(() => {
    const base: Record<string, number> = { ALL: ISSUES.length };
    for (const item of ISSUES) {
      base[item.status] = (base[item.status] ?? 0) + 1;
    }
    return base;
  }, []);

  const visible = useMemo(
    () => (tab === "ALL" ? ISSUES : ISSUES.filter((i) => i.status === tab)),
    [tab],
  );

  return (
    <div className="max-w-[1400px] mx-auto w-full">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-default-900">
            困りごとリスト
          </h1>
          <p className="text-sm text-default-500 mt-1">
            現場の課題を解決するアイデアを募集中です
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
                placeholder="例: ペーパーレス, 業務改善..."
                type="text"
              />
            </div>
          </div>
          <div>
            <span className="block text-xs font-bold text-default-600 mb-1.5">
              部署
            </span>
            <select className="w-full bg-default-50 border border-default-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none">
              <option>すべての部署</option>
              <option>営業部</option>
              <option>開発部</option>
              <option>人事総務部</option>
              <option>マーケティング部</option>
            </select>
          </div>
          <div>
            <span className="block text-xs font-bold text-default-600 mb-1.5">
              募集期限
            </span>
            <select className="w-full bg-default-50 border border-default-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none">
              <option>指定なし</option>
              <option>1週間以内</option>
              <option>1ヶ月以内</option>
              <option>期限なしを含む</option>
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
      {visible.length === 0 ? (
        <div className="text-center py-16 text-default-400">
          <p className="text-sm">該当する困りごとはありません</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
          {visible.map((item) => {
            const meta = STATUS_META[item.status];
            return (
              <Link
                key={item.id}
                href={`/app/issues/${item.id}`}
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
                      期限: {item.deadline}
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
                      {item.department}
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
                  {item.reward ? (
                    <div className="p-3 bg-amber-50 rounded-lg">
                      <p className="text-xs text-amber-700 font-bold">
                        報酬条件
                      </p>
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
                    <span>💡 提案 {item.proposals}</span>
                    <span>❤ {item.likes}</span>
                  </div>
                  <span className="text-primary text-sm font-bold">
                    詳細を見る →
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
