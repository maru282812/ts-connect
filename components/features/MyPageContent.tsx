"use client";

import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Input,
  Tab,
  Tabs,
} from "@heroui/react";
import { useEffect, useState } from "react";
import { formLabelClasses } from "@/components/common/FormField";
import { PageHeader } from "@/components/common/PageHeader";
import { createClient } from "@/lib/supabase/client";

const inputClasses = {
  ...formLabelClasses,
  inputWrapper: "border-slate-300 hover:border-slate-400 bg-white h-12",
  input: "text-base",
};

export function MyPageContent() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
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
      setDisplayName(user.user_metadata?.display_name ?? "");
      setCompanyName(user.user_metadata?.company_name ?? "");
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
      data: { display_name: displayName, company_name: companyName },
    });

    const { error: dbError } = await supabase
      .from("users")
      .update({
        display_name: displayName,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    setIsProfileLoading(false);
    if (authError ?? dbError) {
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
                <Input
                  label="お名前"
                  labelPlacement="outside"
                  value={displayName}
                  onValueChange={setDisplayName}
                  isRequired
                  placeholder="山田 太郎"
                  variant="bordered"
                  size="lg"
                  classNames={inputClasses}
                />
                <Input
                  label="メールアドレス"
                  labelPlacement="outside"
                  value={email}
                  isReadOnly
                  variant="bordered"
                  size="lg"
                  description="メールアドレスの変更はサポートにお問い合わせください"
                  classNames={{
                    ...inputClasses,
                    inputWrapper: "border-slate-200 bg-slate-50 h-12",
                  }}
                />
                <Input
                  label="所属会社"
                  labelPlacement="outside"
                  value={companyName}
                  onValueChange={setCompanyName}
                  placeholder="株式会社〇〇"
                  variant="bordered"
                  size="lg"
                  classNames={inputClasses}
                />
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
                <Input
                  label="新しいパスワード"
                  labelPlacement="outside"
                  type="password"
                  value={newPassword}
                  onValueChange={setNewPassword}
                  isRequired
                  placeholder="8文字以上で入力"
                  description="8文字以上"
                  variant="bordered"
                  size="lg"
                  classNames={inputClasses}
                />
                <Input
                  label="新しいパスワード（確認）"
                  labelPlacement="outside"
                  type="password"
                  value={confirmPassword}
                  onValueChange={setConfirmPassword}
                  isRequired
                  placeholder="もう一度入力してください"
                  variant="bordered"
                  size="lg"
                  classNames={inputClasses}
                />
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
