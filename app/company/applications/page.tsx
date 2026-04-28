import {
  AdminApplicationsClient,
  type ApplicationRow,
} from "@/components/admin/AdminApplicationsClient";
import { PageHeader } from "@/components/common/PageHeader";
import { createClient } from "@/lib/supabase/server";

interface AdminApplicationsPageProps {
  searchParams: Promise<{ postId?: string }>;
}

export default async function AdminApplicationsPage({
  searchParams,
}: AdminApplicationsPageProps) {
  const supabase = await createClient();
  const { postId } = await searchParams;

  // RLS が ADMIN=所属会社案件の応募のみ / MASTER_ADMIN=全件 を自動適用する
  let query = supabase
    .from("applications")
    .select(
      "id, post_id, applicant_name_snapshot, applicant_email_snapshot, applicant_company_snapshot, post_title_snapshot, application_type, application_status, applied_at, message",
    )
    .order("applied_at", { ascending: false });

  if (postId) {
    query = query.eq("post_id", postId);
  }

  const { data: applications, error } = await query;

  if (error) {
    return (
      <div className="text-sm text-danger p-4">
        応募データの取得に失敗しました: {error.message}
      </div>
    );
  }

  const rows = (applications as ApplicationRow[]) ?? [];

  return (
    <div>
      <PageHeader title="応募管理" description="応募・問い合わせ一覧" />
      <AdminApplicationsClient applications={rows} />
    </div>
  );
}
