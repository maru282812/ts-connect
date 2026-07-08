"use client";

import {
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Switch,
  Textarea,
  useDisclosure,
} from "@heroui/react";
import { useCallback, useEffect, useState } from "react";
import { formInputClasses } from "@/components/common/FormField";
import { PageHeader } from "@/components/common/PageHeader";
import { AppButton } from "@/components/ui/AppButton";
import { FormField } from "@/components/ui/FormField";
import {
  createTheme,
  deleteTheme,
  fetchAllThemes,
  updateTheme,
  type WeeklyThemeInput,
} from "@/lib/community";
import type { CommunityWeeklyTheme } from "@/types/database";

type ThemeStatus = "ACTIVE" | "UPCOMING" | "ENDED";

function themeStatus(t: CommunityWeeklyTheme): ThemeStatus {
  const today = new Date().toISOString().slice(0, 10);
  if (t.ends_on < today) return "ENDED";
  if (t.starts_on > today) return "UPCOMING";
  return "ACTIVE";
}

const STATUS_META: Record<ThemeStatus, { label: string; tone: string }> = {
  ACTIVE: { label: "開催中", tone: "bg-green-100 text-green-700" },
  UPCOMING: { label: "予定", tone: "bg-amber-100 text-amber-700" },
  ENDED: { label: "終了", tone: "bg-default-100 text-default-500" },
};

const EMPTY: WeeklyThemeInput = {
  title: "",
  description: "",
  startsOn: "",
  endsOn: "",
  isActive: true,
};

