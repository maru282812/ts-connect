"use client";

import Link from "next/link";
import { useState } from "react";

type SettingsTab = "TAGS" | "REWARDS" | "TEMPLATES" | "DISPLAY";

const TABS: { key: SettingsTab; label: string }[] = [
  { key: "TAGS", label: "共通タグ" },
  { key: "REWARDS", label: "報酬ルール" },
  { key: "TEMPLATES", label: "通知テンプレート" },
  { key: "DISPLAY", label: "表示・公開設定" },
];

/* ---------- Shared UI ---------- */

function Toggle({ on }: { on: boolean }) {
  const [checked, setChecked] = useState(on);
  return (
    <button
      type="button"
      onClick={() => setChecked((v) => !v)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
        checked ? "bg-primary" : "bg-default-300"
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

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
        active
          ? "bg-green-50 text-green-600 border-green-200"
          : "bg-default-100 text-default-500 border-default-300"
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          active ? "bg-green-500" : "bg-default-400"
        }`}
      />
      {active ? "有効" : "無効"}
    </span>
  );
}

const FIELD_LABEL = "block text-xs font-bold text-default-500 uppercase mb-2";
const INPUT =
  "w-full border border-default-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary outline-none";

/* ---------- 共通タグ ---------- */

interface Tag {
  id: string;
  name: string;
  dot: string;
  category: string;
  functions: string[];
  count: string;
  active: boolean;
  updatedAt: string;
}

const TAGS: Tag[] = [
  {
    id: "TAG-0042",
    name: "業務改善",
    dot: "bg-primary",
    category: "Post",
    functions: ["投稿", "企画"],
    count: "1,248",
    active: true,
    updatedAt: "2023/10/24 14:20",
  },
  {
    id: "TAG-0051",
    name: "DX推進",
    dot: "bg-teal-500",
    category: "Profile",
    functions: ["プロフィール"],
    count: "856",
    active: true,
    updatedAt: "2023/10/22 09:15",
  },
  {
    id: "TAG-0063",
    name: "福利厚生",
    dot: "bg-amber-500",
    category: "Idea",
    functions: ["投稿"],
    count: "42",
    active: false,
    updatedAt: "2023/10/18 16:50",
  },
];

function TagsTab() {
  const [selected, setSelected] = useState<Tag>(TAGS[0]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div className="xl:col-span-2 space-y-4">
        {/* Filter bar */}
        <div className="bg-white rounded-xl border border-default-200 p-4 flex flex-wrap items-center gap-4">
          <input
            className="flex-1 min-w-[200px] px-4 py-2 border border-default-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
            placeholder="タグ名で検索..."
            type="text"
          />
          <div className="flex items-center gap-2">
            <span className="text-sm text-default-500">カテゴリ:</span>
            <select className="border border-default-200 rounded-lg text-sm px-3 py-2 outline-none focus:ring-2 focus:ring-primary">
              <option>すべて</option>
              <option>Post</option>
              <option>Profile</option>
              <option>Idea</option>
            </select>
          </div>
          <button
            type="button"
            className="ml-auto bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 shadow-sm"
          >
            新規タグを追加
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-default-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-default-50 border-b border-default-200">
                <tr>
                  <th className="px-4 py-3 text-xs text-default-500 uppercase">
                    タグ名
                  </th>
                  <th className="px-4 py-3 text-xs text-default-500 uppercase">
                    カテゴリ
                  </th>
                  <th className="px-4 py-3 text-xs text-default-500 uppercase">
                    対象機能
                  </th>
                  <th className="px-4 py-3 text-xs text-default-500 uppercase">
                    利用件数
                  </th>
                  <th className="px-4 py-3 text-xs text-default-500 uppercase">
                    ステータス
                  </th>
                  <th className="px-4 py-3 text-xs text-default-500 uppercase">
                    最終更新
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-default-100">
                {TAGS.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => setSelected(t)}
                    className={`cursor-pointer transition-colors ${
                      selected.id === t.id
                        ? "bg-primary-50/40"
                        : "hover:bg-primary-50/20"
                    }`}
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <span className={`w-2 h-2 rounded-full ${t.dot}`} />
                        <span className="font-bold text-default-800">
                          {t.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-default-500 text-sm">
                      {t.category}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1">
                        {t.functions.map((f) => (
                          <span
                            key={f}
                            className="px-2 py-0.5 rounded bg-default-100 text-default-600 text-[10px] font-bold"
                          >
                            {f}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm font-bold text-default-800">
                      {t.count}{" "}
                      <span className="text-xs font-normal text-default-400">
                        件
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge active={t.active} />
                    </td>
                    <td className="px-4 py-4 text-sm text-default-500">
                      {t.updatedAt}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-default-200 flex items-center justify-between">
            <span className="text-sm text-default-500">
              全 156 件中 1-3 件を表示
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                className="w-8 h-8 flex items-center justify-center rounded bg-primary text-white font-bold text-xs"
              >
                1
              </button>
              <button
                type="button"
                className="w-8 h-8 flex items-center justify-center rounded border border-default-200 hover:bg-default-50 text-xs"
              >
                2
              </button>
              <button
                type="button"
                className="w-8 h-8 flex items-center justify-center rounded border border-default-200 hover:bg-default-50 text-xs"
              >
                3
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit pane */}
      <aside
        key={selected.id}
        className="bg-white border border-default-200 rounded-xl overflow-hidden flex flex-col self-start"
      >
        <div className="p-5 border-b border-default-200 bg-default-50 flex items-center justify-between">
          <h3 className="font-bold text-default-900">タグ詳細編集</h3>
          <p className="text-xs text-default-400">ID: {selected.id}</p>
        </div>
        <div className="p-5 space-y-5">
          <div>
            <span className={FIELD_LABEL}>タグ名</span>
            <input className={INPUT} type="text" defaultValue={selected.name} />
          </div>
          <div>
            <span className={FIELD_LABEL}>カテゴリ</span>
            <select className={INPUT} defaultValue={selected.category}>
              <option>Post</option>
              <option>Profile</option>
              <option>Idea</option>
            </select>
          </div>
          <div>
            <span className={FIELD_LABEL}>対象機能</span>
            <div className="space-y-2">
              {["投稿", "プロフィール", "企画"].map((f) => (
                <label
                  key={f}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-default-50 cursor-pointer border border-transparent"
                >
                  <input
                    type="checkbox"
                    defaultChecked={selected.functions.includes(f)}
                    className="w-4 h-4 rounded border-default-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-default-800">{f}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-default-50 rounded-lg border border-default-200">
            <div>
              <p className="text-sm font-bold text-default-800">ステータス</p>
              <p className="text-[10px] text-default-500">
                このタグをサイト全体で有効化します
              </p>
            </div>
            <Toggle on={selected.active} />
          </div>
          <div>
            <span className={FIELD_LABEL}>表記ゆれ統合先</span>
            <input
              className={INPUT}
              type="text"
              placeholder="統合先のタグを選択..."
            />
            <p className="mt-1 text-[10px] text-default-500">
              複数のタグを1つに統合する場合に設定します。
            </p>
          </div>
        </div>
        <div className="p-5 border-t border-default-200 space-y-3 mt-auto">
          <button
            type="button"
            className="w-full bg-primary text-white py-2.5 rounded-lg text-sm font-bold hover:bg-primary/90 shadow-sm"
          >
            変更内容を保存
          </button>
          <button
            type="button"
            className="w-full border border-default-200 rounded-lg py-2.5 text-sm font-bold hover:bg-default-50"
          >
            キャンセル
          </button>
          <button
            type="button"
            className="w-full text-red-500 py-2 text-xs font-bold hover:bg-red-50 rounded-lg transition-colors"
          >
            このタグを削除
          </button>
        </div>
      </aside>
    </div>
  );
}

/* ---------- 報酬ルール ---------- */

interface RewardRule {
  id: string;
  name: string;
  action: string;
  rewardType: string;
  amount: string;
  monthlyCap: string;
  active: boolean;
}

const REWARD_RULES: RewardRule[] = [
  {
    id: "SNS-001",
    name: "社内SNS「いいね」還元",
    action: "いいね",
    rewardType: "社内ポイント",
    amount: "10pt",
    monthlyCap: "2,000pt",
    active: true,
  },
  {
    id: "PLAN-102",
    name: "新事業企画 採用ボーナス",
    action: "企画採用",
    rewardType: "Amazonギフト",
    amount: "5,000円",
    monthlyCap: "50,000円",
    active: true,
  },
  {
    id: "HELP-005",
    name: "困りごと解決サンクス",
    action: "困りごと解決",
    rewardType: "社内ポイント",
    amount: "50pt",
    monthlyCap: "5,000pt",
    active: true,
  },
  {
    id: "MVP-2024",
    name: "月間MVP 特別報酬",
    action: "特別選定",
    rewardType: "社内通貨",
    amount: "10,000c",
    monthlyCap: "10,000c",
    active: false,
  },
];

function RewardsTab() {
  const [selected, setSelected] = useState<RewardRule>(REWARD_RULES[0]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* Table */}
      <div className="xl:col-span-2 bg-white rounded-xl border border-default-200 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-default-200 flex justify-between items-center bg-default-50">
          <h3 className="font-bold text-default-900">登録済みルール一覧</h3>
          <button
            type="button"
            className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 shadow-sm"
          >
            新規ルール作成
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-default-50 border-b border-default-200">
              <tr>
                <th className="px-4 py-3 text-xs text-default-500 uppercase">
                  ルール名
                </th>
                <th className="px-4 py-3 text-xs text-default-500 uppercase">
                  対象アクション
                </th>
                <th className="px-4 py-3 text-xs text-default-500 uppercase">
                  報酬種別
                </th>
                <th className="px-4 py-3 text-xs text-default-500 uppercase">
                  設定額
                </th>
                <th className="px-4 py-3 text-xs text-default-500 uppercase">
                  月次上限
                </th>
                <th className="px-4 py-3 text-xs text-default-500 uppercase">
                  ステータス
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-default-100">
              {REWARD_RULES.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => setSelected(r)}
                  className={`cursor-pointer transition-colors ${
                    selected.id === r.id
                      ? "bg-primary-50/40 border-l-4 border-primary"
                      : "hover:bg-primary-50/20"
                  }`}
                >
                  <td className="px-4 py-3">
                    <div className="text-sm font-bold text-default-800">
                      {r.name}
                    </div>
                    <div className="text-[10px] text-default-400">{r.id}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="bg-primary-50 text-primary px-2 py-0.5 rounded text-[11px] font-medium">
                      {r.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-default-600">
                    {r.rewardType}
                  </td>
                  <td className="px-4 py-3 text-sm text-default-800">
                    {r.amount}
                  </td>
                  <td className="px-4 py-3 text-sm text-default-600">
                    {r.monthlyCap}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        r.active
                          ? "bg-green-50 text-green-600"
                          : "bg-default-100 text-default-500"
                      }`}
                    >
                      {r.active ? "有効" : "停止中"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit pane */}
      <aside
        key={selected.id}
        className="bg-white border border-default-200 rounded-xl overflow-hidden flex flex-col self-start"
      >
        <div className="p-4 border-b border-default-200 bg-default-50 flex items-center justify-between">
          <h3 className="font-bold text-default-900">ルール詳細編集</h3>
          <Link
            href={`/company/master/system-settings/rewards/${selected.id}`}
            className="text-xs font-bold text-primary hover:underline"
          >
            詳細を開く
          </Link>
        </div>
        <div className="p-5 space-y-5">
          <div>
            <span className={FIELD_LABEL}>ルール名</span>
            <input className={INPUT} type="text" defaultValue={selected.name} />
          </div>
          <div>
            <span className={FIELD_LABEL}>対象機能</span>
            <select className={INPUT} defaultValue="社内SNS">
              <option>社内SNS</option>
              <option>困りごと掲示板</option>
              <option>企画・アイデア公募</option>
            </select>
          </div>
          <div>
            <span className={FIELD_LABEL}>アクション種別</span>
            <div className="flex flex-wrap gap-2">
              {["いいね", "コメント投稿", "記事作成"].map((a, i) => (
                <label
                  key={a}
                  className={`px-3 py-1.5 rounded border cursor-pointer text-sm ${
                    i === 0
                      ? "border-primary bg-primary-50 text-primary"
                      : "border-default-200 hover:bg-default-50 text-default-700"
                  }`}
                >
                  <input
                    type="radio"
                    name={`action-${selected.id}`}
                    defaultChecked={i === 0}
                    className="hidden"
                  />
                  {a}
                </label>
              ))}
            </div>
          </div>
          <div className="p-4 bg-default-50 rounded-lg border border-default-200 space-y-4">
            <h4 className="text-xs font-bold text-default-700 border-b border-default-200 pb-2">
              報酬換算設定
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="block text-[11px] text-default-500 mb-1">
                  換算レート
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm">1いいね ＝</span>
                  <input
                    type="number"
                    defaultValue={10}
                    className="w-16 border border-default-200 rounded p-1.5 text-sm text-right"
                  />
                  <span className="text-sm font-bold">pt</span>
                </div>
              </div>
              <div>
                <span className="block text-[11px] text-default-500 mb-1">
                  報酬種別
                </span>
                <select className="w-full border border-default-200 rounded p-1.5 text-sm">
                  <option>社内ポイント</option>
                  <option>Amazonギフト</option>
                  <option>社内通貨</option>
                </select>
              </div>
            </div>
          </div>
          <div>
            <span className={FIELD_LABEL}>支給条件</span>
            <textarea
              className={`${INPUT} min-h-[80px]`}
              defaultValue="即時反映（いいねされたタイミング）"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className={FIELD_LABEL}>月次支給上限額</span>
              <div className="relative">
                <input
                  className={`${INPUT} text-right pr-8`}
                  type="text"
                  defaultValue="2,000"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-default-400 text-sm">
                  pt
                </span>
              </div>
            </div>
            <div>
              <span className={FIELD_LABEL}>適用優先度</span>
              <input className={INPUT} type="number" defaultValue={1} />
            </div>
          </div>
          <div>
            <span className={FIELD_LABEL}>有効期間</span>
            <div className="flex items-center gap-2">
              <input className={INPUT} type="date" defaultValue="2024-04-01" />
              <span className="text-default-400">～</span>
              <input className={INPUT} type="date" defaultValue="2025-03-31" />
            </div>
          </div>
        </div>
        <div className="p-5 border-t border-default-200 flex justify-end gap-3 mt-auto">
          <button
            type="button"
            className="px-4 py-2.5 text-sm font-bold text-default-600 hover:bg-default-50 rounded-lg"
          >
            キャンセル
          </button>
          <button
            type="button"
            className="px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 shadow-sm"
          >
            保存する
          </button>
        </div>
      </aside>
    </div>
  );
}

