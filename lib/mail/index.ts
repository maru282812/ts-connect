/**
 * メール送信の抽象化レイヤー
 * MAIL_PROVIDER 環境変数で送信サービスを切り替え可能
 * - console (デフォルト): ローカル開発用にコンソール出力
 * - resend: Resend サービスを使用
 */

export interface MailPayload {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

export interface MailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// ============================================================
// Provider: console (開発用)
// ============================================================
async function sendWithConsole(payload: MailPayload): Promise<MailResult> {
  console.log("=== [MAIL DEBUG] ===");
  console.log("To:", payload.to);
  console.log("Subject:", payload.subject);
  console.log("Body (text):", payload.text ?? "(html only)");
  console.log("===================");
  return { success: true, messageId: `console-${Date.now()}` };
}

// ============================================================
// Provider: Resend
// ============================================================
async function sendWithResend(payload: MailPayload): Promise<MailResult> {
  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);

  const from = process.env.MAIL_FROM_ADDRESS ?? "noreply@example.com";
  const toAddresses = Array.isArray(payload.to) ? payload.to : [payload.to];

  const { data, error } = await resend.emails.send({
    from,
    to: toAddresses,
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
  });

  if (error) {
    console.error("[MAIL ERROR] Resend error:", error);
    return { success: false, error: error.message };
  }

  return { success: true, messageId: data?.id };
}

// ============================================================
// メイン送信関数（プロバイダー自動選択）
// ============================================================
export async function sendMail(payload: MailPayload): Promise<MailResult> {
  const provider = process.env.MAIL_PROVIDER ?? "console";

  try {
    switch (provider) {
      case "resend":
        return await sendWithResend(payload);
      default:
        return await sendWithConsole(payload);
    }
  } catch (err) {
    console.error("[MAIL ERROR] Failed to send mail:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

// ============================================================
// 通知先アドレス解決
// 将来: company.notification_email → members → admin fallback
// ============================================================
export function resolveNotificationEmail(_companyId?: string): string {
  // Phase1: 固定の管理者通知先
  // Phase2: _companyId を使って会社ごとの通知先へ拡張
  return process.env.ADMIN_NOTIFICATION_EMAIL ?? "admin@example.com";
}
