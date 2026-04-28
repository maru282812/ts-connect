import { Button, Card, CardBody, CardHeader, Chip, Divider } from "@heroui/react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FormField } from "@/components/ui/FormField";
import { createClient } from "@/lib/supabase/server";
import type { PostWithRelations } from "@/types/database";

interface ArchivePostDetailPageProps {
  params: Promise<{ postId: string }>;
}

function ReadonlyField({ value }: { value: string }) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 h-12 flex items-center text-base text-slate-800">
      {value}
    </div>
  );
}

function ReadonlyTextarea({ value }: { value: string }) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-3 text-base text-slate-800 leading-relaxed min-h-[160px] whitespace-pre-wrap">
      {value}
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-l-4 border-slate-400 pl-3 mb-1">
      <p className="text-sm font-semibold text-slate-500">{children}</p>
    </div>
  );
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
        <CardBody className="flex flex-col gap-6">

          {/* ── 基本情報 ── */}
          <div className="flex flex-col gap-4">
            <SectionHeading>基本情報</SectionHeading>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="投稿種別">
                <ReadonlyField
                  value={p.post_type === "OFFICIAL" ? "公式案件" : "気軽に投稿"}
                />
              </FormField>
              <FormField label="掲載状態">
                <ReadonlyField value="終了" />
              </FormField>
            </div>
          </div>

          {/* ── 補足情報 ── */}
          <div className="flex flex-col gap-4">
            <SectionHeading>補足情報</SectionHeading>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="単価">
                <ReadonlyField value={p.price_text ?? "—"} />
              </FormField>
              <FormField label="担当者">
                <ReadonlyField value={p.contact_person_name ?? "—"} />
              </FormField>
              <FormField label="終了日">
                <ReadonlyField value={closedAt} />
              </FormField>
              <FormField label="作成者">
                <ReadonlyField value={p.users?.display_name ?? "匿名"} />
              </FormField>
            </div>
          </div>

          {/* ── 本文 ── */}
          <div className="flex flex-col gap-4">
            <SectionHeading>本文</SectionHeading>
            <FormField label="案件内容">
              <ReadonlyTextarea value={p.body} />
            </FormField>
          </div>

        </CardBody>
      </Card>
    </div>
  );
}
