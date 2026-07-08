"use client";

import { Input, Select, SelectItem } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { formInputClasses, formSelectClasses } from "@/components/common/FormField";
import { ThumbnailInput } from "@/components/common/ThumbnailInput";
import { AppButton } from "@/components/ui/AppButton";
import { AutoResizeTextarea } from "@/components/ui/AutoResizeTextarea";
import { FormField } from "@/components/ui/FormField";

const BACK_PATH = "/company/events-admin";

// 運営イベントのカテゴリ（朝礼・研修・健診など投稿にならない予定）
const CATEGORIES = [
  { value: "ALL_HANDS", label: "全社行事（朝礼・総会など）" },
  { value: "TRAINING", label: "研修" },
  { value: "HEALTH", label: "健康・健診" },
  { value: "MEETUP", label: "交流会" },
  { value: "STUDY", label: "勉強会" },
  { value: "CLUB", label: "部活動" },
  { value: "OTHER", label: "その他" },
] as const;

// 公開範囲
const SCOPES = [
  { value: "ALL", label: "全社に公開" },
  { value: "DEPT", label: "指定部署のみ" },
  { value: "ROLE", label: "特定役職以上" },
  { value: "MEMBERS", label: "メンバー指定" },
] as const;

interface Member {
  id: string;
  name: string;
  dept: string;
  role: string;
}

// 社員名簿（静的モック）
const MEMBER_POOL: Member[] = [
  { id: "u1", name: "山田 太郎", dept: "総務部", role: "部長" },
  { id: "u2", name: "佐藤 花子", dept: "人事部", role: "メンバー" },
  { id: "u3", name: "鈴木 一郎", dept: "DX推進部", role: "マネージャー" },
  { id: "u4", name: "高橋 美咲", dept: "デザイン戦略部", role: "メンバー" },
  { id: "u5", name: "田中 健", dept: "デザイン戦略部", role: "マネージャー" },
  { id: "u6", name: "伊藤 さくら", dept: "DX推進部", role: "メンバー" },
  { id: "u7", name: "渡辺 大輔", dept: "営業部", role: "部長" },
  { id: "u8", name: "中村 結衣", dept: "営業部", role: "メンバー" },
];

const LEAD_ROLES = ["部長", "マネージャー"];

// 公開範囲を選ぶと、その範囲に該当するメンバーを初期セットとして展開する。
// 以降は手作業で範囲外の追加・除外ができる。
function seedMembersForScope(scope: string): Member[] {
  switch (scope) {
    case "ALL":
      return [...MEMBER_POOL];
    case "DEPT":
      // 例として主催に関わりやすい部署を初期展開
      return MEMBER_POOL.filter((m) =>
        ["DX推進部", "デザイン戦略部"].includes(m.dept),
      );
    case "ROLE":
      return MEMBER_POOL.filter((m) => LEAD_ROLES.includes(m.role));
    default:
      // メンバー指定：空から手で追加
      return [];
  }
}

type PlaceType = "VENUE" | "ONLINE" | "HYBRID";
type JoinType = "OPTIONAL" | "REQUIRED";

