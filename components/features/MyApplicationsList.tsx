"use client";

import { Card, CardBody, CardHeader } from "@heroui/react";
import { useEffect, useState } from "react";
import { ApplicationTable } from "@/components/common/ApplicationTable";
import { PageHeader } from "@/components/common/PageHeader";
import { createClient } from "@/lib/supabase/client";
import type { ApplicationWithPost } from "@/types/database";

export function MyApplicationsList() {
  const [applications, setApplications] = useState<ApplicationWithPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("applications")
        .select("*, posts(id, title, post_type)")
        .eq("applicant_user_id", user.id)
        .order("applied_at", { ascending: false });

      setApplications((data as ApplicationWithPost[]) ?? []);
      setIsLoading(false);
    };
    fetch();
  }, []);

  return (
    <div>
      <PageHeader title="応募一覧" description="あなたの応募・問い合わせ履歴" />

      <Card shadow="sm">
        <CardHeader>
          <p className="text-sm text-default-500">
            {isLoading ? "読み込み中..." : `${applications.length}件`}
          </p>
        </CardHeader>
        <CardBody className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-12 bg-default-100 rounded-lg animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <ApplicationTable applications={applications} />
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
