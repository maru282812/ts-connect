"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LinkedText } from "@/components/ui/LinkedText";
import {
  fetchIssue,
  NEWSLETTER_CATEGORY_LABEL,
  type NewsletterIssue,
  recordView,
} from "@/lib/newsletter";

export function NewsletterArticleClient() {
  const params = useParams();
  const router = useRouter();
  const issueId = params.issueId as string;

  const [issue, setIssue] = useState<NewsletterIssue | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const data = await fetchIssue(issueId);
      if (active) {
        setIssue(data);
        setLoading(false);
      }
      // 閲覧数を記録（既読は二重計上されない）
      if (data) recordView(issueId);
    })();
    return () => {
      active = false;
    };
  }, [issueId]);

  if (loading) {
    return <div className="bg-white rounded-xl h-96 animate-pulse" />;
  }

  if (!issue) {
    return (
      <div className="text-center py-16">
        <p className="text-default-500">社内報が見つかりませんでした</p>
        <button
          type="button"
          onClick={() => router.back()}
          className="mt-4 text-sm text-primary font-bold hover:underline"
        >
          ← 戻る
        </button>
      </div>
    );
  }

  const publishedLabel = issue.publishedAt
    ? new Date(issue.publishedAt).toLocaleDateString("ja-JP")
    : new Date(issue.createdAt).toLocaleDateString("ja-JP");

  return (
    <div className="max-w-3xl mx-auto w-full">
      <button
        type="button"
        onClick={() => router.back()}
        className="mb-4 text-sm text-default-500 hover:text-primary"
      >
        ← 一覧に戻る
      </button>

      <article className="bg-white rounded-xl border border-default-200 overflow-hidden">
        {issue.coverImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={issue.coverImageUrl}
            alt={issue.title}
            className="w-full h-64 object-contain bg-default-100"
          />
        )}
        <div className="p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-3">
            <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-[11px] font-bold">
              {NEWSLETTER_CATEGORY_LABEL[issue.category]}
            </span>
            <span className="text-xs text-default-400">{publishedLabel}</span>
            <span className="text-xs text-default-400">
              閲覧 {issue.viewCount}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-default-900 mb-6">
            {issue.title}
          </h1>
          {issue.summary && (
            <p className="text-sm text-default-500 mb-6 pb-6 border-b border-default-200">
              {issue.summary}
            </p>
          )}
          <div className="text-default-700 whitespace-pre-wrap leading-relaxed">
            <LinkedText text={issue.body} />
          </div>
          {issue.imageUrls.length > 0 && (
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {issue.imageUrls.map((url) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={url}
                  src={url}
                  alt=""
                  className="w-full h-48 rounded-lg object-cover bg-default-100"
                />
              ))}
            </div>
          )}
        </div>
      </article>
    </div>
  );
}
