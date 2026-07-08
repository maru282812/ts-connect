"use client";

import { useState } from "react";

type Role = "USER" | "ADMIN" | "MASTER_ADMIN";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  dept: string;
  title: string;
  role: Role;
  active: boolean;
  lastLogin: string;
}

const ROLE_TONE: Record<Role, string> = {
  USER: "bg-default-200 text-default-600",
  ADMIN: "bg-primary text-white",
  MASTER_ADMIN: "bg-teal-600 text-white",
};

const USERS: AdminUser[] = [
  {
    id: "u-1",
    name: "田中 美咲",
    email: "m.tanaka@example.com",
    dept: "人事総務部",
    title: "マネージャー",
    role: "ADMIN",
    active: true,
    lastLogin: "2023/10/24 10:15",
  },
  {
    id: "u-2",
    name: "佐藤 健司",
    email: "k.sato@example.com",
    dept: "DX推進本部",
    title: "部長",
    role: "MASTER_ADMIN",
    active: true,
    lastLogin: "2023/10/24 09:30",
  },
  {
    id: "u-3",
    name: "鈴木 一郎",
    email: "i.suzuki@example.com",
    dept: "営業本部",
    title: "一般社員",
    role: "USER",
    active: false,
    lastLogin: "2023/09/15 18:45",
  },
];

const ROLE_OPTIONS: { key: Role; label: string; desc: string }[] = [
  { key: "USER", label: "USER", desc: "一般利用者の権限です。" },
  { key: "ADMIN", label: "ADMIN", desc: "所属組織内の管理権限です。" },
  {
    key: "MASTER_ADMIN",
    label: "MASTER_ADMIN",
    desc: "全社の最高管理権限です。",
  },
];

export function UsersAdminClient() {
  const [selectedId, setSelectedId] = useState<string>("u-1");
  const [role, setRole] = useState<Role>("ADMIN");

  const selected = USERS.find((u) => u.id === selectedId) ?? USERS[0];

  return (
    <div className="max-w-[1600px] mx-auto w-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-default-900">
          ユーザー・権限管理
        </h1>
        <button
          type="button"
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 shadow-sm"
        >
          新規ユーザー追加
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left: list */}
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white p-4 rounded-xl border border-default-200 flex flex-wrap items-center gap-4">
            <input
              className="flex-1 min-w-[200px] px-4 py-2 bg-default-50 border border-default-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
              placeholder="氏名、メールアドレスで検索..."
              type="text"
            />
            <select className="px-4 py-2 bg-default-50 border border-default-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none">
              <option>すべての権限</option>
              <option>USER</option>
              <option>ADMIN</option>
              <option>MASTER_ADMIN</option>
            </select>
            <select className="px-4 py-2 bg-default-50 border border-default-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none">
              <option>すべてのステータス</option>
              <option>有効</option>
              <option>停止中</option>
              <option>招待中</option>
            </select>
          </div>

          <div className="bg-white rounded-xl border border-default-200 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-default-50 border-b border-default-200">
                  <th className="p-4 text-xs font-bold text-default-500 uppercase">
                    氏名
                  </th>
                  <th className="p-4 text-xs font-bold text-default-500 uppercase">
                    部署・役職
                  </th>
                  <th className="p-4 text-xs font-bold text-default-500 uppercase">
                    権限ロール
                  </th>
                  <th className="p-4 text-xs font-bold text-default-500 uppercase">
                    ステータス
                  </th>
                  <th className="p-4 text-xs font-bold text-default-500 uppercase">
                    最終ログイン
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-default-100">
                {USERS.map((u) => {
                  const active = u.id === selectedId;
                  return (
                    <tr
                      key={u.id}
                      onClick={() => {
                        setSelectedId(u.id);
                        setRole(u.role);
                      }}
                      className={`hover:bg-primary-50/40 transition-colors cursor-pointer ${
                        active
                          ? "bg-primary-50/40 border-l-4 border-l-primary"
                          : ""
                      }`}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-default-100 text-default-500 flex items-center justify-center text-[10px] font-bold">
                            {u.name.slice(0, 2)}
                          </div>
                          <div>
                            <p className="font-bold text-sm text-default-800">
                              {u.name}
                            </p>
                            <p className="text-[11px] text-default-400">
                              {u.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="text-sm">{u.dept}</p>
                        <p className="text-[11px] text-default-400">
                          {u.title}
                        </p>
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${ROLE_TONE[u.role]}`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`flex items-center gap-1.5 font-bold text-sm ${
                            u.active ? "text-green-600" : "text-default-400"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              u.active ? "bg-green-500" : "bg-default-300"
                            }`}
                          />
                          {u.active ? "有効" : "停止中"}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-default-500">
                        {u.lastLogin}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: permission edit */}
        <aside className="bg-white border border-default-200 rounded-xl p-6 space-y-8 self-start">
          <div className="pb-6 border-b border-default-200">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-2xl bg-default-100 text-default-500 flex items-center justify-center font-bold text-xl">
                {selected.name.slice(0, 2)}
              </div>
              <div>
                <h3 className="text-lg font-bold text-default-900">
                  {selected.name}
                </h3>
                <p className="text-sm text-default-500">
                  {selected.dept} / {selected.title}
                </p>
                <p className="text-xs text-default-400 mt-1">
                  {selected.email}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h4 className="text-sm font-bold uppercase tracking-widest text-teal-600">
              権限の変更
            </h4>
            <div className="bg-red-50 border border-red-200 p-4 rounded-xl">
              <p className="text-xs text-red-700 leading-relaxed">
                ロールの変更はシステムのセキュリティとデータアクセスに重大な影響を与えます。操作前に変更内容を十分に確認してください。
              </p>
            </div>
            <div>
              <span className="block text-sm text-default-500 mb-3">
                新しいロールを選択
              </span>
              <div className="space-y-3">
                {ROLE_OPTIONS.map((o) => {
                  const active = role === o.key;
                  return (
                    <button
                      key={o.key}
                      type="button"
                      onClick={() => setRole(o.key)}
                      className={`w-full text-left flex items-center gap-4 p-4 rounded-xl transition-all ${
                        active
                          ? "border-2 border-primary bg-primary-50/40"
                          : "border border-default-200 hover:bg-default-50"
                      }`}
                    >
                      <span
                        className={`w-4 h-4 rounded-full border-2 ${
                          active
                            ? "border-primary bg-primary"
                            : "border-default-300"
                        }`}
                      />
                      <span>
                        <p
                          className={`text-sm font-bold ${active ? "text-primary" : "text-default-800"}`}
                        >
                          {o.label}
                        </p>
                        <p className="text-xs text-default-500">{o.desc}</p>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <span className="block text-sm text-default-500 mb-2">
                変更理由 <span className="text-red-500 font-bold">*</span>
              </span>
              <textarea
                className="w-full px-4 py-3 bg-default-50 border border-default-200 rounded-xl focus:ring-2 focus:ring-primary outline-none text-sm"
                rows={4}
                placeholder="権限変更が必要な理由を具体的に入力してください..."
              />
            </div>
            <button
              type="button"
              className="w-full py-4 bg-red-500 text-white rounded-xl font-bold shadow-lg hover:brightness-110 transition-all"
            >
              権限を更新する
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
