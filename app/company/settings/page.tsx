"use client";

import {
  Card,
  CardBody,
  CardHeader,
  Divider,
  Input,
  Switch,
} from "@heroui/react";
import { useEffect, useState } from "react";
import { formInputReadonlyClasses } from "@/components/common/FormField";
import { PageHeader } from "@/components/common/PageHeader";
import { FormField } from "@/components/ui/FormField";
import { createClient } from "@/lib/supabase/client";

interface OpsNotification {
  id: string;
  label: string;
  description: string;
  on: boolean;
}

const OPS_NOTIFICATIONS: OpsNotification[] = [
  {
    id: "report",
    label: "新規通報の通知",
    description: "コンテンツが通報された際に運用担当へ通知します。",
    on: true,
  },
  {
    id: "application",
    label: "新規応募の通知",
    description: "案件に新しい応募があった際に通知します。",
    on: true,
  },
  {
    id: "weekly",
    label: "週次サマリーの送信",
    description: "毎週月曜に投稿・応募・通報の集計を運用窓口へ送信します。",
    on: false,
  },
];

export default function AdminSettingsPage() {
  const [companyEmail, setCompanyEmail] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

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

      if (!memberData?.company_id) {
        setIsLoaded(true);
        return;
      }

      const { data: company } = await supabase
        .from("companies")
        .select("email")
        .eq("id", memberData.company_id)
        .single();

      setCompanyEmail(company?.email ?? null);
      setIsLoaded(true);
    };
    load();
  }, []);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader
        title="運用設定"
        description="自社の運用に関する設定です。全社共通のマスター設定はマスター管理から行います。"
      />

      {/* 会社情報 */}
      {isLoaded && companyEmail !== null && (
        <Card shadow="sm">
          <CardHeader className="px-6 py-4">
            <h2 className="text-base font-semibold">会社情報</h2>
          </CardHeader>
          <Divider />
          <CardBody className="px-6 py-6">
            <FormField
              label="所属会社メールアドレス"
              description="会社の代表メールアドレスです。変更は管理者にお問い合わせください。"
            >
              <Input
                value={companyEmail}
                isReadOnly
                variant="bordered"
                size="lg"
                classNames={formInputReadonlyClasses}
              />
            </FormField>
          </CardBody>
        </Card>
      )}

      {/* 運用窓口 */}
      <Card shadow="sm">
        <CardHeader className="px-6 py-4">
          <h2 className="text-base font-semibold">運用窓口</h2>
        </CardHeader>
        <Divider />
        <CardBody className="px-6 py-6 space-y-6">
          <FormField
            label="問い合わせ先メールアドレス"
            description="ユーザーからの問い合わせや通知の宛先になります。"
          >
            <Input
              defaultValue="ops@example.com"
              variant="bordered"
              size="lg"
              placeholder="ops@example.com"
            />
          </FormField>
          <FormField
            label="運用ポリシーのURL"
            description="ガイドラインや利用規約のリンクを設定します。"
          >
            <Input
              defaultValue="https://example.com/policy"
              variant="bordered"
              size="lg"
              placeholder="https://"
            />
          </FormField>
        </CardBody>
      </Card>

      {/* 通知設定 */}
      <Card shadow="sm">
        <CardHeader className="px-6 py-4">
          <h2 className="text-base font-semibold">通知設定</h2>
        </CardHeader>
        <Divider />
        <CardBody className="px-2 py-2">
          {OPS_NOTIFICATIONS.map((n, i) => (
            <div key={n.id}>
              {i > 0 && <Divider />}
              <div className="flex items-center justify-between gap-4 px-4 py-4">
                <div>
                  <p className="text-sm font-semibold text-default-800">
                    {n.label}
                  </p>
                  <p className="text-xs text-default-400 mt-0.5">
                    {n.description}
                  </p>
                </div>
                <Switch defaultSelected={n.on} aria-label={n.label} />
              </div>
            </div>
          ))}
        </CardBody>
      </Card>

      <div className="flex justify-end">
        <button
          type="button"
          className="px-6 py-2.5 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary/90 shadow-sm"
        >
          設定を保存
        </button>
      </div>
    </div>
  );
}
