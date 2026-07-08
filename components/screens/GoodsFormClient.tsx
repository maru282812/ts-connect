"use client";

import Link from "next/link";
import { type ReactNode, useState } from "react";

interface GoodsFormInitial {
  name: string;
  variant: string;
  category: string;
  points: number;
  description: string;
  status: "公開中" | "非公開" | "在庫なし";
}

const CATEGORIES = [
  "アパレル",
  "ステーショナリー",
  "ガジェット",
  "体験",
] as const;

interface Variation {
  id: string;
  size: string;
  color: string;
  stock: number;
  code: string;
}

function Section({
  index,
  title,
  children,
  defaultOpen = true,
}: {
  index: string;
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white border border-default-200 rounded-xl overflow-hidden shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full p-4 bg-default-50 border-b border-default-200 flex justify-between items-center hover:bg-default-100 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-primary font-bold">{index}</span>
          <h3 className="font-bold text-default-800 text-base">{title}</h3>
        </div>
        <span
          className={`text-default-500 transition-transform ${open ? "" : "-rotate-90"}`}
          aria-hidden
        >
          ⌄
        </span>
      </button>
      {open && <div className="p-6">{children}</div>}
    </div>
  );
}

const labelCls = "block text-[11px] font-semibold text-default-500 mb-1";
const inputCls =
  "w-full px-3 py-2 border border-default-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none";

