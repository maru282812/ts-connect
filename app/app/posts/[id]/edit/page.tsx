"use client";

import { Button } from "@heroui/react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { NewCasualPostForm } from "@/components/features/NewCasualPostForm";
import { createClient } from "@/lib/supabase/client";
import type { PostWithRelations } from "@/types/database";

export default function EditPostPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [post, setPost] = useState<PostWithRelations | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPost = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("ログインが必要です");
        setIsLoading(false);
        return;
      }

      const { data } = await supabase
        .from("posts")
        .select(
          "*, companies(id, name), users:created_by_user_id(id, display_name, email)",
        )
        .eq("id", id)
        .eq("created_by_user_id", user.id)
        .single();

      if (!data) {
        setError("投稿が見つかりません、または編集権限がありません");
        setIsLoading(false);
        return;
      }

      setPost(data as PostWithRelations);
      setIsLoading(false);
    };
    fetchPost();
  }, [id]);

  if (isLoading) {
    return <div className="bg-white rounded-xl h-96 animate-pulse" />;
  }

  if (error || !post) {
    return (
      <div className="text-center py-16">
        <p className="text-default-500">
          {error ?? "投稿が見つかりませんでした"}
        </p>
        <Button variant="flat" onPress={() => router.push("/app/my-posts")} className="mt-4">
          投稿一覧に戻る
        </Button>
      </div>
    );
  }

  return (
    <NewCasualPostForm
      mode="user"
      intent="edit"
      defaultValues={{
        id: post.id,
        title: post.title ?? undefined,
        body: post.body ?? undefined,
        thumbnailUrl: post.thumbnail_url ?? undefined,
        postStatus: post.post_status,
        companyId: post.company_id ?? undefined,
        deadline: post.deadline_at ? post.deadline_at.slice(0, 10) : undefined,
      }}
      cancelPath="/app/my-posts"
      getRedirectPath={() => "/app/my-posts?success=updated"}
    />
  );
}
