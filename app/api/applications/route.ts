import { NextResponse } from "next/server";
import { sendMail } from "@/lib/mail";
import {
  buildApplicationEmailHtml,
  buildApplicationEmailSubject,
  buildApplicationEmailText,
} from "@/lib/mail/templates/application";
import { createClient } from "@/lib/supabase/server";
import type { ApplicationType, PostType } from "@/types/database";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // 認証チェック
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    // リクエストボディ
    const body = await request.json();
    const {
      post_id,
      message,
      application_type,
    }: {
      post_id: string;
      message?: string;
      application_type: ApplicationType;
    } = body;

    if (!post_id || !application_type) {
      return NextResponse.json(
        { error: "必須パラメータが不足しています" },
        { status: 400 },
      );
    }

    // 案件情報取得（投稿者のメールアドレスも取得）
    const { data: post, error: postError } = await supabase
      .from("posts")
      .select("*, companies(id, name), creator:created_by_user_id(email)")
      .eq("id", post_id)
      .eq("post_status", "PUBLISHED")
      .single();

    if (postError || !post) {
      return NextResponse.json(
        { error: "案件が見つかりませんでした" },
        { status: 404 },
      );
    }

    // ユーザープロフィール取得
    const { data: userProfile } = await supabase
      .from("users")
      .select("display_name, email")
      .eq("id", user.id)
      .single();

    const applicantName =
      userProfile?.display_name ?? user.user_metadata?.display_name ?? "不明";
    const applicantEmail = user.email ?? "";
    const applicantCompany = user.user_metadata?.company_name ?? null;

    // 重複送信チェック（同一ユーザー × 同一投稿 × 同一タイプ）
    const { data: existing } = await supabase
      .from("applications")
      .select("id")
      .eq("post_id", post_id)
      .eq("applicant_user_id", user.id)
      .eq("application_type", application_type)
      .maybeSingle();

    if (existing) {
      const label =
        application_type === "INQUIRY"
          ? "聞いてみる"
          : post.post_type === "OFFICIAL"
            ? "応募"
            : "参加希望";
      return NextResponse.json(
        { error: `すでに「${label}」済みです` },
        { status: 409 },
      );
    }

    // 応募ステータス決定
    const applicationStatus =
      application_type === "APPLY" ? "APPLIED" : "INQUIRY";

    // applications テーブルに挿入
    const appliedAt = new Date().toISOString();

    const { data: application, error: insertError } = await supabase
      .from("applications")
      .insert({
        post_id,
        applicant_user_id: user.id,
        message: message ?? null,
        application_type,
        application_status: applicationStatus,
        applicant_email_snapshot: applicantEmail,
        applicant_name_snapshot: applicantName,
        applicant_company_snapshot: applicantCompany,
        post_title_snapshot: post.title,
        applied_at: appliedAt,
      })
      .select()
      .single();

    if (insertError) {
      console.error("[API] Insert error:", insertError);
      return NextResponse.json(
        { error: "応募の送信に失敗しました" },
        { status: 500 },
      );
    }

    // 環境変数の設定有無を確認（値は出さない）
    console.log("[MAIL] env check", {
      MAIL_PROVIDER: process.env.MAIL_PROVIDER ?? "(unset → console)",
      hasResendApiKey: !!process.env.RESEND_API_KEY,
      hasMailFromAddress: !!process.env.MAIL_FROM_ADDRESS,
      hasAdminNotificationEmail: !!process.env.ADMIN_NOTIFICATION_EMAIL,
    });

    // 通知先: 投稿者のメール → フォールバックで管理者メール
    const creatorEmail = (post as { creator?: { email?: string } }).creator
      ?.email;
    if (!creatorEmail) {
      console.warn(
        "[MAIL] creator email is null/undefined — falling back to ADMIN_NOTIFICATION_EMAIL",
        {
          post_id,
          created_by_user_id: post.created_by_user_id,
        },
      );
    }
    const notificationEmail =
      creatorEmail ??
      process.env.ADMIN_NOTIFICATION_EMAIL ??
      "admin@example.com";

    const postType = (post.post_type as PostType) ?? "OFFICIAL";

    const emailData = {
      applicantName,
      applicantEmail,
      applicantCompany,
      postTitle: post.title as string,
      postType,
      applicationType: application_type,
      message: message ?? null,
      appliedAt,
    };

    // 送信直前のペイロードログ
    console.log("[MAIL] application mail payload", {
      postId: post_id,
      postTitle: post.title,
      creatorEmail: creatorEmail ?? null,
      notificationEmail,
      applicantEmail,
      applicationType: application_type,
    });

    let mailResult;
    try {
      mailResult = await sendMail({
        to: notificationEmail,
        subject: buildApplicationEmailSubject(
          application_type,
          post.title as string,
          postType,
        ),
        html: buildApplicationEmailHtml(emailData),
        text: buildApplicationEmailText(emailData),
      });
      if (mailResult.success) {
        console.log("[MAIL] mail send success", {
          messageId: mailResult.messageId,
        });
      } else {
        console.error("[MAIL] mail send failed (result)", {
          error: mailResult.error,
        });
      }
    } catch (mailErr) {
      console.error("[MAIL] mail send threw exception", mailErr);
    }

    return NextResponse.json({ data: application }, { status: 201 });
  } catch (err) {
    console.error("[API] Unexpected error:", err);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 },
    );
  }
}
