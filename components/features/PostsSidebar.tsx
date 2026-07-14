"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchRecommendedPosts } from "@/lib/recommend";

// ── おすすめ枠の表示アイテム ──
// migration 028/030 適用後は「プロフィールのスキル × 案件タグ一致」の実データを表示し、
// 未適用・一致0件のあいだは従来の仮データで枠自体は見せ続ける（デモ互換）。
interface RecommendedItem {
  id: string;
  title: string;
  company: string;
  thumbnailUrl: string | null;
  matchedTags: string[];
  href: string | null; // null = 仮データ（リンクなし）
}

const RECOMMENDED: RecommendedItem[] = [
  {
    id: "r-1",
    title: "フットサルメンバー急募！",
    company: "ゼロプライド株式会社",
    thumbnailUrl: null,
    matchedTags: [],
    href: null,
  },
  {
    id: "r-2",
    title: "英語を教えられる人募集！！",
    company: "ゼロプライド株式会社",
    thumbnailUrl: null,
    matchedTags: [],
    href: null,
  },
];

const POPULAR_ISSUES = [
  { rank: 1, title: "PCの動作が重い時の対処法", views: 450, comments: 12 },
  { rank: 2, title: "新しい福利厚生のアイデア", views: 320, comments: 45 },
  { rank: 3, title: "ランチのおすすめスポット", views: 280, comments: 18 },
];

const POPULAR_TAGS = [
  "#業務改善",
  "#DX",
  "#福利厚生",
  "#社内イベント",
  "#スキルシェア",
];

export function PostsSidebar() {
  // 仮データを初期値に。実レコメンドが取れたら置き換える（0件なら仮データ維持）。
  const [recommended, setRecommended] =
    useState<RecommendedItem[]>(RECOMMENDED);

  useEffect(() => {
    let active = true;
    (async () => {
      const results = await fetchRecommendedPosts(3);
      if (!active || results.length === 0) return;
      setRecommended(
        results.map((r) => ({
          id: r.post.id,
          title: r.post.title,
          company: r.post.companies?.name ?? "",
          thumbnailUrl: r.post.thumbnail_url ?? null,
          matchedTags: r.matchedTags,
          href: `/app/official-posts/${r.post.id}`,
        })),
      );
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <section className="bg-white p-6 rounded-xl border border-default-200">
        <h2 className="font-bold text-default-800 mb-4">
          ⭐ あなたへのおすすめ
        </h2>
        <div className="space-y-4">
          {recommended.map((r) => {
            const card = (
              <>
                {r.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={r.thumbnailUrl}
                    alt={r.title}
                    className="h-28 w-full rounded-lg object-cover mb-2"
                  />
                ) : (
                  <div className="h-28 rounded-lg overflow-hidden mb-2 bg-default-100 flex items-center justify-center text-default-300 text-xs">
                    画像
                  </div>
                )}
                <p className="text-sm font-bold text-default-800 line-clamp-1 group-hover:text-primary">
                  {r.title}
                </p>
                <p className="text-xs text-default-500">{r.company}</p>
                {r.matchedTags.length > 0 && (
                  <p className="text-[11px] text-primary mt-0.5">
                    一致タグ: {r.matchedTags.join(" / ")}
                  </p>
                )}
              </>
            );
            return r.href ? (
              <Link
                key={r.id}
                href={r.href}
                className="group block text-left w-full"
              >
                {card}
              </Link>
            ) : (
              <div key={r.id} className="group block text-left w-full">
                {card}
              </div>
            );
          })}
        </div>
      </section>

      <section className="bg-white p-6 rounded-xl border border-default-200">
        <h2 className="font-bold text-default-800 mb-4">
          人気困りごとランキング
        </h2>
        <div className="space-y-4">
          {POPULAR_ISSUES.map((p) => (
            <div key={p.rank} className="flex gap-3">
              <span
                className={`text-lg font-bold ${
                  p.rank === 1 ? "text-primary" : "text-default-400"
                }`}
              >
                {p.rank}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold text-default-800 line-clamp-1">
                  {p.title}
                </p>
                <p className="text-xs text-default-400">
                  👁 {p.views} 💬 {p.comments}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white p-6 rounded-xl border border-default-200">
        <h2 className="font-bold text-default-800 mb-4">人気タグ</h2>
        <div className="flex flex-wrap gap-2">
          {POPULAR_TAGS.map((t) => (
            <button
              key={t}
              type="button"
              className="px-3 py-1 bg-default-50 hover:bg-default-100 text-default-600 text-xs rounded-full transition-colors"
            >
              {t}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
