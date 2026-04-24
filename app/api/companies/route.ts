import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// サインアップページは未認証のため RLS をバイパスするため admin client を使用
export async function GET() {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("companies")
    .select("id, name")
    .order("name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
