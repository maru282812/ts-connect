import {
  type PostRow,
  PostsManagementClient,
} from "@/components/admin/PostsManagementClient";
import { getAdminContext } from "@/lib/auth/helpers";
import { createClient } from "@/lib/supabase/server";

export default async function AdminPostsPage() {
  const supabase = await createClient();
  const { userId, isMasterAdmin, companyId, companyIds } = await getAdminContext();

  // ADMIN が会社に所属していない場合は設定不備として早期リターン
  if (!isMasterAdmin && !companyId) {
    return (
      <div className="p-6 bg-warning-50 border border-warning-200 rounded-xl text-sm text-warning-800 max-w-lg">
        <p className="font-semibold mb-1">会社への所属が設定されていません</p>
        <p>
          このアカウントはまだどの会社にも所属していないため、投稿を表示できません。
          Supabase 管理画面から <code className="bg-warning-100 px-1 rounded">company_members</code> テーブルに
          このユーザーのレコードを追加してください（role: ADMIN / status: active）。
        </p>
      </div>
    );
  }

  // ADMIN=所属会社のみ / MASTER_ADMIN=全件
  // RLS の SELECT ポリシーは OPEN/IN_PROGRESS なら全社分を許可しているため、
  // ここで明示的に company_id を絞る。
  let postsQuery = supabase
    .from("posts")
    .select(
      "id, title, post_type, post_status, thumbnail_url, updated_at, created_by_user_id",
    )
    .order("updated_at", { ascending: false });

  if (!isMasterAdmin) {
    postsQuery = postsQuery.in("company_id", companyIds);
  }

  const { data: posts, error } = await postsQuery;

  if (error) {
    return (
      <div className="text-sm text-danger p-4">
        案件の取得に失敗しました: {error.message}
      </div>
    );
  }

  // 応募数を別途取得（RLS により ADMIN は所属会社案件の応募のみ取得される）
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
    thumbnail_url: p.thumbnail_url ?? null,
    application_count: countMap[p.id] ?? 0,
    updated_at: p.updated_at,
    created_by_user_id: p.created_by_user_id,
  }));

  return (
    <PostsManagementClient
      posts={postRows}
      currentUserId={userId}
      isMasterAdmin={isMasterAdmin}
    />
  );
}
