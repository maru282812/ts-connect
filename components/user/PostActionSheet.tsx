"use client";

import { useRouter } from "next/navigation";
import { NavigationIcon } from "@/components/common/NavigationIcon";

// ============================================================
// 投稿アクションシート（ボトムシート）
// 下タブ中央の「＋投稿」から開く。2種類の投稿導線を選ばせる。
//   ・社内SNSに投稿（既定/上）→ /app/community
//   ・気軽に投稿する         → /app/casual-posts/new
// ============================================================

interface PostActionSheetProps {
  open: boolean;
  onClose: () => void;
}

export function PostActionSheet({ open, onClose }: PostActionSheetProps) {
  const router = useRouter();
  if (!open) return null;

  const go = (href: string) => {
    onClose();
    router.push(href);
  };

  return (
    <div
      className="fixed inset-0 z-[60] md:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="投稿する"
    >
      <button
        type="button"
        aria-label="閉じる"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <div className="absolute inset-x-0 bottom-0 rounded-t-2xl bg-white p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-2xl">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-default-200" />
        <p className="mb-3 text-center text-sm font-bold text-default-700">
          投稿する
        </p>
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => go("/app/community")}
            className="flex w-full items-center gap-3 rounded-xl border border-primary bg-primary-50 p-3 text-left"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-white">
              <NavigationIcon name="forum" className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-sm font-bold text-default-800">
                社内SNSに投稿
              </span>
              <span className="block text-xs text-default-500">
                みんなのタイムラインに共有
              </span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => go("/app/casual-posts/new")}
            className="flex w-full items-center gap-3 rounded-xl border border-default-200 p-3 text-left"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-default-100 text-default-600">
              <NavigationIcon name="edit" className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-sm font-bold text-default-800">
                気軽に投稿する
              </span>
              <span className="block text-xs text-default-500">
                案件・お手伝いの募集を出す
              </span>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
