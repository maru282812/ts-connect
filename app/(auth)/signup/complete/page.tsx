"use client";

import { Button, Card, CardBody, CardHeader } from "@heroui/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { createClient } from "@/lib/supabase/client";

function SignupCompleteContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const [resendStatus, setResendStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");

  const handleResend = async () => {
    setResendStatus("loading");
    const supabase = createClient();
    const { error } = await supabase.auth.resend({ type: "signup", email });
    setResendStatus(error ? "error" : "sent");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <Card className="w-full max-w-md shadow-lg text-center" shadow="sm">
        <CardHeader className="flex flex-col items-center gap-3 pt-8 pb-4">
          <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center">
            <svg
              className="text-primary"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-default-900">
            確認メールを送信しました
          </h1>
          <p className="text-sm text-default-500">
            ログイン前にメールの確認が必要です
          </p>
        </CardHeader>
        <CardBody className="px-8 pb-8 flex flex-col items-center gap-6">
          {email && (
            <p className="text-sm text-default-700">
              <span className="font-semibold">{email}</span> 宛に確認メールを送信しました。
            </p>
          )}

          <div className="w-full bg-warning-50 border border-warning-200 rounded-lg p-4 text-left space-y-2">
            <p className="text-sm font-semibold text-warning-700">
              まだログインできません
            </p>
            <p className="text-sm text-warning-600">
              メール内の確認リンクをクリックするまで、ログインはできません。
            </p>
          </div>

          <div className="w-full bg-default-50 rounded-lg p-4 text-left space-y-2">
            <p className="text-sm font-semibold text-default-700">次にやること</p>
            <ol className="text-sm text-default-600 space-y-1.5 list-decimal list-inside">
              <li>受信トレイを開く（迷惑メールフォルダも確認）</li>
              <li>「メールアドレスの確認」メールを開く</li>
              <li>メール内の確認リンクをクリック</li>
              <li>確認完了後、ログイン画面からログイン</li>
            </ol>
          </div>

          <div className="w-full flex flex-col gap-3">
            <Button
              as={Link}
              href="/login"
              color="primary"
              size="lg"
              className="w-full font-semibold"
            >
              ログイン画面へ進む
            </Button>

            <div className="text-center">
              {resendStatus === "sent" ? (
                <p className="text-success text-sm">確認メールを再送しました。</p>
              ) : resendStatus === "error" ? (
                <p className="text-danger text-sm">
                  再送に失敗しました。時間をおいて再度お試しください。
                </p>
              ) : (
                <Button
                  variant="light"
                  size="sm"
                  isLoading={resendStatus === "loading"}
                  onPress={handleResend}
                  isDisabled={!email}
                  className="text-default-500 text-xs"
                >
                  確認メールが届かない場合は再送する
                </Button>
              )}
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

export default function SignupCompletePage() {
  return (
    <Suspense>
      <SignupCompleteContent />
    </Suspense>
  );
}
