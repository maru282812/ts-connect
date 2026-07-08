"use client";

import { useState } from "react";

type NgTab = "DICTIONARY" | "LOG" | "SETTINGS";

interface NgWord {
  id: string;
  word: string;
  level?: { label: string; tone: string };
  target: string;
  match: string;
  enabled: boolean;
  updatedAt: string;
  updatedBy: string;
}

const TABS: { key: NgTab; label: string }[] = [
  { key: "DICTIONARY", label: "NGワード辞書" },
  { key: "LOG", label: "検知ログ" },
  { key: "SETTINGS", label: "適用設定" },
];

const WORDS: NgWord[] = [
  {
    id: "ng-1",
    word: "死ね",
    level: { label: "厳格", tone: "bg-red-50 text-red-600 border-red-100" },
    target: "すべて",
    match: "部分一致",
    enabled: true,
    updatedAt: "2023/12/01",
    updatedBy: "佐藤 次郎",
  },
  {
    id: "ng-2",
    word: "馬鹿",
    level: {
      label: "標準",
      tone: "bg-orange-50 text-orange-600 border-orange-100",
    },
    target: "本文",
    match: "部分一致",
    enabled: true,
    updatedAt: "2023/11/24",
    updatedBy: "鈴木 一郎",
  },
  {
    id: "ng-3",
    word: "競合社名A",
    level: {
      label: "ポリシー",
      tone: "bg-blue-50 text-blue-600 border-blue-100",
    },
    target: "タイトル",
    match: "完全一致",
    enabled: false,
    updatedAt: "2023/11/15",
    updatedBy: "システム管理者",
  },
  {
    id: "ng-4",
    word: "卑猥語彙",
    target: "本文",
    match: "部分一致",
    enabled: true,
    updatedAt: "2023/10/30",
    updatedBy: "田中 花子",
  },
];

function Toggle({ on }: { on: boolean }) {
  const [checked, setChecked] = useState(on);
  return (
    <button
      type="button"
      onClick={() => setChecked((v) => !v)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
        checked ? "bg-green-500" : "bg-default-200"
      }`}
      aria-pressed={checked}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-[22px]" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

export function NgWordsClient() {
  const [tab, setTab] = useState<NgTab>("DICTIONARY");

  return (
    <div className="max-w-[1600px] mx-auto w-full">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <nav className="flex items-center gap-2 text-default-500 text-sm mb-1">
            <span>管理メニュー</span>
            <span>›</span>
            <span>モデレーション</span>
            <span>›</span>
            <span className="text-primary font-medium">NGワード管理</span>
          </nav>
          <h1 className="text-2xl font-bold text-default-900">NGワード管理</h1>
          <p className="text-sm text-default-500 mt-1">
            投稿・コメントに適用するNGワード辞書と検知の運用を管理します。
          </p>
        </div>
        {tab === "DICTIONARY" && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="flex items-center gap-2 bg-white border border-primary text-primary px-5 py-2.5 rounded-lg font-medium hover:bg-default-50 shadow-sm text-sm"
            >
              CSVインポート
            </button>
            <button
              type="button"
              className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-lg font-medium hover:bg-primary/90 shadow-sm text-sm"
            >
              新規ワード登録
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-default-200 gap-8 mb-6">
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`pb-3 px-2 border-b-2 text-sm transition-colors ${
                active
                  ? "border-primary text-primary font-bold"
                  : "border-transparent text-default-500 hover:text-default-700 font-medium"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "DICTIONARY" && <DictionaryTab />}
      {tab === "LOG" && <LogTab />}
      {tab === "SETTINGS" && <SettingsTab />}
    </div>
  );
}

/* ---------- NGワード辞書 ---------- */

