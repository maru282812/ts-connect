import { OfficialPostForm } from "@/components/admin/OfficialPostForm";
import { getAdminContext } from "@/lib/auth/helpers";
import { createClient } from "@/lib/supabase/server";
import type { Company } from "@/types/database";

export default async function NewOfficialPostPage() {
  const supabase = await createClient();
  const { isMasterAdmin, companyId, companyIds } = await getAdminContext();

  const { data: companies } = isMasterAdmin
    ? await supabase.from("companies").select("*").order("name")
    : companyIds.length > 0
      ? await supabase
          .from("companies")
          .select("*")
          .in("id", companyIds)
          .order("name")
      : { data: [] };

  const defaultCompanyId = companyId ?? undefined;

  return (
    <OfficialPostForm
      companies={(companies as Company[]) ?? []}
      defaultCompanyId={defaultCompanyId}
    />
  );
}