/* ---------- 通知テンプレート ---------- */

interface Template {
  id: string;
  name: string;
  subName: string;
  trigger: string;
  channels: string[];
  published: boolean;
  updatedAt: string;
}

const TEMPLATES: Template[] = [
  {
    id: "tpl-1",
    name: "本人確認承認完了",
    subName: "Identity verification approved",
    trigger: "審査ステータス: 承認",
    channels: ["MAIL", "APP"],
    published: true,
    updatedAt: "2023/11/24",
  },
  {
    id: "tpl-2",
    name: "新規メッセージ着信",
    subName: "New message received",
    trigger: "メッセージ受信",
    channels: ["APP"],
    published: true,
    updatedAt: "2023/11/20",
  },
  {
    id: "tpl-3",
    name: "報酬振込完了",
    subName: "Payment transfer complete",
    trigger: "振込完了ステータス更新",
    channels: ["MAIL"],
    published: true,
    updatedAt: "2023/11/15",
  },
  {
    id: "tpl-4",
    name: "パスワードリセット要求",
    subName: "Password reset request",
    trigger: "再発行リクエスト受信",
    channels: ["MAIL"],
    published: false,
    updatedAt: "2023/11/02",
  },
];

const TEMPLATE_BODY = `{user_name} 様

いつもWorkMarketをご利用いただきありがとうございます。
ご提出いただいた本人確認書類の審査が完了いたしました。

本日より、すべてのプラットフォーム機能（報酬の出金、プレミアム案件への応募など）がご利用いただけます。

■ ログインはこちら
https://workmarket-app.jp/login

今後ともWorkMarketをよろしくお願い申し上げます。`;

