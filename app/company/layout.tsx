import { redirect } from "next/navigation";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
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

  return (
    <div className="min-h-screen bg-slate-100 flex">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader displayName={displayName} email={user.email ?? ""} />
        {/* メインコンテンツ */}
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
