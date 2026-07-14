import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const supabase = await createClient();

    // 認証チェック
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    // いいねを追加（既存チェックは upsert で）
    const { data, error } = await supabase
      .from("post_reactions")
      .upsert(
        {
          post_id: id,
          user_id: user.id,
        },
        { onConflict: "post_id,user_id" },
      )
      .select("*");

    if (error) {
      console.error("Error adding like:", error);
      return NextResponse.json(
        { error: "Failed to add like" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { message: "Like added successfully", data },
      { status: 201 },
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Unexpected error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const supabase = await createClient();

    // 認証チェック
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    // いいねを削除
    const { error } = await supabase
      .from("post_reactions")
      .delete()
      .eq("post_id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error removing like:", error);
      return NextResponse.json(
        { error: "Failed to remove like" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { message: "Like removed successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Unexpected error" },
      { status: 500 },
    );
  }
}
