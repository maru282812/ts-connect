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

export function PostDetailCard({
  post,
  onApply,
  onInquiry,
  readonly = false,
}: PostDetailCardProps) {
  const isOfficial = post.post_type === "OFFICIAL";

  const deadline = post.deadline_at
    ? new Date(post.deadline_at).toLocaleDateString("ja-JP")
    : null;

  return (
    <Card className="w-full" shadow="sm">
      {/* ── 基本情報 ── */}
      <CardHeader className="flex flex-col items-start gap-3 pb-4">
        {post.thumbnail_url && (
          <img
            src={post.thumbnail_url}
            alt="サムネイル"
            className="w-full h-40 object-cover rounded-lg"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
          />
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
                  color="primary"
                  size="md"
                  onPress={onApply}
                  className="flex-1 min-w-[140px]"
                >
                  応募する
                </Button>
              )}
              {onInquiry && (
                <Button
                  color="secondary"
                  variant="flat"
                  size="md"
                  onPress={onInquiry}
                  className="flex-1 min-w-[140px]"
                >
                  問い合わせる
                </Button>
              )}
            </div>
          </CardBody>
        </>
      )}
    </Card>
  );
}
