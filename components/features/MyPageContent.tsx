"use client";

import {
  Checkbox,
  Chip,
  Input,
  Progress,
  Select,
  SelectItem,
  Switch,
  Textarea,
} from "@heroui/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  formInputClasses,
  formSelectClasses,
} from "@/components/common/FormField";
import { AppButton } from "@/components/ui/AppButton";
import { FormField } from "@/components/ui/FormField";
import { fetchMyProfile, saveMyProfile } from "@/lib/profile";
import { createClient } from "@/lib/supabase/client";
import type { Company } from "@/types/database";

const PROFILE_FORM_ID = "mypage-profile-form";
const PASSWORD_FORM_ID = "mypage-password-form";

// 第1弾リリースの表示制御（memory/release_scope_phase1.md）。次フェーズで true に戻す。
const SHOW_DEPARTMENT_POSITION = false; // 部署・役職
const SHOW_NOTIFICATIONS_TAB = false; // 通知設定タブ
const SHOW_SKILLS_SECTION = true; // スキル・タグ（Phase2 マイページ拡張で公開）

const TABS = [
  { key: "profile", label: "プロフィール" },
  { key: "skills", label: "スキル・タグ" },
  { key: "notifications", label: "通知設定" },
  { key: "account", label: "アカウント" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

// 非表示タブを除いた、実際に表示するタブ
const VISIBLE_TABS = TABS.filter(
  (t) =>
    (SHOW_NOTIFICATIONS_TAB || t.key !== "notifications") &&
    (SHOW_SKILLS_SECTION || t.key !== "skills"),
);

const NOTIFICATION_ROWS = [
  { label: "投稿への「いいね」「コメント」", mail: true, browser: true },
  { label: "困りごと提案への反応", mail: true, browser: true },
  { label: "案件への採用・オファー", mail: true, browser: true },
  { label: "報酬の確定", mail: true, browser: false },
  { label: "グッズ問い合わせ", mail: false, browser: true },
];

function getInitials(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return trimmed.slice(0, 2).toUpperCase();
}

// --- セクション共通ラッパー（U-09: 白カード + アイコン付きヘッダー） ---
function SectionCard({
  innerRef,
  icon,
  title,
  children,
}: {
  innerRef?: React.Ref<HTMLElement>;
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      ref={innerRef}
      className="scroll-mt-24 rounded-xl border border-slate-200 bg-white p-6 sm:p-8"
    >
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
          {icon}
        </span>
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      </div>
      {children}
    </section>
  );
}

// --- チップ入力（スキル・特技・趣味 共通） ---
function ChipListInput({
  label,
  chips,
  onRemove,
  inputValue,
  onInputChange,
  onAdd,
  placeholder,
  suggestions,
}: {
  label: string;
  chips: string[];
  onRemove: (value: string) => void;
  inputValue: string;
  onInputChange: (v: string) => void;
  onAdd: (v: string) => void;
  placeholder: string;
  suggestions?: string[];
}) {
  return (
    <div className="space-y-2">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      {chips.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {chips.map((s) => (
            <Chip
              key={s}
              color="primary"
              variant="solid"
              onClose={() => onRemove(s)}
            >
              {s}
            </Chip>
          ))}
        </div>
      )}
      <Input
        value={inputValue}
        onValueChange={onInputChange}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onAdd(inputValue);
          }
        }}
        placeholder={placeholder}
        variant="bordered"
        size="lg"
        classNames={formInputClasses}
      />
      {suggestions && suggestions.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="mb-2 text-[11px] text-slate-400">サジェスト：</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onAdd(s)}
                className="rounded border border-slate-300 px-2 py-0.5 text-[11px] text-slate-600 transition-colors hover:border-blue-500 hover:bg-blue-50"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const iconProps = {
  "aria-hidden": true,
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const PersonIcon = () => (
  <svg {...iconProps}>
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);
const TagIcon = () => (
  <svg {...iconProps}>
    <path d="M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
    <circle cx="7" cy="7" r="1.2" fill="currentColor" />
  </svg>
);
const BellIcon = () => (
  <svg {...iconProps}>
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);
const LockIcon = () => (
  <svg {...iconProps}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

export function MyPageContent() {
  // --- 実データ（既存ロジック流用） ---
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [originalEmail, setOriginalEmail] = useState("");
  const [notificationEmail, setNotificationEmail] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // --- U-09 の表示専用フィールド（DB未対応・保存されない／見た目のみ） ---
  const [nickname, setNickname] = useState("");
  const [department, setDepartment] = useState("");
  const [position, setPosition] = useState("");
  const [available, setAvailable] = useState(true);
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const SKILL_SUGGESTIONS = ["UI/UXデザイン", "アジャイル開発", "市場調査"];
  // Phase2: 特技 / 趣味 / 興味テーマ / 相談に乗れること（user_profiles へ保存）
  const [specialSkills, setSpecialSkills] = useState<string[]>([]);
  const [specialSkillInput, setSpecialSkillInput] = useState("");
  const [hobbies, setHobbies] = useState<string[]>([]);
  const [hobbyInput, setHobbyInput] = useState("");
  const [interestThemes, setInterestThemes] = useState("");
  const [consultTopics, setConsultTopics] = useState("");

  // --- タブ（U-09: 4タブ）→ 該当セクションへスクロール ---
  const [activeTab, setActiveTab] = useState<TabKey>("profile");
  const sectionRefs = {
    profile: useRef<HTMLElement>(null),
    skills: useRef<HTMLElement>(null),
    notifications: useRef<HTMLElement>(null),
    account: useRef<HTMLElement>(null),
  };
  const goTab = (key: TabKey) => {
    setActiveTab(key);
    sectionRefs[key].current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  // public.users を正として表示する。auth.users は参照しない。
  // メール変更は auth.updateUser → 確認メール承認 → トリガー同期 の順で完結する。
  const fetchProfile = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: userProfile } = await supabase
      .from("users")
      .select("email, display_name, notification_email, avatar_url")
      .eq("id", user.id)
      .single();

    setEmail(userProfile?.email ?? "");
    setOriginalEmail(userProfile?.email ?? "");
    setDisplayName(userProfile?.display_name ?? "");
    setNotificationEmail(userProfile?.notification_email ?? "");
    setAvatarUrl(userProfile?.avatar_url ?? "");

    const { data: companiesData } = await supabase
      .from("companies")
      .select("id, name, created_at, updated_at")
      .order("name");
    if (companiesData) setCompanies(companiesData as Company[]);

    const { data: memberData } = await supabase
      .from("company_members")
      .select("company_id")
      .eq("user_id", user.id)
      .limit(1)
      .single();
    if (memberData?.company_id) setCompanyId(memberData.company_id);

    // Phase2: user_profiles（スキル・特技・趣味・興味テーマ・相談可否）を復元。
    // 行が無い / migration 028 未適用時は null で返り、フォームは空のまま。
    const profile = await fetchMyProfile();
    if (profile) {
      setBio(profile.bio ?? "");
      setSkills(profile.skills ?? []);
      setSpecialSkills(profile.special_skills ?? []);
      setHobbies(profile.hobbies ?? []);
      setInterestThemes(profile.interest_themes ?? "");
      setConsultTopics(profile.consult_topics ?? "");
      setAvailable(
        profile.availability ? profile.availability === "AVAILABLE" : true,
      );
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // プロフィール写真のアップロード（既存 thumbnails バケットを再利用）。
  // パスは {user_id}/avatar/... とし、thumbnails の RLS（先頭フォルダ=uid）を満たす。
  const AVATAR_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
  const AVATAR_MAX_BYTES = 5 * 1024 * 1024; // 5MB

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setProfileError(null);
    if (!AVATAR_TYPES.includes(file.type)) {
      setProfileError("対応形式は PNG / JPEG / WebP / GIF です");
      return;
    }
    if (file.size > AVATAR_MAX_BYTES) {
      setProfileError("ファイルサイズは 5MB 以下にしてください");
      return;
    }

    setIsAvatarUploading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setProfileError("ログインが必要です");
        return;
      }

      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${user.id}/avatar/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from("thumbnails")
        .upload(path, file, { upsert: false, contentType: file.type });
      if (uploadErr) throw new Error(uploadErr.message);

      const {
        data: { publicUrl },
      } = supabase.storage.from("thumbnails").getPublicUrl(path);

      setAvatarUrl(publicUrl);
    } catch (err) {
      setProfileError(
        err instanceof Error ? err.message : "アップロードに失敗しました",
      );
    } finally {
      setIsAvatarUploading(false);
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProfileLoading(true);
    setProfileSuccess(null);
    setProfileError(null);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setProfileError("認証エラー");
        return;
      }

      const trimmedEmail = email.trim();
      const emailChanged =
        trimmedEmail !== "" && trimmedEmail !== originalEmail;

      const { error: dbError } = await supabase
        .from("users")
        .update({
          display_name: displayName,
          notification_email: notificationEmail.trim() || null,
          avatar_url: avatarUrl || null,
        })
        .eq("id", user.id);

      if (dbError) {
        setProfileError("更新に失敗しました");
        return;
      }

      // 所属会社を更新
      if (companyId) {
        const { error: delError } = await supabase
          .from("company_members")
          .delete()
          .eq("user_id", user.id);

        if (delError) {
          setProfileError("更新に失敗しました");
          return;
        }

        const { error: insError } = await supabase
          .from("company_members")
          .insert({
            user_id: user.id,
            company_id: companyId,
            role: "USER",
            status: "active",
          });

        if (insError) {
          setProfileError("更新に失敗しました");
          return;
        }
      }

      // Phase2: user_profiles（スキル・特技・趣味・興味テーマ・相談可否）を保存。
      // メール変更時は下で早期 return するため、その前に保存しておく。
      const profileResult = await saveMyProfile({
        bio,
        skills,
        specialSkills,
        hobbies,
        interestThemes,
        consultTopics,
        availability: available ? "AVAILABLE" : "UNAVAILABLE",
      });
      if (!profileResult.ok) {
        setProfileError(
          profileResult.error ?? "プロフィールの保存に失敗しました",
        );
        return;
      }

      if (emailChanged) {
        const { error: emailError } = await supabase.auth.updateUser(
          { email: trimmedEmail },
          {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=/app/mypage`,
          },
        );

        if (emailError) {
          setProfileError(
            `メールアドレスの変更に失敗しました: ${emailError.message}`,
          );
          return;
        }

        setProfileSuccess(
          "新しいメールアドレス宛に確認メールを送信しました。メール内のリンクをクリックすると変更が完了します。",
        );
        return;
      }

      await fetchProfile();
      setProfileSuccess("プロフィールを更新しました");
    } finally {
      setIsProfileLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordError("パスワードが一致しません");
      return;
    }
    setIsPasswordLoading(true);
    setPasswordSuccess(null);
    setPasswordError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    setIsPasswordLoading(false);
    if (error) {
      setPasswordError(error.message);
    } else {
      setPasswordSuccess("パスワードを変更しました");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const addSkill = (value: string) => {
    const v = value.trim();
    if (!v || skills.includes(v)) return;
    setSkills((prev) => [...prev, v]);
    setSkillInput("");
  };

  // 汎用チップ追加（特技 / 趣味）。重複・空文字は無視する。
  const addChip = (
    value: string,
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    clearInput: () => void,
  ) => {
    const v = value.trim();
    if (!v || list.includes(v)) return;
    setList((prev) => [...prev, v]);
    clearInput();
  };

  const companyName = useMemo(
    () => companies.find((c) => c.id === companyId)?.name ?? "",
    [companies, companyId],
  );

  // プロフィール入力率（既存フィールドの充足度から算出）
  const completion = useMemo(() => {
    const fields = [
      displayName.trim(),
      email.trim(),
      notificationEmail.trim(),
      companyId,
    ];
    const filled = fields.filter(Boolean).length;
    return Math.round((filled / fields.length) * 100);
  }, [displayName, email, notificationEmail, companyId]);

  return (
    <div className="mx-auto max-w-6xl">
      {/* ===== Page Header (U-09) ===== */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">マイページ編集</h1>
          <p className="mt-1 text-sm text-slate-500">
            プロフィール情報やスキル、通知の設定を変更できます。
          </p>
        </div>
        <div className="flex gap-3">
          <AppButton
            type="button"
            variantType="secondary"
            onPress={() => fetchProfile()}
          >
            キャンセル
          </AppButton>
          <AppButton
            type="submit"
            form={PROFILE_FORM_ID}
            isLoading={isProfileLoading}
          >
            変更を保存
          </AppButton>
        </div>
      </div>

      {/* ===== Tabs (U-09) ===== */}
      <div className="mb-8 flex overflow-x-auto border-b border-slate-200">
        {VISIBLE_TABS.map((t) => {
          const isActive = activeTab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => goTab(t.key)}
              className={`whitespace-nowrap border-b-2 px-6 py-3 text-sm font-semibold transition-colors ${
                isActive
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-blue-600"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ===== Left column ===== */}
        <div className="space-y-6 lg:col-span-2">
          {/* --- プロフィール情報 + スキル・タグ + 通知設定（プロフィールフォーム） --- */}
          <form
            id={PROFILE_FORM_ID}
            onSubmit={handleProfileSave}
            className="space-y-6"
          >
            {(profileSuccess || profileError) && (
              <p
                className={`rounded-lg p-3 text-sm ${
                  profileError
                    ? "bg-danger-50 text-danger"
                    : "bg-success-50 text-success"
                }`}
              >
                {profileError ?? profileSuccess}
              </p>
            )}

            {/* プロフィール情報 */}
            <SectionCard
              innerRef={sectionRefs.profile}
              icon={<PersonIcon />}
              title="プロフィール情報"
            >
              <div className="mb-8 flex flex-col gap-8 md:flex-row">
                <div className="flex flex-col items-center gap-3">
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={isAvatarUploading}
                    aria-label="プロフィール写真を変更"
                    className="group relative h-32 w-32 overflow-hidden rounded-2xl border-2 border-slate-200 bg-blue-50 transition-colors hover:border-blue-400 disabled:opacity-60"
                  >
                    {avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={avatarUrl}
                        alt="プロフィール写真"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-3xl font-bold text-blue-600">
                        {getInitials(displayName)}
                      </span>
                    )}
                    <span className="absolute inset-x-0 bottom-0 bg-black/55 py-1 text-center text-[11px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                      {isAvatarUploading ? "アップロード中..." : "写真を変更"}
                    </span>
                  </button>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept={AVATAR_TYPES.join(",")}
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                  {avatarUrl ? (
                    <button
                      type="button"
                      onClick={() => setAvatarUrl("")}
                      className="text-[11px] text-slate-400 underline transition-colors hover:text-slate-600"
                    >
                      写真を削除
                    </button>
                  ) : (
                    <p className="text-center text-[11px] leading-relaxed text-slate-400">
                      クリックで写真を設定
                      <br />
                      PNG / JPEG / WebP / GIF・最大 5MB
                    </p>
                  )}
                </div>
                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField label="氏名" required>
                      <Input
                        value={displayName}
                        onValueChange={setDisplayName}
                        isRequired
                        placeholder="佐藤 健太"
                        variant="bordered"
                        size="lg"
                        classNames={formInputClasses}
                      />
                    </FormField>
                    <FormField label="表示名">
                      <Input
                        value={nickname}
                        onValueChange={setNickname}
                        placeholder="ケンタ"
                        variant="bordered"
                        size="lg"
                        classNames={formInputClasses}
                      />
                    </FormField>
                  </div>
                  <FormField label="所属会社">
                    <Select
                      selectedKeys={companyId ? [companyId] : []}
                      onSelectionChange={(keys) =>
                        setCompanyId(Array.from(keys)[0] as string)
                      }
                      placeholder="会社を選択してください"
                      variant="bordered"
                      size="lg"
                      classNames={formSelectClasses}
                    >
                      {companies.map((c) => (
                        <SelectItem key={c.id}>{c.name}</SelectItem>
                      ))}
                    </Select>
                  </FormField>
                  {/* 部署・役職は第1弾リリースでは非表示（SHOW_DEPARTMENT_POSITION） */}
                  {SHOW_DEPARTMENT_POSITION && (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <FormField label="部署">
                        <Input
                          value={department}
                          onValueChange={setDepartment}
                          placeholder="DX推進本部 戦略室"
                          variant="bordered"
                          size="lg"
                          classNames={formInputClasses}
                        />
                      </FormField>
                      <FormField label="役職">
                        <Input
                          value={position}
                          onValueChange={setPosition}
                          placeholder="シニアマネージャー"
                          variant="bordered"
                          size="lg"
                          classNames={formInputClasses}
                        />
                      </FormField>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4 border-t border-slate-200/70 pt-6">
                <div className="flex items-center justify-between rounded-lg border border-blue-200/60 bg-blue-50 p-4">
                  <div>
                    <p className="text-sm font-bold text-blue-700">
                      相談可否ステータス
                    </p>
                    <p className="text-[11px] text-slate-500">
                      ONにすると他の社員から直接相談が受けられるようになります。
                    </p>
                  </div>
                  <Switch
                    isSelected={available}
                    onValueChange={setAvailable}
                    color="primary"
                  />
                </div>
                <FormField label="自己紹介">
                  <Textarea
                    value={bio}
                    onValueChange={setBio}
                    minRows={4}
                    maxLength={500}
                    placeholder="あなたの専門性や、どんな相談を受けられるか、個人的な興味などを入力してください。"
                    variant="bordered"
                    classNames={{
                      inputWrapper: "border-slate-300 hover:border-slate-400",
                    }}
                  />
                  <p className="text-right text-[10px] text-slate-400">
                    {bio.length} / 500 文字
                  </p>
                </FormField>
              </div>
            </SectionCard>

            {/* スキル・タグ設定：第1弾リリースでは非表示（SHOW_SKILLS_SECTION） */}
            {SHOW_SKILLS_SECTION && (
              <SectionCard
                innerRef={sectionRefs.skills}
                icon={<TagIcon />}
                title="スキル・タグ設定"
              >
                <div className="space-y-6">
                  <ChipListInput
                    label="得意分野（スキル）"
                    chips={skills}
                    onRemove={(s) =>
                      setSkills((prev) => prev.filter((x) => x !== s))
                    }
                    inputValue={skillInput}
                    onInputChange={setSkillInput}
                    onAdd={addSkill}
                    placeholder="キーワードを入力して Enter..."
                    suggestions={SKILL_SUGGESTIONS}
                  />
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <ChipListInput
                      label="特技"
                      chips={specialSkills}
                      onRemove={(s) =>
                        setSpecialSkills((prev) => prev.filter((x) => x !== s))
                      }
                      inputValue={specialSkillInput}
                      onInputChange={setSpecialSkillInput}
                      onAdd={(v) =>
                        addChip(v, specialSkills, setSpecialSkills, () =>
                          setSpecialSkillInput(""),
                        )
                      }
                      placeholder="例: プレゼンテーション（Enter で追加）"
                    />
                    <ChipListInput
                      label="趣味"
                      chips={hobbies}
                      onRemove={(s) =>
                        setHobbies((prev) => prev.filter((x) => x !== s))
                      }
                      inputValue={hobbyInput}
                      onInputChange={setHobbyInput}
                      onAdd={(v) =>
                        addChip(v, hobbies, setHobbies, () => setHobbyInput(""))
                      }
                      placeholder="例: キャンプ（Enter で追加）"
                    />
                  </div>
                  <FormField label="興味テーマ">
                    <Textarea
                      value={interestThemes}
                      onValueChange={setInterestThemes}
                      minRows={2}
                      placeholder="今後関わってみたいプロジェクトや、今学んでいること"
                      variant="bordered"
                      classNames={{
                        inputWrapper: "border-slate-300 hover:border-slate-400",
                      }}
                    />
                  </FormField>
                  <FormField
                    label="相談に乗れること"
                    description="社員検索で「相談OK」の人として表示され、相談内容の目安になります"
                  >
                    <Textarea
                      value={consultTopics}
                      onValueChange={setConsultTopics}
                      minRows={2}
                      placeholder="例: キャリア相談、Figmaの使い方、資料作成のコツ"
                      variant="bordered"
                      classNames={{
                        inputWrapper: "border-slate-300 hover:border-slate-400",
                      }}
                    />
                  </FormField>
                </div>
              </SectionCard>
            )}

            {/* 通知設定：第1弾リリースでは非表示（SHOW_NOTIFICATIONS_TAB） */}
            {SHOW_NOTIFICATIONS_TAB && (
              <SectionCard
                innerRef={sectionRefs.notifications}
                icon={<BellIcon />}
                title="通知設定"
              >
                <div className="space-y-6">
                  <FormField
                    label="通知先メールアドレス"
                    description="未設定の場合はログインメールアドレスへ通知されます"
                  >
                    <Input
                      value={notificationEmail}
                      onValueChange={setNotificationEmail}
                      type="email"
                      placeholder="notify@example.com"
                      variant="bordered"
                      size="lg"
                      classNames={formInputClasses}
                    />
                  </FormField>

                  <div className="overflow-hidden rounded-lg border border-slate-200">
                    <table className="w-full border-collapse text-left">
                      <thead>
                        <tr className="bg-slate-50">
                          <th className="border-b border-slate-200 p-4 text-sm font-bold text-slate-700">
                            イベント
                          </th>
                          <th className="border-b border-slate-200 p-4 text-center text-sm font-bold text-slate-700">
                            メール
                          </th>
                          <th className="border-b border-slate-200 p-4 text-center text-sm font-bold text-slate-700">
                            ブラウザ
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {NOTIFICATION_ROWS.map((row) => (
                          <tr key={row.label}>
                            <td className="p-4 text-sm font-medium text-slate-700">
                              {row.label}
                            </td>
                            <td className="p-4 text-center">
                              <Checkbox defaultSelected={row.mail} size="sm" />
                            </td>
                            <td className="p-4 text-center">
                              <Checkbox
                                defaultSelected={row.browser}
                                size="sm"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex gap-3 rounded-lg bg-blue-50 p-4">
                    <span className="mt-0.5 text-blue-600">
                      <svg {...iconProps} width={18} height={18}>
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 16v-4M12 8h.01" />
                      </svg>
                    </span>
                    <p className="text-[11px] leading-relaxed text-slate-500">
                      ブラウザ通知を有効にするには、ブラウザの設定からも許可が必要です。重要なお知らせやメンテナンス情報は、設定に関わらず送信される場合があります。
                    </p>
                  </div>
                </div>
              </SectionCard>
            )}
          </form>

          {/* アカウント（メール + パスワード変更：別フォーム） */}
          <SectionCard
            innerRef={sectionRefs.account}
            icon={<LockIcon />}
            title="アカウント"
          >
            <div className="mb-8">
              <FormField label="メールアドレス">
                <Input
                  value={email}
                  onValueChange={setEmail}
                  type="email"
                  placeholder="user@example.com"
                  variant="bordered"
                  size="lg"
                  classNames={formInputClasses}
                  description="変更すると確認メールが送信されます。上部の「変更を保存」で反映されます。"
                />
              </FormField>
            </div>

            <div className="border-t border-slate-200/70 pt-6">
              <h3 className="mb-4 text-sm font-semibold text-slate-900">
                パスワード変更
              </h3>
              <form
                id={PASSWORD_FORM_ID}
                onSubmit={handlePasswordChange}
                className="flex flex-col gap-6"
              >
                {passwordSuccess && (
                  <p className="rounded-lg bg-success-50 p-3 text-sm text-success">
                    {passwordSuccess}
                  </p>
                )}
                {passwordError && (
                  <p className="rounded-lg bg-danger-50 p-3 text-sm text-danger">
                    {passwordError}
                  </p>
                )}
                <FormField
                  label="新しいパスワード"
                  required
                  description="8文字以上"
                >
                  <Input
                    type="password"
                    value={newPassword}
                    onValueChange={setNewPassword}
                    isRequired
                    placeholder="8文字以上で入力"
                    variant="bordered"
                    size="lg"
                    classNames={formInputClasses}
                  />
                </FormField>
                <FormField label="新しいパスワード（確認）" required>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onValueChange={setConfirmPassword}
                    isRequired
                    placeholder="もう一度入力してください"
                    variant="bordered"
                    size="lg"
                    classNames={formInputClasses}
                  />
                </FormField>
                <div className="flex justify-end">
                  <AppButton type="submit" isLoading={isPasswordLoading}>
                    パスワードを変更する
                  </AppButton>
                </div>
              </form>
            </div>
          </SectionCard>
        </div>

        {/* ===== Right column ===== */}
        <div className="space-y-6">
          {/* 入力率 */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-base font-semibold text-slate-900">
              プロフィール入力率
            </h3>
            <div className="mb-2 flex items-end justify-between">
              <span className="text-2xl font-bold text-blue-600">
                {completion}%
              </span>
              <span className="text-[11px] font-bold text-slate-400">
                {completion >= 100 ? "入力完了！" : "あと少しで完了！"}
              </span>
            </div>
            <Progress
              aria-label="プロフィール入力率"
              value={completion}
              color="primary"
              size="sm"
            />
          </div>

          {/* 公開プレビュー */}
          <div className="sticky top-24 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                公開プレビュー
              </span>
              <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                LIVE
              </span>
            </div>
            <div className="p-6">
              <div className="mb-4 flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-blue-50 text-base font-bold text-blue-600">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarUrl}
                      alt="プロフィール写真"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    getInitials(displayName)
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-bold text-slate-900">
                    {displayName || "（氏名未設定）"}
                  </p>
                  <p className="truncate text-[11px] text-slate-500">
                    {[companyName, nickname].filter(Boolean).join(" ・ ") ||
                      "所属会社未設定"}
                  </p>
                </div>
              </div>
              <div className="mb-4">
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold text-white ${
                    available ? "bg-emerald-500" : "bg-slate-400"
                  }`}
                >
                  {available ? "相談OK" : "相談不可"}
                </span>
              </div>
              <p className="mb-4 line-clamp-3 text-[12px] leading-relaxed text-slate-500">
                {bio || "自己紹介はまだ入力されていません。"}
              </p>
              {skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {skills.map((s) => (
                    <span
                      key={s}
                      className="rounded border border-blue-200/60 bg-blue-50 px-1.5 py-0.5 text-[10px] text-blue-600"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick actions */}
          <div className="space-y-3">
            <AppButton
              type="submit"
              form={PROFILE_FORM_ID}
              isLoading={isProfileLoading}
              className="w-full"
            >
              変更を保存して反映
            </AppButton>
            <AppButton type="button" variantType="secondary" className="w-full">
              公開ページを確認
            </AppButton>
          </div>
        </div>
      </div>
    </div>
  );
}
