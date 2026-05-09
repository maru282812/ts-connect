"use client";

import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Divider,
} from "@heroui/react";
import { POST_STATUS_CHIP_COLOR, POST_STATUS_LABELS } from "@/lib/postStatus";
import type { PostWithRelations } from "@/types/database";

interface PostDetailCardProps {
  post: PostWithRelations;
  onApply?: () => void;
  onInquiry?: () => void;
  readonly?: boolean;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-bold text-default-400 uppercase tracking-wider mb-3">
      {children}
    </h2>
  );
}

function SendIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

function MessageIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
    </svg>
  );
}

export function PostDetailCard({
  post,
  onApply,
  onInquiry,
  readonly = false,
}: PostDetailCardProps) {
  const isOfficial = post.post_type === "OFFICIAL";
  const actionButtonBase =
    "flex-1 min-w-[140px] h-10 px-6 rounded-full text-sm font-medium";
  const primaryActionClass = isOfficial
    ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
    : "bg-green-600 hover:bg-green-700 text-white shadow-sm";
  const subActionClass = isOfficial
    ? "border-blue-300 text-blue-600 hover:bg-blue-50"
    : "border-green-300 text-green-600 hover:bg-green-50";

  const deadline = post.deadline_at
    ? new Date(post.deadline_at).toLocaleDateString("ja-JP")
    : null;

  return (
    <Card className="w-full" shadow="sm">
      {/* ── 基本情報 ── */}
      <CardHeader className="flex flex-col items-start gap-3 pb-4">
        {post.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.thumbnail_url}
            alt="サムネイル"
            className="w-full h-40 object-cover rounded-lg shadow-sm"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <div
            className={`w-full h-40 rounded-lg shadow-sm flex flex-col items-center justify-center gap-2 px-4 ${
              isOfficial
                ? "bg-blue-50 text-blue-700"
                : "bg-green-50 text-green-700"
            }`}
          >
            <span className="text-sm font-medium">
              {isOfficial ? "公式案件" : "気軽に投稿"}
            </span>
            <span className="text-lg font-bold text-center line-clamp-2 leading-snug">
              {post.title}
            </span>
          </div>
        )}

        <div className="flex items-start justify-between w-full gap-3">
          <div className="flex-1">
            <p className="text-sm text-default-400 mb-1">
              {post.companies?.name ?? "未設定"}
            </p>
            <h1 className="text-xl font-bold text-default-900">{post.title}</h1>
          </div>
          <Chip
            color={POST_STATUS_CHIP_COLOR[post.post_status] ?? "default"}
            variant="flat"
            size="sm"
          >
            {POST_STATUS_LABELS[post.post_status] ?? post.post_status}
          </Chip>
        </div>
      </CardHeader>

      <Divider />

      {/* ── 案件内容 ── */}
      <CardBody className="py-6">
        <SectionLabel>案件内容</SectionLabel>
        <div className="whitespace-pre-wrap text-default-700 leading-relaxed text-sm">
          {post.body}
        </div>
      </CardBody>

      {/* ── 募集条件（公式案件のみ） ── */}
      {isOfficial && (
        <>
          <Divider />
          <CardBody className="py-6">
            <SectionLabel>募集条件</SectionLabel>
            <div className="whitespace-pre-wrap text-default-700 leading-relaxed text-sm">
              {post.requirements ?? "未設定"}
            </div>
          </CardBody>
        </>
      )}

      {/* ── 補足情報（公式案件） ── */}
      {isOfficial && (
        <>
          <Divider />
          <CardBody className="py-6">
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
          </CardBody>
        </>
      )}

      {/* ── 締切（気軽な投稿で設定されている場合） ── */}
      {!isOfficial && deadline && (
        <>
          <Divider />
          <CardBody className="py-6">
            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-sm">
              <dt className="text-default-400 font-medium">締切</dt>
              <dd className="text-default-700">{deadline}</dd>
            </dl>
          </CardBody>
        </>
      )}

      {/* ── アクション ── */}
      {!readonly && (onApply || onInquiry) && (
        <>
          <Divider />
          <CardBody className="pt-4 pb-4">
            <div className="flex gap-3 flex-wrap">
              {onApply && (
                <Button
                  size="md"
                  onPress={onApply}
                  className={`${actionButtonBase} ${primaryActionClass}`}
                  variant="solid"
                  startContent={<SendIcon />}
                >
                  応募する
                </Button>
              )}
              {onInquiry && (
                <Button
                  variant="bordered"
                  size="md"
                  onPress={onInquiry}
                  className={`${actionButtonBase} ${subActionClass}`}
                  startContent={<MessageIcon />}
                >
                  聞いてみる
                </Button>
              )}
            </div>
          </CardBody>
        </>
      )}
    </Card>
  );
}
