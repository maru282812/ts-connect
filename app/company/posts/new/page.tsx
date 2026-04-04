import { redirect } from "next/navigation";

/** 旧 /company/posts/new → 案件管理にリダイレクト（ドロップダウンで種別選択） */
export default function NewPostRedirectPage() {
  redirect("/company/posts");
}
