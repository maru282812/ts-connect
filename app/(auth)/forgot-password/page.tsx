"use client";

import { Button, Card, CardBody, CardHeader, Input, Link } from "@heroui/react";
import { useEffect, useState } from "react";
import { formInputClasses } from "@/components/common/FormField";
import { FormField } from "@/components/ui/FormField";
import { AUTH_MESSAGES } from "@/constants/authMessages";
import { createClient } from "@/lib/supabase/client";

const isDev = process.env.NODE_ENV === "development";
const RESEND_COOLDOWN_SEC = 60;

function isRateLimitError(message: string): boolean {
  const msg = message.toLowerCase();
  return (
    msg.includes("rate") ||
    msg.includes("too many") ||
    msg.includes("over_email_send_rate_limit") ||
    msg.includes("60 seconds")
  );
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldownSec, setCooldownSec] = useState(0);

  useEffect(() => {
    if (cooldownSec <= 0) return;
    const timer = setTimeout(() => setCooldownSec((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldownSec]);

  const sendResetEmail = async (targetEmail: string) => {
    setIsLoading(true);
    setError(null);

    const supabase = createClient();
    const redirectTo = `${window.location.origin}/reset-password`;

    if (isDev) {
      console.log("[forgot-password] resetPasswordForEmail called, redirectTo:", redirectTo);
    }

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(targetEmail, {
      redirectTo,
    });

    if (isDev) {
      console.log(
        "[forgot-password] result:",
        resetError ? `error: ${resetError.message}` : "success"
      );
    }

    setIsLoading(false);

    if (resetError) {
      if (isRateLimitError(resetError.message)) {
        setError(AUTH_MESSAGES.RESET_RATE_LIMIT);
      } else {
        setError(AUTH_MESSAGES.RESET_SEND_ERROR);
      }
      return false;
    }

    setCooldownSec(RESEND_COOLDOWN_SEC);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await sendResetEmail(email);
    if (ok) setIsSubmitted(true);
  };

  const handleResend = async () => {
    await sendResetEmail(email);
  };

  if (isSubmitted) {
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
            <h1 className="text-xl font-bold text-default-900">再設定メールを送信しました</h1>
          </CardHeader>
          <CardBody className="px-8 pb-8 flex flex-col items-center gap-6">
            <div className="w-full text-left space-y-3">
              <p className="text-sm text-default-700">
                <span className="font-semibold">{email}</span>{" "}
                宛にパスワード再設定の案内を送信しました。
              </p>
              <div className="bg-default-50 rounded-lg p-4 space-y-2">
                <p className="text-sm font-semibold text-default-700">
                  次の手順でパスワードを変更してください
                </p>
                <ol className="text-sm text-default-600 space-y-1 list-decimal list-inside">
                  <li>受信したメールを開く</li>
                  <li>メール内の「パスワードを再設定する」リンクをクリック</li>
                  <li>新しいパスワードを設定</li>
                  <li>ログイン画面からログイン</li>
                </ol>
              </div>
              <p className="text-xs text-default-400">
                メールが届かない場合は、迷惑メールフォルダをご確認ください。
                登録されていないメールアドレスには送信されません。
              </p>
            </div>

            {error && (
              <div className="w-full bg-danger-50 border border-danger-200 rounded-lg p-3">
                <p className="text-danger text-sm">{error}</p>
              </div>
            )}

            <div className="w-full flex flex-col gap-3">
              <Button
                variant="bordered"
                size="md"
                isLoading={isLoading}
                isDisabled={cooldownSec > 0}
                onPress={handleResend}
                className="w-full"
              >
                {cooldownSec > 0
                  ? `再送できるまで ${cooldownSec} 秒お待ちください`
                  : "再設定メールを再送する"}
              </Button>
              <p className="text-xs text-default-400 text-center">
                短時間に複数回再送すると送信制限がかかる場合があります。
              </p>
              <Button as="a" href="/login" variant="light" size="sm" className="w-full">
                ログイン画面に戻る
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <Card className="w-full max-w-md shadow-lg" shadow="sm">
        <CardHeader className="flex flex-col items-center gap-2 pt-8 pb-4">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
            <svg
              className="text-white"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-default-900">パスワードの再設定</h1>
          <p className="text-sm text-default-500">登録済みのメールアドレスを入力してください</p>
        </CardHeader>
        <CardBody className="px-8 pb-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {error && (
              <div className="bg-danger-50 border border-danger-200 rounded-lg p-3">
                <p className="text-danger text-sm">{error}</p>
              </div>
            )}
            <FormField label="メールアドレス" required>
              <Input
                type="email"
                value={email}
                onValueChange={setEmail}
                isRequired
                autoComplete="email"
                placeholder="your@email.com"
                variant="bordered"
                size="lg"
                classNames={formInputClasses}
              />
            </FormField>
            <Button
              type="submit"
              color="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full font-semibold"
            >
              再設定メールを送信する
            </Button>
          </form>
          <div className="mt-6 text-center">
            <Link href="/login" size="sm" color="primary">
              ログイン画面に戻る
            </Link>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
