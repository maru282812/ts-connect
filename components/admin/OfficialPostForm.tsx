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
import { isPublicStatus, POST_STATUSES } from "@/lib/postStatus";
import { createClient } from "@/lib/supabase/client";
import type { Company, Post, PostStatus } from "@/types/database";

interface OfficialPostFormProps {
  post?: Post;
  companies: Company[];
  defaultCompanyId?: string;
  cancelPath?: string;
}

export function OfficialPostForm({
  post,
  companies,
  defaultCompanyId,
  cancelPath = "/company/posts",
}: OfficialPostFormProps) {
  const router = useRouter();
  const isEdit = Boolean(post);

  const [title, setTitle] = useState(post?.title ?? "");
  const [body, setBody] = useState(post?.body ?? "");
  const [requirements, setRequirements] = useState(post?.requirements ?? "");
  const [priceText, setPriceText] = useState(post?.price_text ?? "");
  const [applicationLimit, setApplicationLimit] = useState(
    post?.application_limit ? String(post.application_limit) : "",
  );
  const [deadlineAt, setDeadlineAt] = useState(
    post?.deadline_at ? post.deadline_at.slice(0, 16) : "",
  );
  const [contactPersonName, setContactPersonName] = useState(
    post?.contact_person_name ?? "",
  );
  const [companyId, setCompanyId] = useState(
    post?.company_id ?? defaultCompanyId ?? "",
  );
  const [thumbnailUrl, setThumbnailUrl] = useState(post?.thumbnail_url ?? "");
  const [referenceUrl, setReferenceUrl] = useState(post?.reference_url ?? "");
  const [postStatus, setPostStatus] = useState<PostStatus>(
    post?.post_status ?? "DRAFT",
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!requirements.trim()) {
      setError("募集条件は必須項目です");
      return;
    }

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
      requirements,
      post_type: "OFFICIAL" as const,
      post_status: postStatus,
      company_id: companyId,
      price_text: priceText || null,
      contact_person_name: contactPersonName || null,
      application_limit: applicationLimit
        ? parseInt(applicationLimit, 10)
        : null,
      deadline_at: deadlineAt ? new Date(deadlineAt).toISOString() : null,
      thumbnail_url: thumbnailUrl || null,
      reference_url: referenceUrl || null,
      published_at: isPublicStatus(postStatus)
        ? new Date().toISOString()
        : null,
      closed_at: postStatus === "CLOSED" ? new Date().toISOString() : null,
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

    router.push(cancelPath);
    router.refresh();
  };

  const pageTitle = isEdit ? "公式案件を編集" : "公式案件を投稿";

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* パンくず */}
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <button
          type="button"
          onClick={() => router.push(cancelPath)}
          className="hover:text-slate-700 transition-colors"
        >
          ← 案件管理
        </button>
        <span className="text-slate-300">/</span>
        <span className="text-slate-400">{pageTitle}</span>
      </div>

      {/* ページタイトル */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-900">{pageTitle}</h1>
          <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full font-medium">
            公式
          </span>
        </div>
        <p className="text-slate-500 mt-1.5 text-sm">
          {isEdit
            ? post?.title
            : "業務案件として公開されます。募集条件は必須項目です。"}
        </p>
      </div>

      {/* フォームカード */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <form onSubmit={handleSubmit}>
          <div className="p-8 flex flex-col gap-6">
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
                placeholder="案件タイトルを入力"
                variant="bordered"
                size="lg"
                classNames={formInputClasses}
              />
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <FormField label="投稿会社" required>
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
                  {POST_STATUSES.map((s) => (
                    <SelectItem key={s.value}>{s.label}</SelectItem>
                  ))}
                </Select>
              </FormField>
            </div>

            <FormField label="サムネイル画像">
              <ThumbnailInput
                value={thumbnailUrl}
                onChange={setThumbnailUrl}
                onError={setError}
              />
            </FormField>

            <FormField label="案件内容" required>
              <AutoResizeTextarea
                value={body}
                onValueChange={setBody}
                isRequired
                placeholder="案件の詳細を入力してください"
                minRows={5}
              />
            </FormField>

            <FormField label="募集条件" required>
              <AutoResizeTextarea
                value={requirements}
                onValueChange={setRequirements}
                isRequired
                placeholder="応募に必要なスキル・条件を入力してください"
                minRows={5}
              />
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <FormField label="報酬（任意）">
                <Input
                  value={priceText}
                  onValueChange={setPriceText}
                  placeholder="例: 50,000円/件"
                  variant="bordered"
                  size="lg"
                  classNames={formInputClasses}
                />
              </FormField>
              <FormField label="募集人数（任意）">
                <Input
                  type="number"
                  value={applicationLimit}
                  onValueChange={setApplicationLimit}
                  placeholder="例: 3"
                  min={1}
                  variant="bordered"
                  size="lg"
                  classNames={formInputClasses}
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <FormField label="締切日（任意）">
                <Input
                  type="datetime-local"
                  value={deadlineAt}
                  onValueChange={setDeadlineAt}
                  variant="bordered"
                  size="lg"
                  classNames={formInputClasses}
                />
              </FormField>
              <FormField label="担当者（任意）">
                <Input
                  value={contactPersonName}
                  onValueChange={setContactPersonName}
                  placeholder="例: 山田 太郎"
                  variant="bordered"
                  size="lg"
                  classNames={formInputClasses}
                />
              </FormField>
            </div>

            <FormField label="参考URL（任意）">
              <Input
                value={referenceUrl}
                onValueChange={setReferenceUrl}
                placeholder="https://..."
                variant="bordered"
                size="lg"
                classNames={formInputClasses}
              />
            </FormField>
          </div>

          {/* フッターボタン */}
          <div className="px-8 py-5 bg-slate-50 border-t border-slate-100 flex gap-3 justify-end">
            <AppButton
              type="button"
              variantType="secondary"
              onPress={() => router.push(cancelPath)}
            >
              キャンセル
            </AppButton>
            <AppButton type="submit" isLoading={isLoading}>
              {isEdit ? "更新する" : "投稿する"}
            </AppButton>
          </div>
        </form>
      </div>
    </div>
  );
}
