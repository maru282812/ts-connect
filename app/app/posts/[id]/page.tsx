"use client";

import { Button } from "@heroui/react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ApplicationModal } from "@/components/common/ApplicationModal";
import { PostDetailCard } from "@/components/common/PostDetailCard";
import { createClient } from "@/lib/supabase/client";
import type { ApplicationType, PostWithRelations } from "@/types/database";

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [post, setPost] = useState<PostWithRelations | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [modalType, setModalType] = useState<ApplicationType | null>(null);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("posts")
        .select(
          "*, companies(id, name), users:created_by_user_id(id, display_name, email)",
        )
        .eq("id", id)
        .eq("post_status", "PUBLISHED")
        .single();
      setPost(data as PostWithRelations | null);
      setIsLoading(false);
    };
    fetchPost();
  }, [id]);

  if (isLoading) {
    return <div className="bg-white rounded-xl h-96 animate-pulse" />;
  }

  if (!post) {
    return (
      <div className="text-center py-16">
        <p className="text-default-500">案件が見つかりませんでした</p>
        <Button variant="flat" onPress={() => router.back()} className="mt-4">
          戻る
        </Button>
      </div>
    );
  }

  const isOfficial = post.post_type === "OFFICIAL";

  return (
    <div className="max-w-3xl mx-auto">
      <Button
        variant="flat"
        size="sm"
        onPress={() => router.push("/app/posts")}
        className="mb-4"
      >
        ← 案件一覧に戻る
      </Button>

      {applied && (
        <div className="mb-4 bg-success-50 border border-success-200 rounded-lg p-3">
          <p className="text-success text-sm font-medium">
            応募・問い合わせを送信しました。
          </p>
        </div>
      )}

      <PostDetailCard
        post={post}
        onApply={isOfficial ? () => setModalType("APPLY") : undefined}
        onInquiry={isOfficial ? () => setModalType("INQUIRY") : undefined}
      />

      {modalType && (
        <ApplicationModal
          post={post}
          applicationType={modalType}
          isOpen={!!modalType}
          onClose={() => setModalType(null)}
          onSuccess={() => setApplied(true)}
        />
      )}
    </div>
  );
}
