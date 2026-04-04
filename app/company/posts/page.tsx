import {
  type PostRow,
  PostsManagementClient,
} from "@/components/admin/PostsManagementClient";
import { createClient } from "@/lib/supabase/server";

export default async function AdminPostsPage() {
  const supabase = await createClient();

  // thumbnail_url / requirements はDBマイグレーション未適用の環境でも動くよう select から除外
  const { data: posts, error } = await supabase
    .from("posts")
    .select("id, title, post_type, post_status, updated_at")
    .order("updated_at", { ascending: false });

  if (error) {
    return (
      <div className="text-sm text-danger p-4">
        案件の取得に失敗しました: {error.message}
      </div>
    );
  }

  // 応募数を別途取得
  const { data: counts } = await supabase
    .from("applications")
    .select("post_id");

  const countMap: Record<string, number> = {};
  for (const row of counts ?? []) {
    countMap[row.post_id] = (countMap[row.post_id] ?? 0) + 1;
  }

  const postRows: PostRow[] = (posts ?? []).map((p) => ({
    id: p.id,
    title: p.title,
    post_type: p.post_type,
    post_status: p.post_status,
    thumbnail_url: null, // DBマイグレーション適用後に (p as any).thumbnail_url ?? null へ変更
    application_count: countMap[p.id] ?? 0,
    updated_at: p.updated_at,
  }));

  return <PostsManagementClient posts={postRows} />;
}
