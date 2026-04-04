import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Divider,
  Input,
  Textarea,
} from "@heroui/react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { PostWithRelations } from "@/types/database";

interface ArchivePostDetailPageProps {
  params: Promise<{ postId: string }>;
}

export default async function ArchivePostDetailPage({
  params,
}: ArchivePostDetailPageProps) {
  const { postId } = await params;
  const supabase = await createClient();

  const { data: post } = await supabase
    .from("posts")
    .select(
      "*, companies(id, name), users:created_by_user_id(id, display_name, email)",
    )
    .eq("id", postId)
    .eq("post_status", "CLOSED")
    .single();

  if (!post) {
    notFound();
  }

  const p = post as PostWithRelations;
  const closedAt = p.closed_at
    ? new Date(p.closed_at).toLocaleDateString("ja-JP")
    : "—";

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button as={Link} href="/company/archive" variant="flat" size="sm">
          ← 過去案件一覧へ
        </Button>
        <Chip color="default" variant="flat">
          終了
        </Chip>
      </div>

      <Card shadow="sm">
        <CardHeader className="flex items-start justify-between">
          <div>
            <p className="text-sm text-default-400">
              {p.companies?.name ?? "未設定"}
            </p>
            <h1 className="text-xl font-bold text-default-900 mt-1">
              {p.title}
            </h1>
          </div>
        </CardHeader>
        <Divider />
        <CardBody className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="投稿種別"
              value={p.post_type === "OFFICIAL" ? "公式案件" : "気軽に投稿"}
              isReadOnly
            />
            <Input label="掲載状態" value="終了" isReadOnly />
            <Input label="単価" value={p.price_text ?? "—"} isReadOnly />
            <Input
              label="担当者"
              value={p.contact_person_name ?? "—"}
              isReadOnly
            />
            <Input label="終了日" value={closedAt} isReadOnly />
            <Input
              label="作成者"
              value={p.users?.display_name ?? "匿名"}
              isReadOnly
            />
          </div>
          <Textarea label="本文" value={p.body} isReadOnly minRows={6} />
        </CardBody>
      </Card>
    </div>
  );
}
