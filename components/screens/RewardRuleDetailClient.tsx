"use client";

import Link from "next/link";
import { useState } from "react";

interface RuleSummary {
  id: string;
  name: string;
  category: string;
  amount: string;
  unit: string;
  active: boolean;
  updatedAt: string;
}

const RULES: RuleSummary[] = [
  {
    id: "SNS-001",
    name: "社内SNS「いいね」還元",
    category: "社内SNS",
    amount: "10",
    unit: "pt",
    active: true,
    updatedAt: "2024.04.15",
  },
  {
    id: "PLAN-102",
    name: "新事業企画 採用ボーナス",
    category: "企画・アイデア",
    amount: "5,000",
    unit: "円",
    active: true,
    updatedAt: "2024.03.20",
  },
  {
    id: "HELP-005",
    name: "困りごと解決サンクス",
    category: "困りごと解決",
    amount: "50",
    unit: "pt",
    active: true,
    updatedAt: "2024.02.10",
  },
  {
    id: "MVP-2024",
    name: "月間MVP 特別報酬",
    category: "特別選定",
    amount: "10,000",
    unit: "c",
    active: false,
    updatedAt: "2024.01.05",
  },
];

interface RuleDetail {
  summary: RuleSummary;
  description: string;
  pointsPerAction: string;
  pointsUnit: string;
  monthlyCap: string;
  monthlyMaxCount: string;
  targetAction: string;
  conditions: string[];
  startDate: string;
  endDate: string;
  priority: string;
}

const DETAILS: Record<string, RuleDetail> = {
  "SNS-001": {
    summary: RULES[0],
    description:
      "社内SNSにおいて、投稿に対して他のユーザーから「いいね」を受け取った際に付与される報酬設定です。ポジティブなコミュニケーションの活性化を目的としています。",
    pointsPerAction: "10",
    pointsUnit: "pt",
    monthlyCap: "2,000 pt",
    monthlyMaxCount: "200 回",
    targetAction: "いいね受信",
    conditions: [
      "本人が作成した記事へのリアクション",
      "同一ユーザーからの連続付与は無効",
      "即時反映（システム連携）",
    ],
    startDate: "2024年4月1日",
    endDate: "2025年3月31日",
    priority: "1 (最高)",
  },
};

function buildFallback(summary: RuleSummary): RuleDetail {
  return {
    summary,
    description: `${summary.category}に関する報酬ルールの詳細設定です。`,
    pointsPerAction: summary.amount,
    pointsUnit: summary.unit,
    monthlyCap: "—",
    monthlyMaxCount: "—",
    targetAction: summary.category,
    conditions: ["即時反映（システム連携）"],
    startDate: "2024年4月1日",
    endDate: "2025年3月31日",
    priority: "1 (最高)",
  };
}

