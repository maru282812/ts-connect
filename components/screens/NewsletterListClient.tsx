"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { APP_NAME } from "@/constants/appConstants";
import {
  fetchPublishedIssues,
  NEWSLETTER_CATEGORY_LABEL,
  type NewsletterCategory,
  type NewsletterIssue,
} from "@/lib/newsletter";

// ============================================================
// 社内報 一覧（従業員向け・PC/スマホ共用）
// 右カラム専用パネルから独立した閲覧導線へ移設したもの。
// 029 未適用/失敗時は fetchPublishedIssues が null を返すため仮データで描画。
// ============================================================

// 029 未適用時のフォールバック（CompanyNewsPanel と同趣旨の仮データ）
const FALLBACK_ISSUES: NewsletterIssue[] = [
  {
    id: "issue-2026-06",
    title: "T's connect 社内報 2026年6月号",
    category: "MONTHLY",
    summary:
      "新オフィス移転プロジェクトの進捗と、各部署の上半期ハイライトを特集。表彰式の様子もレポート。",
    body: "",
    coverImageUrl: null,
    imageUrls: [],
    status: "PUBLISHED",
    publishedAt: "2026-06-25",
    isPickup: true,
    viewCount: 128,
    createdAt: "2026-06-25",
  },
  {
    id: "issue-feature-dx",
    title: "DX推進本部が語る、社内ナレッジ基盤の裏側",
    category: "FEATURE",
    summary:
      "全社の情報共有を支えるナレッジ基盤。その設計思想と運用の工夫を担当チームに聞きました。",
    body: "",
    coverImageUrl: null,
    imageUrls: [],
    status: "PUBLISHED",
    publishedAt: "2026-06-20",
    isPickup: false,
    viewCount: 94,
    createdAt: "2026-06-20",
  },
  {
    id: "issue-people-newcomer",
    title: "新入社員インタビュー：入社3ヶ月で感じたこと",
    category: "PEOPLE",
    summary: "今年入社したメンバーに、入社前後のギャップや日々の学びを語ってもらいました。",
    body: "",
    coverImageUrl: null,
    imageUrls: [],
    status: "PUBLISHED",
    publishedAt: "2026-06-18",
    isPickup: false,
    viewCount: 76,
    createdAt: "2026-06-18",
  },
  {
    id: "issue-2026-05",
    title: "T's connect 社内報 2026年5月号：期初キックオフ特集",
    category: "MONTHLY",
    summary: "期初キックオフの全社方針と、各本部の重点テーマをまとめました。",
    body: "",
    coverImageUrl: null,
    imageUrls: [],
    status: "PUBLISHED",
    publishedAt: "2026-05-25",
    isPickup: false,
    viewCount: 203,
    createdAt: "2026-05-25",
  },
];

type CategoryFilter = "ALL" | NewsletterCategory;

const FILTERS: { value: CategoryFilter; label: string }[] = [
  { value: "ALL", label: "すべて" },
  { value: "MONTHLY", label: NEWSLETTER_CATEGORY_LABEL.MONTHLY },
  { value: "FEATURE", label: NEWSLETTER_CATEGORY_LABEL.FEATURE },
  { value: "PEOPLE", label: NEWSLETTER_CATEGORY_LABEL.PEOPLE },
  { value: "NOTICE", label: NEWSLETTER_CATEGORY_LABEL.NOTICE },
];

function formatDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

export function NewsletterListClient() {
  const [issues, setIssues] = useState<NewsletterIssue[] | null>(null);
  const [filter, setFilter] = useState<CategoryFilter>("ALL");

  useEffect(() => {
    let alive = true;
    fetchPublishedIssues().then((data) => {
      if (!alive) return;
      setIssues(data && data.length > 0 ? data : FALLBACK_ISSUES);
    });
    return () => {
      alive = false;
    };
  }, []);

  const visible = useMemo(() => {
    const list = issues ?? [];
    return filter === "ALL"
      ? list
      : list.filter((i) => i.category === filter);
  }, [issues, filter]);

  const isLoading = issues === null;

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="mb-1">
        <h1 className="text-lg font-bold text-default-800">社内報</h1>
        <p className="text-xs text-default-400">
          {`${APP_NAME} の社内報バックナンバー`}
        </p>
      </div>

      {/* カテゴリフィルタ */}
      <div className="mb-5 mt-3 flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === f.value
                ? "bg-primary text-white"
                : "border border-default-200 bg-white text-default-600 hover:bg-default-50"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {["a", "b", "c"].map((k) => (
            <div
              key={k}
              className="h-52 animate-pulse rounded-xl border border-default-100 bg-white"
            />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="py-16 text-center text-default-400">
          <p className="text-sm">この分類の社内報はまだありません</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((issue) => (
            <Link
              key={issue.id}
              href={`/app/newsletter/${issue.id}`}
              className="group overflow-hidden rounded-xl border border-default-200 bg-white transition-shadow hover:shadow-md"
            >
              <div className="relative h-32 bg-gradient-to-br from-primary-100 to-default-100">
                {issue.coverImageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element -- 社内報カバーは外部URL・最適化不要
                  <img
                    src={issue.coverImageUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                )}
                <span className="absolute left-2 top-2 rounded bg-white/90 px-2 py-0.5 text-[10px] font-bold text-primary">
                  {NEWSLETTER_CATEGORY_LABEL[issue.category]}
                </span>
              </div>
              <div className="p-3">
                <h2 className="line-clamp-2 text-sm font-bold leading-snug text-default-800 group-hover:text-primary">
                  {issue.title}
                </h2>
                {issue.summary && (
                  <p className="mt-1 line-clamp-2 text-xs text-default-500">
                    {issue.summary}
                  </p>
                )}
                <div className="mt-2 flex items-center gap-2 text-[11px] text-default-400">
                  <span>{formatDate(issue.publishedAt)}</span>
                  <span aria-hidden="true">·</span>
                  <span>{issue.viewCount} views</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
