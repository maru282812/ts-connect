import { ArchiveClient } from "@/components/admin/ArchiveClient";
import { getAdminContext } from "@/lib/auth/helpers";
import { createClient } from "@/lib/supabase/server";
import type { PostWithRelations } from "@/types/database";

export default async function ArchivePage() {
  const supabase = await createClient();
  const { userId, isMasterAdmin } = await getAdminContext();

  const { data: posts } = await supabase
    .from("posts")
    .select(
      "*, companies(id, name), users:created_by_user_id(id, display_name, email)",
    )
    .eq("post_status", "CLOSED")
    .order("closed_at", { ascending: false });

  const archivedPosts = (posts as PostWithRelations[]) ?? [];

  return (
    <ArchiveClient
      posts={archivedPosts}
      currentUserId={userId}
      isMasterAdmin={isMasterAdmin}
    />
  );
}
