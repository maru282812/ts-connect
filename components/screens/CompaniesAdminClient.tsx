"use client";

import { useState } from "react";

interface Company {
  id: string;
  code: string;
  name: string;
  initial: string;
}

const COMPANIES: Company[] = [
  { id: "c-wm", code: "WM-001", name: "株式会社WorkMarket", initial: "WM" },
  { id: "c-gh", code: "GH-052", name: "Global Holdings inc.", initial: "GH" },
  { id: "c-ts", code: "TS-110", name: "Tech Solutions Ltd.", initial: "TS" },
  { id: "c-nf", code: "NF-029", name: "Next Future Japan", initial: "NF" },
];

interface DeptNode {
  id: string;
  name: string;
  count: number;
  children?: DeptNode[];
}

const DEPT_TREE: DeptNode = {
  id: "root",
  name: "株式会社WorkMarket (全社)",
  count: 0,
  children: [
    {
      id: "keiei",
      name: "経営企画本部",
      count: 3,
      children: [
        { id: "prod", name: "プロダクト開発部", count: 12 },
        { id: "shinki", name: "新規事業室", count: 4 },
      ],
    },
    { id: "kanri", name: "管理本部", count: 5 },
  ],
};

export function CompaniesAdminClient() {
  const [companyId, setCompanyId] = useState("c-wm");
  const [deptId, setDeptId] = useState("prod");

  return (
    <div className="max-w-[1600px] mx-auto w-full">
      <h1 className="text-2xl font-bold text-default-900 mb-6">
        会社・部署マスター管理
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Company list */}
        <section className="lg:col-span-3 bg-white border border-default-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-default-200 bg-default-50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-default-600">
                会社一覧
              </span>
              <button
                type="button"
                className="text-primary hover:bg-primary-50 p-1 rounded"
                aria-label="会社追加"
              >
                ＋
              </button>
            </div>
            <input
              className="w-full px-3 py-2 text-xs border border-default-200 rounded-lg focus:ring-2 focus:ring-primary outline-none"
              placeholder="会社名で絞り込み"
              type="text"
            />
          </div>
          <div>
            {COMPANIES.map((c) => {
              const active = c.id === companyId;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCompanyId(c.id)}
                  className={`w-full text-left px-5 py-3 flex items-start gap-3 transition-colors ${
                    active
                      ? "bg-primary-50/40 border-l-4 border-primary"
                      : "hover:bg-default-50 border-l-4 border-transparent"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded flex items-center justify-center font-bold text-xs shrink-0 ${
                      active
                        ? "bg-primary text-white"
                        : "bg-default-200 text-default-600"
                    }`}
                  >
                    {c.initial}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-default-800">
                      {c.name}
                    </p>
                    <p className="text-[10px] text-default-400 mt-0.5">
                      Code: {c.code}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Department tree */}
        <section className="lg:col-span-5 bg-white border border-default-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-default-200 bg-default-50 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-default-900">部署階層構造</h3>
              <p className="text-[11px] text-default-400">
                ドラッグ＆ドロップで階層を整理
              </p>
            </div>
            <button
              type="button"
              className="bg-primary text-white text-xs px-3 py-1.5 rounded-lg font-medium hover:bg-primary/90 shadow-sm"
            >
              部署追加
            </button>
          </div>
          <div className="p-6">
            <div className="flex items-center gap-2 p-2 bg-default-100 rounded-lg border border-primary/20 w-fit pr-4 mb-4">
              <span className="text-sm font-bold text-default-800">
                {DEPT_TREE.name}
              </span>
            </div>
            <div className="ml-4 space-y-3 border-l border-default-200 pl-4">
              {DEPT_TREE.children?.map((node) => (
                <div key={node.id} className="space-y-3">
                  <DeptRow
                    node={node}
                    active={node.id === deptId}
                    onSelect={() => setDeptId(node.id)}
                  />
                  {node.children && (
                    <div className="ml-6 space-y-3 border-l border-default-200 pl-4">
                      {node.children.map((child) => (
                        <DeptRow
                          key={child.id}
                          node={child}
                          active={child.id === deptId}
                          onSelect={() => setDeptId(child.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Department detail */}
        <section className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-default-200 rounded-xl p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h4 className="text-xs font-bold text-primary uppercase tracking-widest mb-1">
                  Department Detail
                </h4>
                <h3 className="text-lg font-bold text-default-900">
                  プロダクト開発部
                </h3>
                <p className="text-xs text-default-400">Code: DP-PROD-01</p>
              </div>
              <button
                type="button"
                className="bg-default-50 border border-default-200 text-default-700 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-default-100"
              >
                基本情報を編集
              </button>
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-6">
              <div>
                <span className="block text-[10px] text-default-400 font-bold uppercase">
                  上位部署
                </span>
                <p className="text-sm font-medium mt-1">経営企画本部</p>
              </div>
              <div>
                <span className="block text-[10px] text-default-400 font-bold uppercase">
                  部署区分
                </span>
                <p className="text-sm font-medium mt-1">部 (開発・技術)</p>
              </div>
              <div className="col-span-2">
                <span className="block text-[10px] text-default-400 font-bold uppercase mb-2">
                  責任者・副責任者
                </span>
                <div className="flex flex-col gap-2">
                  {[
                    { name: "田中 健一", role: "責任者", title: "VPoE / 部長" },
                    { name: "佐藤 美香", role: "副責任者", title: "PM / TL" },
                  ].map((m) => (
                    <div
                      key={m.name}
                      className="flex items-center gap-3 p-2 bg-default-50 rounded-lg border border-dashed border-default-300"
                    >
                      <div className="w-8 h-8 rounded-full bg-default-200 flex items-center justify-center text-xs font-bold text-default-500">
                        {m.name.slice(0, 2)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold">
                          {m.name}
                          <span className="text-[10px] font-normal text-default-400 ml-2">
                            {m.role}
                          </span>
                        </p>
                        <p className="text-[10px] text-default-400">
                          {m.title}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 機能・公開設定（旧「業務カテゴリ」を統合） */}
          <div className="bg-white border border-default-200 rounded-xl p-6">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h4 className="text-xs font-bold text-primary uppercase tracking-widest mb-1">
                  Feature &amp; Visibility
                </h4>
                <h3 className="text-base font-bold text-default-900">
                  機能・公開設定
                </h3>
                <p className="text-xs text-default-400 mt-0.5">
                  この部署を対象にできる機能と公開状態を設定します。
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <span className="block text-[10px] text-default-400 font-bold uppercase mb-2">
                  対象機能
                </span>
                <div className="flex flex-col gap-2">
                  {[
                    { label: "困りごと投稿", checked: true },
                    { label: "企画・アイデア投稿", checked: true },
                    { label: "案件募集", checked: false },
                  ].map((f) => (
                    <label
                      key={f.label}
                      className="flex items-center gap-3 p-2.5 rounded-lg border border-default-200 hover:bg-default-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        defaultChecked={f.checked}
                        className="rounded border-default-300 text-primary focus:ring-primary"
                      />
                      <span className="text-sm text-default-700">
                        {f.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-[10px] text-default-400 font-bold uppercase mb-2">
                    表示順
                  </span>
                  <input
                    type="number"
                    defaultValue={10}
                    className="w-full px-3 py-2 bg-default-50 border border-default-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
                <div>
                  <span className="block text-[10px] text-default-400 font-bold uppercase mb-2">
                    利用状態
                  </span>
                  <div className="flex items-center gap-4 py-2">
                    {["有効", "無効"].map((s, i) => (
                      <label
                        key={s}
                        className="flex items-center gap-2 cursor-pointer text-sm text-default-700"
                      >
                        <input
                          type="radio"
                          name="dept-status"
                          defaultChecked={i === 0}
                          className="text-primary focus:ring-primary"
                        />
                        {s}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <span className="block text-[10px] text-default-400 font-bold uppercase mb-2">
                  説明文
                </span>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 bg-default-50 border border-default-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
                  placeholder="ユーザーが部署選択時に表示される説明を入力してください。"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-5 border-t border-default-100">
              <button
                type="button"
                className="px-4 py-2 bg-white border border-default-200 text-default-600 text-sm font-medium rounded-lg hover:bg-default-50"
              >
                キャンセル
              </button>
              <button
                type="button"
                className="px-5 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary/90 shadow-sm"
              >
                保存する
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function DeptRow({
  node,
  active,
  onSelect,
}: {
  node: DeptNode;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`px-3 py-2 rounded-lg flex items-center gap-3 shadow-sm min-w-[200px] w-full transition-colors ${
        active
          ? "bg-primary-50/40 border border-primary/30"
          : "bg-white border border-default-200 hover:border-primary"
      }`}
    >
      <span
        className={`text-sm ${active ? "font-bold text-primary" : "font-medium text-default-700"}`}
      >
        {node.name}
      </span>
      <span
        className={`ml-auto text-[10px] px-1.5 py-0.5 rounded ${
          active ? "bg-primary text-white" : "bg-default-100 text-default-500"
        }`}
      >
        {node.count}
      </span>
    </button>
  );
}
