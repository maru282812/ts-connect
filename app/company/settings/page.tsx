"use client";

import {
  Card,
  CardBody,
  CardHeader,
  Divider,
  Input,
} from "@heroui/react";
import { useEffect, useState } from "react";
import { formInputReadonlyClasses } from "@/components/common/FormField";
import { PageHeader } from "@/components/common/PageHeader";
import { FormField } from "@/components/ui/FormField";
import { createClient } from "@/lib/supabase/client";

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
    <div className="max-w-2xl mx-auto">
      <PageHeader title="管理設定" description="所属会社の情報" />

      {isLoaded && companyEmail !== null && (
        <Card shadow="sm">
          <CardHeader className="px-6 py-4">
            <h2 className="text-base font-semibold">所属会社メールアドレス</h2>
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
    </div>
  );
}