export function WeeklyThemesAdminClient() {
  const [themes, setThemes] = useState<CommunityWeeklyTheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<WeeklyThemeInput>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const reload = useCallback(async () => {
    setThemes(await fetchAllThemes());
    setLoading(false);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY);
    setError(null);
    onOpen();
  };

  const openEdit = (t: CommunityWeeklyTheme) => {
    setEditingId(t.id);
    setForm({
      title: t.title,
      description: t.description ?? "",
      startsOn: t.starts_on,
      endsOn: t.ends_on,
      isActive: t.is_active,
    });
    setError(null);
    onOpen();
  };

  // 開催中テーマと期間が重なる場合の警告（保存はブロックしない）
  const overlapWarning =
    form.isActive &&
    form.startsOn &&
    form.endsOn &&
    themes.some(
      (t) =>
        t.id !== editingId &&
        t.is_active &&
        t.starts_on <= form.endsOn &&
        t.ends_on >= form.startsOn,
    );

  const handleSave = async () => {
    if (!form.title.trim() || !form.startsOn || !form.endsOn) {
      setError("テーマ名・開始日・終了日は必須です");
      return;
    }
    if (form.endsOn < form.startsOn) {
      setError("終了日は開始日以降にしてください");
      return;
    }
    setSaving(true);
    setError(null);
    const result = editingId
      ? await updateTheme(editingId, form)
      : await createTheme(form);
    setSaving(false);
    if (!result.ok) {
      setError(result.error ?? "保存に失敗しました");
      return;
    }
    onClose();
    await reload();
  };

  const handleDelete = async (t: CommunityWeeklyTheme) => {
    if (!window.confirm(`「${t.title}」を削除しますか？`)) return;
    const result = await deleteTheme(t.id);
    if (!result.ok) {
      window.alert(result.error ?? "削除に失敗しました");
      return;
    }
    await reload();
  };

  return (
    <div className="max-w-[1200px] mx-auto w-full">
      <PageHeader
        title="週替わりテーマ管理"
        description="社内SNSの投稿を促す「今週のお題」を作成・管理します"
        actions={
          <AppButton type="button" onPress={openCreate}>
            + 新規テーマ
          </AppButton>
        }
      />

      <div className="bg-white rounded-xl border border-default-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-default-50 border-b border-default-200">
              <tr className="text-xs text-default-500 uppercase">
                <th className="py-4 px-4">テーマ</th>
                <th className="py-4 px-4 w-52">期間</th>
                <th className="py-4 px-4 w-28">状態</th>
                <th className="py-4 px-4 w-32">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-default-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={4}
                    className="py-12 text-center text-sm text-default-400"
                  >
                    読み込み中...
                  </td>
                </tr>
              ) : themes.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="py-12 text-center text-sm text-default-400"
                  >
                    テーマがまだありません。「新規テーマ」から追加してください。
                  </td>
                </tr>
              ) : (
                themes.map((t) => {
                  const meta = STATUS_META[themeStatus(t)];
                  return (
                    <tr
                      key={t.id}
                      className="hover:bg-default-50 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <p className="font-bold text-sm text-default-800">
                          {t.title}
                        </p>
                        {t.description && (
                          <p className="text-xs text-default-500 line-clamp-1 mt-0.5">
                            {t.description}
                          </p>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs text-default-500">
                        {t.starts_on} 〜 {t.ends_on}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${meta.tone}`}
                        >
                          {meta.label}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => openEdit(t)}
                            className="text-xs text-blue-600 hover:underline"
                          >
                            編集
                          </button>
                          <span className="text-default-200">|</span>
                          <button
                            type="button"
                            onClick={() => handleDelete(t)}
                            className="text-xs text-red-500 hover:underline"
                          >
                            削除
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isOpen} onClose={onClose} size="lg" placement="center">
        <ModalContent>
          <ModalHeader>
            {editingId ? "テーマを編集" : "テーマを新規作成"}
          </ModalHeader>
          <ModalBody className="gap-4">
            {error && (
              <p className="text-danger text-sm bg-danger-50 rounded-lg p-3">
                {error}
              </p>
            )}
            <FormField label="テーマ名" required>
              <Input
                value={form.title}
                onValueChange={(v) => setForm((f) => ({ ...f, title: v }))}
                placeholder="例: 便利だったショートカット"
                variant="bordered"
                size="lg"
                classNames={formInputClasses}
              />
            </FormField>
            <FormField label="説明（投稿を促す補足）">
              <Textarea
                value={form.description}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, description: v }))
                }
                minRows={2}
                placeholder="どんな投稿を期待するかの一言"
                variant="bordered"
                classNames={{
                  inputWrapper: "border-slate-300 hover:border-slate-400",
                }}
              />
            </FormField>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="開始日" required>
                <Input
                  type="date"
                  value={form.startsOn}
                  onValueChange={(v) => setForm((f) => ({ ...f, startsOn: v }))}
                  variant="bordered"
                  size="lg"
                  classNames={formInputClasses}
                />
              </FormField>
              <FormField label="終了日" required>
                <Input
                  type="date"
                  value={form.endsOn}
                  onValueChange={(v) => setForm((f) => ({ ...f, endsOn: v }))}
                  variant="bordered"
                  size="lg"
                  classNames={formInputClasses}
                />
              </FormField>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-default-200 px-4 py-3">
              <div>
                <p className="text-sm font-bold text-default-700">有効にする</p>
                <p className="text-[11px] text-default-400">
                  ONの期間中は社内SNSのお題として表示されます
                </p>
              </div>
              <Switch
                isSelected={form.isActive}
                onValueChange={(v) => setForm((f) => ({ ...f, isActive: v }))}
                color="primary"
              />
            </div>
            {overlapWarning && (
              <p className="text-amber-600 text-xs bg-amber-50 rounded-lg p-3">
                他の「開催中」テーマと期間が重なっています。表示は重複する可能性があります。
              </p>
            )}
          </ModalBody>
          <ModalFooter>
            <AppButton type="button" variantType="secondary" onPress={onClose}>
              キャンセル
            </AppButton>
            <AppButton type="button" onPress={handleSave} isLoading={saving}>
              {editingId ? "更新する" : "作成する"}
            </AppButton>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
