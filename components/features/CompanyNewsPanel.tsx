"use client";

import { useEffect, useState } from "react";
import {
  fetchPublishedIssues,
  NEWSLETTER_CATEGORY_LABEL,
} from "@/lib/newsletter";

// ============================================================
// 社内報 右サイドパネル（社内SNS タイムラインの補助情報枠）
// 設置先: components/screens/CommunityFeedClient.tsx の右カラム
// ※ migration 029 適用後は公開済みの号を表示。未適用/失敗時は仮データにフォールバック。
//   （fetchPublishedIssues が null を返したら LATEST_ISSUE / PICKUP_ARTICLES を維持）
// 配色は CommunityFeedClient のハウススタイル（slate / blue-600）に準拠。
// ============================================================

interface NewsletterIssue {
  id: string;
  /** 号タイトル */
  title: string;
  /** 種別・カテゴリ（例: 月次/特集/お知らせ） */
  category: string;
  /** 発行日ラベル */
  dateLabel: string;
  /** 短い説明文 */
  summary: string;
  /** 詳細リンク（未配線時は "#"） */
  href: string;
}

interface PickupArticle {
  id: string;
  title: string;
  category: string;
  dateLabel: string;
  href: string;
}

// ── 仮データ（API接続時に差し替え） ──────────────────────────
const LATEST_ISSUE: NewsletterIssue = {
  id: "issue-2026-06",
  title: "T's connect 社内報 2026年6月号",
  category: "月次",
  dateLabel: "2026/06/25",
  summary:
    "今月は新オフィス移転プロジェクトの進捗と、各部署の上半期ハイライトを特集。表彰式の様子もレポートしています。",
  href: "#",
};

const PICKUP_ARTICLES: PickupArticle[] = [
  {
    id: "pick-1",
    title: "DX推進本部が語る、社内ナレッジ基盤の裏側",
    category: "特集",
    dateLabel: "2026/06/20",
    href: "#",
  },
  {
    id: "pick-2",
    title: "新入社員インタビュー：入社3ヶ月で感じたこと",
    category: "ピープル",
    dateLabel: "2026/06/12",
    href: "#",
  },
  {
    id: "pick-3",
    title: "【お知らせ】夏季の福利厚生メニューが拡充されました",
    category: "お知らせ",
    dateLabel: "2026/06/05",
    href: "#",
  },
];

const CATEGORY_BADGE: Record<string, string> = {
  月次: "bg-blue-100 text-blue-700",
  特集: "bg-violet-100 text-violet-700",
  ピープル: "bg-emerald-100 text-emerald-700",
  お知らせ: "bg-amber-100 text-amber-700",
};

function categoryBadgeClass(category: string): string {
  return CATEGORY_BADGE[category] ?? "bg-slate-100 text-slate-600";
}

export function CompanyNewsPanel() {
  // 仮データを初期値に。029 適用後は公開済みの号で置き換える。
  const [latest, setLatest] = useState<NewsletterIssue>(LATEST_ISSUE);
  const [pickups, setPickups] = useState<PickupArticle[]>(PICKUP_ARTICLES);

  useEffect(() => {
    let active = true;
    (async () => {
      const issues = await fetchPublishedIssues();
      if (!active || issues === null || issues.length === 0) return;
      const [head, ...rest] = issues;
      setLatest({
        id: head.id,
        title: head.title,
        category: NEWSLETTER_CATEGORY_LABEL[head.category],
        dateLabel: head.publishedAt
          ? new Date(head.publishedAt).toLocaleDateString("ja-JP")
          : "",
        summary: head.summary,
        href: `/app/newsletter/${head.id}`,
      });
      setPickups(
        rest
          .filter((i) => i.isPickup)
          .slice(0, 3)
          .map((i) => ({
            id: i.id,
            title: i.title,
            category: NEWSLETTER_CATEGORY_LABEL[i.category],
            dateLabel: i.publishedAt
              ? new Date(i.publishedAt).toLocaleDateString("ja-JP")
              : "",
            href: `/app/newsletter/${i.id}`,
          })),
      );
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-4">
      {/* 見出し */}
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-1.5 text-sm font-bold text-slate-900">
          <NewspaperIcon />
          社内報
        </h2>
        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600">
          最新号
        </span>
      </div>

      {/* 最新号カード（大きめ1件） */}
      <article className="rounded-xl border border-slate-200 bg-white shadow-sm">
        {/* カバー（画像未配線のためプレースホルダ） */}
        <div className="flex h-28 items-center justify-center rounded-t-xl bg-gradient-to-br from-slate-100 to-blue-50 text-slate-300">
          <NewspaperIcon large />
        </div>
        <div className="p-4">
          <div className="mb-2 flex items-center gap-2">
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${categoryBadgeClass(
                LATEST_ISSUE.category,
              )}`}
            >
              {latest.category}
            </span>
            <span className="text-[11px] text-slate-400">
              {latest.dateLabel}
            </span>
          </div>
          <h3 className="text-sm font-bold leading-snug text-slate-900">
            {latest.title}
          </h3>
          <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-slate-500">
            {latest.summary}
          </p>
          <a
            href={latest.href}
            className="mt-3 inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90"
          >
            読む
            <ArrowRightIcon />
          </a>
        </div>
      </article>

      {/* ピックアップ記事 */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-xs font-bold text-slate-700">
          ピックアップ記事
        </h3>
        <ul className="space-y-3">
          {pickups.map((article) => (
            <li key={article.id}>
              <a
                href={article.href}
                className="group block rounded-lg -mx-1 px-1 py-1 transition-colors hover:bg-slate-50"
              >
                <div className="mb-1 flex items-center gap-2">
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${categoryBadgeClass(
                      article.category,
                    )}`}
                  >
                    {article.category}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {article.dateLabel}
                  </span>
                </div>
                <p className="line-clamp-2 text-xs font-medium leading-snug text-slate-700 group-hover:text-blue-600">
                  {article.title}
                </p>
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

// ── アイコン（CommunityFeedClient のインラインSVG流儀に準拠） ──
function NewspaperIcon({ large }: { large?: boolean }) {
  return (
    <svg
      className={large ? "h-8 w-8" : "h-4 w-4"}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m0 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
      />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg
      className="h-3.5 w-3.5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}
