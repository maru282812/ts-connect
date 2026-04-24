import type { Metadata } from "next";
import { Providers } from "./providers";
import "./globals.css";
import { APP_NAME } from "@/constants/appConstants";

export const metadata: Metadata = {
  title: APP_NAME,
  description: `${APP_NAME}は会社と個人をつなぐ仕事マッチングサービスです`,
  openGraph: {
    title: APP_NAME,
    siteName: APP_NAME,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
