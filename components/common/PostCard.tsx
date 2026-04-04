"use client";

import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Chip,
} from "@heroui/react";
import Link from "next/link";
import type { PostWithRelations } from "@/types/database";

interface PostCardProps {
  post: PostWithRelations;
  href: string;
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

export function PostCard({ post, href }: PostCardProps) {
  const bodyPreview =
    post.body.length > 120 ? `${post.body.slice(0, 120)}…` : post.body;
  const deadline = post.deadline_at
    ? new Date(post.deadline_at).toLocaleDateString("ja-JP")
    : "未設定";

  return (
    <Card
      className="w-full hover:shadow-md transition-shadow duration-200"
      shadow="sm"
    >
      {post.thumbnail_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.thumbnail_url}
          alt={post.title}
          className="w-full h-36 object-cover rounded-t-xl"
        />
      )}
      <CardHeader className="flex items-start justify-between gap-2 pb-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-default-400 mb-1">
            {post.companies?.name ?? "未設定"}
          </p>
          <h3 className="text-base font-semibold text-default-800 line-clamp-2">
            {post.title}
          </h3>
        </div>
        <Chip
          color={statusColorMap[post.post_status] ?? "default"}
          size="sm"
          variant="flat"
        >
          {statusLabelMap[post.post_status] ?? post.post_status}
        </Chip>
      </CardHeader>
      <CardBody className="py-2">
        <p className="text-sm text-default-500 line-clamp-3">{bodyPreview}</p>
        <div className="flex flex-wrap gap-4 mt-3 text-xs text-default-400">
          {post.contact_person_name && (
            <span>担当: {post.contact_person_name}</span>
          )}
          <span>締切: {deadline}</span>
          {post.price_text && <span>単価: {post.price_text}</span>}
        </div>
      </CardBody>
      <CardFooter className="pt-2">
        <Button
          as={Link}
          href={href}
          color="primary"
          variant="flat"
          size="sm"
          className="w-full"
        >
          詳細を見る
        </Button>
      </CardFooter>
    </Card>
  );
}
