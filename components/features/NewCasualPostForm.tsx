"use client";

import { Input, Select, SelectItem, Switch } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
import type { Company, PostStatus } from "@/types/database";

// 社内イベントカレンダー連携は第1弾リリースでは非表示（memory/release_scope_phase1.md）。
// 次フェーズで true に戻すと入力UI・検証が復活する。
const ENABLE_CALENDAR_LINK = false;

export interface CasualPostDefaultValues {
  id: string;
  title?: string;
  body?: string;
  thumbnailUrl?: string;
  postStatus?: PostStatus;
  companyId?: string;
  deadline?: string;
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
    defaultValues?.postStatus ?? "OPEN",
  );
  const [deadline, setDeadline] = useState(defaultValues?.deadline ?? "");

  // 社内イベントカレンダー連携（admin 以上のみ）。
  // 現状はプロトタイプUI段階で、イベント側の保存処理は未接続。
  const [linkToCalendar, setLinkToCalendar] = useState(false);
  const [eventStartAt, setEventStartAt] = useState("");
  const [eventEndAt, setEventEndAt] = useState("");
  const [eventVenue, setEventVenue] = useState("");

  const [companies, setCompanies] = useState<Company[]>([]);
  const [companyId, setCompanyId] = useState(defaultValues?.companyId ?? "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mode !== "admin") return;
    const supabase = createClient();
    const fetchCompanies = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("users")
        .select("system_role")
        .eq("id", user.id)
        .single();
      const isMasterAdmin = profile?.system_role === "MASTER_ADMIN";

      const { data: memberships } = await supabase
        .from("company_members")
        .select("company_id")
        .eq("user_id", user.id)
        .eq("status", "active");
      const companyIds = memberships?.map((m) => m.company_id) ?? [];

      const { data } = isMasterAdmin
        ? await supabase.from("companies").select("*").order("name")
        : companyIds.length > 0
          ? await supabase
              .from("companies")
              .select("*")
              .in("id", companyIds)
              .order("name")
          : { data: [] };

      setCompanies(data ?? []);
      if (!companyId) {
        setCompanyId((data ?? [])[0]?.id ?? "");
      }
    };

    fetchCompanies();
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

    // カレンダー連携（admin 以上）を有効にした場合は開催開始日時が必須。
    // ※イベント側の保存処理はプロトタイプ段階で未接続のため、ここでは入力検証のみ行う。
    if (ENABLE_CALENDAR_LINK && mode === "admin" && linkToCalendar && !eventStartAt) {
      setError("カレンダー連携を有効にする場合は開催開始日時を入力してください。");
      setIsLoading(false);
      return;
    }

    let resolvedCompanyId = companyId;
    if (mode === "user" || !resolvedCompanyId) {
      const { data: memberData } = await supabase
        .from("company_members")
        .select("company_id")
        .eq("user_id", user.id)
        .eq("status", "active")
        .limit(1)
        .single();

      if (!memberData?.company_id) {
        setError("所属会社が設定されていません。設定を確認してください。");
        setIsLoading(false);
        return;
      }
      resolvedCompanyId = memberData.company_id;
    }

    const resolvedStatus: PostStatus = postStatus;

    if (isEdit && defaultValues?.id) {
      const { error: updateError } = await supabase
        .from("posts")
        .update({
          title,
          body,
          post_status: resolvedStatus,
          company_id: resolvedCompanyId,
          thumbnail_url: thumbnailUrl || null,
          deadline_at: deadline ? new Date(deadline).toISOString() : null,
          published_at: isPublicStatus(resolvedStatus)
            ? new Date().toISOString()
            : null,
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

    const { data: inserted, error: insertError } = await supabase
      .from("posts")
      .insert({
        title,
        body,
        post_type: "CASUAL",
        post_status: resolvedStatus,
        company_id: resolvedCompanyId,
        thumbnail_url: thumbnailUrl || null,
        deadline_at: deadline ? new Date(deadline).toISOString() : null,
        created_by_user_id: user.id,
        published_at: isPublicStatus(resolvedStatus)
          ? new Date().toISOString()
          : null,
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
          data-testid="casual-post-back"
          aria-label={`${backLabel}へ戻る`}
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

            <FormField label="タイトル" required>
              <Input
                value={title}
                onValueChange={setTitle}
                isRequired
                placeholder="どんな投稿ですか？"
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
                placeholder="詳細を書いてください。相談・告知・募集など何でもOKです"
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <FormField label="締切日（任意）">
                <Input
                  type="date"
                  value={deadline}
                  onValueChange={setDeadline}
                  variant="bordered"
                  size="lg"
                  classNames={formInputClasses}
                />
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

            {/* 管理者のみ：補足設定（会社選択・カレンダー連携） */}
            {mode === "admin" && (
              <div className="border-t border-slate-100 pt-6 flex flex-col gap-6">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  補足設定
                </p>

                {companies.length > 0 && (
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
                )}

                {/* 社内イベントカレンダー連携（admin 以上のみ）。
                    第1弾リリースでは非表示（ENABLE_CALENDAR_LINK）。 */}
                {ENABLE_CALENDAR_LINK && (
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-bold text-slate-700">
                        社内イベントカレンダーに連携
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        ONにすると、この投稿をイベントとして社内イベントカレンダーにも掲載します。
                      </p>
                    </div>
                    <Switch
                      isSelected={linkToCalendar}
                      onValueChange={setLinkToCalendar}
                      color="primary"
                    />
                  </div>

                  {linkToCalendar && (
                    <div className="flex flex-col gap-4 border-t border-slate-200 pt-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <FormField label="開催開始" required>
                          <Input
                            type="datetime-local"
                            value={eventStartAt}
                            onValueChange={setEventStartAt}
                            isRequired
                            variant="bordered"
                            size="lg"
                            classNames={formInputClasses}
                          />
                        </FormField>
                        <FormField label="開催終了（任意）">
                          <Input
                            type="datetime-local"
                            value={eventEndAt}
                            onValueChange={setEventEndAt}
                            variant="bordered"
                            size="lg"
                            classNames={formInputClasses}
                          />
                        </FormField>
                      </div>
                      <FormField label="開催場所（任意）">
                        <Input
                          value={eventVenue}
                          onValueChange={setEventVenue}
                          placeholder="例: 本社 会議室A / オンライン"
                          variant="bordered"
                          size="lg"
                          classNames={formInputClasses}
                        />
                      </FormField>
                    </div>
                  )}
                </div>
                )}
              </div>
            )}
          </div>

          {/* フッターボタン */}
          <div className="px-8 py-5 bg-slate-50 border-t border-slate-100 flex gap-3 justify-end">
            <AppButton
              type="button"
              data-testid="casual-post-cancel"
              variantType="secondary"
              onPress={() => router.push(resolvedCancelPath)}
            >
              キャンセル
            </AppButton>
            <AppButton
              type="submit"
              data-testid="casual-post-submit"
              isLoading={isLoading}
            >
              {submitLabel}
            </AppButton>
          </div>
        </form>
      </div>
    </div>
  );
}
