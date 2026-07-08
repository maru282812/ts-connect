"use client";

import Link from "next/link";
import { useState } from "react";

const SIZES = ["S", "M", "L", "XL"] as const;
const COLORS = [
  { key: "navy", label: "ネイビー", swatch: "bg-slate-900" },
  { key: "gray", label: "グレー", swatch: "bg-slate-400" },
  { key: "black", label: "ブラック", swatch: "bg-black" },
] as const;

const SIZE_TABLE = [
  { size: "S", length: 66, width: 52, sleeve: 60 },
  { size: "M", length: 69, width: 55, sleeve: 61 },
  { size: "L", length: 72, width: 58, sleeve: 62 },
  { size: "XL", length: 75, width: 61, sleeve: 63 },
];

const SPECS = [
  { label: "素材", value: "綿 100% (裏パイル)" },
  { label: "厚み", value: "12.7オンス" },
  { label: "生産国", value: "中国" },
  { label: "洗濯", value: "洗濯機可（ネット推奨）" },
];

export function GoodsDetailClient({
  productId,
  basePath = "/app/goods",
}: {
  productId: string;
  basePath?: string;
}) {
  const [size, setSize] = useState<string>("M");
  const [color, setColor] = useState<string>("navy");

  const selectedColor = COLORS.find((c) => c.key === color);

  return (
    <div className="max-w-7xl mx-auto w-full">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 mb-8 text-sm text-default-500">
        <Link href={basePath} className="hover:text-primary">
          社内グッズ
        </Link>
        <span>›</span>
        <span className="text-default-800">WMプレミアムフーディー</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: visuals & info */}
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white rounded-xl border border-default-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-3 aspect-square rounded-lg bg-default-100 border border-default-200 flex items-center justify-center text-default-300">
                商品画像
              </div>
              <div className="md:col-span-1 flex md:flex-col gap-3">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className={`flex-shrink-0 w-20 md:w-full aspect-square rounded-lg border overflow-hidden flex items-center justify-center text-default-300 text-xs ${
                      i === 0 ? "border-2 border-primary" : "border-default-200"
                    }`}
                  >
                    画像{i + 1}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <section className="bg-white rounded-xl border border-default-200 p-6 md:col-span-2">
              <h2 className="text-lg font-bold text-default-900 mb-4">
                商品の詳細説明
              </h2>
              <p className="text-default-600 leading-relaxed text-sm">
                オリジナル「WMプレミアムフーディー」は、社員のフィードバックをもとに制作された高品質なスウェットウェアです。12.7オンスの重厚感ある生地を使用しながらも、裏側はパイル地を採用し、季節を問わず快適に着用いただけます。
                <br />
                <br />
                オフィスでの冷房対策や、リモートワーク時のユニフォーム、カジュアルなイベントでの着用に最適です。左胸にはブランドロゴを刺繍であしらい、洗練された印象に仕上げました。
              </p>
            </section>

            <section className="bg-white rounded-xl border border-default-200 p-6">
              <h2 className="text-base font-bold text-default-900 mb-4">
                サイズガイド
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-default-50 border-b border-default-200">
                    <tr>
                      <th className="px-2 py-2 font-bold">サイズ</th>
                      <th className="px-2 py-2 font-bold">身丈</th>
                      <th className="px-2 py-2 font-bold">身幅</th>
                      <th className="px-2 py-2 font-bold">袖丈</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-default-200">
                    {SIZE_TABLE.map((r) => (
                      <tr key={r.size}>
                        <td className="px-2 py-2">{r.size}</td>
                        <td className="px-2 py-2">{r.length}</td>
                        <td className="px-2 py-2">{r.width}</td>
                        <td className="px-2 py-2">{r.sleeve}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="bg-white rounded-xl border border-default-200 p-6">
              <h2 className="text-base font-bold text-default-900 mb-4">
                素材・仕様情報
              </h2>
              <ul className="space-y-2 text-default-600 text-sm">
                {SPECS.map((s) => (
                  <li
                    key={s.label}
                    className="flex justify-between border-b border-dashed border-default-200 pb-1"
                  >
                    <span>{s.label}</span>
                    <span className="font-bold text-default-800">
                      {s.value}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>

        {/* Right: interaction */}
        <div className="lg:col-span-4 lg:sticky lg:top-6 space-y-6">
          <div className="bg-white rounded-xl border border-default-200 p-6 shadow-sm border-t-4 border-t-primary">
            <div className="mb-4">
              <span className="bg-primary text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                APPAREL
              </span>
              <h1 className="text-2xl font-bold text-default-900 mt-2">
                WMプレミアムフーディー
              </h1>
            </div>
            <div className="flex items-end gap-2 mb-6">
              <span className="text-2xl font-bold text-primary">3,500</span>
              <span className="text-sm font-bold mb-1">pt</span>
              <span className="ml-auto bg-green-50 text-green-600 text-sm px-2 py-1 rounded border border-green-200">
                在庫あり
              </span>
            </div>

            <div className="space-y-4 mb-8">
              <div>
                <span className="block text-xs font-bold text-default-500 uppercase mb-2">
                  Select Size
                </span>
                <div className="grid grid-cols-4 gap-2">
                  {SIZES.map((s) => {
                    const active = size === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSize(s)}
                        className={`py-2 rounded-lg text-sm transition-colors ${
                          active
                            ? "border-2 border-primary bg-primary-50 text-primary font-bold"
                            : "border border-default-200 hover:border-primary hover:text-primary"
                        }`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <span className="block text-xs font-bold text-default-500 uppercase mb-2">
                  Select Color
                </span>
                <div className="flex gap-3">
                  {COLORS.map((c) => {
                    const active = color === c.key;
                    return (
                      <button
                        key={c.key}
                        type="button"
                        onClick={() => setColor(c.key)}
                        title={c.label}
                        className={`w-8 h-8 rounded-full border border-default-200 ${c.swatch} ${
                          active ? "ring-2 ring-offset-2 ring-primary" : ""
                        }`}
                      />
                    );
                  })}
                </div>
                <p className="text-[11px] text-default-500 mt-1">
                  選択中: {selectedColor?.label}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-lg transition-all"
              >
                このグッズを申請する
              </button>
              <button
                type="button"
                className="w-full bg-white border border-default-200 hover:bg-default-50 text-default-800 font-bold py-3 rounded-lg transition-all"
              >
                商品について問い合わせる
              </button>
            </div>

            <div className="mt-6 pt-6 border-t border-default-200 text-sm text-default-500">
              最短受取: 3営業日以内
            </div>
          </div>

          <div className="bg-primary-50 rounded-xl border border-primary-100 p-4 flex items-center gap-4">
            <div>
              <p className="text-xs text-primary font-bold uppercase">
                Your Balance
              </p>
              <p className="font-bold text-default-800">12,450 pt</p>
            </div>
            <div className="ml-auto text-xs font-bold text-green-600">
              9,000pt余ります
            </div>
          </div>

          <p className="text-[11px] text-default-400 px-1">
            商品ID: {productId}
          </p>
        </div>
      </div>
    </div>
  );
}
