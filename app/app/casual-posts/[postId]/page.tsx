"use client";

import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Divider,
} from "@heroui/react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { PostWithRelations } from "@/types/database";

export default function CasualPostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.postId as string;

  const [post, setPost] = useState<PostWithRelations | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("posts")
        .select(
          "*, companies(id, name), users:created_by_user_id(id, display_name, email)",
        )
        .eq("id", postId)
        .eq("post_type", "CASUAL")
        .single();
      setPost(data as PostWithRelations | null);
      setIsLoading(false);
    };
    fetch();
  }, [postId]);

  if (isLoading) {
    return <div className="bg-white rounded-xl h-96 animate-pulse" />;
  }

  if (!post) {
    return (
      <div className="text-center py-16">
        <p className="text-default-500">投稿が見つかりませんでした</p>
        <Button variant="flat" onPress={() => router.back()} className="mt-4">
          戻る
        </Button>
      </div>
    );
  }

  const createdAt = new Date(post.created_at).toLocaleDateString("ja-JP");

  return (
    <div className="max-w-3xl mx-auto">
      <Button
        variant="flat"
        size="sm"
        onPress={() => router.back()}
        className="mb-4"
      >
        ← 一覧に戻る
      </Button>

      <Card shadow="sm">
        <CardHeader className="flex flex-col items-start gap-3 pb-3">
          <div className="flex items-start justify-between w-full gap-3">
            <div>
              <p className="text-sm text-default-400 mb-1">
                {post.users?.display_name ?? "匿名"}
              </p>
              <h1 className="text-xl font-bold text-default-900">
                {post.title}
              </h1>
            </div>
            <Chip color="success" variant="flat" size="sm">
              公開中
            </Chip>
          </div>
          <p className="text-xs text-default-400">投稿日: {createdAt}</p>
        </CardHeader>
        <Divider />
        <CardBody className="py-6">
          <div className="whitespace-pre-wrap text-default-700 leading-relaxed">
            {post.body}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
