"use client";

import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Switch,
} from "@heroui/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import type { PostStatus, PostType } from "@/types/database";
import { PostStatusBadge } from "./PostStatusBadge";
import { PostThumbnail } from "./PostThumbnail";
import { PostTypeBadge } from "./PostTypeBadge";

export interface PostRow {
  id: string;
  title: string;
  post_type: PostType;
  post_status: PostStatus;
  thumbnail_url: string | null;
  application_count: number;
  updated_at: string;
}

type TabKey = "all" | "official" | "casual" | "in_progress" | "draft";

const TABS: { key: TabKey; label: string }[] = [
  { key: "all", label: "すべて" },
  { key: "official", label: "公式案件" },
  { key: "casual", label: "気軽投稿" },
  { key: "in_progress", label: "対応中" },
  { key: "draft", label: "下書き" },
];

const STATUS_LABELS: Record<PostStatus, string> = {
  DRAFT: "下書き",
  OPEN: "公開中",
  PUBLISHED: "公開中",
  IN_PROGRESS: "対応中",
  CLOSED: "終了",
};

const CHANGE_STATUSES: { value: PostStatus; label: string }[] = [
  { value: "DRAFT", label: "下書き" },
  { value: "OPEN", label: "公開中" },
  { value: "IN_PROGRESS", label: "対応中" },
  { value: "CLOSED", label: "終了" },
];

function _isActiveStatus(s: PostStatus): boolean {
  return (
    s === "DRAFT" || s === "OPEN" || s === "IN_PROGRESS" || s === "PUBLISHED"
  );
}

interface StatusChangerProps {
  postId: string;
  currentStatus: PostStatus;
  onChanged: (id: string, status: PostStatus) => void;
}

