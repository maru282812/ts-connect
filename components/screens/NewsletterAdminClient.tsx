"use client";

import Link from "next/link";
import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { AppButton } from "@/components/ui/AppButton";

// ============================================================
// 社内報 管理一覧（管理画面 / company surface）
// ルート: /company/newsletter
// ※ ロジック未実装。DB/API が無いため仮データで一覧表示。
//   将来は /api/newsletter/* 等の取得結果へ差し替える。
//   新規作成ボタンは /company/newsletter/new へ遷移する。
// 配色は管理画面のハウススタイル（default-* / primary）に準拠。
// ============================================================

type IssueStatus = "PUBLISHED" | "DRAFT" | "SCHEDULED";

interface NewsletterRow {
  id: string;
  title: string;
  category: string;
  dateLabel: string;
  status: IssueStatus;
  views: number;
  pickup: boolean;
}

const STATUS_META: Record<IssueStatus, { label: string; tone: string }> = {
  PUBLISHED: { label: "公開中", tone: "bg-green-100 text-green-700" },
  DRAFT: { label: "下書き", tone: "bg-default-100 text-default-500" },
  SCHEDULED: { label: "予約投稿", tone: "bg-amber-100 text-amber-700" },
};

const ROWS: NewsletterRow[] = [
  {
    id: "issue-2026-06",
    title: "T's connect 社内報 2026年6月号",
    category: "月次",
    dateLabel: "2026/06/25",
    status: "PUBLISHED",
    views: 482,
    pickup: true,
  },
  {
    id: "pick-1",
    title: "DX推進本部が語る、社内ナレッジ基盤の裏側",
    category: "特集",
    dateLabel: "2026/06/20",
    status: "PUBLISHED",
    views: 311,
    pickup: true,
  },
  {
    id: "pick-2",
    title: "新入社員インタビュー：入社3ヶ月で感じたこと",
    category: "ピープル",
    dateLabel: "2026/06/12",
    status: "PUBLISHED",
    views: 198,
    pickup: true,
  },
  {
    id: "draft-2026-07",
    title: "T's connect 社内報 2026年7月号（編集中）",
    category: "月次",
    dateLabel: "—",
    status: "DRAFT",
    views: 0,
    pickup: false,
  },
];

const CATEGORY_BADGE: Record<string, string> = {
  月次: "bg-blue-100 text-blue-700",
  特集: "bg-violet-100 text-violet-700",
  ピープル: "bg-emerald-100 text-emerald-700",
  お知らせ: "bg-amber-100 text-amber-700",
};

function categoryBadgeClass(category: string): string {
  return CATEGORY_BADGE[category] ?? "bg-default-100 text-default-600";
}

export function NewsletterAdminClient() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | IssueStatus>("ALL");

  const filtered = ROWS.filter((r) => {
    if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
    if (search.trim() && !r.title.includes(search.trim())) return false;
    return true;
  });

  return (
    <div className="max-w-[1600px] mx-auto w-full">
      <PageHeader
        title="社内報管理"
        description="会社からのお知らせ・月次号・特集記事を作成し、社内SNSの社内報枠に掲載します"
        actions={
          <AppButton as={Link} href="/company/newsletter/new">
            + 新規作成
          </AppButton>
        }
      />

      {/* フィルター */}
      <div className="bg-white p-4 rounded-xl border border-default-200 flex flex-wrap gap-4 items-center mb-6">
        <div className="flex-1 min-w-[240px]">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-default-50 border border-default-200 rounded-lg py-2 px-4 text-sm focus:ring-2 focus:ring-primary outline-none"
            placeholder="タイトルで検索"
            type="text"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as "ALL" | IssueStatus)
          }
          className="w-44 bg-default-50 border border-default-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-primary outline-none"
        >
          <option value="ALL">全ステータス</option>
          <option value="PUBLISHED">公開中</option>
          <option value="DRAFT">下書き</option>
          <option value="SCHEDULED">予約投稿</option>
        </select>
      </div>

      {/* テーブル */}
      <div className="bg-white rounded-xl border border-default-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-default-50 border-b border-default-200">
              <tr className="text-xs text-default-500 uppercase">
                <th className="py-4 px-4">タイトル</th>
                <th className="py-4 px-4 w-28">種別</th>
                <th className="py-4 px-4 w-28">発行日</th>
                <th className="py-4 px-4 w-28">ステータス</th>
                <th className="py-4 px-4 w-24 text-right">閲覧数</th>
                <th className="py-4 px-4 w-32">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-default-100">
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-12 text-center text-sm text-default-400"
                  >
                    該当する社内報がありません
                  </td>
                </tr>
              ) : (
                filtered.map((r) => {
                  const status = STATUS_META[r.status];
                  return (
                    <tr
                      key={r.id}
                      className="hover:bg-default-50 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-default-800 line-clamp-1">
                            {r.title}
                          </span>
                          {r.pickup && (
                            <span className="shrink-0 rounded bg-primary-50 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                              ピックアップ
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex rounded px-2 py-0.5 text-[11px] font-bold ${categoryBadgeClass(
                            r.category,
                          )}`}
                        >
                          {r.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-default-500">
                        {r.dateLabel}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.tone}`}
                        >
                          {status.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-sm text-default-700">
                        {r.views.toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            className="text-xs text-primary hover:underline"
                          >
                            詳細
                          </button>
                          <span className="text-default-200">|</span>
                          <button
                            type="button"
                            className="text-xs text-blue-600 hover:underline"
                          >
                            編集
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
