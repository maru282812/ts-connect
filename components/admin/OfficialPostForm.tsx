"use client";

import { Button, Input, Select, SelectItem, Textarea } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { formLabelClasses } from "@/components/common/FormField";
import { createClient } from "@/lib/supabase/client";
import type { Company, Post, PostStatus } from "@/types/database";

interface OfficialPostFormProps {
  post?: Post;
  companies: Company[];
  defaultCompanyId?: string;
}

const POST_STATUSES: { value: PostStatus; label: string }[] = [
  { value: "DRAFT", label: "下書き" },
  { value: "OPEN", label: "公開中" },
  { value: "IN_PROGRESS", label: "対応中" },
  { value: "CLOSED", label: "終了" },
];

const inputClasses = {
  ...formLabelClasses,
  inputWrapper: "border-slate-300 hover:border-slate-400 bg-white h-12",
  input: "text-base",
};

const textareaClasses = {
  ...formLabelClasses,
  inputWrapper: "border-slate-300 hover:border-slate-400 bg-white",
  input: "text-base leading-relaxed py-2",
};

const selectClasses = {
  ...formLabelClasses,
  trigger: "border-slate-300 hover:border-slate-400 bg-white h-12",
  value: "text-base",
};

export function OfficialPostForm({
  post,
  companies,
  defaultCompanyId,
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
  const [postStatus, setPostStatus] = useState<PostStatus>(
    post?.post_status ?? "DRAFT",
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

    const payload = {
      title,
      body,
      requirements: requirements || null,
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
      published_at:
        postStatus === "OPEN" || postStatus === "IN_PROGRESS"
          ? new Date().toISOString()
          : null,
      closed_at: postStatus === "CLOSED" ? new Date().toISOString() : null,
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {error && (
        <p className="text-danger text-sm bg-danger-50 rounded-lg p-3">
          {error}
        </p>
      )}

      {/* タイトル */}
      <Input
        label="タイトル"
        labelPlacement="outside"
        value={title}
        onValueChange={setTitle}
        isRequired
        placeholder="案件タイトルを入力"
        variant="bordered"
        size="lg"
        classNames={inputClasses}
      />

      {/* 詳細説明 */}
      <Textarea
        label="詳細説明"
        labelPlacement="outside"
        value={body}
        onValueChange={setBody}
        isRequired
        placeholder="案件の詳細を入力してください"
        minRows={6}
        variant="bordered"
        classNames={textareaClasses}
      />

      {/* 募集条件 */}
      <Textarea
        label="募集条件"
        labelPlacement="outside"
        value={requirements}
        onValueChange={setRequirements}
        placeholder="応募に必要なスキル・条件を入力してください"
        minRows={4}
        variant="bordered"
        classNames={textareaClasses}
      />

      {/* 報酬 / 募集人数 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Input
          label="報酬"
          labelPlacement="outside"
          value={priceText}
          onValueChange={setPriceText}
          placeholder="例: 50,000円/件"
          variant="bordered"
          size="lg"
          classNames={inputClasses}
        />
        <Input
          label="募集人数"
          labelPlacement="outside"
          type="number"
          value={applicationLimit}
          onValueChange={setApplicationLimit}
          placeholder="例: 3"
          min={1}
          variant="bordered"
          size="lg"
          classNames={inputClasses}
        />
      </div>

      {/* 締切日 / 担当者 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Input
          label="締切日"
          labelPlacement="outside"
          type="datetime-local"
          value={deadlineAt}
          onValueChange={setDeadlineAt}
          variant="bordered"
          size="lg"
          classNames={inputClasses}
        />
        <Input
          label="担当者"
          labelPlacement="outside"
          value={contactPersonName}
          onValueChange={setContactPersonName}
          placeholder="例: 山田 太郎"
          variant="bordered"
          size="lg"
          classNames={inputClasses}
        />
      </div>

      {/* 所属会社 / ステータス */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Select
          label="所属会社"
          labelPlacement="outside"
          selectedKeys={companyId ? [companyId] : []}
          onSelectionChange={(keys) =>
            setCompanyId(Array.from(keys)[0] as string)
          }
          isRequired
          variant="bordered"
          classNames={selectClasses}
        >
          {companies.map((c) => (
            <SelectItem key={c.id}>{c.name}</SelectItem>
          ))}
        </Select>

        <Select
          label="ステータス"
          labelPlacement="outside"
          selectedKeys={[postStatus]}
          onSelectionChange={(keys) =>
            setPostStatus(Array.from(keys)[0] as PostStatus)
          }
          variant="bordered"
          classNames={selectClasses}
        >
          {POST_STATUSES.map((s) => (
            <SelectItem key={s.value}>{s.label}</SelectItem>
          ))}
        </Select>
      </div>

      {/* サムネイル画像URL（任意） */}
      <Input
        label="サムネイル画像URL（任意）"
        labelPlacement="outside"
        value={thumbnailUrl}
        onValueChange={setThumbnailUrl}
        placeholder="https://..."
        variant="bordered"
        size="lg"
        classNames={inputClasses}
      />

      <div className="flex gap-3 pt-4">
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
          isLoading={isLoading}
          className="flex-1 bg-blue-800 text-white hover:bg-blue-900"
        >
          {isEdit ? "更新する" : "投稿する"}
        </Button>
      </div>
    </form>
  );
}
