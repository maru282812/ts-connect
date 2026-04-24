"use client";

import {
  Button,
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
import { useEffect, useState } from "react";
import {
  formInputClasses,
  formInputReadonlyClasses,
  formSelectClasses,
} from "@/components/common/FormField";
import { PageHeader } from "@/components/common/PageHeader";
import { FormField } from "@/components/ui/FormField";
import { createClient } from "@/lib/supabase/client";
import type { Company } from "@/types/database";

export function MyPageContent() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
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

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      setEmail(user.email ?? "");

      const { data: userProfile } = await supabase
        .from("users")
        .select("display_name")
        .eq("id", user.id)
        .single();
      setDisplayName(userProfile?.display_name ?? "");

      const { data: companiesData } = await supabase
        .from("companies")
        .select("id, name, created_at, updated_at")
        .order("name");
      if (companiesData) setCompanies(companiesData);

      const { data: memberData } = await supabase
        .from("company_members")
        .select("company_id")
        .eq("user_id", user.id)
        .limit(1)
        .single();
      if (memberData?.company_id) setCompanyId(memberData.company_id);
    };
    load();
  }, []);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProfileLoading(true);
    setProfileSuccess(null);
    setProfileError(null);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setProfileError("認証エラー");
      setIsProfileLoading(false);
      return;
    }

    const { error: authError } = await supabase.auth.updateUser({
      data: { display_name: displayName },
    });

    const { error: dbError } = await supabase
      .from("users")
      .update({ display_name: displayName, updated_at: new Date().toISOString() })
      .eq("id", user.id);

    let memberError: Error | null = null;
    if (companyId) {
      const { error: delError } = await supabase
        .from("company_members")
        .delete()
        .eq("user_id", user.id);

      if (delError) {
        memberError = delError;
      } else {
        const { error: insError } = await supabase
          .from("company_members")
          .insert({ user_id: user.id, company_id: companyId, role: "USER", status: "active" });
        if (insError) memberError = insError;
      }
    }

    setIsProfileLoading(false);
    if (authError ?? dbError ?? memberError) {
      setProfileError("更新に失敗しました");
    } else {
      setProfileSuccess("プロフィールを更新しました");
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
                <FormField
                  label="メールアドレス"
                  description="メールアドレスの変更はサポートにお問い合わせください"
                >
                  <Input
                    value={email}
                    isReadOnly
                    variant="bordered"
                    size="lg"
                    classNames={formInputReadonlyClasses}
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
                  <Button
                    type="submit"
                    color="primary"
                    isLoading={isProfileLoading}
                    className="min-w-28"
                  >
                    保存する
                  </Button>
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
                  <Button
                    type="submit"
                    color="primary"
                    isLoading={isPasswordLoading}
                    className="min-w-28"
                  >
                    変更する
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>
        </Tab>
      </Tabs>
    </div>
  );
}
