"use client";

import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Divider,
} from "@heroui/react";
import type { PostWithRelations } from "@/types/database";

interface PostDetailCardProps {
  post: PostWithRelations;
  onApply?: () => void;
  onInquiry?: () => void;
  readonly?: boolean;
}

const statusColorMap: Record<string, "success" | "warning" | "default"> = {
  PUBLISHED: "success",
  DRAFT: "warning",
  CLOSED: "default",
};

const statusLabelMap: Record<string, string> = {
  PUBLISHED: "公開中",
  DRAFT: "下書き",
  CLOSED: "終了",
};

export function PostDetailCard({
  post,
  onApply,
  onInquiry,
  readonly = false,
}: PostDetailCardProps) {
  const deadline = post.deadline_at
    ? new Date(post.deadline_at).toLocaleDateString("ja-JP")
    : "未設定";
  const publishedAt = post.published_at
    ? new Date(post.published_at).toLocaleDateString("ja-JP")
    : null;

  return (
    <Card className="w-full" shadow="sm">
      <CardHeader className="flex flex-col items-start gap-3 pb-3">
        <div className="flex items-start justify-between w-full gap-3">
          <div className="flex-1">
            <p className="text-sm text-default-400 mb-1">
              {post.companies?.name ?? "未設定"}
            </p>
            <h1 className="text-xl font-bold text-default-900">{post.title}</h1>
          </div>
          <Chip
            color={statusColorMap[post.post_status] ?? "default"}
            variant="flat"
          >
            {statusLabelMap[post.post_status] ?? post.post_status}
          </Chip>
        </div>

        <div className="flex flex-wrap gap-4 text-sm text-default-500">
          {post.price_text && (
            <div className="flex items-center gap-1">
              <span className="font-medium text-primary">
                💰 {post.price_text}
              </span>
            </div>
          )}
          {post.contact_person_name && (
            <div className="flex items-center gap-1">
              <span>担当: {post.contact_person_name}</span>
            </div>
          )}
          <div>
            <span>締切: {deadline}</span>
          </div>
          {publishedAt && (
            <div>
              <span>掲載日: {publishedAt}</span>
            </div>
          )}
        </div>
      </CardHeader>

      <Divider />

      <CardBody className="py-6">
        <h2 className="text-sm font-semibold text-default-600 mb-3">
          案件詳細
        </h2>
        <div className="whitespace-pre-wrap text-default-700 leading-relaxed">
          {post.body}
        </div>
      </CardBody>

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
