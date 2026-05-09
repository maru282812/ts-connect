import { NextResponse } from "next/server";
import { sendMail } from "@/lib/mail";
import {
  buildApplicationEmailHtml,
  buildApplicationEmailSubject,
  buildApplicationEmailText,
} from "@/lib/mail/templates/application";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { ApplicationType, PostType } from "@/types/database";

type ApplicationRequestBody = {
  post_id?: string;
  message?: string;
  application_type?: ApplicationType;
};

type PostForNotification = {
  id: string;
  title: string;
  post_type: PostType;
  post_status: string;
  created_by_user_id: string;
  company_id: string;
  creator?: {
    id: string;
    email: string | null;
    display_name: string | null;
  } | null;
};

function isApplicationType(value: unknown): value is ApplicationType {
  return value === "APPLY" || value === "INQUIRY";
}

function normalizeCreator(
  creator: PostForNotification["creator"] | PostForNotification["creator"][],
): PostForNotification["creator"] {
  return Array.isArray(creator) ? creator[0] : creator;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "ログインが必要です。" },
        { status: 401 },
      );
    }

    const body = (await request.json()) as ApplicationRequestBody;
    const { post_id, message, application_type } = body;

    if (!post_id || !isApplicationType(application_type)) {
      return NextResponse.json(
        { error: "応募に必要なパラメータが不足しています。" },
        { status: 400 },
      );
    }

    const admin = createAdminClient();
    const { data: postData, error: postError } = await admin
      .from("posts")
      .select(
        "id, title, post_type, post_status, created_by_user_id, company_id, creator:created_by_user_id(id, email, display_name)",
      )
      .eq("id", post_id)
      .in("post_status", ["OPEN", "IN_PROGRESS"])
      .single();

    if (postError || !postData) {
      return NextResponse.json(
        { error: "案件が見つからないか、応募できない状態です。" },
        { status: 404 },
      );
    }

    const post = postData as unknown as PostForNotification;

    const { data: userProfile } = await supabase
      .from("users")
      .select("display_name, email")
      .eq("id", user.id)
      .maybeSingle();

    const { data: memberData } = await supabase
      .from("company_members")
      .select("companies(name)")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    const applicantName = userProfile?.display_name ?? user.email ?? "未登録";
    const applicantEmail = userProfile?.email ?? user.email ?? "";
    const applicantCompany =
      (memberData?.companies as unknown as { name: string } | null)?.name ??
      null;

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
          ? "問い合わせ"
          : post.post_type === "OFFICIAL"
            ? "応募"
            : "参加希望";

      return NextResponse.json(
        { error: `すでに${label}済みです。` },
        { status: 409 },
      );
    }

    const appliedAt = new Date().toISOString();
    const applicationStatus =
      application_type === "APPLY" ? "APPLIED" : "INQUIRY";

    const { data: application, error: insertError } = await supabase
      .from("applications")
      .insert({
        post_id,
        applicant_user_id: user.id,
        message: message?.trim() || null,
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
      console.error("[API] Failed to create application:", insertError);
      return NextResponse.json(
        { error: "応募の送信に失敗しました。" },
        { status: 500 },
      );
    }

    // 通知先メール優先順位:
    // 1. companies.notification_email
    // 2. 投稿者のメールアドレス
    // 3. ログインユーザーのメールアドレス
    const { data: companyData } = await admin
      .from("companies")
      .select("notification_email")
      .eq("id", post.company_id)
      .single();

    const creator = normalizeCreator(
      post.creator as
        | PostForNotification["creator"]
        | PostForNotification["creator"][],
    );
    const notificationEmail =
      companyData?.notification_email ||
      creator?.email ||
      applicantEmail ||
      null;

    if (!notificationEmail) {
      console.warn("[MAIL] No notification email found.", {
        postId: post.id,
        companyId: post.company_id,
        createdByUserId: post.created_by_user_id,
      });
    } else {
      const emailData = {
        applicantName,
        applicantEmail,
        applicantCompany,
        postTitle: post.title,
        postType: post.post_type,
        applicationType: application_type,
        message: message?.trim() || null,
        appliedAt,
      };

      const mailResult = await sendMail({
        to: notificationEmail,
        subject: buildApplicationEmailSubject(post.title),
        html: buildApplicationEmailHtml(emailData),
        text: buildApplicationEmailText(emailData),
      });

      if (!mailResult.success) {
        console.error("[MAIL] Failed to send application notification.", {
          postId: post.id,
          applicationId: application.id,
          error: mailResult.error,
        });
      }
    }

    return NextResponse.json({ data: application }, { status: 201 });
  } catch (err) {
    console.error("[API] Unexpected application error:", err);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました。" },
      { status: 500 },
    );
  }
}
