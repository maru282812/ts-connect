import { createClient } from "@/lib/supabase/server";
import type { SystemRole, User } from "@/types/database";

export async function getCurrentUserProfile(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select(
      "id, email, display_name, system_role, account_status, created_at, updated_at",
    )
    .eq("id", user.id)
    .single();

  return profile ?? null;
}

export async function getCurrentSystemRole(): Promise<SystemRole | null> {
  const profile = await getCurrentUserProfile();
  return (profile?.system_role as SystemRole) ?? null;
}

export async function isAdminUser(): Promise<boolean> {
  const role = await getCurrentSystemRole();
  return role === "ADMIN" || role === "MASTER_ADMIN";
}

export async function isMasterAdminUser(): Promise<boolean> {
  const role = await getCurrentSystemRole();
  return role === "MASTER_ADMIN";
}

export interface AdminContext {
  userId: string;
  systemRole: SystemRole;
  isMasterAdmin: boolean;
  companyId: string | null;
  companyIds: string[];
}

/**
 * 管理系ページ用のコンテキストを取得する。
 * - isMasterAdmin: true の場合 companyId は null（全件アクセス可）
 * - ADMIN の場合 company_members から所属会社を取得
 */
export async function getAdminContext(): Promise<AdminContext> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthenticated");

  const { data: profile } = await supabase
    .from("users")
    .select("system_role")
    .eq("id", user.id)
    .single();

  const systemRole = (profile?.system_role ?? "USER") as SystemRole;
  const isMasterAdmin = systemRole === "MASTER_ADMIN";

  let companyId: string | null = null;
  let companyIds: string[] = [];
  if (!isMasterAdmin) {
    const { data: memberships } = await supabase
      .from("company_members")
      .select("company_id")
      .eq("user_id", user.id)
      .eq("status", "active");

    companyIds = memberships?.map((m) => m.company_id) ?? [];
    companyId = companyIds[0] ?? null;
  }

  return { userId: user.id, systemRole, isMasterAdmin, companyId, companyIds };
}
