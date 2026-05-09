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

async function sendWithConsole(payload: MailPayload): Promise<MailResult> {
  console.log("=== [MAIL DEBUG] ===");
  console.log("To:", payload.to);
  console.log("Subject:", payload.subject);
  console.log("Body (text):", payload.text ?? "(html only)");
  console.log("====================");

  return { success: true, messageId: `console-${Date.now()}` };
}

async function sendWithResend(payload: MailPayload): Promise<MailResult> {
  if (!process.env.RESEND_API_KEY) {
    return {
      success: false,
      error: "RESEND_API_KEY is not set.",
    };
  }

  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);

  const from = process.env.MAIL_FROM_ADDRESS ?? "noreply@example.com";
  const to = Array.isArray(payload.to) ? payload.to : [payload.to];

  const { data, error } = await resend.emails.send({
    from,
    to,
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
  });

  if (error) {
    console.error("[MAIL] Resend error:", error);
    return { success: false, error: error.message };
  }

  return { success: true, messageId: data?.id };
}

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
    console.error("[MAIL] Failed to send mail:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown mail error",
    };
  }
}
