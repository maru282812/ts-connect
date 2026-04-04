"use client";

import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Input,
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

export default function AdminSettingsPage() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [notificationEmail, setNotificationEmail] = useState(
    process.env.NEXT_PUBLIC_ADMIN_NOTIFICATION_EMAIL ?? "",
  );
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setEmail(user.email ?? "");
      setDisplayName(user.user_metadata?.display_name ?? "");
    };
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccess(null);
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

    const { error: authError } = await supabase.auth.updateUser({
      data: { display_name: displayName },
    });

    const { error: dbError } = await supabase
      .from("users")
      .update({
        display_name: displayName,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    setIsLoading(false);
    if (authError ?? dbError) {
      setError("更新に失敗しました");
    } else {
      setSuccess("設定を保存しました");
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader title="管理設定" description="管理者アカウントと通知設定" />

      <div className="space-y-8">
        {/* 管理者情報 */}
        <Card shadow="sm">
          <CardHeader className="px-6 py-4">
            <h2 className="text-base font-semibold">管理者情報</h2>
          </CardHeader>
          <Divider />
          <CardBody className="px-6 py-6">
            <form onSubmit={handleSave} className="flex flex-col gap-6">
              {success && (
                <p className="text-success text-sm bg-success-50 rounded-lg p-3">
                  {success}
                </p>
              )}
              {error && (
                <p className="text-danger text-sm bg-danger-50 rounded-lg p-3">
                  {error}
                </p>
              )}
              <Input
                label="管理者名"
                labelPlacement="outside"
                value={displayName}
                onValueChange={setDisplayName}
                isRequired
                placeholder="管理者 太郎"
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
                description="メールアドレスの変更はシステム管理者にお問い合わせください"
                classNames={{
                  ...inputClasses,
                  inputWrapper: "border-slate-200 bg-slate-50 h-12",
                }}
              />
              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  color="primary"
                  isLoading={isLoading}
                  className="min-w-28"
                >
                  保存する
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>

        {/* 通知設定 */}
        <Card shadow="sm">
          <CardHeader className="px-6 py-4">
            <h2 className="text-base font-semibold">通知設定</h2>
          </CardHeader>
          <Divider />
          <CardBody className="px-6 py-6 flex flex-col gap-4">
            <Input
              label="管理者通知先メールアドレス"
              labelPlacement="outside"
              value={notificationEmail}
              onValueChange={setNotificationEmail}
              variant="bordered"
              size="lg"
              isReadOnly
              classNames={{
                ...inputClasses,
                inputWrapper: "border-slate-200 bg-slate-50 h-12",
              }}
            />
            <p className="text-xs text-slate-400 leading-relaxed">
              応募・問い合わせ通知の送信先です。環境変数{" "}
              <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-600">
                ADMIN_NOTIFICATION_EMAIL
              </code>{" "}
              で設定します。
              <br />
              通知先の変更は{" "}
              <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-600">
                .env.local
              </code>{" "}
              を更新してください。将来的には会社ごとの通知先設定に拡張予定です。
            </p>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
