import { Button } from "@heroui/react";
import { AppMenuGrid } from "@/components/user/AppMenuGrid";
import { signOut } from "@/lib/auth/actions";

// 「もっと」ページ：下タブに載らない全機能への入口＋ログアウト。
export default function MorePage() {
  return (
    <div className="mx-auto w-full max-w-3xl">
      <h1 className="mb-4 text-lg font-bold text-default-800">もっと</h1>

      <AppMenuGrid />

      <div className="mt-8 border-t border-default-100 pt-6">
        <form action={signOut}>
          <Button
            type="submit"
            variant="flat"
            color="danger"
            size="sm"
            className="w-full max-w-xs"
          >
            ログアウト
          </Button>
        </form>
      </div>
    </div>
  );
}
