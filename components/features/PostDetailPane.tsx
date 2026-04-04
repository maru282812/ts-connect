"use client";

import { Button, Chip } from "@heroui/react";
import { useEffect, useState } from "react";
import { ApplicationModal } from "@/components/common/ApplicationModal";
import { createClient } from "@/lib/supabase/client";
import type { ApplicationType, PostWithRelations } from "@/types/database";

interface PostDetailPaneProps {
  post: PostWithRelations;
  onApplicationSuccess?: (postId: string, type: ApplicationType) => void;
}

export function PostDetailPane({
  post,
  onApplicationSuccess,
}: PostDetailPaneProps) {
  const [modalType, setModalType] = useState<ApplicationType | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [appliedTypes, setAppliedTypes] = useState<Set<ApplicationType>>(
    new Set(),
  );

  const isOfficial = post.post_type === "OFFICIAL";
  const deadline = post.deadline_at
    ? new Date(post.deadline_at).toLocaleDateString("ja-JP")
    : null;
  const createdAt = new Date(post.created_at).toLocaleDateString("ja-JP");
  const publishedAt = post.published_at
    ? new Date(post.published_at).toLocaleDateString("ja-JP")
    : null;
  const userName = post.users?.display_name ?? "匿名";
  const companyName = post.companies?.name ?? "会社不明";

  // 応募済み状態を取得
  useEffect(() => {
    const fetchStatus = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("applications")
        .select("application_type")
        .eq("post_id", post.id)
        .eq("applicant_user_id", user.id);
      if (data) {
        setAppliedTypes(
          new Set(data.map((a) => a.application_type as ApplicationType)),
        );
      }
    };
    fetchStatus();
  }, [post.id]);

  const handleSuccess = (type: ApplicationType) => {
    setAppliedTypes((prev) => new Set([...prev, type]));
    onApplicationSuccess?.(post.id, type);
    if (type === "APPLY") {
      setSuccessMessage(
        isOfficial
          ? "応募を送信しました。担当者からの連絡をお待ちください。"
          : "参加希望を送信しました。投稿者からの連絡をお待ちください。",
      );
    } else {
      setSuccessMessage(
        "お問い合わせを送信しました。担当者からの連絡をお待ちください。",
      );
    }
    setModalType(null);
  };

  return (
    <div>
      <div className="bg-white rounded-xl border border-default-200 shadow-sm">
        {/* ── 上部：固定ヘッダーエリア ── */}
        <div className="sticky top-0 bg-white z-10 rounded-t-xl px-5 pt-5 pb-4 border-b border-default-100 shadow-[0_2px_6px_rgba(0,0,0,0.06)]">
          {/* 成功メッセージ */}
          {successMessage && (
            <div className="mb-3 flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2.5">
              <p className="text-sm text-emerald-700 font-medium">
                ✓ {successMessage}
              </p>
              <button
                onClick={() => setSuccessMessage(null)}
                className="text-emerald-500 hover:text-emerald-700 text-xl leading-none ml-4"
                aria-label="閉じる"
              >
                ×
              </button>
            </div>
          )}

          {/* Type + status badges */}
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <Chip
              size="sm"
              color={isOfficial ? "primary" : "success"}
              variant="flat"
            >
              {isOfficial ? "公式案件" : "気軽に投稿"}
            </Chip>
            {post.post_status === "PUBLISHED" && (
              <Chip size="sm" color="success" variant="flat">
                公開中
              </Chip>
            )}
            {post.post_status === "CLOSED" && (
              <Chip size="sm" color="default" variant="flat">
                終了
              </Chip>
            )}
          </div>

          {/* Title */}
          <h1 className="text-xl font-bold text-default-900 leading-snug mb-2">
            {post.title}
          </h1>

          {/* Meta */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-default-500 mb-3">
            <span>{companyName}</span>
            {isOfficial && post.price_text && (
              <span className="font-semibold text-primary">
                💰 {post.price_text}
              </span>
            )}
            {isOfficial && post.contact_person_name && (
              <span>担当: {post.contact_person_name}</span>
            )}
            {isOfficial && deadline && <span>締切: {deadline}</span>}
            {isOfficial && publishedAt && <span>掲載日: {publishedAt}</span>}
            {!isOfficial && <span>投稿者: {userName}</span>}
            <span>投稿日: {createdAt}</span>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 w-full">
            {appliedTypes.has("APPLY") ? (
              <Button
                color="default"
                size="md"
                className="flex-1 bg-default-100 text-default-400"
                isDisabled
                variant="flat"
                style={{ cursor: "default", pointerEvents: "none" }}
              >
                {isOfficial ? "応募済み" : "参加希望済み"}
              </Button>
            ) : (
              <Button
                color="primary"
                size="md"
                onPress={() => setModalType("APPLY")}
                className="flex-1"
                variant="solid"
              >
                {isOfficial ? "応募する" : "参加希望"}
              </Button>
            )}
            {appliedTypes.has("INQUIRY") ? (
              <Button
                color="default"
                size="md"
                className="flex-1 bg-default-100 text-default-400"
                isDisabled
                variant="flat"
                style={{ cursor: "default", pointerEvents: "none" }}
              >
                聞いてみる済み
              </Button>
            ) : (
              <Button
                color="secondary"
                variant="bordered"
                size="md"
                onPress={() => setModalType("INQUIRY")}
                className="flex-1"
              >
                聞いてみる
              </Button>
            )}
          </div>
        </div>

        {/* ── 下部：本文エリア ── */}
        <div className="px-5 py-6">
          <h2 className="text-sm font-semibold text-default-600 mb-3">
            {isOfficial ? "案件詳細" : "投稿内容"}
          </h2>
          <div className="whitespace-pre-wrap text-default-700 leading-relaxed text-sm">
            {post.body}
          </div>

          {isOfficial &&
            post.application_limit &&
            post.is_application_limit_enabled && (
              <div className="mt-4 p-3 bg-default-50 rounded-lg">
                <p className="text-xs text-default-500">
                  募集人数:{" "}
                  <span className="font-medium text-default-700">
                    {post.application_limit}名
                  </span>
                </p>
              </div>
            )}
        </div>
      </div>

      {modalType && (
        <ApplicationModal
          post={post}
          applicationType={modalType}
          isOpen={true}
          onClose={() => setModalType(null)}
          onSuccess={() => handleSuccess(modalType)}
        />
      )}
    </div>
  );
}
