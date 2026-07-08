export interface AdminGoods {
  id: string;
  name: string;
  variant: string;
  category: string;
  categoryTone: string;
  points: string;
  pointsValue: number;
  description: string;
  status: "公開中" | "非公開" | "在庫なし";
  statusTone: string;
  updatedAt: string;
}

export const GOODS_ROWS: AdminGoods[] = [
  {
    id: "ag-1",
    name: "特製ロゴTシャツ 2024",
    variant: "Navy / Cotton 100%",
    category: "アパレル",
    categoryTone: "bg-blue-50 text-blue-600",
    points: "1,500 pt",
    pointsValue: 1500,
    description:
      "2024年度限定のオリジナルロゴ入りTシャツです。高品質なオーガニックコットンを使用しています。",
    status: "公開中",
    statusTone: "text-green-600",
    updatedAt: "2024/05/15",
  },
  {
    id: "ag-2",
    name: "エグゼクティブ・万年筆",
    variant: "Matte Black / Ink Black",
    category: "文具",
    categoryTone: "bg-default-100 text-default-600",
    points: "3,200 pt",
    pointsValue: 3200,
    description: "高級感のあるマットブラック仕上げの万年筆です。",
    status: "非公開",
    statusTone: "text-default-500",
    updatedAt: "2024/05/10",
  },
  {
    id: "ag-3",
    name: "ノイズキャンセリングヘッドホン",
    variant: "Charcoal / BT 5.2",
    category: "ガジェット",
    categoryTone: "bg-purple-50 text-purple-600",
    points: "12,000 pt",
    pointsValue: 12000,
    description: "Bluetooth 5.2対応のノイズキャンセリングヘッドホンです。",
    status: "在庫なし",
    statusTone: "text-amber-600",
    updatedAt: "2024/05/12",
  },
];

export function getGoodsById(id: string): AdminGoods | undefined {
  return GOODS_ROWS.find((g) => g.id === id);
}
