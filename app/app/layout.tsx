import { redirect } from "next/navigation";
import { UserSidebar } from "@/components/user/UserSidebar";
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

  // ユーザープロフィール取得
  const { data: profile } = await supabase
    .from("users")
    .select("display_name, system_role, account_status")
    .eq("id", user.id)
    .single();

  const displayName =
    profile?.display_name ?? user.user_metadata?.display_name ?? "ユーザー";

  return (
    <div className="h-screen overflow-hidden bg-blue-50 flex">
      <UserSidebar />
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        {/* ヘッダー */}
        <header className="bg-white border-b border-default-100 px-6 py-3 flex items-center justify-between shrink-0 z-10">
          <div className="text-sm text-default-500">
            <span className="font-medium text-default-700">WorkMarket</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-default-800">
                {displayName}
              </p>
              <p className="text-xs text-default-400">{user.email}</p>
            </div>
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold">
              {displayName.charAt(0)}
            </div>
          </div>
        </header>
        {/* メインコンテンツ */}
        <main className="flex-1 p-6 overflow-auto min-h-0">{children}</main>
      </div>
    </div>
  );
}
