import type { MetadataRoute } from "next";
import { APP_NAME, APP_NAME_SHORT } from "@/constants/appConstants";

// PWA マニフェスト（Next.js 標準の metadata route）。
// display:standalone でホーム画面から全画面起動する。
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: APP_NAME,
    short_name: APP_NAME_SHORT,
    description: `${APP_NAME}は会社と個人をつなぐ仕事マッチングサービスです`,
    start_url: "/app",
    display: "standalone",
    background_color: "#eff6ff",
    theme_color: "#006FEE",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
