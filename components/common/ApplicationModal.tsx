"use client";

import {
  Button,
  Chip,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Textarea,
} from "@heroui/react";
import { useState } from "react";
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
  // APPLY: 公式案件なら「応募」、気軽投稿なら「参加希望」
  return post.post_type === "OFFICIAL" ? "応募" : "参加希望";
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

      if (!res.ok) {
        setError(data.error ?? "エラーが発生しました");
        return;
      }

      setMessage("");
      onSuccess();
      onClose();
    } catch {
      setError("ネットワークエラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
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
            placeholder={`${typeLabel}の内容を入力してください`}
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
          <Button variant="flat" onPress={onClose} isDisabled={isLoading}>
            キャンセル
          </Button>
          <Button
            color={applicationType === "INQUIRY" ? "secondary" : "primary"}
            onPress={handleSubmit}
            isLoading={isLoading}
          >
            {typeLabel}を送信する
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
