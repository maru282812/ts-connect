import { APP_NAME } from "@/constants/appConstants";
import type { ApplicationType, PostType } from "@/types/database";

export interface ApplicationEmailData {
  applicantName: string;
  applicantEmail: string;
  applicantCompany: string | null;
  postTitle: string;
  postType: PostType;
  applicationType: ApplicationType;
  message: string | null;
  appliedAt: string;
}

function resolveActionLabel(
  applicationType: ApplicationType,
  postType: PostType,
): string {
  if (applicationType === "INQUIRY") return "問い合わせ";
  return postType === "OFFICIAL" ? "応募" : "参加希望";
}

function resolvePostTypeLabel(postType: PostType): string {
  return postType === "OFFICIAL" ? "公式案件" : "気軽に投稿";
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("ja-JP", {
    timeZone: "Asia/Tokyo",
  });
}

export function buildApplicationEmailSubject(postTitle: string): string {
  return `【応募通知】${postTitle}`;
}

export function buildApplicationEmailHtml(data: ApplicationEmailData): string {
  const actionLabel = resolveActionLabel(data.applicationType, data.postType);
  const postTypeLabel = resolvePostTypeLabel(data.postType);
  const companyText = data.applicantCompany ?? "未登録";
  const messageText = data.message?.trim() || "メッセージなし";
  const appliedAtFormatted = formatDateTime(data.appliedAt);

  return `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>応募通知</title>
  <style>
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #1f2937; background: #f3f4f6; line-height: 1.7; }
    .container { max-width: 640px; margin: 0 auto; padding: 24px; }
    .header { background: #0f172a; color: #fff; padding: 20px 24px; border-radius: 8px 8px 0 0; }
    .header p { margin: 0 0 4px; color: #cbd5e1; font-size: 13px; }
    .header h1 { margin: 0; font-size: 20px; }
    .content { background: #fff; padding: 24px; border: 1px solid #e5e7eb; border-top: 0; border-radius: 0 0 8px 8px; }
    .field { margin-bottom: 16px; }
    .label { color: #64748b; font-size: 12px; font-weight: 700; letter-spacing: 0.04em; }
    .value { margin-top: 4px; font-size: 15px; }
    .message { margin-top: 6px; padding: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; white-space: pre-wrap; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <p>${escapeHtml(APP_NAME)}</p>
      <h1>案件に${escapeHtml(actionLabel)}がありました</h1>
    </div>
    <div class="content">
      ${field("案件名", data.postTitle)}
      ${field("案件種別", postTypeLabel)}
      ${field("種別", actionLabel)}
      ${field("応募者名", data.applicantName)}
      ${field(
        "応募者メールアドレス",
        `<a href="mailto:${escapeHtml(data.applicantEmail)}">${escapeHtml(
          data.applicantEmail,
        )}</a>`,
        false,
      )}
      ${field("応募者所属会社", companyText)}
      <div class="field">
        <div class="label">メッセージ</div>
        <div class="message">${escapeHtml(messageText)}</div>
      </div>
      ${field("応募日時", appliedAtFormatted)}
    </div>
  </div>
</body>
</html>
  `.trim();
}

export function buildApplicationEmailText(data: ApplicationEmailData): string {
  const actionLabel = resolveActionLabel(data.applicationType, data.postType);
  const postTypeLabel = resolvePostTypeLabel(data.postType);
  const companyText = data.applicantCompany ?? "未登録";
  const messageText = data.message?.trim() || "メッセージなし";
  const appliedAtFormatted = formatDateTime(data.appliedAt);

  return [
    `【応募通知】${data.postTitle}`,
    "",
    `案件名: ${data.postTitle}`,
    `案件種別: ${postTypeLabel}`,
    `種別: ${actionLabel}`,
    `応募者名: ${data.applicantName}`,
    `応募者メールアドレス: ${data.applicantEmail}`,
    `応募者所属会社: ${companyText}`,
    "",
    "メッセージ:",
    messageText,
    "",
    `応募日時: ${appliedAtFormatted}`,
  ].join("\n");
}

function field(label: string, value: string, shouldEscape = true): string {
  return `
      <div class="field">
        <div class="label">${escapeHtml(label)}</div>
        <div class="value">${shouldEscape ? escapeHtml(value) : value}</div>
      </div>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
