"use client";

import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Input,
  Select,
  SelectItem,
  Textarea,
} from "@heroui/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Company, Post, PostStatus, PostType } from "@/types/database";

interface PostFormProps {
  post?: Post;
  companies: Company[];
  defaultCompanyId?: string;
}

const POST_TYPES: { value: PostType; label: string }[] = [
  { value: "OFFICIAL", label: "公式案件" },
  { value: "CASUAL", label: "気軽に投稿" },
];

const POST_STATUSES: { value: PostStatus; label: string }[] = [
  { value: "DRAFT", label: "下書き" },
  { value: "PUBLISHED", label: "公開中" },
  { value: "CLOSED", label: "終了" },
];

export function PostForm({ post, companies, defaultCompanyId }: PostFormProps) {
  const router = useRouter();
  const isEdit = Boolean(post);

  const [title, setTitle] = useState(post?.title ?? "");
  const [body, setBody] = useState(post?.body ?? "");
  const [postType, setPostType] = useState<PostType>(
    post?.post_type ?? "OFFICIAL",
  );
  const [postStatus, setPostStatus] = useState<PostStatus>(
    post?.post_status ?? "DRAFT",
  );
  const [companyId, setCompanyId] = useState(
    post?.company_id ?? defaultCompanyId ?? "",
  );
  const [priceText, setPriceText] = useState(post?.price_text ?? "");
  const [contactPersonName, setContactPersonName] = useState(
    post?.contact_person_name ?? "",
  );
  const [deadlineAt, setDeadlineAt] = useState(
    post?.deadline_at ? post.deadline_at.slice(0, 16) : "",
  );
  const [thumbnailUrl, setThumbnailUrl] = useState(post?.thumbnail_url ?? "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("認証エラー");
      setIsLoading(false);
      return;
    }

    const payload = {
      title,
      body,
      post_type: postType,
      post_status: postStatus,
      company_id: companyId,
      price_text: priceText || null,
      contact_person_name: contactPersonName || null,
      deadline_at: deadlineAt ? new Date(deadlineAt).toISOString() : null,
      published_at:
        postStatus === "PUBLISHED" ? new Date().toISOString() : null,
      closed_at: postStatus === "CLOSED" ? new Date().toISOString() : null,
      thumbnail_url: thumbnailUrl || null,
      updated_at: new Date().toISOString(),
    };

    let result;
    if (isEdit && post) {
      result = await supabase.from("posts").update(payload).eq("id", post.id);
    } else {
      result = await supabase.from("posts").insert({
        ...payload,
        created_by_user_id: user.id,
      });
    }

    setIsLoading(false);

    if (result.error) {
      setError(result.error.message);
      return;
    }

    router.push("/company/posts");
    router.refresh();
  };

  return (
    <Card className="max-w-2xl mx-auto" shadow="sm">
      <CardHeader>
        <h2 className="text-lg font-semibold">
          {isEdit ? "投稿を編集" : "新規投稿を作成"}
        </h2>
      </CardHeader>
      <Divider />
      <CardBody>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <p className="text-danger text-sm bg-danger-50 rounded-lg p-3">
              {error}
            </p>
          )}

          <Input
            label="タイトル"
            value={title}
            onValueChange={setTitle}
            isRequired
            placeholder="案件タイトルを入力"
          />

          <Textarea
            label="本文"
            value={body}
            onValueChange={setBody}
            isRequired
            placeholder="案件の詳細を入力してください"
            minRows={6}
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="投稿種別"
              selectedKeys={[postType]}
              onSelectionChange={(keys) =>
                setPostType(Array.from(keys)[0] as PostType)
              }
            >
              {POST_TYPES.map((t) => (
                <SelectItem key={t.value}>{t.label}</SelectItem>
              ))}
            </Select>

            <Select
              label="掲載状態"
              selectedKeys={[postStatus]}
              onSelectionChange={(keys) =>
                setPostStatus(Array.from(keys)[0] as PostStatus)
              }
            >
              {POST_STATUSES.map((s) => (
                <SelectItem key={s.value}>{s.label}</SelectItem>
              ))}
            </Select>
          </div>

          <Select
            label="会社"
            selectedKeys={companyId ? [companyId] : []}
            onSelectionChange={(keys) =>
              setCompanyId(Array.from(keys)[0] as string)
            }
            isRequired
          >
            {companies.map((c) => (
              <SelectItem key={c.id}>{c.name}</SelectItem>
            ))}
          </Select>

          <Input
            label="単価"
            value={priceText}
            onValueChange={setPriceText}
            placeholder="例: 5,000円/件"
          />

          <Input
            label="担当者名"
            value={contactPersonName}
            onValueChange={setContactPersonName}
            placeholder="例: 山田 太郎"
          />

          <Input
            label="締切日時"
            type="datetime-local"
            value={deadlineAt}
            onValueChange={setDeadlineAt}
          />

          <Input
            label="サムネイルURL"
            value={thumbnailUrl}
            onValueChange={setThumbnailUrl}
            placeholder="https://example.com/image.png"
          />

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="flat"
              onPress={() => router.back()}
              className="flex-1"
            >
              キャンセル
            </Button>
            <Button
              type="submit"
              color="primary"
              isLoading={isLoading}
              className="flex-1"
            >
              {isEdit ? "更新する" : "作成する"}
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
