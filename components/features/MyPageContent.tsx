"use client";

import {
  Card,
  CardBody,
  CardHeader,
  Divider,
  Input,
  Select,
  SelectItem,
  Tab,
  Tabs,
} from "@heroui/react";
import { useCallback, useEffect, useState } from "react";
import {
  formInputClasses,
  formSelectClasses,
} from "@/components/common/FormField";
import { PageHeader } from "@/components/common/PageHeader";
import { AppButton } from "@/components/ui/AppButton";
import { FormField } from "@/components/ui/FormField";
import { createClient } from "@/lib/supabase/client";
import type { Company } from "@/types/database";

export function MyPageContent() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [originalEmail, setOriginalEmail] = useState("");
  const [notificationEmail, setNotificationEmail] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

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
      .select("email, display_name, notification_email")
      .eq("id", user.id)
      .single();

    setEmail(userProfile?.email ?? "");
    setOriginalEmail(userProfile?.email ?? "");
    setDisplayName(userProfile?.display_name ?? "");
    setNotificationEmail(userProfile?.notification_email ?? "");

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
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

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
      const emailChanged = trimmedEmail !== "" && trimmedEmail !== originalEmail;

      const { error: dbError } = await supabase
        .from("users")
        .update({
          display_name: displayName,
          notification_email: notificationEmail.trim() || null,
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
          .insert({ user_id: user.id, company_id: companyId, role: "USER", status: "active" });

        if (insError) {
          setProfileError("更新に失敗しました");
          return;
        }
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

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader title="基本設定" description="プロフィールとアカウント設定" />

      <Tabs aria-label="設定タブ" color="primary" variant="underlined">
        <Tab key="profile" title="プロフィール">
          <Card shadow="sm" className="mt-4">
            <CardHeader className="px-6 py-4">
              <h2 className="text-base font-semibold">プロフィール設定</h2>
            </CardHeader>
            <Divider />
            <CardBody className="px-6 py-6">
              <form
                onSubmit={handleProfileSave}
                className="flex flex-col gap-6"
              >
                {profileSuccess && (
                  <p className="text-success text-sm bg-success-50 rounded-lg p-3">
                    {profileSuccess}
                  </p>
                )}
                {profileError && (
                  <p className="text-danger text-sm bg-danger-50 rounded-lg p-3">
                    {profileError}
                  </p>
                )}
                <FormField label="お名前" required>
                  <Input
                    value={displayName}
                    onValueChange={setDisplayName}
                    isRequired
                    placeholder="山田 太郎"
                    variant="bordered"
                    size="lg"
                    classNames={formInputClasses}
                  />
                </FormField>
                <FormField label="メールアドレス">
                  <Input
                    value={email}
                    onValueChange={setEmail}
                    type="email"
                    placeholder="user@example.com"
                    variant="bordered"
                    size="lg"
                    classNames={formInputClasses}
                  />
                </FormField>
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
                <div className="flex justify-end pt-2">
                  <AppButton type="submit" isLoading={isProfileLoading}>
                    保存する
                  </AppButton>
                </div>
              </form>
            </CardBody>
          </Card>
        </Tab>

        <Tab key="password" title="パスワード変更">
          <Card shadow="sm" className="mt-4">
            <CardHeader className="px-6 py-4">
              <h2 className="text-base font-semibold">パスワード変更</h2>
            </CardHeader>
            <Divider />
            <CardBody className="px-6 py-6">
              <form
                onSubmit={handlePasswordChange}
                className="flex flex-col gap-6"
              >
                {passwordSuccess && (
                  <p className="text-success text-sm bg-success-50 rounded-lg p-3">
                    {passwordSuccess}
                  </p>
                )}
                {passwordError && (
                  <p className="text-danger text-sm bg-danger-50 rounded-lg p-3">
                    {passwordError}
                  </p>
                )}
                <FormField label="新しいパスワード" required description="8文字以上">
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
                <div className="flex justify-end pt-2">
                  <AppButton type="submit" isLoading={isPasswordLoading}>
                    変更する
                  </AppButton>
                </div>
              </form>
            </CardBody>
          </Card>
        </Tab>
      </Tabs>
    </div>
  );
}
