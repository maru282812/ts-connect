import Link from "next/link";
import { OfficialPostForm } from "@/components/admin/OfficialPostForm";
import { createClient } from "@/lib/supabase/server";
import type { Company } from "@/types/database";

export default async function NewOfficialPostPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: companies }, { data: profile }] = await Promise.all([
    supabase.from("companies").select("*").order("name"),
    user
      ? supabase
          .from("company_members")
          .select("company_id")
          .eq("user_id", user.id)
          .limit(1)
          .single()
      : Promise.resolve({ data: null, error: null }),
  ]);

  const defaultCompanyId = profile?.company_id ?? undefined;

  return (
    <div>
      {/* 公式案件モードのヘッダー帯 */}
      <div className="bg-blue-900 -mx-6 -mt-6 px-8 pt-6 pb-5 mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Link
            href="/company/posts"
            className="text-blue-300 hover:text-white text-sm transition-colors"
          >
            ← 案件管理
          </Link>
          <span className="text-blue-700">/</span>
          <span className="text-blue-200 text-sm">公式案件を投稿</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            公
          </span>
          <div>
            <h1 className="text-xl font-bold text-white">公式案件を投稿</h1>
            <p className="text-sm text-blue-300 mt-0.5">
              admin専用 · 業務案件として公開されます
            </p>
          </div>
        </div>
      </div>

      {/* フォームエリア — サイドバー分を除いた中央領域で適切な幅を確保 */}
      <div className="max-w-2xl">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          <OfficialPostForm
            companies={(companies as Company[]) ?? []}
            defaultCompanyId={defaultCompanyId}
          />
        </div>
      </div>
    </div>
  );
}
