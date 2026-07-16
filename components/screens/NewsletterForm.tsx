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
import {
  createIssue,
  NEWSLETTER_CATEGORIES,
  NEWSLETTER_STATUSES,
  type NewsletterCategory,
  type NewsletterIssue,
  type NewsletterStatus,
  updateIssue,
} from "@/lib/newsletter";

// ============================================================
// 社内報 作成・編集フォーム（管理画面 / company surface）
// ルート: /company/newsletter/new（新規） /company/newsletter/[id]/edit（編集）
// migration 029 未適用時は保存が RLS/テーブル欠落で失敗し、エラー表示される。
// ============================================================

const LIST_PATH = "/company/newsletter";

interface NewsletterFormProps {
  issue?: NewsletterIssue;
}

export function NewsletterForm({ issue }: NewsletterFormProps) {
  const router = useRouter();
  const isEdit = Boolean(issue);

  const [title, setTitle] = useState(issue?.title ?? "");
  const [category, setCategory] = useState<NewsletterCategory>(
    issue?.category ?? "MONTHLY",
  );
  const [publishDate, setPublishDate] = useState(
    issue?.publishedAt ? issue.publishedAt.slice(0, 10) : "",
  );
  const [summary, setSummary] = useState(issue?.summary ?? "");
  const [body, setBody] = useState(issue?.body ?? "");
  const [status, setStatus] = useState<NewsletterStatus>(
    issue?.status ?? "DRAFT",
  );
  const [pickup, setPickup] = useState(issue?.isPickup ?? true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // サムネイル画像（1枚）
  const [thumbnailUrl, setThumbnailUrl] = useState(issue?.coverImageUrl ?? "");
  // その他写真（複数枚）。各行を ThumbnailInput で編集する。
  const [photos, setPhotos] = useState<{ id: string; url: string }[]>(
    (issue?.imageUrls ?? []).map((url, i) => ({ id: `photo-init-${i}`, url })),
  );

  const addPhoto = () =>
    setPhotos((prev) => [
      ...prev,
      { id: `photo-${Date.now()}-${prev.length}`, url: "" },
    ]);
  const updatePhoto = (id: string, url: string) =>
    setPhotos((prev) => prev.map((p) => (p.id === id ? { ...p, url } : p)));
  const removePhoto = (id: string) =>
    setPhotos((prev) => prev.filter((p) => p.id !== id));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      setError("タイトルと本文は必須です");
      return;
    }
    setIsLoading(true);
    setError(null);

    // 発行日時: 入力があればその日付、無ければ「すぐに公開」時に現在時刻。
    const publishedAt = publishDate
      ? new Date(publishDate).toISOString()
      : status === "PUBLISHED"
        ? new Date().toISOString()
        : null;

    const input = {
      title,
      category,
      summary,
      body,
      coverImageUrl: thumbnailUrl || null,
      imageUrls: photos.map((p) => p.url).filter(Boolean),
      status,
      publishedAt,
      isPickup: pickup,
    };

    const result =
      isEdit && issue
        ? await updateIssue(issue.id, input)
        : await createIssue(input);

    setIsLoading(false);
    if (!result.ok) {
      setError(result.error ?? "保存に失敗しました");
      return;
    }
    router.push(`${LIST_PATH}?success=${isEdit ? "updated" : "created"}`);
    router.refresh();
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* パンくず */}
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <button
          type="button"
          onClick={() => router.push(LIST_PATH)}
          className="hover:text-slate-700 transition-colors"
        >
          ← 社内報管理
        </button>
        <span className="text-slate-300">/</span>
        <span className="text-slate-400">{isEdit ? "編集" : "新規作成"}</span>
      </div>

      {/* ページタイトル */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          {isEdit ? "社内報を編集" : "社内報を新規作成"}
        </h1>
        <p className="text-slate-500 mt-1.5 text-sm">
          会社からのお知らせ・月次号・特集記事を作成します。公開すると社内SNSの社内報枠に掲載されます。
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
                placeholder="例: T's connect 社内報 2026年7月号"
                variant="bordered"
                size="lg"
                classNames={formInputClasses}
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
              <FormField label="種別・カテゴリ" required>
                <Select
                  selectedKeys={[category]}
                  onSelectionChange={(keys) =>
                    setCategory(Array.from(keys)[0] as NewsletterCategory)
                  }
                  variant="bordered"
                  classNames={formSelectClasses}
                >
                  {NEWSLETTER_CATEGORIES.map((c) => (
                    <SelectItem key={c.value}>{c.label}</SelectItem>
                  ))}
                </Select>
              </FormField>

              <FormField label="発行日">
                <Input
                  type="date"
                  value={publishDate}
                  onValueChange={setPublishDate}
                  variant="bordered"
                  size="lg"
                  classNames={formInputClasses}
                />
              </FormField>
            </div>

            <FormField label="概要（一覧・カードに表示）">
              <AutoResizeTextarea
                value={summary}
                onValueChange={setSummary}
                placeholder="社内報カードに表示される短い説明文（2〜3行程度）"
                minRows={2}
              />
            </FormField>

            <FormField label="本文" required>
              <AutoResizeTextarea
                value={body}
                onValueChange={setBody}
                isRequired
                placeholder={
                  "社内報の本文を入力してください\n\nURL（https://…）はそのまま貼るとリンクになります。\n表示名を付けたいときは [表示名](https://…) の形式で入力できます。"
                }
                minRows={8}
              />
              <p className="mt-1.5 text-xs text-slate-400">
                本文に URL を貼ると自動でリンクになります。「
                <span className="font-mono">[表示名](https://…)</span>
                」の形式で表示名を付けることもできます。
              </p>
            </FormField>

            <FormField label="その他写真（複数可）">
              <div className="flex flex-col gap-4">
                {photos.length === 0 && (
                  <p className="text-xs text-slate-400">
                    記事に載せる写真を追加できます（任意）
                  </p>
                )}
                {photos.map((photo, index) => (
                  <div
                    key={photo.id}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500">
                        写真 {index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removePhoto(photo.id)}
                        className="text-xs text-red-500 hover:underline"
                      >
                        この写真を削除
                      </button>
                    </div>
                    <ThumbnailInput
                      value={photo.url}
                      onChange={(url) => updatePhoto(photo.id, url)}
                      onError={setError}
                    />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addPhoto}
                  className="self-start rounded-lg border border-dashed border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:border-slate-400 hover:bg-slate-50"
                >
                  ＋ 写真を追加
                </button>
              </div>
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <FormField label="公開状態">
                <Select
                  selectedKeys={[status]}
                  onSelectionChange={(keys) =>
                    setStatus(Array.from(keys)[0] as NewsletterStatus)
                  }
                  variant="bordered"
                  classNames={formSelectClasses}
                >
                  {NEWSLETTER_STATUSES.map((s) => (
                    <SelectItem key={s.value}>{s.label}</SelectItem>
                  ))}
                </Select>
              </FormField>

              <FormField label="ピックアップ表示">
                <label className="flex h-12 cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-4 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={pickup}
                    onChange={(e) => setPickup(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  社内SNSのピックアップ記事に表示する
                </label>
              </FormField>
            </div>
          </div>

          {/* フッターボタン */}
          <div className="px-8 py-5 bg-slate-50 border-t border-slate-100 flex gap-3 justify-end">
            <AppButton
              type="button"
              variantType="secondary"
              onPress={() => router.push(LIST_PATH)}
            >
              キャンセル
            </AppButton>
            <AppButton type="submit" isLoading={isLoading}>
              {isEdit ? "更新する" : "作成する"}
            </AppButton>
          </div>
        </form>
      </div>
    </div>
  );
}
