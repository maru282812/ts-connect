"use client";

import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Input,
  Link,
} from "@heroui/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { formLabelClasses } from "@/components/common/FormField";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const supabase = createClient();

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError("メールアドレスまたはパスワードが正しくありません");
      setIsLoading(false);
      return;
    }

    const systemRole = data.user?.user_metadata?.system_role as
      | string
      | undefined;
    if (systemRole === "ADMIN") {
      router.push("/company/posts");
    } else {
      router.push("/app/posts");
    }
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <Card className="w-full max-w-lg shadow-lg" shadow="sm">
        <CardHeader className="flex flex-col items-center gap-2 pt-10 pb-6">
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
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-default-900">WorkMarket</h1>
          <p className="text-sm text-default-500">アカウントにログイン</p>
        </CardHeader>
        <CardBody className="px-10 pb-10">
          <form onSubmit={handleLogin} className="flex flex-col gap-6">
            {error && (
              <div className="bg-danger-50 border border-danger-200 rounded-lg p-3">
                <p className="text-danger text-sm">{error}</p>
              </div>
            )}
            <Input
              label="メールアドレス"
              labelPlacement="outside"
              type="email"
              value={email}
              onValueChange={setEmail}
              isRequired
              autoComplete="email"
              placeholder="your@email.com"
              variant="bordered"
              size="lg"
              classNames={{
                ...formLabelClasses,
                inputWrapper:
                  "bg-white border-slate-300 hover:border-slate-400 h-12",
                input: "text-base",
              }}
            />
            <Input
              label="パスワード"
              labelPlacement="outside"
              type="password"
              value={password}
              onValueChange={setPassword}
              isRequired
              autoComplete="current-password"
              placeholder="パスワードを入力"
              variant="bordered"
              size="lg"
              classNames={{
                ...formLabelClasses,
                inputWrapper:
                  "bg-white border-slate-300 hover:border-slate-400 h-12",
                input: "text-base",
              }}
            />
            <Button
              type="submit"
              color="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full font-semibold mt-1"
            >
              ログイン
            </Button>
          </form>

          <Divider className="my-8" />

          <p className="text-center text-sm text-default-500">
            アカウントをお持ちでない方は{" "}
            <Link href="/signup" size="sm" color="primary">
              新規登録
            </Link>
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
