"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type Relation = "保存" | "いいね" | "コメント・提案";
type ContentType = "案件" | "困りごと" | "企画" | "グッズ" | "社員" | "社内SNS";

type ActivityItem = {
  id: string;
  relation: Relation;
  type: ContentType;
  title: string;
  summary: string;
  href: string;
  status?: string;
  ended?: boolean;
  actedAt: string;
};

const TABS: { id: "all" | Relation; label: string }[] = [
  { id: "all", label: "すべて" },
  { id: "保存", label: "保存" },
  { id: "いいね", label: "いいね" },
  { id: "コメント・提案", label: "コメント・提案" },
];

const SORTS = ["関わった日", "更新日", "期限が近い", "いいね数"] as const;

const TYPE_STYLES: Record<ContentType, string> = {
  案件: "bg-blue-50 text-blue-600",
  困りごと: "bg-amber-50 text-amber-600",
  企画: "bg-violet-50 text-violet-600",
  グッズ: "bg-teal-50 text-teal-600",
  社員: "bg-pink-50 text-pink-600",
  社内SNS: "bg-default-100 text-default-600",
};

const RELATION_STYLES: Record<Relation, string> = {
  保存: "bg-primary-50 text-primary",
  いいね: "bg-rose-50 text-rose-500",
  "コメント・提案": "bg-emerald-50 text-emerald-600",
};

const ITEMS: ActivityItem[] = [
  {
    id: "1",
    relation: "保存",
    type: "案件",
    title: "新オフィスのレイアウト改善プロジェクト",
    summary: "フリーアドレス導入に向けた意見出しと試験運用メンバー募集。",
    href: "/app/posts",
    status: "募集中",
    actedAt: "2日前に保存",
  },
  {
    id: "2",
    relation: "いいね",
    type: "企画",
    title: "夏季限定アイスコーヒー導入案",
    summary: "オフィスのドリンクサーバーに季節メニューを追加する提案。",
    href: "/app/ideas",
    status: "❤ 215",
    actedAt: "3日前にいいね",
  },
  {
    id: "3",
    relation: "コメント・提案",
    type: "困りごと",
    title: "VPN接続が頻繁に切れる",
    summary: "あなたの提案: 自動再接続スクリプトの配布で解消できそうです。",
    href: "/app/issues",
    status: "提案 8",
    actedAt: "5日前に提案",
  },
  {
    id: "4",
    relation: "保存",
    type: "グッズ",
    title: "ロゴ入り真空断熱タンブラー",
    summary: "申請して受け取りたいグッズ。在庫があるうちに申請予定。",
    href: "/app/goods",
    status: "在庫あり",
    actedAt: "1週間前に保存",
  },
  {
    id: "5",
    relation: "いいね",
    type: "社内SNS",
    title: "開発本部 新人歓迎ランチの様子",
    summary: "歓迎会の写真投稿。コメントも盛り上がっていた。",
    href: "/app/community",
    status: "❤ 42",
    actedAt: "1週間前にいいね",
  },
  {
    id: "6",
    relation: "保存",
    type: "案件",
    title: "社内表彰式の司会スタッフ募集",
    summary: "年次表彰イベントの運営メンバー。すでに募集は終了。",
    href: "/app/posts",
    status: "終了",
    ended: true,
    actedAt: "3週間前に保存",
  },
];

export function MyActivityClient() {
  const [tab, setTab] = useState<"all" | Relation>("all");
  const [keyword, setKeyword] = useState("");
  const [sort, setSort] = useState<(typeof SORTS)[number]>("関わった日");

  const filtered = useMemo(() => {
    return ITEMS.filter((item) => {
      if (tab !== "all" && item.relation !== tab) return false;
      if (keyword && !`${item.title}${item.summary}`.includes(keyword)) {
        return false;
      }
      return true;
    });
  }, [tab, keyword]);

  return (
    <div className="max-w-5xl mx-auto w-full space-y-6">
      {/* Title */}
      <div className="flex flex-wrap items-center gap-4">
        <h1 className="text-xl font-bold text-default-900">自分の関わり</h1>
        <span className="bg-primary-50 text-primary px-3 py-0.5 rounded-full text-xs font-bold">
          U-10
        </span>
        <div className="flex-1" />
        <p className="text-xs text-default-400">
          保存・いいね・コメント/提案したものをまとめて見返せます
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-default-200">
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 text-sm font-bold -mb-px border-b-2 transition-colors ${
                active
                  ? "border-primary text-primary"
                  : "border-transparent text-default-500 hover:text-default-800"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="タイトル・内容で検索"
            className="w-full h-10 px-4 rounded-lg border border-default-200 text-sm focus:ring-2 focus:ring-primary outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-default-500">並び替え</span>
          <select
            value={sort}
            onChange={(e) =>
              setSort(e.target.value as (typeof SORTS)[number])
            }
            className="h-10 px-3 rounded-lg border border-default-200 text-sm focus:ring-2 focus:ring-primary outline-none"
          >
            {SORTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-default-200 p-12 text-center">
          <p className="text-default-500 text-sm">
            該当する関わりはまだありません。
          </p>
          <p className="text-default-400 text-xs mt-2">
            各一覧の保存・いいね・コメントが、ここにまとまります。
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className={`block bg-white rounded-xl border border-default-200 p-5 hover:shadow-sm hover:border-primary/40 transition-all ${
                item.ended ? "opacity-60" : ""
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${RELATION_STYLES[item.relation]}`}
                >
                  {item.relation}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${TYPE_STYLES[item.type]}`}
                >
                  {item.type}
                </span>
                <div className="flex-1" />
                {item.status ? (
                  <span
                    className={`text-[10px] font-bold ${
                      item.ended ? "text-default-400" : "text-default-500"
                    }`}
                  >
                    {item.status}
                  </span>
                ) : null}
              </div>
              <h3 className="text-sm font-bold text-default-900 truncate">
                {item.title}
              </h3>
              <p className="text-xs text-default-500 mt-1 line-clamp-2">
                {item.summary}
              </p>
              <p className="text-[10px] text-default-400 mt-3">{item.actedAt}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
