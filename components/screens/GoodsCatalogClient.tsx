"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Stock = "IN_STOCK" | "LOW" | "OUT";

interface Goods {
  id: string;
  name: string;
  category: string;
  categoryKey: string;
  points: number;
  description: string;
  stock: Stock;
  badge?: "人気" | "NEW";
  basePath: string;
}

const STOCK_META: Record<Stock, { label: string; dot: string; text: string }> =
  {
    IN_STOCK: {
      label: "在庫あり",
      dot: "bg-green-500",
      text: "text-green-600",
    },
    LOW: { label: "残りわずか", dot: "bg-amber-500", text: "text-amber-600" },
    OUT: { label: "在庫なし", dot: "bg-default-400", text: "text-default-500" },
  };

const CATEGORIES = [
  { key: "ALL", label: "すべて" },
  { key: "apparel", label: "アパレル" },
  { key: "stationery", label: "文具" },
  { key: "gadget", label: "ガジェット" },
  { key: "experience", label: "体験" },
] as const;

const GOODS: Goods[] = [
  {
    id: "g-01",
    name: "WMプレミアムフーディー",
    category: "アパレル",
    categoryKey: "apparel",
    points: 3500,
    description:
      "肌触りの良い上質なコットンを使用した、オフィスでも普段使いでも活躍する一着です。",
    stock: "IN_STOCK",
    badge: "人気",
    basePath: "/app/goods",
  },
  {
    id: "g-02",
    name: "真空断熱タンブラー (450ml)",
    category: "生活雑貨",
    categoryKey: "gadget",
    points: 1800,
    description:
      "保温・保冷機能に優れたステンレス製。長時間のデスクワークのお供に最適です。",
    stock: "LOW",
    basePath: "/app/goods",
  },
  {
    id: "g-03",
    name: "サステナブル文具セット",
    category: "文具",
    categoryKey: "stationery",
    points: 1200,
    description:
      "環境に配慮した素材を使用したノートとボールペンのセット。ギフトにも喜ばれます。",
    stock: "IN_STOCK",
    badge: "NEW",
    basePath: "/app/goods",
  },
  {
    id: "g-04",
    name: "カフェテリア特別チケット",
    category: "体験",
    categoryKey: "experience",
    points: 500,
    description:
      "社内カフェテリアや提携ショップで使えるドリンク・軽食の交換チケットです。",
    stock: "IN_STOCK",
    basePath: "/app/goods",
  },
];

export function GoodsCatalogClient({
  basePath = "/app/goods",
}: {
  basePath?: string;
}) {
  const [category, setCategory] = useState<string>("ALL");

  const visible = useMemo(
    () =>
      category === "ALL"
        ? GOODS
        : GOODS.filter((g) => g.categoryKey === category),
    [category],
  );

  return (
    <div className="max-w-[1400px] mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-default-900 mb-1">社内グッズ</h1>
        <p className="text-sm text-default-500">
          貢献活動で貯まったポイントを使って、オリジナルグッズと交換しましょう。
        </p>
      </div>

      {/* Category filter (tabs) */}
      <div className="flex flex-wrap items-center gap-3 mb-8">
        {CATEGORIES.map((c) => {
          const active = category === c.key;
          return (
            <button
              key={c.key}
              type="button"
              onClick={() => setCategory(c.key)}
              className={`px-5 py-2 rounded-full text-sm transition-all ${
                active
                  ? "bg-primary text-white font-bold shadow-sm"
                  : "bg-white border border-default-200 text-default-600 hover:bg-default-50"
              }`}
            >
              {c.label}
            </button>
          );
        })}
        <div className="h-6 w-px bg-default-200 mx-1" />
        <button
          type="button"
          className="px-5 py-2 bg-white border border-default-200 text-default-600 rounded-full text-sm hover:bg-default-50 transition-all"
        >
          在庫ありのみ
        </button>
      </div>

      {/* Goods grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {visible.map((g) => {
          const stock = STOCK_META[g.stock];
          return (
            <div
              key={g.id}
              className="bg-white border border-default-200 rounded-xl overflow-hidden group hover:shadow-lg transition-all flex flex-col"
            >
              <div className="relative h-40 bg-default-100 flex items-center justify-center">
                <span className="text-default-300 text-sm">画像</span>
                {g.badge && (
                  <div className="absolute top-3 left-3 bg-primary text-white text-[10px] font-bold px-2 py-1 rounded">
                    {g.badge}
                  </div>
                )}
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-sm text-primary font-semibold">
                    {g.category}
                  </span>
                  <span
                    className={`text-xs flex items-center gap-1 font-medium ${stock.text}`}
                  >
                    <span className={`w-2 h-2 rounded-full ${stock.dot}`} />
                    {stock.label}
                  </span>
                </div>
                <h3 className="text-base font-bold text-default-900 mb-2">
                  {g.name}
                </h3>
                <div className="flex items-baseline gap-1 text-primary font-bold text-lg mb-4">
                  {g.points.toLocaleString()}
                  <span className="text-xs font-normal text-default-500 ml-0.5">
                    pt 相当
                  </span>
                </div>
                <p className="text-sm text-default-500 mb-6 line-clamp-2">
                  {g.description}
                </p>
                <div className="mt-auto flex gap-2">
                  <Link
                    href={`${basePath}/${g.id}`}
                    className="flex-1 text-center py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 transition-all"
                  >
                    詳細を見る
                  </Link>
                  <button
                    type="button"
                    className="p-2 border border-default-200 rounded-lg text-default-500 hover:bg-default-50 transition-colors"
                    aria-label="お気に入り"
                  >
                    ♡
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
