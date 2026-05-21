"use client";

import {
  Chip,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Textarea,
} from "@heroui/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppButton } from "@/components/ui/AppButton";
import type { ApplicationType, Post } from "@/types/database";

interface ApplicationModalProps {
  post: Post;
  applicationType: ApplicationType;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function resolveTypeLabel(
  post: Post,
  applicationType: ApplicationType,
): string {
  if (applicationType === "INQUIRY") return "聞いてみる";
  return post.post_type === "OFFICIAL" ? "応募" : "参加希望";
}

function resolveSuccessMessage(
  post: Post,
  applicationType: ApplicationType,
): string {
  if (applicationType === "INQUIRY") {
    return `「${post.title}」へのお問い合わせを送信しました`;
  }
  const label = post.post_type === "OFFICIAL" ? "応募" : "参加希望";
  return `「${post.title}」への${label}を送信しました`;
}

export function ApplicationModal({
  post,
  applicationType,
  isOpen,
  onClose,
  onSuccess,
}: ApplicationModalProps) {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const typeLabel = resolveTypeLabel(post, applicationType);

  const handleSubmit = async () => {
    console.log("[ApplicationModal] 送信ボタン押下:", { post_id: post.id, applicationType });
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          post_id: post.id,
          message,
          application_type: applicationType,
        }),
      });

      const data = await res.json();
      console.log("[ApplicationModal] API response:", res.status, data);

      if (!res.ok) {
        const msg = data.error ?? "エラーが発生しました";
        setError(msg);
        toast.error(msg);
        console.error("[ApplicationModal] API error:", res.status, data);
        return;
      }

      console.log("[ApplicationModal] 応募成功:", data);
      setMessage("");
      toast.success(resolveSuccessMessage(post, applicationType), {
        description: "担当者からの連絡をお待ちください。",
      });
      onSuccess();
      onClose();
    } catch (err) {
      const msg = "ネットワークエラーが発生しました";
      setError(msg);
      toast.error(msg);
      console.error("[ApplicationModal] Network error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setMessage("");
      setError(null);
    }
  }, [isOpen]);

  const handleClose = () => {
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md" placement="center">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span>{typeLabel}</span>
            <Chip
              color={applicationType === "INQUIRY" ? "secondary" : "primary"}
              size="sm"
              variant="flat"
            >
              {typeLabel}
            </Chip>
          </div>
          <p className="text-sm font-normal text-default-500">{post.title}</p>
        </ModalHeader>
        <ModalBody>
          {error && (
            <p className="text-danger text-sm bg-danger-50 rounded-lg p-3">
              {error}
            </p>
          )}
          <Textarea
            label={`${typeLabel}メッセージ`}
            placeholder={`${typeLabel}の内容を入力してください（任意）`}
            value={message}
            onValueChange={setMessage}
            minRows={4}
            maxRows={8}
          />
          <p className="text-xs text-default-400">
            送信後、担当者にメール通知が届きます。
          </p>
        </ModalBody>
        <ModalFooter>
          <AppButton
            variantType="secondary"
            onPress={handleClose}
            isDisabled={isLoading}
          >
            キャンセル
          </AppButton>
          <AppButton
            variantType={applicationType === "INQUIRY" ? "sub" : "primary"}
            onPress={handleSubmit}
            isLoading={isLoading}
          >
            {typeLabel}を送信する
          </AppButton>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