export function RewardRuleDetailClient({ ruleId }: { ruleId: string }) {
  const [wizardOpen, setWizardOpen] = useState(false);

  const summary = RULES.find((r) => r.id === ruleId) ?? RULES[0];
  const detail = DETAILS[summary.id] ?? buildFallback(summary);

  return (
    <div className="max-w-[1600px] mx-auto w-full">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-default-500 mb-2">
        <Link
          href="/company/master/system-settings"
          className="hover:text-primary"
        >
          全社共通マスター設定
        </Link>
        <span>›</span>
        <span className="text-default-700">報酬ルール詳細</span>
      </nav>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-default-900">報酬ルール詳細</h1>
        <button
          type="button"
          onClick={() => setWizardOpen(true)}
          className="bg-primary text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-primary/90 shadow-sm"
        >
          ＋ 新規報酬ルール作成
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Rule list */}
        <div className="space-y-3 self-start">
          <div className="bg-white p-4 rounded-xl border border-default-200 space-y-3">
            <input
              className="w-full px-4 py-2 border border-default-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
              placeholder="ルール名を検索..."
              type="text"
            />
            <div className="flex gap-2">
              <select className="flex-1 text-xs border border-default-200 rounded p-1.5">
                <option>全カテゴリ</option>
                <option>社内SNS</option>
                <option>困りごと解決</option>
              </select>
              <select className="flex-1 text-xs border border-default-200 rounded p-1.5">
                <option>全状態</option>
                <option>有効</option>
                <option>停止</option>
              </select>
            </div>
          </div>
          <div className="space-y-3">
            {RULES.map((r) => {
              const isActive = r.id === summary.id;
              return (
                <Link
                  key={r.id}
                  href={`/company/master/system-settings/rewards/${r.id}`}
                  className={`block bg-white p-4 rounded-xl border shadow-sm transition-all ${
                    isActive
                      ? "border-l-4 border-primary border-y border-r border-default-200"
                      : "border border-default-200 hover:border-primary/50"
                  } ${!r.active && !isActive ? "opacity-80 hover:opacity-100" : ""}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        r.active
                          ? "bg-green-50 text-green-600"
                          : "bg-default-100 text-default-500"
                      }`}
                    >
                      {r.active ? "有効" : "停止中"}
                    </span>
                    <span className="text-default-400 text-[10px]">{r.id}</span>
                  </div>
                  <h4 className="text-sm font-bold text-default-900 mb-1">
                    {r.name}
                  </h4>
                  <p className="text-xs text-default-400 mb-3">{r.category}</p>
                  <div className="flex justify-between items-end">
                    <div
                      className={`font-black ${
                        r.active ? "text-primary" : "text-default-400"
                      }`}
                    >
                      <span className="text-lg">{r.amount}</span>{" "}
                      <span className="text-xs">{r.unit}</span>
                    </div>
                    <span className="text-[10px] text-default-400">
                      更新: {r.updatedAt}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Detail */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-default-200 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-black text-default-900">
                  {summary.name}
                </h2>
                <p className="text-sm text-default-400">
                  カテゴリ: {summary.category} / ID: {summary.id}
                </p>
              </div>
              <div
                className={`px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-2 border ${
                  summary.active
                    ? "bg-green-50 text-green-600 border-green-200"
                    : "bg-default-100 text-default-500 border-default-300"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    summary.active ? "bg-green-500" : "bg-default-400"
                  }`}
                />
                {summary.active ? "現在有効なルールです" : "停止中のルールです"}
              </div>
            </div>
            <p className="text-sm text-default-600 leading-relaxed">
              {detail.description}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Points */}
            <div className="bg-white p-6 rounded-xl border border-default-200 shadow-sm">
              <h3 className="text-xs font-bold text-default-400 border-b border-default-100 pb-3 mb-4">
                ポイント設定
              </h3>
              <div className="space-y-6">
                <div>
                  <p className="text-xs text-default-400 mb-1">
                    付与ポイント（1回あたり）
                  </p>
                  <div className="text-primary font-black">
                    <span className="text-4xl leading-none">
                      {detail.pointsPerAction}
                    </span>{" "}
                    <span className="text-xl">{detail.pointsUnit}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-default-400 mb-1">月次上限額</p>
                    <p className="text-base font-bold text-default-800">
                      {detail.monthlyCap}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-default-400 mb-1">月間最大回数</p>
                    <p className="text-base font-bold text-default-800">
                      {detail.monthlyMaxCount}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Conditions */}
            <div className="bg-white p-6 rounded-xl border border-default-200 shadow-sm">
              <h3 className="text-xs font-bold text-default-400 border-b border-default-100 pb-3 mb-4">
                発生条件
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-default-400 mb-1">対象アクション</p>
                  <span className="bg-primary-50 text-primary px-3 py-1 rounded text-sm font-bold">
                    {detail.targetAction}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-default-400 mb-1">判定条件</p>
                  <ul className="text-sm text-default-700 space-y-1 list-disc list-inside">
                    {detail.conditions.map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Period & meta */}
          <div className="bg-white p-6 rounded-xl border border-default-200 shadow-sm">
            <h3 className="text-xs font-bold text-default-400 border-b border-default-100 pb-3 mb-4">
              適用・管理情報
            </h3>
            <div className="grid grid-cols-3 gap-8">
              <div>
                <p className="text-xs text-default-400 mb-1">適用開始日</p>
                <p className="text-base font-bold text-default-800">
                  {detail.startDate}
                </p>
              </div>
              <div>
                <p className="text-xs text-default-400 mb-1">適用終了日</p>
                <p className="text-base font-bold text-default-800">
                  {detail.endDate}
                </p>
              </div>
              <div>
                <p className="text-xs text-default-400 mb-1">優先度設定</p>
                <p className="text-base font-bold text-default-800">
                  {detail.priority}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3 self-start">
          <div className="bg-white p-4 rounded-xl border border-default-200 shadow-sm">
            <p className="text-xs font-bold text-default-400 mb-4">アクション</p>
            <div className="flex flex-col gap-3">
              <Link
                href="/company/master/system-settings"
                className="w-full flex items-center justify-center py-3 bg-white border border-default-200 rounded-lg text-default-800 hover:bg-default-50 font-bold shadow-sm text-sm"
              >
                編集する
              </Link>
              <button
                type="button"
                className="w-full py-3 bg-white border border-default-200 rounded-lg text-default-800 hover:bg-default-50 font-bold shadow-sm text-sm"
              >
                複製する
              </button>
              <div className="h-px bg-default-100 my-1" />
              <button
                type="button"
                className="w-full py-3 bg-white border border-amber-300 text-amber-600 hover:bg-amber-50 font-bold rounded-lg text-sm"
              >
                一時停止
              </button>
              <button
                type="button"
                className="w-full py-3 bg-white border border-red-300 text-red-500 hover:bg-red-50 font-bold rounded-lg text-sm"
              >
                削除する
              </button>
            </div>
          </div>
          <div className="bg-primary-50 p-4 rounded-xl border border-primary-100">
            <p className="text-xs text-primary font-bold mb-2">ヘルプ</p>
            <p className="text-xs text-default-600 leading-relaxed">
              ルールを変更すると、次回のポイント集計時より反映されます。過去分には適用されません。
            </p>
          </div>
        </div>
      </div>

      {/* Wizard modal */}
      {wizardOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 z-[100] flex items-center justify-center p-4"
          onClick={() => setWizardOpen(false)}
        >
          <div
            className="bg-white w-full max-w-3xl max-h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-default-100 flex justify-between items-center bg-default-50">
              <h2 className="text-lg font-black text-default-900">
                新規報酬ルール作成
              </h2>
              <button
                type="button"
                onClick={() => setWizardOpen(false)}
                className="text-default-400 hover:text-default-700 text-xl leading-none"
              >
                ×
              </button>
            </div>
            {/* Steps */}
            <div className="flex items-center px-8 py-6 bg-default-50">
              {["カテゴリ選択", "条件設定", "期間設定", "完了確認"].map(
                (label, i) => (
                  <div key={label} className="flex items-center flex-1 last:flex-none">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center font-bold mb-1 ${
                          i === 0
                            ? "bg-primary text-white"
                            : "bg-white border-2 border-default-200 text-default-400"
                        }`}
                      >
                        {i + 1}
                      </div>
                      <span
                        className={`text-[11px] ${
                          i === 0
                            ? "font-bold text-default-800"
                            : "text-default-400"
                        }`}
                      >
                        {label}
                      </span>
                    </div>
                    {i < 3 && (
                      <div
                        className={`h-1 flex-1 mx-2 ${
                          i === 0 ? "bg-primary" : "bg-default-200"
                        }`}
                      />
                    )}
                  </div>
                ),
              )}
            </div>
            {/* Content */}
            <div className="flex-1 p-8 overflow-y-auto">
              <div className="max-w-lg mx-auto space-y-6">
                <div className="text-center">
                  <h3 className="font-bold text-default-900 mb-1">
                    作成するルールのカテゴリを選んでください
                  </h3>
                  <p className="text-sm text-default-400">
                    カテゴリによって設定できるアクションが異なります
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {["社内SNS", "困りごと解決", "企画・アイデア", "特別報酬"].map(
                    (cat, i) => (
                      <label
                        key={cat}
                        className={`p-6 rounded-xl cursor-pointer flex flex-col items-center text-center border-2 transition-all ${
                          i === 0
                            ? "border-primary bg-primary-50"
                            : "border-default-100 hover:border-primary/50 hover:bg-default-50"
                        }`}
                      >
                        <input
                          type="radio"
                          name="wizard-cat"
                          defaultChecked={i === 0}
                          className="hidden"
                        />
                        <span className="font-bold text-default-800">{cat}</span>
                      </label>
                    ),
                  )}
                </div>
              </div>
            </div>
            <div className="p-6 bg-default-50 border-t border-default-100 flex justify-between">
              <button
                type="button"
                onClick={() => setWizardOpen(false)}
                className="px-8 py-3 text-default-600 font-bold hover:bg-default-200 rounded-lg"
              >
                キャンセル
              </button>
              <button
                type="button"
                className="px-10 py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 shadow-sm"
              >
                次へ進む
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
