"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppMenuGrid } from "@/components/user/AppMenuGrid";
import {
  fetchFeed,
  fetchWeeklyThemes,
  getActiveTheme,
  type FeedPost,
} from "@/lib/community";
import {
  NEWSLETTER_CATEGORY_LABEL,
  fetchPublishedIssues,
  type NewsletterIssue,
} from "@/lib/newsletter";
import { fetchRecommendedPosts, type RecommendedPost } from "@/lib/recommend";
import type { CommunityWeeklyTheme } from "@/types/database";

// ============================================================
// ホーム画面（従業員向けの着地点）
// 上部: 社内報最新号 / おすすめ案件 / 今週のテーマ / 最近の社内SNS
// 下部: 全機能への遷移先グリッド（AppMenuGrid を再利用）
// データは既存クライアント lib を流用。未取得/空セクションは非表示。
// ============================================================

// 029 未適用時の最新号フォールバック
const FALLBACK_LATEST: NewsletterIssue = {
  id: "issue-2026-06",
  title: "T's connect 社内報 2026年6月号",
  category: "MONTHLY",
  summary: "新オフィス移転の進捗と各部署の上半期ハイライトを特集しています。",
  body: "",
  coverImageUrl: null,
  imageUrls: [],
  status: "PUBLISHED",
  publishedAt: "2026-06-25",
  isPickup: true,
  viewCount: 128,
  createdAt: "2026-06-25",
};

function SectionHeading({
  title,
  href,
  linkLabel,
}: {
  title: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-2 flex items-baseline justify-between">
      <h2 className="text-sm font-bold text-default-700">{title}</h2>
      {href && (
        <Link href={href} className="text-xs font-medium text-primary">
          {linkLabel ?? "すべて見る"} ›
        </Link>
      )}
    </div>
  );
}

export function HomeClient() {
  const [latestIssue, setLatestIssue] = useState<NewsletterIssue | null>(null);
  const [recommended, setRecommended] = useState<RecommendedPost[]>([]);
  const [activeTheme, setActiveTheme] = useState<CommunityWeeklyTheme | null>(
    null,
  );
  const [recentPosts, setRecentPosts] = useState<FeedPost[]>([]);

  useEffect(() => {
    let alive = true;

    fetchPublishedIssues().then((issues) => {
      if (!alive) return;
      setLatestIssue(issues && issues.length > 0 ? issues[0] : FALLBACK_LATEST);
    });
    fetchRecommendedPosts(4).then((r) => alive && setRecommended(r));
    fetchWeeklyThemes().then((themes) => {
      if (!alive) return;
      setActiveTheme(getActiveTheme(themes));
    });
    fetchFeed().then((posts) => alive && setRecentPosts(posts.slice(0, 3)));

    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8">
      {/* 1. お知らせ・社内報 */}
      {latestIssue && (
        <section>
          <SectionHeading
            title="お知らせ・社内報"
            href="/app/newsletter"
            linkLabel="バックナンバー"
          />
          <Link
            href={`/app/newsletter/${latestIssue.id}`}
            className="block rounded-xl border border-amber-200 bg-amber-50 p-4 transition-shadow hover:shadow-sm"
          >
            <div className="flex items-center gap-2">
              <span className="rounded bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                NEW
              </span>
              <span className="text-[11px] font-bold text-amber-700">
                {NEWSLETTER_CATEGORY_LABEL[latestIssue.category]}
              </span>
            </div>
            <h3 className="mt-1 text-sm font-bold text-default-800">
              {latestIssue.title}
            </h3>
            {latestIssue.summary && (
              <p className="mt-1 line-clamp-2 text-xs text-default-600">
                {latestIssue.summary}
              </p>
            )}
            <span className="mt-2 inline-block text-xs font-bold text-amber-700">
              読む ›
            </span>
          </Link>
        </section>
      )}

      {/* 2. あなたへのおすすめ案件 */}
      {recommended.length > 0 && (
        <section>
          <SectionHeading
            title="あなたへのおすすめ案件"
            href="/app/posts"
            linkLabel="案件一覧"
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {recommended.map(({ post, matchedTags }) => (
              <Link
                key={post.id}
                href={`/app/posts/${post.id}`}
                className="rounded-xl border border-default-200 bg-white p-3 transition-shadow hover:shadow-sm"
              >
                <h3 className="line-clamp-1 text-sm font-bold text-default-800">
                  {post.title}
                </h3>
                {post.companies?.name && (
                  <p className="mt-0.5 text-[11px] text-default-400">
                    {post.companies.name}
                  </p>
                )}
                {matchedTags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {matchedTags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="rounded bg-primary-50 px-1.5 py-0.5 text-[10px] font-medium text-primary"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 3. 今週のテーマ */}
      {activeTheme && (
        <section>
          <SectionHeading title="今週のテーマ" />
          <Link
            href="/app/community"
            className="block rounded-xl border border-primary-200 bg-primary-50 p-4 transition-shadow hover:shadow-sm"
          >
            <p className="text-[11px] font-bold text-primary">📌 今週のテーマ</p>
            <h3 className="mt-1 text-sm font-bold text-default-800">
              {activeTheme.title}
            </h3>
            {activeTheme.description && (
              <p className="mt-1 line-clamp-2 text-xs text-default-600">
                {activeTheme.description}
              </p>
            )}
            <span className="mt-2 inline-block text-xs font-bold text-primary">
              このテーマで投稿する ›
            </span>
          </Link>
        </section>
      )}

      {/* 4. 最近の社内SNS */}
      {recentPosts.length > 0 && (
        <section>
          <SectionHeading
            title="最近の社内SNS"
            href="/app/community"
            linkLabel="社内SNS"
          />
          <div className="space-y-2">
            {recentPosts.map((post) => (
              <Link
                key={post.id}
                href="/app/community"
                className="flex gap-3 rounded-xl border border-default-200 bg-white p-3 transition-shadow hover:shadow-sm"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                  {post.author.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-default-700">
                    {post.author}
                  </p>
                  <p className="line-clamp-2 text-xs text-default-600">
                    {post.body}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 5. 全機能メニュー */}
      <section>
        <h2 className="mb-3 text-sm font-bold text-default-700">メニュー</h2>
        <AppMenuGrid />
      </section>
    </div>
  );
}
