import {
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/react";
import Link from "next/link";
import { PageHeader } from "@/components/common/PageHeader";
import { getAdminContext } from "@/lib/auth/helpers";
import { createClient } from "@/lib/supabase/server";
import type { PostType, PostWithRelations } from "@/types/database";

const typeLabelMap: Record<PostType, string> = {
  OFFICIAL: "公式案件",
  CASUAL: "気軽に投稿",
};

export default async function ArchivedPostsPage() {
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
    <div>
      <PageHeader title="過去案件" description="終了した案件の一覧" />

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <Table aria-label="過去案件一覧" removeWrapper>
          <TableHeader>
            <TableColumn>タイトル</TableColumn>
            <TableColumn>投稿種別</TableColumn>
            <TableColumn>会社</TableColumn>
            <TableColumn>終了日</TableColumn>
            <TableColumn>操作</TableColumn>
          </TableHeader>
          <TableBody emptyContent="過去案件がありません">
            {archivedPosts.map((post) => {
              const canEdit =
                isMasterAdmin || post.created_by_user_id === userId;
              return (
                <TableRow key={post.id}>
                  <TableCell>
                    <span className="font-medium text-default-800 line-clamp-1 max-w-xs">
                      {post.title}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Chip
                      color={
                        post.post_type === "OFFICIAL" ? "primary" : "secondary"
                      }
                      size="sm"
                      variant="flat"
                    >
                      {typeLabelMap[post.post_type]}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-default-600">
                      {post.companies?.name ?? "未設定"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-default-500">
                      {post.closed_at
                        ? new Date(post.closed_at).toLocaleDateString("ja-JP")
                        : "—"}
                    </span>
                  </TableCell>
                  <TableCell>
                    {canEdit ? (
                      <Button
                        as={Link}
                        href={`/company/posts/${post.id}/edit`}
                        size="sm"
                        variant="flat"
                      >
                        編集
                      </Button>
                    ) : (
                      <span className="text-xs text-default-300">閲覧のみ</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