function DictionaryTab() {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* Left: filters + table */}
      <div className="xl:col-span-2 space-y-6">
        <div className="bg-white p-4 rounded-xl border border-default-200 flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <span className="block text-xs text-default-500 mb-1.5 ml-1">
              ワード検索
            </span>
            <input
              className="w-full px-4 py-2 bg-default-50 border border-default-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
              placeholder="キーワードを入力..."
              type="text"
            />
          </div>
          <div className="w-40">
            <span className="block text-xs text-default-500 mb-1.5 ml-1">
              適用対象
            </span>
            <select className="w-full px-3 py-2 bg-default-50 border border-default-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none">
              <option>すべて</option>
              <option>タイトル</option>
              <option>本文</option>
            </select>
          </div>
          <button
            type="button"
            className="px-6 py-2 bg-default-100 text-default-700 font-medium rounded-lg hover:bg-default-200"
          >
            検索
          </button>
        </div>

        <div className="bg-white rounded-xl border border-default-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-default-50">
                <tr>
                  <th className="p-4 border-b border-default-200 text-xs font-bold text-default-500 uppercase">
                    NGワード
                  </th>
                  <th className="p-4 border-b border-default-200 text-xs font-bold text-default-500 uppercase">
                    適用対象
                  </th>
                  <th className="p-4 border-b border-default-200 text-xs font-bold text-default-500 uppercase">
                    一致方式
                  </th>
                  <th className="p-4 border-b border-default-200 text-xs font-bold text-default-500 uppercase">
                    有効状態
                  </th>
                  <th className="p-4 border-b border-default-200 text-xs font-bold text-default-500 uppercase">
                    最終更新
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-default-100">
                {WORDS.map((w) => (
                  <tr
                    key={w.id}
                    className="hover:bg-default-50 transition-colors cursor-pointer"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-default-800">
                          {w.word}
                        </span>
                        {w.level && (
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${w.level.tone}`}
                          >
                            {w.level.label}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-default-600">{w.target}</td>
                    <td className="p-4 text-sm text-default-600">{w.match}</td>
                    <td className="p-4">
                      <Toggle on={w.enabled} />
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-default-600">
                        {w.updatedAt}
                      </div>
                      <div className="text-[10px] text-default-400">
                        {w.updatedBy}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-default-200 flex items-center justify-between">
            <p className="text-sm text-default-500">124件中 1-50件を表示</p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="w-8 h-8 flex items-center justify-center bg-primary text-white rounded-lg"
              >
                1
              </button>
              <button
                type="button"
                className="w-8 h-8 flex items-center justify-center hover:bg-default-100 text-default-600 rounded-lg"
              >
                2
              </button>
              <button
                type="button"
                className="w-8 h-8 flex items-center justify-center hover:bg-default-100 text-default-600 rounded-lg"
              >
                3
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right: edit pane */}
      <aside className="bg-white rounded-xl border border-default-200 overflow-hidden flex flex-col">
        <div className="p-5 border-b border-default-100 bg-default-50">
          <h3 className="font-bold text-default-800">ワード詳細・編集</h3>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <span className="block text-xs text-default-500 mb-2">
              NGワード <span className="text-red-500">*</span>
            </span>
            <input
              className="w-full px-4 py-2.5 bg-default-50 border border-default-200 rounded-lg text-sm font-bold focus:ring-2 focus:ring-primary outline-none"
              type="text"
              defaultValue="死ね"
            />
          </div>
          <div>
            <span className="block text-xs text-default-500 mb-2">
              重要度レベル
            </span>
            <div className="grid grid-cols-3 gap-2">
              {["ポリシー", "標準", "厳格"].map((lv) => (
                <button
                  key={lv}
                  type="button"
                  className={`py-2 text-center text-sm border rounded-lg transition-all ${
                    lv === "標準"
                      ? "bg-orange-50 border-orange-500 text-orange-700"
                      : "bg-default-50 border-default-200 text-default-500"
                  }`}
                >
                  {lv}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="block text-xs text-default-500 mb-2">
              一致方式
            </span>
            <div className="flex gap-4">
              {["完全一致", "部分一致"].map((m) => (
                <label
                  key={m}
                  className="flex items-center gap-2 cursor-pointer text-sm text-default-700"
                >
                  <input
                    type="radio"
                    name="ng-match"
                    defaultChecked={m === "部分一致"}
                    className="text-primary focus:ring-primary"
                  />
                  {m}
                </label>
              ))}
            </div>
          </div>
          <div>
            <span className="block text-xs text-default-500 mb-2">
              検知時のアクション
            </span>
            <select className="w-full px-4 py-2.5 bg-default-50 border border-default-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none">
              <option>ブロック (送信させない)</option>
              <option>警告 (確認ダイアログを表示)</option>
              <option>管理者通知のみ</option>
            </select>
          </div>
          <div>
            <span className="block text-xs text-default-500 mb-2">
              説明・登録理由
            </span>
            <textarea
              className="w-full px-4 py-2.5 bg-default-50 border border-default-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
              rows={3}
              defaultValue="攻撃的な言動、および生命への脅迫に該当するため一律禁止。"
            />
          </div>
          <div>
            <span className="block text-xs text-default-500 mb-3">
              適用機能
            </span>
            <div className="space-y-2">
              {[
                { label: "困りごと (Q&A)", checked: true },
                { label: "企画・アイデア", checked: true },
                { label: "社内SNS", checked: true },
                { label: "プロフィール・社員検索", checked: false },
              ].map((f) => (
                <label
                  key={f.label}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    defaultChecked={f.checked}
                    className="rounded border-default-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-default-600">{f.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="p-6 border-t border-default-100 bg-default-50 flex gap-3 mt-auto">
          <button
            type="button"
            className="flex-1 py-2.5 bg-primary text-white font-bold rounded-lg hover:bg-primary/90"
          >
            更新内容を保存
          </button>
          <button
            type="button"
            className="px-4 py-2.5 bg-white border border-default-200 text-default-600 font-medium rounded-lg hover:bg-default-100"
          >
            キャンセル
          </button>
        </div>
      </aside>
    </div>
  );
}

/* ---------- 検知ログ ---------- */

interface DetectionLog {
  id: string;
  detectedAt: string;
  word: string;
  feature: string;
  user: string;
  excerpt: string;
  action: { label: string; tone: string };
}

const LOGS: DetectionLog[] = [
  {
    id: "log-1",
    detectedAt: "2023/12/01 14:32",
    word: "死ね",
    feature: "社内SNS",
    user: "山田 太郎",
    excerpt: "…そんなの〇〇しろって話で…",
    action: {
      label: "ブロック",
      tone: "bg-red-50 text-red-600 border-red-100",
    },
  },
  {
    id: "log-2",
    detectedAt: "2023/12/01 11:05",
    word: "競合社名A",
    feature: "困りごと (Q&A)",
    user: "鈴木 花子",
    excerpt: "…〇〇社の事例だと…",
    action: {
      label: "管理者通知",
      tone: "bg-blue-50 text-blue-600 border-blue-100",
    },
  },
  {
    id: "log-3",
    detectedAt: "2023/11/30 18:47",
    word: "馬鹿",
    feature: "企画・アイデア",
    user: "佐藤 次郎",
    excerpt: "…そんな〇〇げた案は…",
    action: {
      label: "警告",
      tone: "bg-orange-50 text-orange-600 border-orange-100",
    },
  },
];

function LogTab() {
  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-xl border border-default-200 flex flex-wrap items-end gap-4">
        <div className="w-44">
          <span className="block text-xs text-default-500 mb-1.5 ml-1">
            期間
          </span>
          <select className="w-full px-3 py-2 bg-default-50 border border-default-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none">
            <option>過去7日間</option>
            <option>過去30日間</option>
            <option>すべて</option>
          </select>
        </div>
        <div className="w-44">
          <span className="block text-xs text-default-500 mb-1.5 ml-1">
            対象機能
          </span>
          <select className="w-full px-3 py-2 bg-default-50 border border-default-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none">
            <option>すべて</option>
            <option>社内SNS</option>
            <option>困りごと (Q&A)</option>
            <option>企画・アイデア</option>
          </select>
        </div>
        <div className="w-44">
          <span className="block text-xs text-default-500 mb-1.5 ml-1">
            実行アクション
          </span>
          <select className="w-full px-3 py-2 bg-default-50 border border-default-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none">
            <option>すべて</option>
            <option>ブロック</option>
            <option>警告</option>
            <option>管理者通知</option>
          </select>
        </div>
        <div className="flex-1 min-w-[180px]">
          <span className="block text-xs text-default-500 mb-1.5 ml-1">
            ワード検索
          </span>
          <input
            className="w-full px-4 py-2 bg-default-50 border border-default-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
            placeholder="検知ワードで絞り込み..."
            type="text"
          />
        </div>
        <button
          type="button"
          className="px-6 py-2 bg-default-100 text-default-700 font-medium rounded-lg hover:bg-default-200"
        >
          絞り込み
        </button>
        <button
          type="button"
          className="px-4 py-2 bg-white border border-default-200 text-default-600 font-medium rounded-lg hover:bg-default-50"
        >
          CSVエクスポート
        </button>
      </div>

      <div className="bg-white rounded-xl border border-default-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-default-50">
              <tr>
                <th className="p-4 border-b border-default-200 text-xs font-bold text-default-500 uppercase">
                  検知日時
                </th>
                <th className="p-4 border-b border-default-200 text-xs font-bold text-default-500 uppercase">
                  検知ワード
                </th>
                <th className="p-4 border-b border-default-200 text-xs font-bold text-default-500 uppercase">
                  対象機能
                </th>
                <th className="p-4 border-b border-default-200 text-xs font-bold text-default-500 uppercase">
                  投稿者
                </th>
                <th className="p-4 border-b border-default-200 text-xs font-bold text-default-500 uppercase">
                  一致箇所(抜粋)
                </th>
                <th className="p-4 border-b border-default-200 text-xs font-bold text-default-500 uppercase">
                  実行アクション
                </th>
                <th className="p-4 border-b border-default-200 text-xs font-bold text-default-500 uppercase text-right">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-default-100">
              {LOGS.map((l) => (
                <tr
                  key={l.id}
                  className="hover:bg-default-50 transition-colors"
                >
                  <td className="p-4 text-sm text-default-600 whitespace-nowrap">
                    {l.detectedAt}
                  </td>
                  <td className="p-4">
                    <span className="font-bold text-red-500 text-sm">
                      {l.word}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-default-600">{l.feature}</td>
                  <td className="p-4 text-sm text-default-700">{l.user}</td>
                  <td className="p-4 text-sm text-default-500 max-w-[220px] truncate">
                    {l.excerpt}
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2.5 py-0.5 text-[11px] font-bold rounded-full border ${l.action.tone}`}
                    >
                      {l.action.label}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      type="button"
                      className="text-primary text-xs font-bold hover:underline"
                    >
                      詳細
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-default-200 flex items-center justify-between">
          <p className="text-sm text-default-500">直近 312 件の検知</p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="w-8 h-8 flex items-center justify-center bg-primary text-white rounded-lg"
            >
              1
            </button>
            <button
              type="button"
              className="w-8 h-8 flex items-center justify-center hover:bg-default-100 text-default-600 rounded-lg"
            >
              2
            </button>
            <button
              type="button"
              className="w-8 h-8 flex items-center justify-center hover:bg-default-100 text-default-600 rounded-lg"
            >
              3
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- 適用設定 ---------- */

function SettingsTab() {
  return (
    <div className="max-w-3xl space-y-6">
      {/* 自動モデレーション */}
      <section className="bg-white rounded-xl border border-default-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-default-200 bg-default-50">
          <h3 className="font-bold text-default-900">自動モデレーション</h3>
          <p className="text-[11px] text-default-400 mt-0.5">
            NGワード検知・通報に対する自動処理のしきい値を設定します。
          </p>
        </div>
        <div className="divide-y divide-default-100">
          <div className="p-6 flex items-center justify-between gap-6">
            <div>
              <p className="text-sm font-bold text-default-800">
                自動非表示閾値
              </p>
              <p className="text-xs text-default-400 mt-0.5">
                指定回数の通報を受けた投稿を自動的に非表示にし、管理者レビュー待ちにします。
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <input
                type="number"
                defaultValue={5}
                min={1}
                className="w-20 px-3 py-2 text-right bg-default-50 border border-default-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
              />
              <span className="text-sm text-default-500">通報</span>
            </div>
          </div>
          <div className="p-6 flex items-center justify-between gap-6">
            <div>
              <p className="text-sm font-bold text-default-800">
                検知時のデフォルトアクション
              </p>
              <p className="text-xs text-default-400 mt-0.5">
                個別ワードで指定がない場合に適用される標準の挙動です。
              </p>
            </div>
            <select className="w-56 px-3 py-2 bg-default-50 border border-default-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none shrink-0">
              <option>ブロック (送信させない)</option>
              <option>警告 (確認ダイアログを表示)</option>
              <option>管理者通知のみ</option>
            </select>
          </div>
          <div className="p-6 flex items-center justify-between gap-6">
            <div>
              <p className="text-sm font-bold text-default-800">
                重複投稿の自動検知
              </p>
              <p className="text-xs text-default-400 mt-0.5">
                短時間に同一内容が連続投稿された場合に自動でフラグを立てます。
              </p>
            </div>
            <Toggle on={true} />
          </div>
        </div>
      </section>

      {/* 適用範囲 */}
      <section className="bg-white rounded-xl border border-default-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-default-200 bg-default-50">
          <h3 className="font-bold text-default-900">適用範囲</h3>
          <p className="text-[11px] text-default-400 mt-0.5">
            新規ワード登録時のデフォルト適用対象です。
          </p>
        </div>
        <div className="p-6 space-y-5">
          <div>
            <span className="block text-xs font-bold text-default-500 uppercase mb-3">
              デフォルト適用機能
            </span>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "困りごと (Q&A)", checked: true },
                { label: "企画・アイデア", checked: true },
                { label: "社内SNS", checked: true },
                { label: "プロフィール・社員検索", checked: false },
              ].map((f) => (
                <label
                  key={f.label}
                  className="flex items-center gap-3 p-3 rounded-lg border border-default-200 hover:bg-default-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    defaultChecked={f.checked}
                    className="rounded border-default-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-default-700">{f.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <span className="block text-xs font-bold text-default-500 uppercase mb-3">
              デフォルト一致方式
            </span>
            <div className="flex gap-4">
              {["完全一致", "部分一致"].map((m) => (
                <label
                  key={m}
                  className="flex items-center gap-2 cursor-pointer text-sm text-default-700"
                >
                  <input
                    type="radio"
                    name="default-match"
                    defaultChecked={m === "部分一致"}
                    className="text-primary focus:ring-primary"
                  />
                  {m}
                </label>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 通知 */}
      <section className="bg-white rounded-xl border border-default-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-default-200 bg-default-50">
          <h3 className="font-bold text-default-900">通知</h3>
        </div>
        <div className="divide-y divide-default-100">
          <div className="p-6 flex items-center justify-between gap-6">
            <div>
              <p className="text-sm font-bold text-default-800">
                検知時に管理者へ通知
              </p>
              <p className="text-xs text-default-400 mt-0.5">
                NGワードが検知された際にモデレーション担当へ通知します。
              </p>
            </div>
            <Toggle on={true} />
          </div>
          <div className="p-6">
            <span className="block text-xs font-bold text-default-500 uppercase mb-2">
              通知先メールアドレス
            </span>
            <input
              type="text"
              defaultValue="moderation@example.com"
              className="w-full px-4 py-2.5 bg-default-50 border border-default-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
            />
          </div>
        </div>
      </section>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          className="px-5 py-2.5 bg-white border border-default-200 text-default-600 font-medium rounded-lg hover:bg-default-50"
        >
          キャンセル
        </button>
        <button
          type="button"
          className="px-6 py-2.5 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 shadow-sm"
        >
          設定を保存
        </button>
      </div>
    </div>
  );
}
