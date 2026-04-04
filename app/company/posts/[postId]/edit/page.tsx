import Link from "next/link";
import { notFound } from "next/navigation";
import { OfficialPostForm } from "@/components/admin/OfficialPostForm";
import { NewCasualPostForm } from "@/components/features/NewCasualPostForm";
import { createClient } from "@/lib/supabase/server";
import type { Company, Post } from "@/types/database";

interface EditPostPageProps {
  params: Promise<{ postId: string }>;
}

export default async function EditPostPage({ params }: EditPostPageProps) {
  const { postId } = await params;
  const supabase = await createClient();

  const [{ data: post }, { data: companies }] = await Promise.all([
    supabase.from("posts").select("*").eq("id", postId).single(),
    supabase.from("companies").select("*").order("name"),
  ]);

  if (!post) {
    notFound();
  }

  const p = post as Post;

  // 気軽投稿: NewCasualPostForm が独自レイアウトを持つため直接返す
  if (p.post_type === "CASUAL") {
    return (
      <NewCasualPostForm
        mode="admin"
        intent="edit"
        cancelPath="/company/casual-posts"
        defaultValues={{
          id: p.id,
          title: p.title,
          body: p.body,
          thumbnailUrl: p.thumbnail_url ?? undefined,
          postStatus: p.post_status,
          companyId: p.company_id,
        }}
      />
    );
  }

  return (
    <div>
      {/* 公式案件編集: ネイビーヘッダー帯 */}
      <div className="bg-blue-900 -mx-6 -mt-6 px-6 pt-6 pb-5 mb-6">
        <div className="flex items-center gap-3 mb-1">
          <Link
            href="/company/posts"
            className="text-blue-300 hover:text-white text-sm transition-colors"
          >
            ← 案件管理
          </Link>
          <span className="text-blue-700">/</span>
          <span className="text-blue-200 text-sm">公式案件を編集</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center text-white text-sm font-bold">
            公
          </span>
          <div>
            <h1 className="text-xl font-bold text-white">公式案件を編集</h1>
            <p className="text-sm text-blue-300 mt-0.5 line-clamp-1">
              {p.title}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <OfficialPostForm
            post={p}
            companies={(companies as Company[]) ?? []}
          />
        </div>
      </div>
    </div>
  );
}
