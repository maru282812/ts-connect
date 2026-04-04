"use client";

import { Button } from "@heroui/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { PostType, PostWithRelations } from "@/types/database";
import { PostThumbnail } from "./PostThumbnail";
import { PostTypeBadge } from "./PostTypeBadge";

interface ArchiveClientProps {
  posts: PostWithRelations[];
}

export function ArchiveClient({ posts }: ArchiveClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<PostType | "ALL">("ALL");
  const [duplicating, setDuplicating] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return posts.filter((p) => {
      const matchType = typeFilter === "ALL" || p.post_type === typeFilter;
      const matchSearch =
        !search ||
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.companies?.name?.toLowerCase().includes(search.toLowerCase());
      return matchType && matchSearch;
    });
  }, [posts, search, typeFilter]);

  const handleDuplicate = async (post: PostWithRelations) => {
    setDuplicating(post.id);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setDuplicating(null);
      return;
    }

    const { data: inserted, error } = await supabase
      .from("posts")
      .insert({
        title: `${post.title}（複製）`,
        body: post.body,
        post_type: post.post_type,
        post_status: "DRAFT",
        company_id: post.company_id,
        price_text: post.price_text,
        contact_person_name: post.contact_person_name,
        application_limit: post.application_limit,
        requirements:
          (post as PostWithRelations & { requirements?: string | null })
            .requirements ?? null,
        thumbnail_url:
          (post as PostWithRelations & { thumbnail_url?: string | null })
            .thumbnail_url ?? null,
        created_by_user_id: user.id,
        updated_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    setDuplicating(null);

    if (!error && inserted) {
      router.push(`/company/posts/${inserted.id}/edit`);
    }
  };

  return (
    <div>
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-default-900">過去案件</h1>
          <p className="text-sm text-default-500 mt-0.5">
            終了済み案件の一覧 · 複製して再投稿できます
          </p>
        </div>
        <Link
          href="/company/posts"
          className="text-sm text-default-400 hover:text-default-700 transition-colors"
        >
          ← 案件管理へ
        </Link>
      </div>

      {/* 検索・フィルター */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-default-400"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="タイトル・会社名で検索"
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>

        <div className="flex gap-1">
          {(["ALL", "OFFICIAL", "CASUAL"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`px-3 py-2 text-xs rounded-lg font-medium transition-colors ${
                typeFilter === type
                  ? type === "OFFICIAL"
                    ? "bg-blue-800 text-white"
                    : type === "CASUAL"
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-700 text-white"
                  : "bg-white border border-slate-200 text-default-600 hover:bg-slate-50"
              }`}
            >
              {type === "ALL"
                ? "すべて"
                : type === "OFFICIAL"
                  ? "公式案件"
                  : "気軽投稿"}
            </button>
          ))}
        </div>
      </div>

      {/* 一覧テーブル */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-sm text-default-400">
            {search || typeFilter !== "ALL"
              ? "条件に一致する過去案件がありません"
              : "過去案件がありません"}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-4 py-3 text-xs font-medium text-default-500 w-14">
                  サムネ
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-default-500">
                  タイトル
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-default-500 w-20">
                  種別
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-default-500 w-32">
                  会社
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-default-500 w-28">
                  終了日
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-default-500 w-40">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((post) => (
                <tr
                  key={post.id}
                  className="border-b last:border-0 border-slate-100 hover:bg-slate-50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <PostThumbnail
                      thumbnailUrl={
                        (
                          post as PostWithRelations & {
                            thumbnail_url?: string | null;
                          }
                        ).thumbnail_url
                      }
                      title={post.title}
                      type={post.post_type}
                      size="sm"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-default-700 line-clamp-2 max-w-xs">
                      {post.title}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <PostTypeBadge type={post.post_type} />
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-default-500">
                      {post.companies?.name ?? "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-default-400">
                      {post.closed_at
                        ? new Date(post.closed_at).toLocaleDateString("ja-JP")
                        : "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/company/archive/${post.id}`}
                        className="text-xs text-default-500 hover:text-default-800 hover:underline"
                      >
                        詳細
                      </Link>
                      <span className="text-slate-200">|</span>
                      <Button
                        size="sm"
                        variant="flat"
                        isLoading={duplicating === post.id}
                        onPress={() => handleDuplicate(post)}
                        className="text-xs h-7 px-3"
                      >
                        複製して再投稿
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-xs text-default-400 mt-3 text-right">
        {filtered.length} 件表示 / 合計 {posts.length} 件
      </p>
    </div>
  );
}
