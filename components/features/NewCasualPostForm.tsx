"use client";

import { Button, Input, Select, SelectItem, Textarea } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { formLabelClasses } from "@/components/common/FormField";
import { createClient } from "@/lib/supabase/client";
import type { Company, PostStatus } from "@/types/database";

export interface CasualPostDefaultValues {
  id: string;
  title?: string;
  body?: string;
  thumbnailUrl?: string;
  postStatus?: PostStatus;
  companyId?: string;
}

interface NewCasualPostFormProps {
  mode: "user" | "admin";
  intent?: "create" | "edit";
  defaultValues?: CasualPostDefaultValues;
  /** キャンセル・戻り先のパス。未指定時は mode に応じたデフォルト */
  cancelPath?: string;
  /** 投稿成功後のリダイレクト先。未指定時は mode に応じたデフォルト */
  getRedirectPath?: (id: string) => string;
}

export function NewCasualPostForm({
  mode,
  intent = "create",
  defaultValues,
  cancelPath,
  getRedirectPath,
}: NewCasualPostFormProps) {
  const router = useRouter();
  const isEdit = intent === "edit";

  const defaultCancelPath =
    mode === "admin" ? "/company/casual-posts" : "/app/casual-posts";
  const resolvedCancelPath = cancelPath ?? defaultCancelPath;

  const [title, setTitle] = useState(defaultValues?.title ?? "");
  const [body, setBody] = useState(defaultValues?.body ?? "");
  const [thumbnailUrl, setThumbnailUrl] = useState(
    defaultValues?.thumbnailUrl ?? "",
  );
  const [postStatus, setPostStatus] = useState<PostStatus>(
    defaultValues?.postStatus ?? "PUBLISHED",
  );
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companyId, setCompanyId] = useState(defaultValues?.companyId ?? "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mode !== "admin") return;
    const supabase = createClient();
    supabase
      .from("companies")
      .select("*")
      .order("name")
      .then(({ data }) => {
        setCompanies(data ?? []);
        if (data && data.length > 0 && !companyId) {
          supabase.auth.getUser().then(({ data: { user } }) => {
            if (!user) return;
            supabase
              .from("company_members")
              .select("company_id")
              .eq("user_id", user.id)
              .limit(1)
              .single()
              .then(({ data: memberData }) => {
                if (memberData?.company_id) {
                  setCompanyId(memberData.company_id);
                }
              });
          });
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, companyId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("ログインが必要です");
      setIsLoading(false);
      return;
    }

    let resolvedCompanyId = companyId;
    if (mode === "user" || !resolvedCompanyId) {
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

    const resolvedStatus: PostStatus =
      mode === "user" ? "PUBLISHED" : postStatus;

    if (isEdit && defaultValues?.id) {
      const { error: updateError } = await supabase
        .from("posts")
        .update({
          title,
          body,
          post_status: resolvedStatus,
          company_id: resolvedCompanyId,
          thumbnail_url: thumbnailUrl || null,
          published_at:
            resolvedStatus === "PUBLISHED" ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", defaultValues.id);

      setIsLoading(false);

      if (updateError) {
        setError(updateError.message);
        return;
      }

      const defaultRedirect =
        mode === "admin"
          ? "/company/casual-posts?success=updated"
          : `/app/casual-posts/${defaultValues.id}`;
      router.push(
        getRedirectPath ? getRedirectPath(defaultValues.id) : defaultRedirect,
      );
      router.refresh();
      return;
    }

    // create
    const { data: inserted, error: insertError } = await supabase
      .from("posts")
      .insert({
        title,
        body,
        post_type: "CASUAL",
        post_status: resolvedStatus,
        company_id: resolvedCompanyId,
        thumbnail_url: thumbnailUrl || null,
        created_by_user_id: user.id,
        published_at:
          resolvedStatus === "PUBLISHED" ? new Date().toISOString() : null,
      })
      .select()
      .single();

    setIsLoading(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    const defaultRedirect =
      mode === "admin"
        ? `/company/casual-posts?success=created`
        : `/app/casual-posts/${inserted.id}`;
    router.push(
      getRedirectPath ? getRedirectPath(inserted.id) : defaultRedirect,
    );
    router.refresh();
  };

  const backLabel = mode === "admin" ? "気軽な投稿一覧" : "投稿一覧";
  const pageTitle = isEdit ? "気軽な投稿を編集" : "気軽に投稿";
  const submitLabel = isEdit ? "更新する" : "投稿する";

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* パンくず */}
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <button
          type="button"
          onClick={() => router.push(resolvedCancelPath)}
          className="hover:text-slate-700 transition-colors"
        >
          ← {backLabel}
        </button>
        <span className="text-slate-300">/</span>
        <span className="text-slate-400">{pageTitle}</span>
      </div>

      {/* ページタイトル */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-900">{pageTitle}</h1>
          {mode === "admin" && (
            <span className="px-2 py-0.5 text-xs bg-amber-100 text-amber-700 rounded-full font-medium">
              利用者として投稿
            </span>
          )}
        </div>
        <p className="text-slate-500 mt-1.5 text-sm">
          {mode === "admin"
            ? "相談や軽い募集を投稿できます。管理メニューではなく利用者機能として投稿されます。"
            : "相談・お知らせ・軽い募集など、なんでも気軽に投稿できます。"}
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

            <Input
              label="タイトル"
              labelPlacement="outside"
              value={title}
              onValueChange={setTitle}
              isRequired
              placeholder="どんな投稿ですか？"
              variant="bordered"
              size="lg"
              classNames={{
                ...formLabelClasses,
                inputWrapper:
                  "border-slate-300 hover:border-slate-400 bg-white h-12",
                input: "text-base",
              }}
            />

            <Textarea
              label="本文"
              labelPlacement="outside"
              value={body}
              onValueChange={setBody}
              isRequired
              placeholder="詳細を書いてください。相談・告知・募集など何でもOKです"
              minRows={7}
              maxRows={16}
              variant="bordered"
              classNames={{
                ...formLabelClasses,
                inputWrapper:
                  "border-slate-300 hover:border-slate-400 bg-white",
                input: "text-base leading-relaxed py-2",
              }}
            />

            <Input
              label="参考URL（任意）"
              labelPlacement="outside"
              value={thumbnailUrl}
              onValueChange={setThumbnailUrl}
              placeholder="https://..."
              variant="bordered"
              size="lg"
              classNames={{
                ...formLabelClasses,
                inputWrapper:
                  "border-slate-300 hover:border-slate-400 bg-white h-12",
                input: "text-base",
              }}
            />

            {/* 管理者のみ：補足設定 */}
            {mode === "admin" && companies.length > 0 && (
              <div className="border-t border-slate-100 pt-6">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-5">
                  補足設定
                </p>
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
                    classNames={{
                      ...formLabelClasses,
                      trigger:
                        "border-slate-300 hover:border-slate-400 bg-white h-12",
                      value: "text-base",
                    }}
                  >
                    {companies.map((c) => (
                      <SelectItem key={c.id}>{c.name}</SelectItem>
                    ))}
                  </Select>

                  <Select
                    label="公開ステータス"
                    labelPlacement="outside"
                    selectedKeys={[postStatus]}
                    onSelectionChange={(keys) =>
                      setPostStatus(Array.from(keys)[0] as PostStatus)
                    }
                    variant="bordered"
                    classNames={{
                      ...formLabelClasses,
                      trigger:
                        "border-slate-300 hover:border-slate-400 bg-white h-12",
                      value: "text-base",
                    }}
                  >
                    <SelectItem key="PUBLISHED">公開する</SelectItem>
                    <SelectItem key="DRAFT">下書き保存</SelectItem>
                  </Select>
                </div>
              </div>
            )}
          </div>

          {/* フッターボタン */}
          <div className="px-8 py-5 bg-slate-50 border-t border-slate-100 flex gap-3 justify-end">
            <Button
              type="button"
              variant="flat"
              onPress={() => router.push(resolvedCancelPath)}
              className="min-w-28"
            >
              キャンセル
            </Button>
            <Button
              type="submit"
              color="primary"
              isLoading={isLoading}
              className="min-w-28"
            >
              {submitLabel}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
