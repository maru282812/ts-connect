/**
 * Resend メール送信テストスクリプト
 * 実行: node scripts/test-mail.mjs
 */

import { readFileSync } from "fs";
import { resolve } from "path";

// .env.local を手動パース
const envPath = resolve(process.cwd(), ".env.local");
const envVars = {};
try {
  const lines = readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    envVars[key] = value;
  }
} catch (e) {
  console.error("❌ .env.local を読み込めませんでした:", e.message);
  process.exit(1);
}

const RESEND_API_KEY = envVars.RESEND_API_KEY;
const MAIL_FROM = envVars.MAIL_FROM_ADDRESS ?? "onboarding@resend.dev";
const MAIL_PROVIDER = envVars.MAIL_PROVIDER ?? "console";

console.log("=== Resend メール送信テスト ===");
console.log("MAIL_PROVIDER :", MAIL_PROVIDER);
console.log("MAIL_FROM     :", MAIL_FROM);
console.log("RESEND_API_KEY:", RESEND_API_KEY ? `${RESEND_API_KEY.slice(0, 8)}...` : "(未設定)");
console.log("");

if (MAIL_PROVIDER !== "resend") {
  console.error(`❌ MAIL_PROVIDER="${MAIL_PROVIDER}" です。"resend" に変更してください。`);
  process.exit(1);
}

if (!RESEND_API_KEY) {
  console.error("❌ RESEND_API_KEY が設定されていません。");
  process.exit(1);
}

// 送信先: コマンドライン引数 または デフォルト
const TO = process.argv[2] ?? "yotto.llc112@gmail.com";
console.log("送信先         :", TO);
console.log("");

// Resend REST API 直接呼び出し
const payload = {
  from: MAIL_FROM,
  to: [TO],
  subject: "【T's connect】メール送信テスト",
  html: `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
      <h2 style="color:#0f172a">✅ メール送信テスト成功</h2>
      <p>このメールは T's connect からのテスト送信です。</p>
      <table style="border-collapse:collapse;width:100%;font-size:14px;margin-top:16px">
        <tr>
          <td style="padding:8px;color:#64748b;white-space:nowrap">送信元</td>
          <td style="padding:8px">${MAIL_FROM}</td>
        </tr>
        <tr style="background:#f8fafc">
          <td style="padding:8px;color:#64748b;white-space:nowrap">送信先</td>
          <td style="padding:8px">${TO}</td>
        </tr>
        <tr>
          <td style="padding:8px;color:#64748b;white-space:nowrap">日時</td>
          <td style="padding:8px">${new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}</td>
        </tr>
      </table>
      <p style="margin-top:24px;color:#64748b;font-size:12px">
        このメールが届いていれば Resend の設定は正常です。
      </p>
    </div>
  `,
  text: `【T's connect】メール送信テスト\n\n送信元: ${MAIL_FROM}\n送信先: ${TO}\n日時: ${new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}\n\nこのメールが届いていれば Resend の設定は正常です。`,
};

console.log("📤 送信中...");
try {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!res.ok) {
    console.error("❌ Resend API エラー:", res.status, JSON.stringify(data, null, 2));
    if (res.status === 403 && data?.message?.includes("domain")) {
      console.error("");
      console.error("👉 ドメイン未検証の可能性があります。");
      console.error("   Resend ダッシュボード → Domains → ts-career.com を確認してください。");
      console.error("   検証が完了するまでは noreply@resend.dev や onboarding@resend.dev を使用できます。");
    }
    if (res.status === 401) {
      console.error("👉 RESEND_API_KEY が無効です。Resend ダッシュボードで API キーを確認してください。");
    }
    process.exit(1);
  }

  console.log("✅ 送信成功!");
  console.log("   Message ID:", data.id);
  console.log("");
  console.log(`📬 ${TO} のメールボックスを確認してください。`);
} catch (err) {
  console.error("❌ ネットワークエラー:", err.message);
  process.exit(1);
}
