"use client";

import { Button } from "@heroui/react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ApplicationModal } from "@/components/common/ApplicationModal";
import { PostDetailCard } from "@/components/common/PostDetailCard";
import { createClient } from "@/lib/supabase/client";
import type { PostWithRelations } from "@/types/database";

export function OfficialPostDetail() {
  const params = useParams();
  const router = useRouter();
  const postId = params.postId as string;

  const [post, setPost] = useState<PostWithRelations | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [applyOpen, setApplyOpen] = useState(false);
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("posts")
        .select(
          "*, companies(id, name), users:created_by_user_id(id, display_name, email)",
        )
        .eq("id", postId)
        .eq("post_type", "OFFICIAL")
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
        <p className="text-default-500">案件が見つかりませんでした</p>
        <Button variant="flat" onPress={() => router.back()} className="mt-4">
          戻る
        </Button>
      </div>
    );
  }

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

      {successMessage && (
        <div className="mb-4 bg-success-50 border border-success-200 rounded-lg p-4">
          <p className="text-success text-sm font-medium">{successMessage}</p>
        </div>
      )}

      <PostDetailCard
        post={post}
        onApply={() => setApplyOpen(true)}
        onInquiry={() => setInquiryOpen(true)}
      />

      {applyOpen && (
        <ApplicationModal
          post={post}
          applicationType="APPLY"
          isOpen={applyOpen}
          onClose={() => setApplyOpen(false)}
          onSuccess={() =>
            setSuccessMessage(
              "応募を送信しました。担当者からの連絡をお待ちください。",
            )
          }
        />
      )}

      {inquiryOpen && (
        <ApplicationModal
          post={post}
          applicationType="INQUIRY"
          isOpen={inquiryOpen}
          onClose={() => setInquiryOpen(false)}
          onSuccess={() =>
            setSuccessMessage(
              "お問い合わせを送信しました。担当者からの連絡をお待ちください。",
            )
          }
        />
      )}
    </div>
  );
}
