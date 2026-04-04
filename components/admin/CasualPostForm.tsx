"use client";

import { Button, Input, Select, SelectItem, Textarea } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Company, Post, PostStatus } from "@/types/database";

interface CasualPostFormProps {
  post?: Post;
  companies: Company[];
  defaultCompanyId?: string;
  /** 一般ユーザーの場合 true。ステータス選択・会社選択を隠す */
  isUserMode?: boolean;
}

const POST_STATUSES: { value: PostStatus; label: string }[] = [
  { value: "DRAFT", label: "下書き" },
  { value: "OPEN", label: "公開中" },
];

export function CasualPostForm({
  post,
  companies,
  defaultCompanyId,
  isUserMode = false,
}: CasualPostFormProps) {
  const router = useRouter();
  const isEdit = Boolean(post);

  const [title, setTitle] = useState(post?.title ?? "");
  const [body, setBody] = useState(post?.body ?? "");
  const [thumbnailUrl, setThumbnailUrl] = useState(post?.thumbnail_url ?? "");
  const [companyId, setCompanyId] = useState(
    post?.company_id ?? defaultCompanyId ?? "",
  );
  const [postStatus, setPostStatus] = useState<PostStatus>(
    post?.post_status ?? "OPEN",
  );
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

    let resolvedCompanyId = companyId;

    // 一般ユーザーモード: 所属会社を自動取得
    if (isUserMode || !resolvedCompanyId) {
      const { data: memberData } = await supabase
        .from("company_members")
        .select("company_id")
        .eq("user_id", user.id)
        .limit(1)
        .single();

      if (!memberData?.company_id) {
        setError("所属会社が設定されていません。設定を確認してください。");
        setIsLoading(false);
        return;
      }
      resolvedCompanyId = memberData.company_id;
    }

    const resolvedStatus = isUserMode ? "OPEN" : postStatus;

    const payload = {
      title,
      body,
      post_type: "CASUAL" as const,
      post_status: resolvedStatus,
      company_id: resolvedCompanyId,
      thumbnail_url: thumbnailUrl || null,
      published_at: resolvedStatus === "OPEN" ? new Date().toISOString() : null,
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

    if (isUserMode) {
      router.push("/app/casual-posts");
    } else {
      router.push("/company/posts");
    }
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
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
        placeholder="投稿のタイトルを入力"
        classNames={{ inputWrapper: "border border-slate-200" }}
      />

      <Textarea
        label="本文"
        value={body}
        onValueChange={setBody}
        isRequired
        placeholder="投稿の内容を入力してください"
        minRows={6}
        classNames={{ inputWrapper: "border border-slate-200" }}
      />

      <Input
        label="サムネイル画像URL（任意）"
        value={thumbnailUrl}
        onValueChange={setThumbnailUrl}
        placeholder="https://..."
        classNames={{ inputWrapper: "border border-slate-200" }}
      />

      {!isUserMode && (
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="所属会社"
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

          <Select
            label="ステータス"
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
      )}

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
          {isEdit ? "更新する" : "投稿する"}
        </Button>
      </div>
    </form>
  );
}