/** 小さなセグメント切替（プロジェクト既存のタブUIに合わせた素朴な実装） */
function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="inline-flex bg-slate-100 rounded-lg p-1">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`px-4 py-1.5 rounded-md text-sm transition-colors ${
              active
                ? "bg-white shadow-sm text-blue-600 font-bold"
                : "text-slate-500 hover:text-blue-600"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function EventCreateClient() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>("ALL_HANDS");
  const [allDay, setAllDay] = useState(false);
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [placeType, setPlaceType] = useState<PlaceType>("VENUE");
  const [venue, setVenue] = useState("");
  const [onlineUrl, setOnlineUrl] = useState("");
  const [organizerDept, setOrganizerDept] = useState("");
  const [contactName, setContactName] = useState("");
  const [joinType, setJoinType] = useState<JoinType>("OPTIONAL");
  const [capacity, setCapacity] = useState("");
  const [scope, setScope] = useState<string>("ALL");
  const [members, setMembers] = useState<Member[]>(() =>
    seedMembersForScope("ALL"),
  );
  const [memberQuery, setMemberQuery] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  // 公開範囲を変えたら、その範囲のメンバーを初期セットとして展開する。
  const handleScopeChange = (next: string) => {
    setScope(next);
    setMembers(seedMembersForScope(next));
  };

  const addMember = (m: Member) => {
    setMembers((prev) =>
      prev.some((p) => p.id === m.id) ? prev : [...prev, m],
    );
    setMemberQuery("");
  };

  const removeMember = (id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
  };

  // 検索候補：未追加で、名前・部署・役職に一致するもの
  const memberCandidates = memberQuery.trim()
    ? MEMBER_POOL.filter(
        (m) =>
          !members.some((s) => s.id === m.id) &&
          `${m.name}${m.dept}${m.role}`.includes(memberQuery.trim()),
      )
    : [];

  // 静的UI段階：保存処理は未接続。一覧に戻るだけ。
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(BACK_PATH);
  };

  const showVenue = placeType !== "ONLINE";
  const showOnline = placeType !== "VENUE";
  const dateInputType = allDay ? "date" : "datetime-local";

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* パンくず */}
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <button
          type="button"
          onClick={() => router.push(BACK_PATH)}
          className="hover:text-slate-700 transition-colors"
        >
          ← 社内イベントカレンダー管理
        </button>
        <span className="text-slate-300">/</span>
        <span className="text-slate-400">イベント作成</span>
      </div>

      {/* ページタイトル */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-900">イベント作成</h1>
          <span className="px-2 py-0.5 text-xs bg-indigo-100 text-indigo-700 rounded-full font-medium">
            運営イベント
          </span>
        </div>
        <p className="text-slate-500 mt-1.5 text-sm">
          朝礼・研修・健診など、フィード投稿にならない社内予定をカレンダーに登録します。
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

            <FormField label="イベント名" required>
              <Input
                value={title}
                onValueChange={setTitle}
                isRequired
                placeholder="例: 全体朝礼 / 新入社員研修"
                variant="bordered"
                size="lg"
                classNames={formInputClasses}
              />
            </FormField>

            <FormField label="カテゴリ" required>
              <Select
                selectedKeys={[category]}
                onSelectionChange={(keys) =>
                  setCategory(Array.from(keys)[0] as string)
                }
                variant="bordered"
                classNames={formSelectClasses}
              >
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value}>{c.label}</SelectItem>
                ))}
              </Select>
            </FormField>

            {/* 日時 */}
            <FormField label="開催日時" required>
              <div className="flex flex-col gap-3">
                <Segmented<"TIME" | "ALLDAY">
                  value={allDay ? "ALLDAY" : "TIME"}
                  onChange={(v) => setAllDay(v === "ALLDAY")}
                  options={[
                    { value: "TIME", label: "時間指定" },
                    { value: "ALLDAY", label: "終日" },
                  ]}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <FormField label="開始">
                    <Input
                      type={dateInputType}
                      value={startAt}
                      onValueChange={setStartAt}
                      variant="bordered"
                      size="lg"
                      classNames={formInputClasses}
                    />
                  </FormField>
                  <FormField label="終了">
                    <Input
                      type={dateInputType}
                      value={endAt}
                      onValueChange={setEndAt}
                      variant="bordered"
                      size="lg"
                      classNames={formInputClasses}
                    />
                  </FormField>
                </div>
              </div>
            </FormField>

            {/* 開催場所 */}
            <FormField label="開催場所">
              <div className="flex flex-col gap-3">
                <Segmented<PlaceType>
                  value={placeType}
                  onChange={setPlaceType}
                  options={[
                    { value: "VENUE", label: "会場" },
                    { value: "ONLINE", label: "オンライン" },
                    { value: "HYBRID", label: "ハイブリッド" },
                  ]}
                />
                {showVenue && (
                  <Input
                    value={venue}
                    onValueChange={setVenue}
                    placeholder="例: 本社 会議室A"
                    variant="bordered"
                    size="lg"
                    classNames={formInputClasses}
                  />
                )}
                {showOnline && (
                  <Input
                    value={onlineUrl}
                    onValueChange={setOnlineUrl}
                    placeholder="オンライン参加URL（https://...）"
                    variant="bordered"
                    size="lg"
                    classNames={formInputClasses}
                  />
                )}
              </div>
            </FormField>

            {/* 主催 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <FormField label="主催部署">
                <Input
                  value={organizerDept}
                  onValueChange={setOrganizerDept}
                  placeholder="例: 総務部"
                  variant="bordered"
                  size="lg"
                  classNames={formInputClasses}
                />
              </FormField>
              <FormField label="担当者（任意）">
                <Input
                  value={contactName}
                  onValueChange={setContactName}
                  placeholder="例: 山田 太郎"
                  variant="bordered"
                  size="lg"
                  classNames={formInputClasses}
                />
              </FormField>
            </div>

            {/* 参加方式 */}
            <FormField
              label="参加方式"
              description="「全員必須」にすると参加表明なしで全社の予定として配信されます。"
            >
              <div className="flex flex-col gap-3">
                <Segmented<JoinType>
                  value={joinType}
                  onChange={setJoinType}
                  options={[
                    { value: "OPTIONAL", label: "任意参加" },
                    { value: "REQUIRED", label: "全員必須" },
                  ]}
                />
                {joinType === "OPTIONAL" && (
                  <FormField label="定員（任意）">
                    <Input
                      type="number"
                      value={capacity}
                      onValueChange={setCapacity}
                      placeholder="例: 30"
                      min={1}
                      variant="bordered"
                      size="lg"
                      classNames={formInputClasses}
                    />
                  </FormField>
                )}
              </div>
            </FormField>

            {/* 公開範囲 */}
            <FormField
              label="公開範囲"
              required
              description="範囲を選ぶと対象メンバーが展開されます。範囲外の人も個別に追加・除外できます。"
            >
              <Select
                selectedKeys={[scope]}
                onSelectionChange={(keys) =>
                  handleScopeChange(Array.from(keys)[0] as string)
                }
                variant="bordered"
                classNames={formSelectClasses}
              >
                {SCOPES.map((s) => (
                  <SelectItem key={s.value}>{s.label}</SelectItem>
                ))}
              </Select>
            </FormField>

            {/* 公開対象メンバー（範囲をベースに手作業で調整） */}
            <FormField label={`公開対象メンバー（${members.length}名）`}>
              <div className="flex flex-col gap-3">
                {/* 追加検索 */}
                <div className="relative">
                  <Input
                    value={memberQuery}
                    onValueChange={setMemberQuery}
                    placeholder="名前・部署・役職で検索して追加（範囲外も可）"
                    variant="bordered"
                    size="lg"
                    classNames={formInputClasses}
                  />
                  {memberCandidates.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
                      {memberCandidates.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => addMember(m)}
                          className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center justify-between gap-3"
                        >
                          <span className="text-sm text-slate-800">
                            {m.name}
                          </span>
                          <span className="text-xs text-slate-400">
                            {m.dept}・{m.role}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 選択中メンバー */}
                {members.length === 0 ? (
                  <p className="text-sm text-slate-400 bg-slate-50 rounded-lg px-4 py-3">
                    まだ誰も指定されていません。上の検索から追加してください。
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {members.map((m) => (
                      <span
                        key={m.id}
                        className="inline-flex items-center gap-1.5 bg-slate-100 rounded-full pl-3 pr-1.5 py-1 text-sm text-slate-700"
                      >
                        {m.name}
                        <span className="text-xs text-slate-400">
                          {m.dept}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeMember(m.id)}
                          aria-label={`${m.name} を除外`}
                          className="w-5 h-5 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </FormField>

            <FormField label="説明（任意）">
              <AutoResizeTextarea
                value={description}
                onValueChange={setDescription}
                placeholder="開催の目的・持ち物・注意事項など"
                minRows={4}
              />
            </FormField>

            <FormField label="サムネイル画像（任意）">
              <ThumbnailInput
                value={thumbnailUrl}
                onChange={setThumbnailUrl}
                onError={setError}
              />
            </FormField>
          </div>

          {/* フッターボタン */}
          <div className="px-8 py-5 bg-slate-50 border-t border-slate-100 flex gap-3 justify-end">
            <AppButton
              type="button"
              variantType="secondary"
              onPress={() => router.push(BACK_PATH)}
            >
              キャンセル
            </AppButton>
            <AppButton type="submit">カレンダーに登録</AppButton>
          </div>
        </form>
      </div>
    </div>
  );
}
