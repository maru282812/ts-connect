import { HomeClient } from "@/components/screens/HomeClient";

// 従業員向けのホーム（下タブ「ホーム」の着地点）。
// 認証チェックは app/app/layout.tsx で実施済み。
export default function AppHomePage() {
  return <HomeClient />;
}
