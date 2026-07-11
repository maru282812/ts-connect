import type { Metadata, Viewport } from "next";
import { Providers } from "./providers";
import "./globals.css";
import { APP_NAME } from "@/constants/appConstants";

export const metadata: Metadata = {
  title: APP_NAME,
  description: `${APP_NAME}は会社と個人をつなぐ仕事マッチングサービスです`,
  applicationName: APP_NAME,
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_NAME,
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/apple-touch-icon-180.png",
  },
  openGraph: {
    title: APP_NAME,
    siteName: APP_NAME,
  },
};

export const viewport: Viewport = {
  themeColor: "#006FEE",
  viewportFit: "cover",
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
