import { redirect } from "next/navigation";
import { CompanyShell } from "@/components/admin/CompanyShell";
import { createClient } from "@/lib/supabase/server";

export default async function CompanyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("display_name, system_role")
    .eq("id", user.id)
    .single();

  if (
    profile?.system_role !== "ADMIN" &&
    profile?.system_role !== "MASTER_ADMIN"
  ) {
    redirect("/app/posts");
  }

  const displayName = profile.display_name ?? "管理者";
  const systemRole = profile.system_role;

  return (
    <CompanyShell
      displayName={displayName}
      email={user.email ?? ""}
      systemRole={systemRole}
    >
      {children}
    </CompanyShell>
  );
}
