import { notFound, redirect } from "next/navigation";
import { OfficialPostForm } from "@/components/admin/OfficialPostForm";
import { NewCasualPostForm } from "@/components/features/NewCasualPostForm";
import { getAdminContext } from "@/lib/auth/helpers";
import { createClient } from "@/lib/supabase/server";
import type { Company, Post } from "@/types/database";

interface EditPostPageProps {
  params: Promise<{ postId: string }>;
}

export default async function EditPostPage({ params }: EditPostPageProps) {
  const { postId } = await params;
  const supabase = await createClient();
  const { userId, isMasterAdmin, companyIds } = await getAdminContext();

  const companiesPromise = isMasterAdmin
    ? supabase.from("companies").select("*").order("name")
    : companyIds.length > 0
      ? supabase
          .from("companies")
          .select("*")
          .in("id", companyIds)
          .order("name")
      : Promise.resolve({ data: [] });

  const [{ data: post }, { data: companies }] = await Promise.all([
    // RLS により ADMIN は所属会社の投稿のみ取得できる（他社→null→notFound）
    supabase.from("posts").select("*").eq("id", postId).single(),
    companiesPromise,
  ]);

  if (!post) {
    notFound();
  }

  const p = post as Post;

  // ADMIN は自分が投稿したもののみ編集可能
  if (!isMasterAdmin && p.created_by_user_id !== userId) {
    redirect("/company/posts");
  }

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
    <OfficialPostForm
      post={p}
      companies={(companies as Company[]) ?? []}
    />
  );
}