function StatusChanger({
  postId,
  currentStatus,
  onChanged,
}: StatusChangerProps) {
  const [isPending, startTransition] = useTransition();

  const handleChange = (status: PostStatus) => {
    startTransition(async () => {
      const supabase = createClient();
      const update: Record<string, unknown> = {
        post_status: status,
        updated_at: new Date().toISOString(),
      };
      if (status === "OPEN" || status === "IN_PROGRESS") {
        update.published_at = new Date().toISOString();
      }
      if (status === "CLOSED") {
        update.closed_at = new Date().toISOString();
      }
      await supabase.from("posts").update(update).eq("id", postId);
      onChanged(postId, status);
    });
  };

  return (
    <Dropdown>
      <DropdownTrigger>
        <button
          disabled={isPending}
          className="text-xs text-slate-500 hover:text-slate-800 underline underline-offset-2 transition-colors disabled:opacity-50"
        >
          {isPending ? "変更中..." : STATUS_LABELS[currentStatus]}
        </button>
      </DropdownTrigger>
      <DropdownMenu aria-label="ステータス変更">
        {CHANGE_STATUSES.map((s) => (
          <DropdownItem
            key={s.value}
            onPress={() => handleChange(s.value)}
            className={currentStatus === s.value ? "font-semibold" : ""}
          >
            {s.label}
          </DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  );
}

interface PostsManagementClientProps {
  posts: PostRow[];
}

export function PostsManagementClient({
  posts: initialPosts,
}: PostsManagementClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [showClosed, setShowClosed] = useState(false);
  const [posts, setPosts] = useState<PostRow[]>(initialPosts);

  const isOfficialMode = activeTab === "official";

  const filteredPosts = useMemo(() => {
    return posts.filter((p) => {
      // showClosed でなければ closed を除外
      if (!showClosed && p.post_status === "CLOSED") return false;

      switch (activeTab) {
        case "official":
          return p.post_type === "OFFICIAL";
        case "casual":
          return p.post_type === "CASUAL";
        case "in_progress":
          return p.post_status === "IN_PROGRESS";
        case "draft":
          return p.post_status === "DRAFT";
        default:
          return true;
      }
    });
  }, [posts, activeTab, showClosed]);

  const handleStatusChange = (id: string, status: PostStatus) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, post_status: status } : p)),
    );
    router.refresh();
  };

  // 公式案件モードのアクセント色
  const _officialAccent = isOfficialMode ? "bg-blue-900" : "bg-slate-100";
  const tabActiveClass = isOfficialMode
    ? "border-blue-400 text-blue-200 font-semibold"
    : "border-primary text-primary font-semibold";
  const tabInactiveClass = isOfficialMode
    ? "text-slate-300 hover:text-white"
    : "text-default-500 hover:text-default-800";

  return (
    <div>
      {/* ヘッダー: 投稿するボタン */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-default-900">案件管理</h1>
          <p className="text-sm text-default-500 mt-0.5">
            運用中の案件を管理します
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Switch
            size="sm"
            isSelected={showClosed}
            onValueChange={setShowClosed}
            classNames={{ label: "text-xs text-default-500" }}
          >
            過去案件も表示する
          </Switch>
          <Dropdown>
            <DropdownTrigger>
              <Button
                className={
                  isOfficialMode
                    ? "bg-blue-800 text-white"
                    : "bg-primary text-white"
                }
                size="sm"
                endContent={
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                }
              >
                投稿する
              </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="投稿種別を選択">
              <DropdownItem
                key="official"
                href="/company/posts/new/official"
                startContent={
                  <span className="w-5 h-5 bg-blue-700 rounded flex items-center justify-center text-white text-[10px] font-bold">
                    公
                  </span>
                }
                description="admin専用の業務案件"
              >
                公式案件を投稿
              </DropdownItem>
              <DropdownItem
                key="casual"
                href="/company/casual-posts/new"
                startContent={
                  <span className="w-5 h-5 bg-emerald-500 rounded flex items-center justify-center text-white text-[10px] font-bold">
                    気
                  </span>
                }
                description="気軽なお知らせや告知"
              >
                気軽に投稿
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
      </div>

      {/* タブバー */}
      <div
        className={`rounded-xl mb-0 ${isOfficialMode ? "bg-blue-900" : "bg-white border border-slate-200"}`}
      >
        <div className="flex items-center px-4 pt-3 gap-1">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2.5 text-sm border-b-2 transition-colors ${
                  isActive
                    ? tabActiveClass
                    : `border-transparent ${tabInactiveClass}`
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* テーブル */}
        <div className={`${isOfficialMode ? "bg-white rounded-b-xl" : ""}`}>
          {filteredPosts.length === 0 ? (
            <div className="p-12 text-center text-sm text-default-400">
              {showClosed ? "案件がありません" : "運用中の案件がありません"}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr
                  className={`border-b ${isOfficialMode ? "border-slate-200 bg-slate-50" : "border-slate-100"}`}
                >
                  <th className="text-left px-4 py-3 text-xs font-medium text-default-500 w-14">
                    サムネ
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-default-500">
                    タイトル
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-default-500 w-20">
                    種別
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-default-500 w-24">
                    ステータス
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-default-500 w-16">
                    応募数
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-default-500 w-28">
                    更新日
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-default-500 w-48">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredPosts.map((post) => (
                  <tr
                    key={post.id}
                    className={`border-b last:border-0 hover:bg-slate-50 transition-colors ${
                      isOfficialMode && post.post_type === "OFFICIAL"
                        ? "border-blue-50"
                        : "border-slate-100"
                    }`}
                  >
                    <td className="px-4 py-3">
                      <PostThumbnail
                        thumbnailUrl={post.thumbnail_url}
                        title={post.title}
                        type={post.post_type}
                        size="sm"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-default-800 line-clamp-2 max-w-xs">
                        {post.title}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <PostTypeBadge type={post.post_type} />
                    </td>
                    <td className="px-4 py-3">
                      <PostStatusBadge status={post.post_status} />
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/company/applications?postId=${post.id}`}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        {post.application_count}件
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-default-400">
                        {new Date(post.updated_at).toLocaleDateString("ja-JP")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/company/posts/${post.id}/edit`}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          編集
                        </Link>
                        <span className="text-slate-200">|</span>
                        <StatusChanger
                          postId={post.id}
                          currentStatus={post.post_status}
                          onChanged={handleStatusChange}
                        />
                        <span className="text-slate-200">|</span>
                        <Link
                          href={`/company/applications?postId=${post.id}`}
                          className="text-xs text-slate-500 hover:text-slate-800 hover:underline"
                        >
                          応募一覧
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showClosed && (
        <p className="text-xs text-default-400 mt-2 text-right">
          過去案件も表示中 ·{" "}
          <Link
            href="/company/archive"
            className="underline hover:text-default-600"
          >
            過去案件ページへ
          </Link>
        </p>
      )}
    </div>
  );
}
