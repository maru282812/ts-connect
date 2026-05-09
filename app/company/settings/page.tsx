"use client";

import {
  Card,
  CardBody,
  CardHeader,
  Divider,
  Input,
} from "@heroui/react";
import { useEffect, useState } from "react";
import { formInputClasses } from "@/components/common/FormField";
import { PageHeader } from "@/components/common/PageHeader";
import { AppButton } from "@/components/ui/AppButton";
import { FormField } from "@/components/ui/FormField";
import { createClient } from "@/lib/supabase/client";

export default function AdminSettingsPage() {
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [notificationEmail, setNotificationEmail] = useState("");
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

      const { data: memberData } = await supabase
        .from("company_members")
        .select("company_id")
        .eq("user_id", user.id)
        .eq("status", "active")
        .limit(1)
        .single();

      if (!memberData?.company_id) return;
      setCompanyId(memberData.company_id);

      const { data: company } = await supabase
        .from("companies")
        .select("notification_email")
        .eq("id", memberData.company_id)
        .single();

      setNotificationEmail(company?.notification_email ?? "");
    };
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId) {
      setError("所属会社が見つかりません");
      return;
    }
    setIsLoading(true);
    setSuccess(null);
    setError(null);

    const supabase = createClient();
    const { error: dbError } = await supabase
      .from("companies")
      .update({
        notification_email: notificationEmail.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", companyId);

    setIsLoading(false);
    if (dbError) {
      setError("更新に失敗しました");
    } else {
      setSuccess("設定を保存しました");
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader title="管理設定" description="管理者向け通知設定" />

      <Card shadow="sm">
        <CardHeader className="px-6 py-4">
          <h2 className="text-base font-semibold">通知設定</h2>
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
            <FormField
              label="通知用メールアドレス"
              description="応募・問い合わせ等の通知を受け取るメールアドレスです。未設定の場合は、投稿者またはログインユーザーのメールアドレスを利用します。"
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
            <div className="flex justify-end pt-2">
              <AppButton
                type="submit"
                isLoading={isLoading}
              >
                保存する
              </AppButton>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
