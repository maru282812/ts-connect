import { Button, Card, CardBody, CardHeader } from "@heroui/react";
import Link from "next/link";

export default function SignupCompletePage() {
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
          <h1 className="text-2xl font-bold text-default-900">登録完了</h1>
        </CardHeader>
        <CardBody className="px-8 pb-8 flex flex-col items-center gap-6">
          <div className="space-y-2">
            <p className="text-default-700">アカウントの登録が完了しました。</p>
            <p className="text-sm text-default-500">
              メールアドレスに確認メールを送信しました。
              <br />
              確認後、ログインしてサービスをご利用ください。
            </p>
          </div>
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
