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

/** アクション種別を日本語ラベルに変換 */
function resolveActionLabel(
  applicationType: ApplicationType,
  postType: PostType,
): string {
  if (applicationType === "INQUIRY") return "聞いてみる";
  return postType === "OFFICIAL" ? "応募" : "参加希望";
}

/** 案件種別を日本語ラベルに変換 */
function resolvePostTypeLabel(postType: PostType): string {
  return postType === "OFFICIAL" ? "公式案件" : "気軽に投稿";
}

export function buildApplicationEmailSubject(
  applicationType: ApplicationType,
  postTitle: string,
  postType: PostType = "OFFICIAL",
): string {
  const actionLabel = resolveActionLabel(applicationType, postType);
  return `【${actionLabel}通知】${postTitle}`;
}

export function buildApplicationEmailHtml(data: ApplicationEmailData): string {
  const actionLabel = resolveActionLabel(data.applicationType, data.postType);
  const postTypeLabel = resolvePostTypeLabel(data.postType);
  const companyText = data.applicantCompany ?? "未記入";
  const messageText = data.message ?? "（メッセージなし）";
  const appliedAtFormatted = new Date(data.appliedAt).toLocaleString("ja-JP", {
    timeZone: "Asia/Tokyo",
  });

  const badgeClass =
    data.applicationType === "INQUIRY"
      ? "badge-inquiry"
      : data.postType === "OFFICIAL"
        ? "badge-apply"
        : "badge-participate";

  return `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>${actionLabel}通知</title>
  <style>
    body { font-family: sans-serif; color: #333; line-height: 1.6; }
    .container { max-width: 600px; margin: 0 auto; padding: 24px; }
    .header { background: #1e3a5f; color: white; padding: 16px 24px; border-radius: 8px 8px 0 0; }
    .content { background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-radius: 0 0 8px 8px; }
    .field { margin-bottom: 16px; }
    .label { font-weight: bold; color: #475569; font-size: 12px; text-transform: uppercase; }
    .value { color: #1e293b; font-size: 15px; margin-top: 4px; }
    .message-box { background: white; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; white-space: pre-wrap; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: bold; }
    .badge-apply { background: #dbeafe; color: #1d4ed8; }
    .badge-participate { background: #dcfce7; color: #15803d; }
    .badge-inquiry { background: #fef9c3; color: #a16207; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 style="margin:0;">新しい${actionLabel}が届きました</h2>
    </div>
    <div class="content">
      <div class="field">
        <div class="label">アクション種別</div>
        <div class="value">
          <span class="badge ${badgeClass}">${actionLabel}</span>
        </div>
      </div>
      <div class="field">
        <div class="label">案件タイトル</div>
        <div class="value">${escapeHtml(data.postTitle)}</div>
      </div>
      <div class="field">
        <div class="label">案件種別</div>
        <div class="value">${escapeHtml(postTypeLabel)}</div>
      </div>
      <div class="field">
        <div class="label">送信者名</div>
        <div class="value">${escapeHtml(data.applicantName)}</div>
      </div>
      <div class="field">
        <div class="label">メールアドレス</div>
        <div class="value"><a href="mailto:${escapeHtml(data.applicantEmail)}">${escapeHtml(data.applicantEmail)}</a></div>
      </div>
      <div class="field">
        <div class="label">所属会社</div>
        <div class="value">${escapeHtml(companyText)}</div>
      </div>
      <div class="field">
        <div class="label">メッセージ</div>
        <div class="value">
          <div class="message-box">${escapeHtml(messageText)}</div>
        </div>
      </div>
      <div class="field">
        <div class="label">送信日時</div>
        <div class="value">${appliedAtFormatted}</div>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export function buildApplicationEmailText(data: ApplicationEmailData): string {
  const actionLabel = resolveActionLabel(data.applicationType, data.postType);
  const postTypeLabel = resolvePostTypeLabel(data.postType);
  const companyText = data.applicantCompany ?? "未記入";
  const messageText = data.message ?? "（メッセージなし）";
  const appliedAtFormatted = new Date(data.appliedAt).toLocaleString("ja-JP", {
    timeZone: "Asia/Tokyo",
  });

  return [
    `【${actionLabel}通知】`,
    "",
    `案件: ${data.postTitle}`,
    `案件種別: ${postTypeLabel}`,
    `アクション: ${actionLabel}`,
    `送信者名: ${data.applicantName}`,
    `メールアドレス: ${data.applicantEmail}`,
    `所属会社: ${companyText}`,
    "",
    "--- メッセージ ---",
    messageText,
    "---",
    "",
    `送信日時: ${appliedAtFormatted}`,
  ].join("\n");
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
