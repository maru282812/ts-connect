/**
 * service_role GRANT を Supabase に直接適用するスクリプト
 * 実行: node scripts/apply-service-role-grants.mjs
 *
 * Supabase Management API を使って 004_service_role_grants.sql を適用します。
 */

import { readFileSync } from "fs";
import { resolve } from "path";

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

// プロジェクト ref を URL から抽出（例: https://xxxx.supabase.co → xxxx）
const projectRef = SUPABASE_URL?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

const SQL = `
GRANT ALL ON public.users           TO service_role;
GRANT ALL ON public.companies       TO service_role;
GRANT ALL ON public.company_members TO service_role;
GRANT ALL ON public.posts           TO service_role;
GRANT ALL ON public.applications    TO service_role;
`.trim();

console.log("=== service_role GRANT 適用 ===");
console.log("Project ref:", projectRef);
console.log("SQL:\n", SQL);
console.log("");

if (!projectRef || !SERVICE_KEY) {
  console.error("❌ SUPABASE_URL または SERVICE_KEY が未設定");
  process.exit(1);
}

// Supabase REST API の /rest/v1/rpc は SQL を直接実行できないので
// Management API を使用する
const res = await fetch(
  `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: SQL }),
  },
);

const text = await res.text();
let data;
try { data = JSON.parse(text); } catch { data = text; }

if (!res.ok) {
  console.log("⚠️  Management API 経由では適用できませんでした (status:", res.status, ")");
  console.log("   → Supabase SQL Editor で以下の SQL を実行してください:\n");
  console.log("──────────────────────────────────────────────");
  console.log(SQL);
  console.log("──────────────────────────────────────────────");
  console.log("\nURL: https://supabase.com/dashboard/project/" + projectRef + "/sql");
} else {
  console.log("✅ GRANT 適用成功!");
  console.log(JSON.stringify(data, null, 2));
}
