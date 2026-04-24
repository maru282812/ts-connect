"use client";

import { Button, Card, CardBody, CardHeader, Input } from "@heroui/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { formInputClasses } from "@/components/common/FormField";
import { FormField } from "@/components/ui/FormField";
import { AUTH_MESSAGES } from "@/constants/authMessages";
import { createClient } from "@/lib/supabase/client";

const isDev = process.env.NODE_ENV === "development";

type PageState = "loading" | "ready" | "success" | "expired" | "invalid";

function devLog(...args: unknown[]) {
  if (isDev) console.log("[reset-password]", ...args);
}

function classifyLinkError(message: string, status?: number): PageState {
  const msg = message.toLowerCase();
  if (status === 429 || msg.includes("rate") || msg.includes("too many")) return "invalid";
  if (
    msg.includes("expired") ||
    msg.includes("invalid_grant") ||
    msg.includes("otp_expired") ||
    msg.includes("token has expired")
  )
    return "expired";
  return "invalid";
}

function InvalidCard({ reason, pageState }: { reason: string; pageState: PageState }) {
  const title =
    pageState === "expired" ? "リンクの有効期限が切れています" : "リンクが無効または使用済みです";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <Card className="w-full max-w-md shadow-lg text-center" shadow="sm">
        <CardHeader className="flex flex-col items-center gap-3 pt-8 pb-4">
          <div className="w-16 h-16 bg-danger-50 rounded-full flex items-center justify-center">
            <svg
              className="text-danger"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-default-900">{title}</h1>
        </CardHeader>
        <CardBody className="px-8 pb-8 flex flex-col items-center gap-4">
          <p className="text-sm text-default-600">{reason}</p>
          <Button
            as={Link}
            href="/forgot-password"
            color="primary"
            size="lg"
            className="w-full font-semibold"
          >
            再設定メールを再送する
          </Button>
          <Button as={Link} href="/login" variant="light" size="sm">
            ログイン画面に戻る
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const [pageState, setPageState] = useState<PageState>("loading");
  const [invalidReason, setInvalidReason] = useState(AUTH_MESSAGES.LINK_INVALID);
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const supabase = createClient();
    const code = searchParams.get("code");

    devLog("URL search params:", Object.fromEntries(searchParams.entries()));
    devLog(
      "URL hash (truncated):",
      typeof window !== "undefined"
        ? window.location.hash.substring(0, 80)
        : "(ssr)"
    );

    async function handleCode(code: string) {
      devLog("Exchanging code for session via PKCE...");
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      devLog(
        "exchangeCodeForSession result:",
        error ? `error ${error.status}: ${error.message}` : "success"
      );

      if (error) {
        const state = classifyLinkError(error.message, error.status);
        const reason =
          state === "expired" ? AUTH_MESSAGES.LINK_EXPIRED : AUTH_MESSAGES.LINK_UNKNOWN_ERROR;
        setInvalidReason(reason);
        setPageState(state);
        return;
      }

      setPageState("ready");
    }

    // PKCE flow: code is a URL query param
    if (code) {
      handleCode(code);
      return;
    }

    // Implicit flow (older Supabase config): type=recovery in hash
    if (typeof window !== "undefined" && window.location.hash.includes("type=recovery")) {
      devLog("Found type=recovery in hash, session is already set");
      setPageState("ready");
      return;
    }

    // Fallback: wait for PASSWORD_RECOVERY event (e.g., redirect from Supabase studio link)
    devLog("No code or hash found — waiting for PASSWORD_RECOVERY event (10s timeout)...");
    let resolved = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      devLog("onAuthStateChange event:", event);
      if (event === "PASSWORD_RECOVERY") {
        resolved = true;
        setPageState("ready");
        subscription.unsubscribe();
      }
    });

    const timeout = setTimeout(() => {
      if (!resolved) {
        devLog("Timeout: PASSWORD_RECOVERY event not received in 10s");
        setInvalidReason(AUTH_MESSAGES.LINK_INVALID);
        setPageState("invalid");
      }
      subscription.unsubscribe();
    }, 10000);

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== passwordConfirm) {
      setError("パスワードが一致しません");
      return;
    }
    if (password.length < 8) {
      setError("パスワードは8文字以上で入力してください");
      return;
    }
    setIsLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    devLog(
      "updateUser result:",
      updateError ? `error ${updateError.status}: ${updateError.message}` : "success"
    );

    if (updateError) {
      const msg = updateError.message.toLowerCase();
      if (msg.includes("expired") || msg.includes("invalid_grant")) {
        setError(
          "再設定リンクの有効期限が切れています。再設定メールを再送して最初からやり直してください。"
        );
      } else {
        setError(
          "パスワードの変更に失敗しました。再設定メールを再送して最初からやり直してください。"
        );
      }
      setIsLoading(false);
      return;
    }

    await supabase.auth.signOut();
    setPageState("success");
  };

  if (pageState === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
        <Card className="w-full max-w-md shadow-lg text-center" shadow="sm">
          <CardBody className="px-8 py-12">
            <p className="text-default-500 text-sm">再設定リンクを確認中...</p>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (pageState === "expired" || pageState === "invalid") {
    return <InvalidCard reason={invalidReason} pageState={pageState} />;
  }

  if (pageState === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
        <Card className="w-full max-w-md shadow-lg text-center" shadow="sm">
          <CardHeader className="flex flex-col items-center gap-3 pt-8 pb-4">
            <div className="w-16 h-16 bg-success-50 rounded-full flex items-center justify-center">
              <svg
                className="text-success"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-default-900">パスワードを変更しました</h1>
          </CardHeader>
          <CardBody className="px-8 pb-8 flex flex-col items-center gap-4">
            <p className="text-sm text-default-600">新しいパスワードでログインしてください。</p>
            <Button
              as={Link}
              href="/login"
              color="primary"
              size="lg"
              className="w-full font-semibold"
            >
              ログイン画面へ
            </Button>
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
          <h1 className="text-2xl font-bold text-default-900">新しいパスワードを設定</h1>
          <p className="text-sm text-default-500">8文字以上で入力してください</p>
        </CardHeader>
        <CardBody className="px-8 pb-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {error && (
              <div className="bg-danger-50 border border-danger-200 rounded-lg p-3 space-y-2">
                <p className="text-danger text-sm">{error}</p>
                <Button
                  as={Link}
                  href="/forgot-password"
                  size="sm"
                  variant="bordered"
                  color="danger"
                >
                  再設定メールを再送する
                </Button>
              </div>
            )}
            <FormField label="新しいパスワード" required>
              <Input
                type="password"
                value={password}
                onValueChange={setPassword}
                isRequired
                autoComplete="new-password"
                placeholder="8文字以上"
                variant="bordered"
                size="lg"
                classNames={formInputClasses}
              />
            </FormField>
            <FormField label="パスワード（確認）" required>
              <Input
                type="password"
                value={passwordConfirm}
                onValueChange={setPasswordConfirm}
                isRequired
                autoComplete="new-password"
                placeholder="もう一度入力"
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
              パスワードを変更する
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
          <Card className="w-full max-w-md shadow-lg text-center" shadow="sm">
            <CardBody className="px-8 py-12">
              <p className="text-default-500 text-sm">再設定リンクを確認中...</p>
            </CardBody>
          </Card>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