export function GoodsFormClient({
  mode,
  initial,
}: {
  mode: "new" | "edit";
  initial?: GoodsFormInitial;
}) {
  const isEdit = mode === "edit";
  const title = isEdit ? "社内グッズ詳細管理" : "新規グッズ登録";

  const variations: Variation[] = isEdit
    ? [
        {
          id: "v-s",
          size: "S",
          color: "Black",
          stock: 5,
          code: "TS-2024-BK-S",
        },
        {
          id: "v-m",
          size: "M",
          color: "Black",
          stock: 10,
          code: "TS-2024-BK-M",
        },
        {
          id: "v-l",
          size: "L",
          color: "Black",
          stock: 9,
          code: "TS-2024-BK-L",
        },
      ]
    : [{ id: "v-new", size: "", color: "", stock: 0, code: "" }];

  return (
    <div className="max-w-[1400px] mx-auto w-full space-y-6">
      {/* ActionBar */}
      <div className="bg-white border border-default-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-4">
          <Link
            href="/company/goods"
            className="flex items-center gap-1 text-sm text-default-500 hover:text-primary font-medium"
          >
            <span aria-hidden>←</span> 一覧へ戻る
          </Link>
          <div className="h-6 w-px bg-default-200" />
          <h2 className="text-lg font-bold text-default-900">{title}</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 mr-2">
            <span className="text-[11px] font-semibold text-default-500 uppercase">
              公開状態
            </span>
            <select
              className="border border-default-200 rounded-lg text-sm py-1.5 px-2 focus:ring-2 focus:ring-primary outline-none"
              defaultValue={initial?.status ?? "下書き"}
            >
              <option>公開中</option>
              <option>非公開</option>
              <option>下書き</option>
              <option>期間指定公開</option>
            </select>
          </div>
          <button
            type="button"
            className="flex items-center gap-2 px-4 py-2 border border-default-200 rounded-lg text-sm font-bold text-default-700 hover:bg-default-50 transition-colors"
          >
            プレビュー
          </button>
          <button
            type="button"
            className="flex items-center gap-2 px-6 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-bold shadow-sm transition-all"
          >
            {isEdit ? "保存する" : "登録する"}
          </button>
        </div>
      </div>

      {/* ① 基本情報 */}
      <Section index="①" title="基本情報">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <div>
            <span className={labelCls}>商品名</span>
            <input
              className={inputCls}
              type="text"
              placeholder="例：特製ロゴTシャツ 2024"
              defaultValue={initial?.name}
            />
          </div>
          <div>
            <span className={labelCls}>必要ポイント</span>
            <div className="flex items-center gap-2">
              <input
                className={inputCls}
                type="number"
                placeholder="1500"
                defaultValue={initial?.points}
              />
              <span className="text-sm text-default-500">pt</span>
            </div>
          </div>
          <div>
            <span className={labelCls}>カテゴリ</span>
            <select className={inputCls} defaultValue={initial?.category}>
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <span className={labelCls}>在庫ステータス</span>
            <div className="flex items-center gap-2 mt-2">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
              <span className="text-sm text-default-700">
                {isEdit ? "在庫あり" : "未設定"}
              </span>
            </div>
          </div>
          <div>
            <span className={labelCls}>在庫総数</span>
            <p className="font-bold text-default-800">
              {isEdit ? "24" : "0"}{" "}
              <span className="text-[11px] font-normal text-default-400">
                着
              </span>
            </p>
          </div>
          <div>
            <span className={labelCls}>交換申請数</span>
            <p className="font-bold text-default-800">
              {isEdit ? "12" : "0"}{" "}
              <span className="text-[11px] font-normal text-default-400">
                件
              </span>
            </p>
          </div>
          <div>
            <span className={labelCls}>いいね数</span>
            <p className="font-bold text-default-800">
              {isEdit ? "45" : "0"}{" "}
              <span className="text-[11px] font-normal text-default-400">
                likes
              </span>
            </p>
          </div>
          <div>
            <span className={labelCls}>最終更新日時</span>
            <p className="text-sm text-default-700 mt-1">
              {isEdit ? "2024/05/15 14:30" : "—"}
            </p>
          </div>
        </div>
      </Section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: ② 画像管理 */}
        <div className="lg:col-span-5 space-y-6">
          <Section index="②" title="画像管理 (1/10)">
            <div className="space-y-4">
              <div className="aspect-square bg-default-50 border-2 border-dashed border-default-200 rounded-xl flex flex-col items-center justify-center text-default-400 gap-2">
                <span className="text-3xl">＋</span>
                <span className="text-xs">メイン画像をアップロード</span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                <div className="aspect-square rounded border border-default-200 bg-default-50 flex items-center justify-center text-default-400 cursor-pointer hover:bg-default-100">
                  ＋
                </div>
                <div className="aspect-square rounded border border-default-200 bg-default-50" />
                <div className="aspect-square rounded border border-default-200 bg-default-50" />
                <div className="aspect-square rounded border border-default-200 bg-default-50" />
                <div className="aspect-square rounded border border-default-200 bg-default-50" />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="flex-1 py-2 text-sm border border-default-200 rounded-lg hover:bg-default-50"
                >
                  並び替え
                </button>
                <button
                  type="button"
                  className="flex-1 py-2 text-sm bg-default-100 text-default-700 rounded-lg hover:bg-default-200"
                >
                  一括追加
                </button>
              </div>
            </div>
          </Section>
        </div>

        {/* Right: ③ 掲載情報 + ④ バリエーション管理 */}
        <div className="lg:col-span-7 space-y-6">
          <Section index="③" title="掲載情報">
            <div className="space-y-4">
              <div>
                <span className={labelCls}>商品説明</span>
                <textarea
                  className={`${inputCls} h-24`}
                  placeholder="商品概要を記入..."
                  defaultValue={initial?.description}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className={labelCls}>注意事項</span>
                  <textarea
                    className={`${inputCls} h-20`}
                    placeholder="交換時の注意点など..."
                  />
                </div>
                <div>
                  <span className={labelCls}>交換条件 / 申請補足</span>
                  <textarea
                    className={`${inputCls} h-20`}
                    placeholder="役職制限、申請時のアンケートなど..."
                  />
                </div>
              </div>
            </div>
          </Section>

          <Section index="④" title="バリエーション管理">
            <table className="w-full text-sm border-collapse">
              <thead className="border-b border-default-200">
                <tr>
                  <th className="p-3 text-left text-[11px] font-semibold text-default-500">
                    サイズ
                  </th>
                  <th className="p-3 text-left text-[11px] font-semibold text-default-500">
                    カラー
                  </th>
                  <th className="p-3 text-left text-[11px] font-semibold text-default-500">
                    在庫数
                  </th>
                  <th className="p-3 text-left text-[11px] font-semibold text-default-500">
                    管理コード
                  </th>
                  <th className="p-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-default-100">
                {variations.map((v) => (
                  <tr key={v.id}>
                    <td className="p-3">
                      <input
                        className="w-16 border border-default-200 rounded text-sm py-1 px-2"
                        type="text"
                        defaultValue={v.size}
                      />
                    </td>
                    <td className="p-3">
                      <input
                        className="w-24 border border-default-200 rounded text-sm py-1 px-2"
                        type="text"
                        defaultValue={v.color}
                      />
                    </td>
                    <td className="p-3">
                      <input
                        className="w-20 border border-default-200 rounded text-sm py-1 px-2"
                        type="number"
                        defaultValue={v.stock}
                      />
                    </td>
                    <td className="p-3 text-xs text-default-500">
                      <input
                        className="w-32 border border-default-200 rounded text-sm py-1 px-2"
                        type="text"
                        defaultValue={v.code}
                        placeholder="自動採番"
                      />
                    </td>
                    <td className="p-3 text-right">
                      <button
                        type="button"
                        className="text-red-500 hover:text-red-600 text-sm"
                        aria-label="削除"
                      >
                        削除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button
              type="button"
              className="mt-4 flex items-center gap-1 text-primary text-sm font-bold hover:underline"
            >
              <span aria-hidden>＋</span> バリエーションを追加
            </button>
          </Section>
        </div>
      </div>

      {/* ⑤ サイズ・仕様情報 */}
      <Section index="⑤" title="サイズ・仕様情報">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <h4 className="text-[11px] font-semibold text-default-500 uppercase tracking-wider">
              サイズ表設定
            </h4>
            <table className="w-full text-sm border border-default-200">
              <tbody>
                <tr className="bg-default-50">
                  <th className="p-2 border border-default-200">サイズ</th>
                  <th className="p-2 border border-default-200">身丈</th>
                  <th className="p-2 border border-default-200">身幅</th>
                  <th className="p-2 border border-default-200">肩幅</th>
                </tr>
                {["S", "M"].map((s) => (
                  <tr key={s}>
                    <td className="p-2 border border-default-200 text-center font-bold">
                      {s}
                    </td>
                    {[0, 1, 2].map((c) => (
                      <td key={c} className="p-2 border border-default-200">
                        <input
                          className="w-full border-none p-0 text-center text-sm focus:ring-0 outline-none"
                          type="text"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className={labelCls}>素材</span>
              <input className={inputCls} type="text" placeholder="綿100%" />
            </div>
            <div>
              <span className={labelCls}>原産国</span>
              <input className={inputCls} type="text" placeholder="日本" />
            </div>
            <div>
              <span className={labelCls}>重量</span>
              <input className={inputCls} type="text" placeholder="180g" />
            </div>
            <div>
              <span className={labelCls}>洗濯方法</span>
              <input
                className={inputCls}
                type="text"
                placeholder="洗濯機洗い可"
              />
            </div>
          </div>
        </div>
      </Section>

      {/* ⑥ 任意属性エリア */}
      <Section index="⑥" title="任意属性エリア">
        <table className="w-full text-sm">
          <thead className="border-b border-default-200">
            <tr>
              <th className="p-3 text-left text-[11px] font-semibold text-default-500">
                項目名
              </th>
              <th className="p-3 text-left text-[11px] font-semibold text-default-500">
                値
              </th>
              <th className="p-3 text-center text-[11px] font-semibold text-default-500">
                ユーザー表示
              </th>
              <th className="p-3 text-center text-[11px] font-semibold text-default-500">
                表示順
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-default-100">
            <tr>
              <td className="p-3">
                <input
                  className={inputCls}
                  type="text"
                  placeholder="例：ブランド"
                />
              </td>
              <td className="p-3">
                <input
                  className={inputCls}
                  type="text"
                  placeholder="値を入力"
                />
              </td>
              <td className="p-3 text-center">
                <input
                  className="rounded text-primary focus:ring-primary"
                  type="checkbox"
                  defaultChecked
                />
              </td>
              <td className="p-3 text-center">
                <input
                  className="w-16 border border-default-200 rounded text-sm text-center py-1"
                  type="number"
                  defaultValue={1}
                />
              </td>
            </tr>
          </tbody>
        </table>
        <button
          type="button"
          className="mt-4 px-4 py-2 bg-default-100 rounded-lg text-sm hover:bg-default-200 transition-colors"
        >
          自由項目を追加
        </button>
      </Section>

      {/* ⑦ 申請・反応データ (edit only) */}
      {isEdit && (
        <Section index="⑦" title="申請・反応データ">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-default-500">交換申請内訳</span>
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  Total: 12
                </span>
              </div>
              <div className="space-y-2">
                {[
                  { label: "承認済み", w: "60%", v: 8, color: "bg-green-500" },
                  { label: "保留中", w: "25%", v: 3, color: "bg-amber-500" },
                  { label: "却下", w: "8%", v: 1, color: "bg-red-500" },
                ].map((row) => (
                  <div key={row.label} className="flex items-center gap-3">
                    <span className="w-20 text-xs text-default-500">
                      {row.label}
                    </span>
                    <div className="flex-1 h-2 bg-default-100 rounded-full overflow-hidden">
                      <div
                        className={`${row.color} h-full`}
                        style={{ width: row.w }}
                      />
                    </div>
                    <span className="text-xs font-bold w-4 text-right">
                      {row.v}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="md:col-span-2 space-y-2">
              <span className="text-sm text-default-500">
                今月の推移 (週別申請数)
              </span>
              <div className="h-24 flex items-end gap-2 px-2 pb-2 pt-4">
                {[
                  { week: "w1", h: "30%", active: false },
                  { week: "w2", h: "50%", active: false },
                  { week: "w3", h: "40%", active: false },
                  { week: "w4", h: "85%", active: true },
                ].map((bar) => (
                  <div
                    key={bar.week}
                    className={`flex-1 rounded-t ${bar.active ? "bg-primary" : "bg-primary/20"}`}
                    style={{ height: bar.h }}
                  />
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-default-500 border-t border-default-200 pt-1">
                <span>Week 1</span>
                <span>Week 2</span>
                <span>Week 3</span>
                <span>Week 4</span>
              </div>
            </div>
          </div>
        </Section>
      )}

      {/* ⑧ 管理メモエリア */}
      <Section index="⑧" title="管理メモエリア">
        <p className="text-xs text-red-500 font-bold mb-3">
          ※ユーザーには表示されません
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <span className={labelCls}>仕入れメモ・入荷予定</span>
            <textarea
              className={`${inputCls} h-28`}
              placeholder="仕入先: ABC商事、次回入荷: 6月中旬予定..."
            />
          </div>
          <div>
            <span className={labelCls}>内部特記事項</span>
            <textarea
              className={`${inputCls} h-28`}
              placeholder="周年記念グッズのため、在庫管理に注意..."
            />
          </div>
        </div>
      </Section>

      {/* Footer actions */}
      <div className="flex items-center justify-between pt-2">
        {isEdit ? (
          <button
            type="button"
            className="text-red-500 text-sm font-bold hover:underline"
          >
            この商品を削除する
          </button>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-3">
          <Link
            href="/company/goods"
            className="px-5 py-2.5 rounded-lg border border-default-200 text-default-600 font-bold text-sm hover:bg-default-50"
          >
            キャンセル
          </Link>
          <button
            type="button"
            className="bg-primary text-white px-6 py-2.5 rounded-lg font-bold text-sm hover:bg-primary/90 shadow-sm"
          >
            {isEdit ? "保存する" : "登録する"}
          </button>
        </div>
      </div>
    </div>
  );
}