function TemplatesTab() {
  const [selected, setSelected] = useState<Template>(TEMPLATES[0]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* Table */}
      <div className="xl:col-span-2 bg-white rounded-xl border border-default-200 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-default-200 flex justify-between items-center bg-default-50">
          <h3 className="font-bold text-default-900">テンプレート一覧</h3>
          <div className="flex gap-2">
            <input
              className="px-4 py-1.5 border border-default-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none w-48"
              placeholder="テンプレート検索..."
              type="text"
            />
            <button
              type="button"
              className="bg-primary text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-primary/90 shadow-sm"
            >
              新規作成
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-default-50 border-b border-default-200">
              <tr>
                <th className="px-4 py-3 text-xs text-default-500 uppercase">
                  通知名
                </th>
                <th className="px-4 py-3 text-xs text-default-500 uppercase">
                  送信トリガー
                </th>
                <th className="px-4 py-3 text-xs text-default-500 uppercase">
                  通知手段
                </th>
                <th className="px-4 py-3 text-xs text-default-500 uppercase">
                  公開状態
                </th>
                <th className="px-4 py-3 text-xs text-default-500 uppercase">
                  最終更新日
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-default-100">
              {TEMPLATES.map((t) => (
                <tr
                  key={t.id}
                  onClick={() => setSelected(t)}
                  className={`cursor-pointer transition-colors ${
                    selected.id === t.id
                      ? "bg-primary-50/40"
                      : "hover:bg-primary-50/20"
                  }`}
                >
                  <td className="px-4 py-3">
                    <div className="text-sm font-bold text-default-800">
                      {t.name}
                    </div>
                    <div className="text-xs text-default-400">{t.subName}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-default-600">
                    {t.trigger}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {t.channels.map((c) => (
                        <span
                          key={c}
                          className="bg-default-100 text-default-600 px-2 py-0.5 rounded text-[10px] font-bold"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                        t.published
                          ? "bg-green-50 text-green-600 border-green-200"
                          : "bg-default-100 text-default-500 border-default-300"
                      }`}
                    >
                      {t.published ? "公開中" : "非公開"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-default-400">
                    {t.updatedAt}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit pane */}
      <aside
        key={selected.id}
        className="bg-white border border-default-200 rounded-xl overflow-hidden flex flex-col self-start"
      >
        <div className="p-4 border-b border-default-200 bg-default-50">
          <h3 className="font-bold text-default-900">詳細編集</h3>
        </div>
        <div className="p-5 space-y-5">
          <div>
            <span className={FIELD_LABEL}>テンプレート名</span>
            <input className={INPUT} type="text" defaultValue={selected.name} />
          </div>
          <div>
            <span className={FIELD_LABEL}>送信タイミング</span>
            <select className={INPUT} defaultValue={selected.trigger}>
              <option>{selected.trigger}</option>
              <option>審査ステータス: 却下</option>
              <option>会員登録完了</option>
            </select>
          </div>
          <div>
            <span className={FIELD_LABEL}>件名</span>
            <input
              className={INPUT}
              type="text"
              defaultValue="【WorkMarket】本人確認が完了しました"
            />
          </div>
          <div>
            <span className={FIELD_LABEL}>本文</span>
            <textarea
              className={`${INPUT} min-h-[180px] font-mono text-xs leading-relaxed`}
              defaultValue={TEMPLATE_BODY}
            />
          </div>
          <div className="bg-default-50 rounded-lg p-3 border border-default-200">
            <p className="text-xs font-bold text-default-600 mb-2">
              利用可能な変数
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                "{user_name}",
                "{approval_date}",
                "{login_url}",
                "{support_email}",
              ].map((v) => (
                <button
                  key={v}
                  type="button"
                  className="px-2 py-1 bg-white border border-default-200 rounded text-[10px] text-primary font-mono hover:bg-primary-50"
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="p-5 border-t border-default-200 space-y-2 mt-auto">
          <button
            type="button"
            className="w-full py-2 bg-default-100 text-default-600 rounded-lg text-sm font-bold hover:bg-default-200"
          >
            プレビュー
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              className="flex-1 py-2.5 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 shadow-sm"
            >
              保存する
            </button>
            <button
              type="button"
              className="px-4 py-2.5 border border-red-300 text-red-500 rounded-lg text-sm font-bold hover:bg-red-50"
            >
              削除
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}

/* ---------- 表示・公開設定 ---------- */

interface DisplaySetting {
  id: string;
  category: string;
  title: string;
  value: string;
  description: string;
  note: string;
}

const DISPLAY_SETTINGS: DisplaySetting[] = [
  {
    id: "default-visibility",
    category: "コンテンツ設定",
    title: "デフォルト公開範囲",
    value: "全社公開",
    description: "新規投稿時の標準設定。ユーザーが変更可能な範囲を規定します。",
    note: "この設定を変更すると、今後作成されるすべての投稿に適用されます。既存の投稿の公開範囲は変更されません。",
  },
  {
    id: "point-visibility",
    category: "UI表示設定",
    title: "ポイント表示の有無",
    value: "表示ON",
    description: "ナビゲーションバーおよびプロフィールでの表示",
    note: "OFFに設定すると、ユーザー画面上のあらゆる場所からポイント残高や報酬に関連するUIが隠されます。",
  },
  {
    id: "name-format",
    category: "UI表示設定",
    title: "社員名の表示形式",
    value: "姓名 (漢字)",
    description: "姓 名（フリガナ）/ 社員番号の付与など",
    note: "全画面における社員名のレンダリング規則を指定します。",
  },
  {
    id: "dept-depth",
    category: "UI表示設定",
    title: "部署選択の最大階層",
    value: "第4階層まで",
    description: "ピッカーで表示する組織階層の深さ",
    note: "深い組織階層を持つ企業の場合、この値を制限することで部署ピッカーの操作性を向上させることができます。",
  },
];

const FEATURE_FLAGS = [
  {
    id: "ai-summary",
    label: "AIサマリー機能",
    description:
      "投稿内容をAIが要約し、インサイトを提供する機能を有効にします。",
    on: false,
  },
  {
    id: "event-calendar",
    label: "社内イベントカレンダー",
    description:
      "全社規模のイベントをダッシュボードに表示する機能を有効にします。",
    on: true,
  },
];

function DisplayTab() {
  const [selected, setSelected] = useState<DisplaySetting | null>(null);
  const contentSettings = DISPLAY_SETTINGS.filter(
    (s) => s.category === "コンテンツ設定",
  );
  const uiSettings = DISPLAY_SETTINGS.filter(
    (s) => s.category === "UI表示設定",
  );

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div className="xl:col-span-2 space-y-8">
        {/* コンテンツ設定 */}
        <section>
          <h2 className="font-bold text-default-900 mb-4">コンテンツ設定</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {contentSettings.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSelected(s)}
                className={`text-left bg-white p-5 rounded-xl border shadow-sm transition-all ${
                  selected?.id === s.id
                    ? "border-primary ring-1 ring-primary"
                    : "border-default-200 hover:border-primary"
                }`}
              >
                <p className="text-sm font-bold text-default-500 mb-1">
                  {s.title}
                </p>
                <p className="text-lg font-bold text-default-900">{s.value}</p>
                <p className="text-xs text-default-400 mt-2 leading-relaxed">
                  {s.description}
                </p>
              </button>
            ))}
          </div>
        </section>

        {/* UI表示設定 */}
        <section>
          <h2 className="font-bold text-default-900 mb-4">UI表示設定</h2>
          <div className="bg-white rounded-xl border border-default-200 shadow-sm divide-y divide-default-100">
            {uiSettings.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSelected(s)}
                className={`w-full text-left p-4 flex items-center justify-between transition-colors ${
                  selected?.id === s.id
                    ? "bg-primary-50/30"
                    : "hover:bg-default-50"
                }`}
              >
                <div>
                  <p className="text-sm font-bold text-default-800">
                    {s.title}
                  </p>
                  <p className="text-xs text-default-400">{s.description}</p>
                </div>
                <span className="text-sm text-default-600">{s.value}</span>
              </button>
            ))}
          </div>
        </section>

        {/* 機能フラグ */}
        <section>
          <h2 className="font-bold text-default-900 mb-4">機能フラグ</h2>
          <div className="bg-white rounded-xl border border-default-200 shadow-sm overflow-hidden">
            <div className="p-3 bg-default-50 border-b border-default-200">
              <p className="text-xs font-bold text-default-500 uppercase">
                先行リリース・試験機能
              </p>
            </div>
            <div className="divide-y divide-default-100">
              {FEATURE_FLAGS.map((f) => (
                <div
                  key={f.id}
                  className="p-4 flex items-center justify-between"
                >
                  <div className="pr-4">
                    <p className="text-sm font-bold text-default-800">
                      {f.label}
                    </p>
                    <p className="text-xs text-default-400">{f.description}</p>
                  </div>
                  <Toggle on={f.on} />
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Detail pane */}
      <aside className="bg-white border border-default-200 rounded-xl overflow-hidden flex flex-col self-start min-h-[300px]">
        {selected ? (
          <div className="flex flex-col h-full" key={selected.id}>
            <div className="p-5 border-b border-default-200">
              <span className="text-xs font-bold text-primary uppercase block mb-1">
                {selected.category}
              </span>
              <h3 className="font-bold text-default-900">{selected.title}</h3>
            </div>
            <div className="p-5 space-y-5 flex-1">
              <div>
                <span className={FIELD_LABEL}>設定値</span>
                <input
                  className={INPUT}
                  type="text"
                  defaultValue={selected.value}
                />
              </div>
              <div className="bg-primary-50 p-4 rounded-lg border border-primary-100">
                <p className="text-xs font-bold text-primary mb-1">
                  影響範囲の注釈
                </p>
                <p className="text-xs text-default-600 leading-relaxed">
                  {selected.note}
                </p>
              </div>
            </div>
            <div className="p-5 border-t border-default-200 space-y-2">
              <button
                type="button"
                className="w-full bg-primary text-white py-2.5 rounded-lg text-sm font-bold hover:bg-primary/90 shadow-sm"
              >
                設定を保存する
              </button>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="w-full border border-default-200 rounded-lg py-2 text-sm font-bold hover:bg-default-50"
              >
                キャンセル
              </button>
              <p className="text-[10px] text-center text-default-400">
                ※保存すると全ユーザーに即時反映されます。
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center text-default-400 p-10">
            <p className="text-sm font-bold">項目を選択して設定</p>
            <p className="text-xs mt-1">
              左側のリストから設定したい項目をクリックしてください
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}

/* ---------- Root ---------- */

export function SystemSettingsClient() {
  const [tab, setTab] = useState<SettingsTab>("TAGS");

  return (
    <div className="max-w-[1600px] mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-default-900">
          全社共通マスター設定
        </h1>
        <p className="text-sm text-default-500 mt-1">
          システムの根幹となる共通設定を一括管理します。
        </p>
      </div>

      {/* Tabs */}
      <nav className="bg-white border border-default-200 rounded-t-xl flex gap-8 overflow-x-auto px-8">
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`py-4 border-b-2 text-sm whitespace-nowrap transition-colors ${
                active
                  ? "border-primary text-primary font-bold"
                  : "border-transparent text-default-500 hover:text-primary"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </nav>

      <div className="bg-default-50 border-x border-b border-default-200 rounded-b-xl p-6">
        {tab === "TAGS" && <TagsTab />}
        {tab === "REWARDS" && <RewardsTab />}
        {tab === "TEMPLATES" && <TemplatesTab />}
        {tab === "DISPLAY" && <DisplayTab />}
      </div>
    </div>
  );
}
