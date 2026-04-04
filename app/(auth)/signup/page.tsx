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
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const supabase = createClient();

    // Supabase Auth でサインアップ
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
          system_role: "USER",
          company_name: company,
        },
      },
    });

    if (authError) {
      setError(authError.message);
      setIsLoading(false);
      return;
    }

    // public.users テーブルに追加
    if (data.user) {
      await supabase.from("users").insert({
        id: data.user.id,
        email,
        display_name: displayName,
        system_role: "USER",
        account_status: "ACTIVE",
      });
    }

    router.push("/signup/complete");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-8">
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
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-default-900">新規会員登録</h1>
          <p className="text-sm text-default-500">アカウントを作成する</p>
        </CardHeader>
        <CardBody className="px-8 pb-8">
          <form onSubmit={handleSignup} className="flex flex-col gap-4">
            {error && (
              <div className="bg-danger-50 border border-danger-200 rounded-lg p-3">
                <p className="text-danger text-sm">{error}</p>
              </div>
            )}
            <Input
              label="お名前"
              value={displayName}
              onValueChange={setDisplayName}
              isRequired
              placeholder="山田 太郎"
              classNames={{ inputWrapper: "bg-default-100" }}
            />
            <Input
              label="メールアドレス"
              type="email"
              value={email}
              onValueChange={setEmail}
              isRequired
              autoComplete="email"
              classNames={{ inputWrapper: "bg-default-100" }}
            />
            <Input
              label="所属会社"
              value={company}
              onValueChange={setCompany}
              placeholder="株式会社〇〇（任意）"
              classNames={{ inputWrapper: "bg-default-100" }}
            />
            <Input
              label="パスワード"
              type="password"
              value={password}
              onValueChange={setPassword}
              isRequired
              autoComplete="new-password"
              description="8文字以上で入力してください"
              classNames={{ inputWrapper: "bg-default-100" }}
            />
            <Button
              type="submit"
              color="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full font-semibold mt-2"
            >
              アカウントを作成
            </Button>
          </form>

          <Divider className="my-6" />

          <p className="text-center text-sm text-default-500">
            すでにアカウントをお持ちの方は{" "}
            <Link href="/login" size="sm" color="primary">
              ログイン
            </Link>
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
