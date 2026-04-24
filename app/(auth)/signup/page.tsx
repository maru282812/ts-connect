"use client";

import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Input,
  Link,
  Select,
  SelectItem,
} from "@heroui/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  formInputClasses,
  formSelectClasses,
} from "@/components/common/FormField";
import { FormField } from "@/components/ui/FormField";
import { createClient } from "@/lib/supabase/client";
import type { Company } from "@/types/database";

export default function SignupPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/companies")
      .then((r) => r.json())
      .then(({ data }) => {
        if (data) setCompanies(data);
      });
  }, []);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId) {
      setError("所属会社を選択してください");
      return;
    }
    setIsLoading(true);
    setError(null);

    const supabase = createClient();

    console.log("SIGNUP_INPUT", {
      email,
      passwordLength: password.length,
      companyId,
      hasDisplayName: displayName.trim().length > 0,
    });

    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
          company_id: companyId,
        },
      },
    });

    console.log("SIGNUP_RESULT", { data, error: authError });

    if (authError) {
      console.error("[signup] サインアップエラー:", {
        message: authError.message,
        code: (authError as { code?: string }).code,
        status: authError.status,
      });
      const msg = authError.message.toLowerCase();
      if (msg.includes("database error") || msg.includes("unexpected_failure")) {
        // DB trigger / DB 保存系の失敗（会社選択とは無関係の可能性が高い）
        setError("登録処理に失敗しました。時間をおいて再度お試しください。");
      } else if (msg.includes("user already registered") || msg.includes("already been registered")) {
        setError("このメールアドレスはすでに登録されています。");
      } else {
        setError(authError.message);
      }
      setIsLoading(false);
      return;
    }

    router.push(`/signup/complete?email=${encodeURIComponent(email)}`);
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
            <FormField label="お名前" required>
              <Input
                value={displayName}
                onValueChange={setDisplayName}
                isRequired
                placeholder="山田 太郎"
                variant="bordered"
                size="lg"
                classNames={formInputClasses}
              />
            </FormField>
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
            <FormField label="所属会社" required>
              <Select
                isRequired
                selectedKeys={companyId ? [companyId] : []}
                onSelectionChange={(keys) =>
                  setCompanyId(Array.from(keys)[0] as string)
                }
                placeholder="会社を選択してください"
                variant="bordered"
                classNames={formSelectClasses}
              >
                {companies.map((c) => (
                  <SelectItem key={c.id}>{c.name}</SelectItem>
                ))}
              </Select>
            </FormField>
            <FormField label="パスワード" required description="8文字以上で入力してください">
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
