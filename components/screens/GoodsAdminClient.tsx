"use client";

import Link from "next/link";

import { GOODS_ROWS as ROWS } from "@/lib/mock/goods";

const STATS = [
  { label: "総グッズ数", value: "128", tone: "text-default-900" },
  { label: "公開中", value: "112", tone: "text-green-600" },
  { label: "下書き・非公開", value: "16", tone: "text-default-400" },
  { label: "総いいね数", value: "3,420", tone: "text-default-900" },
  { label: "交換申請数", value: "856", tone: "text-primary" },
  { label: "在庫切れ", value: "4", tone: "text-amber-600" },
];

export function GoodsAdminClient() {
  return (
    <div className="max-w-[1600px] mx-auto w-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-default-900">社内グッズ管理</h1>
        <Link
          href="/company/goods/new"
          className="bg-primary text-white px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-primary/90 shadow-sm"
        >
          新規グッズ登録
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {STATS.map((s) => (
          <div
            key={s.label}
            className="bg-white p-4 rounded-xl border border-default-200"
          >
            <div className="text-xs text-default-500 uppercase mb-1">
              {s.label}
            </div>
            <div className={`text-xl font-bold ${s.tone}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 bg-white p-4 rounded-xl border border-default-200">
        <input
          className="w-full px-4 py-2 bg-default-50 border border-default-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
          placeholder="キーワード検索..."
          type="text"
        />
        <select className="w-full px-4 py-2 bg-default-50 border border-default-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none">
          <option>全てのカテゴリ</option>
          <option>アパレル</option>
          <option>文具</option>
          <option>ガジェット</option>
          <option>体験</option>
        </select>
        <select className="w-full px-4 py-2 bg-default-50 border border-default-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none">
          <option>公開状態：全て</option>
          <option>公開中</option>
          <option>非公開</option>
          <option>在庫なし</option>
        </select>
        <select className="w-full px-4 py-2 bg-default-50 border border-default-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none">
          <option>価格帯：全て</option>
          <option>0 - 1,000 pt</option>
          <option>1,001 - 5,000 pt</option>
          <option>5,001 pt以上</option>
        </select>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Table */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-default-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead className="bg-default-50 border-b border-default-200">
                <tr>
                  <th className="p-4 text-sm text-default-500 font-bold">
                    商品名
                  </th>
                  <th className="p-4 text-sm text-default-500 font-bold">
                    カテゴリ
                  </th>
                  <th className="p-4 text-sm text-default-500 font-bold text-right">
                    必要ポイント
                  </th>
                  <th className="p-4 text-sm text-default-500 font-bold">
                    状態
                  </th>
                  <th className="p-4 text-sm text-default-500 font-bold">
                    最終更新
                  </th>
                  <th className="p-4 text-sm text-default-500 font-bold text-right">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-default-100">
                {ROWS.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-default-50 transition-colors cursor-pointer"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-default-100 border border-default-200 flex items-center justify-center text-default-300 text-[10px] shrink-0">
                          画像
                        </div>
                        <div>
                          <div className="font-bold text-default-800">
                            {r.name}
                          </div>
                          <div className="text-[11px] text-default-400">
                            {r.variant}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded text-[11px] font-bold ${r.categoryTone}`}
                      >
                        {r.category}
                      </span>
                    </td>
                    <td className="p-4 text-right font-bold text-default-800">
                      {r.points}
                    </td>
                    <td className="p-4">
                      <span className={`text-xs font-medium ${r.statusTone}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-default-400">
                      {r.updatedAt}
                    </td>
                    <td className="p-4 text-right">
                      <Link
                        href={`/company/goods/${r.id}/edit`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 border border-default-200 rounded-lg text-xs font-bold text-default-600 hover:bg-default-50 transition-colors"
                      >
                        編集
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick edit */}
        <aside className="bg-white rounded-xl border border-default-200 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-default-200 bg-default-50">
            <h3 className="font-bold text-default-800">クイック編集</h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="rounded-xl border border-default-200 overflow-hidden bg-default-50">
              <div className="h-32 bg-default-100 flex items-center justify-center text-default-300 text-xs">
                プレビュー画像
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-default-800">
                    特製ロゴTシャツ 2024
                  </h4>
                  <span className="font-bold text-primary">1,500 pt</span>
                </div>
                <p className="text-xs text-default-400 line-clamp-2">
                  2024年度限定のオリジナルロゴ入りTシャツです。
                </p>
              </div>
            </div>
            <div>
              <span className="block text-sm text-default-500 mb-1">
                商品名
              </span>
              <input
                className="w-full px-3 py-2 border border-default-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
                type="text"
                defaultValue="特製ロゴTシャツ 2024"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="block text-sm text-default-500 mb-1">
                  ポイント
                </span>
                <input
                  className="w-full px-3 py-2 border border-default-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
                  type="number"
                  defaultValue={1500}
                />
              </div>
              <div>
                <span className="block text-sm text-default-500 mb-1">
                  カテゴリ
                </span>
                <select className="w-full px-3 py-2 border border-default-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none">
                  <option>アパレル</option>
                  <option>文具</option>
                  <option>ガジェット</option>
                </select>
              </div>
            </div>
            <div>
              <span className="block text-sm text-default-500 mb-1">
                商品説明
              </span>
              <textarea
                className="w-full px-3 py-2 border border-default-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
                rows={3}
                defaultValue="2024年度限定のオリジナルロゴ入りTシャツです。高品質なオーガニックコットンを使用しています。"
              />
            </div>
            <div className="pt-2 flex gap-3">
              <button
                type="button"
                className="flex-grow bg-primary text-white py-2 rounded-lg font-bold text-sm hover:bg-primary/90 shadow-sm"
              >
                保存する
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
