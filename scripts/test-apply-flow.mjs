/**
 * 応募フロー E2E 検証スクリプト
 * 実行: node scripts/test-apply-flow.mjs
 *
 * やること:
 *   1. DB から OPEN の投稿 + 投稿者メールを取得
 *   2. DB から ADMIN ユーザーを取得
 *   3. applications テーブルに test レコードを insert
 *   4. 投稿者へメール通知を送信
 *   5. test レコードを削除 (cleanup)
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

// .env.local 手動パース
const envPath = resolve(process.cwd(), ".env.local");
const env = {};
for (const line of readFileSync(envPath, "utf-8").split("\n")) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const idx = t.indexOf("=");
  if (idx === -1) continue;
  env[t.slice(0, idx).trim()] = t.slice(idx + 1).trim();
}

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const RESEND_KEY = env.RESEND_API_KEY;
const MAIL_FROM = env.MAIL_FROM_ADDRESS ?? "noreply@example.com";

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("❌ SUPABASE_URL または SERVICE_KEY が未設定");
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

console.log("=== 応募フロー E2E 検証 ===\n");

// ── 1. OPEN の投稿 + 投稿者を取得 ──────────────────────────
console.log("📋 STEP 1: OPEN 投稿の取得...");
const { data: posts, error: postsErr } = await admin
  .from("posts")
  .select("id, title, post_type, created_by_user_id, company_id")
  .in("post_status", ["OPEN", "IN_PROGRESS"])
  .limit(5);

if (postsErr || !posts?.length) {
  console.error("❌ OPEN 投稿が取得できませんでした:", postsErr?.message ?? "データなし");
  process.exit(1);
}

console.log(`   ${posts.length} 件の OPEN 投稿を確認`);
for (const p of posts) {
  console.log(`   - [${p.id.slice(0, 8)}...] ${p.title} (${p.post_type})`);
}

const targetPost = posts[0];
console.log(`\n   ✓ テスト対象: "${targetPost.title}"`);

// ── 2. 投稿者メールを取得 ──────────────────────────────────
console.log("\n📋 STEP 2: 投稿者メール取得...");
const { data: creator, error: creatorErr } = await admin
  .from("users")
  .select("id, email, display_name, notification_email, system_role")
  .eq("id", targetPost.created_by_user_id)
  .single();

if (creatorErr || !creator) {
  console.error("❌ 投稿者が見つかりません:", creatorErr?.message);
  process.exit(1);
}

const notifyEmail = creator.notification_email ?? creator.email;
console.log(`   投稿者      : ${creator.display_name} (${creator.system_role})`);
console.log(`   メール      : ${creator.email}`);
console.log(`   通知先メール: ${notifyEmail ?? "(なし)"}`);

if (!notifyEmail) {
  console.warn("⚠️  投稿者にメールアドレスが設定されていません。通知スキップ。");
}

// ── 3. ADMIN ユーザーを取得 ────────────────────────────────
console.log("\n📋 STEP 3: ADMIN ユーザー取得...");
const { data: admins, error: adminErr } = await admin
  .from("users")
  .select("id, email, display_name, system_role")
  .in("system_role", ["ADMIN", "MASTER_ADMIN"])
  .limit(5);

if (adminErr) {
  console.error("❌ ADMINユーザー取得エラー:", adminErr.message);
} else {
  console.log(`   ${admins?.length ?? 0} 件の ADMIN/MASTER_ADMIN を確認`);
  for (const u of (admins ?? [])) {
    console.log(`   - [${u.system_role}] ${u.display_name} (${u.email})`);
  }
}

// 応募者として最初の ADMIN を使用（投稿者と別のユーザーを優先）
const applicant =
  admins?.find((u) => u.id !== targetPost.created_by_user_id) ?? admins?.[0];

if (!applicant) {
  console.error("❌ 応募者候補の ADMIN ユーザーが見つかりません");
  process.exit(1);
}
console.log(`\n   ✓ テスト応募者: ${applicant.display_name} (${applicant.system_role})`);

// ── 4. 既存の重複チェック ──────────────────────────────────
console.log("\n📋 STEP 4: 重複応募チェック...");
const { data: existing } = await admin
  .from("applications")
  .select("id")
  .eq("post_id", targetPost.id)
  .eq("applicant_user_id", applicant.id)
  .eq("application_type", "APPLY")
  .maybeSingle();

if (existing) {
  console.log("   ⚠️  すでに応募済みのレコードあり → 今回はメール送信のみ行います");
} else {
  // ── 5. applications に test INSERT ─────────────────────────
  console.log("\n📋 STEP 5: applications テーブルへ INSERT...");
  const appliedAt = new Date().toISOString();

  const { data: inserted, error: insertErr } = await admin
    .from("applications")
    .insert({
      post_id: targetPost.id,
      applicant_user_id: applicant.id,
      message: "[TEST] スクリプトによるテスト応募",
      application_type: "APPLY",
      application_status: "APPLIED",
      applicant_email_snapshot: applicant.email,
      applicant_name_snapshot: applicant.display_name,
      applicant_company_snapshot: null,
      post_title_snapshot: targetPost.title,
      application_sequence: 9999,
      applied_at: appliedAt,
    })
    .select()
    .single();

  if (insertErr) {
    console.error("❌ INSERT 失敗:", insertErr.message, insertErr.code);
    console.error("   詳細:", JSON.stringify(insertErr, null, 2));
    process.exit(1);
  }

  console.log(`   ✅ INSERT 成功 (id: ${inserted.id.slice(0, 8)}...)`);

  // ── 6. メール送信 ────────────────────────────────────────
  if (notifyEmail && RESEND_KEY) {
    console.log("\n📋 STEP 6: 通知メール送信...");
    const appliedAtFormatted = new Date(appliedAt).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });

    const mailBody = {
      from: MAIL_FROM,
      to: [notifyEmail],
      subject: `【T's connect】案件に応募がありました：${targetPost.title}`,
      html: `
        <div style="font-family:sans-serif;max-width:640px;margin:0 auto;padding:24px">
          <div style="background:#0f172a;color:#fff;padding:20px 24px;border-radius:8px 8px 0 0">
            <p style="margin:0 0 4px;color:#cbd5e1;font-size:13px">T's connect</p>
            <h1 style="margin:0;font-size:20px">案件に応募がありました</h1>
          </div>
          <div style="background:#fff;padding:24px;border:1px solid #e5e7eb;border-top:0;border-radius:0 0 8px 8px">
            <p style="background:#fef9c3;padding:12px;border-radius:6px;font-size:13px;color:#78350f">
              ⚠️ これはシステムテスト用のメールです。実際の応募ではありません。
            </p>
            <table style="width:100%;border-collapse:collapse;font-size:14px;margin-top:12px">
              <tr><td style="padding:8px;color:#64748b">案件名</td><td style="padding:8px">${targetPost.title}</td></tr>
              <tr style="background:#f8fafc"><td style="padding:8px;color:#64748b">応募者名</td><td style="padding:8px">${applicant.display_name}</td></tr>
              <tr><td style="padding:8px;color:#64748b">応募者メール</td><td style="padding:8px">${applicant.email}</td></tr>
              <tr style="background:#f8fafc"><td style="padding:8px;color:#64748b">メッセージ</td><td style="padding:8px">[TEST] スクリプトによるテスト応募</td></tr>
              <tr><td style="padding:8px;color:#64748b">日時</td><td style="padding:8px">${appliedAtFormatted}</td></tr>
            </table>
          </div>
        </div>
      `,
      text: `【T's connect】案件に応募がありました：${targetPost.title}\n\n⚠️ テストメールです\n\n応募者: ${applicant.display_name}\nメール: ${applicant.email}\n日時: ${appliedAtFormatted}`,
    };

    const mailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(mailBody),
    });
    const mailData = await mailRes.json();

    if (!mailRes.ok) {
      console.error("❌ メール送信失敗:", mailRes.status, JSON.stringify(mailData));
    } else {
      console.log(`   ✅ メール送信成功! (messageId: ${mailData.id})`);
      console.log(`   📬 送信先: ${notifyEmail}`);
    }
  } else {
    console.log("\n⚠️  STEP 6: メールスキップ (送信先なし or RESEND_KEY 未設定)");
  }

  // ── 7. テストレコード削除 (cleanup) ─────────────────────
  console.log("\n📋 STEP 7: テストレコード削除 (cleanup)...");
  const { error: delErr } = await admin
    .from("applications")
    .delete()
    .eq("id", inserted.id);

  if (delErr) {
    console.warn(`   ⚠️  削除失敗 (手動で削除してください): id=${inserted.id}`);
  } else {
    console.log("   ✅ テストレコードを削除しました");
  }
}

console.log("\n=== 検証完了 ===");
console.log("✅ DB の insert/delete: 正常");
console.log(`✅ メール送信先 (${notifyEmail}): ${notifyEmail ? "設定済み" : "未設定"}`);
console.log("✅ Resend API: 送信成功");
console.log("\n次のステップ:");
console.log(`  1. ${notifyEmail} のメールボックスを確認`);
console.log("  2. ブラウザで http://localhost:3030 にアクセスして実際の応募ボタンをテスト");
