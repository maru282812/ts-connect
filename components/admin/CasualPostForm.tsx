"use client";

import { Input, Select, SelectItem } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  formInputClasses,
  formSelectClasses,
} from "@/components/common/FormField";
import { ThumbnailInput } from "@/components/common/ThumbnailInput";
import { AppButton } from "@/components/ui/AppButton";
import { AutoResizeTextarea } from "@/components/ui/AutoResizeTextarea";
import { FormField } from "@/components/ui/FormField";
import { CASUAL_POST_STATUSES, isPublicStatus } from "@/lib/postStatus";
import { createClient } from "@/lib/supabase/client";
import type { Company, Post, PostStatus } from "@/types/database";

interface CasualPostFormProps {
  post?: Post;
  companies: Company[];
  defaultCompanyId?: string;
  /** 一般ユーザーの場合 true。ステータス選択・会社選択を隠す */
  isUserMode?: boolean;
}

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
  const [deadlineAt, setDeadlineAt] = useState(
    post?.deadline_at ? post.deadline_at.slice(0, 10) : "",
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
      deadline_at: deadlineAt ? new Date(deadlineAt).toISOString() : null,
      published_at: isPublicStatus(resolvedStatus) ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    };

    const result =
      isEdit && post
        ? await supabase.from("posts").update(payload).eq("id", post.id)
        : await supabase.from("posts").insert({
            ...payload,
            created_by_user_id: user.id,
          });

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

      <FormField label="タイトル" required>
        <Input
          value={title}
          onValueChange={setTitle}
          isRequired
          placeholder="投稿のタイトルを入力"
          variant="bordered"
          size="lg"
          classNames={formInputClasses}
        />
      </FormField>

      <FormField label="本文" required>
        <AutoResizeTextarea
          value={body}
          onValueChange={setBody}
          isRequired
          placeholder="投稿の内容を入力してください"
          minRows={5}
        />
      </FormField>

      <FormField label="サムネイル画像">
        <ThumbnailInput
          value={thumbnailUrl}
          onChange={setThumbnailUrl}
          onError={setError}
        />
      </FormField>

      <FormField label="締切日（任意）">
        <Input
          type="date"
          value={deadlineAt}
          onValueChange={setDeadlineAt}
          variant="bordered"
          size="lg"
          classNames={formInputClasses}
        />
      </FormField>

      {!isUserMode && (
        <div className="grid grid-cols-2 gap-4">
          <FormField label="所属会社" required>
            <Select
              selectedKeys={companyId ? [companyId] : []}
              onSelectionChange={(keys) =>
                setCompanyId(Array.from(keys)[0] as string)
              }
              isRequired
              variant="bordered"
              classNames={formSelectClasses}
            >
              {companies.map((c) => (
                <SelectItem key={c.id}>{c.name}</SelectItem>
              ))}
            </Select>
          </FormField>

          <FormField label="ステータス">
            <Select
              selectedKeys={[postStatus]}
              onSelectionChange={(keys) =>
                setPostStatus(Array.from(keys)[0] as PostStatus)
              }
              variant="bordered"
              classNames={formSelectClasses}
            >
              {CASUAL_POST_STATUSES.map((s) => (
                <SelectItem key={s.value}>{s.label}</SelectItem>
              ))}
            </Select>
          </FormField>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <AppButton
          type="button"
          variantType="secondary"
          onPress={() => router.back()}
          className="flex-1"
        >
          キャンセル
        </AppButton>
        <AppButton
          type="submit"
          isLoading={isLoading}
          className="flex-1"
        >
          {isEdit ? "更新する" : "投稿する"}
        </AppButton>
      </div>
    </form>
  );
}
