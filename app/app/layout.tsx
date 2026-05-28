import { redirect } from "next/navigation";
import { AppShell } from "@/components/user/AppShell";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({
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
    .select("display_name, system_role, account_status")
    .eq("id", user.id)
    .single();

  const displayName = profile?.display_name ?? "ユーザー";

  return (
    <AppShell displayName={displayName} email={user.email ?? ""}>
      {children}
    </AppShell>
  );
}
