"use client";

import { Button, Chip, Divider } from "@heroui/react";
import { useEffect, useState } from "react";
import { ApplicationModal } from "@/components/common/ApplicationModal";
import { isActiveStatus } from "@/lib/postStatus";
import { createClient } from "@/lib/supabase/client";
import type { ApplicationType, PostWithRelations } from "@/types/database";

interface PostDetailPaneProps {
  post: PostWithRelations;
  onApplicationSuccess?: (postId: string, type: ApplicationType) => void;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-bold text-default-400 uppercase tracking-wider mb-3">
      {children}
    </h2>
  );
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
  const companyName = post.companies?.name ?? "会社不明";

  const deadline = post.deadline_at
    ? new Date(post.deadline_at).toLocaleDateString("ja-JP")
    : null;

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
        {/* ── 基本情報（スティッキーヘッダー） ── */}
        <div className="sticky top-0 bg-white z-10 rounded-t-xl px-5 pt-5 pb-4 border-b border-default-100 shadow-[0_2px_6px_rgba(0,0,0,0.06)]">
          {successMessage && (
            <div className="mb-3 flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2.5">
              <p className="text-sm text-emerald-700 font-medium">
                ✓ {successMessage}
              </p>
              <button
                type="button"
                onClick={() => setSuccessMessage(null)}
                className="text-emerald-500 hover:text-emerald-700 text-xl leading-none ml-4"
                aria-label="閉じる"
              >
                ×
              </button>
            </div>
          )}

          {/* タイプ・ステータスバッジ */}
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <Chip
              size="sm"
              color={isOfficial ? "primary" : "success"}
              variant="flat"
            >
              {isOfficial ? "公式案件" : "気軽に投稿"}
            </Chip>
            {isActiveStatus(post.post_status) && (
              <Chip
                size="sm"
                color={post.post_status === "OPEN" ? "primary" : "warning"}
                variant="flat"
              >
                {post.post_status === "OPEN" ? "公開中" : "対応中"}
              </Chip>
            )}
            {post.post_status === "CLOSED" && (
              <Chip size="sm" color="default" variant="flat">
                終了
              </Chip>
            )}
          </div>

          {/* タイトル */}
          <h1 className="text-xl font-bold text-default-900 leading-snug mb-1">
            {post.title}
          </h1>

          {/* 投稿会社 */}
          <p className="text-sm text-default-500 mb-3">{companyName}</p>

          {/* アクションボタン */}
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

        {/* ── 案件内容 ── */}
        <div className="px-5 py-6">
          <SectionLabel>{isOfficial ? "案件内容" : "投稿内容"}</SectionLabel>
          <div className="whitespace-pre-wrap text-default-700 leading-relaxed text-sm">
            {post.body}
          </div>
        </div>

        {/* ── 募集条件（公式案件のみ） ── */}
        {isOfficial && (
          <>
            <Divider />
            <div className="px-5 py-6">
              <SectionLabel>募集条件</SectionLabel>
              <div className="whitespace-pre-wrap text-default-700 leading-relaxed text-sm">
                {post.requirements ?? "未設定"}
              </div>
            </div>
          </>
        )}

        {/* ── 締切（気軽な投稿で設定されている場合） ── */}
        {!isOfficial && deadline && (
          <>
            <Divider />
            <div className="px-5 py-6">
              <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-sm">
                <dt className="text-default-400 font-medium">締切</dt>
                <dd className="text-default-700">{deadline}</dd>
              </dl>
            </div>
          </>
        )}

        {/* ── 補足情報（公式案件のみ） ── */}
        {isOfficial && (
          <>
            <Divider />
            <div className="px-5 py-6">
              <SectionLabel>補足情報</SectionLabel>
              <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-sm">
                <dt className="text-default-400 font-medium">報酬</dt>
                <dd className="text-default-700">
                  {post.price_text ?? "応相談"}
                </dd>

                <dt className="text-default-400 font-medium">締切</dt>
                <dd className="text-default-700">{deadline ?? "期限未設定"}</dd>

                <dt className="text-default-400 font-medium">担当者</dt>
                <dd className="text-default-700">
                  {post.contact_person_name ?? "未設定"}
                </dd>

                {post.reference_url && (
                  <>
                    <dt className="text-default-400 font-medium">参考URL</dt>
                    <dd className="text-default-700 break-all">
                      <a
                        href={post.reference_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline"
                      >
                        {post.reference_url}
                      </a>
                    </dd>
                  </>
                )}
              </dl>

              {post.application_limit && post.is_application_limit_enabled && (
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
          </>
        )}
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
