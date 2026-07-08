"use client";

const KPIS = [
  { label: "総部活動数", value: "142", delta: "+12% vs last month", up: true },
  {
    label: "累計メンバー数",
    value: "3,852",
    delta: "+5.4% vs last month",
    up: true,
  },
  {
    label: "今月の活動回数",
    value: "428",
    delta: "-2.1% vs last month",
    up: false,
  },
  { label: "未活動部活動数", value: "18", delta: "30日以上未活動", warn: true },
];

const CHART = [
  { label: "4月", height: 70 },
  { label: "5月", height: 85 },
  { label: "6月", height: 60 },
  { label: "7月", height: 95 },
  { label: "8月", height: 80 },
  { label: "今月", height: 90, current: true },
];

const RANKING = [
  {
    rank: 1,
    name: "フットサル部",
    members: "142名",
    freq: "週2回活動",
    tone: "bg-green-100 text-green-700",
  },
  {
    rank: 2,
    name: "ボードゲーム部",
    members: "86名",
    freq: "週1回活動",
    tone: "bg-green-100 text-green-700",
  },
  {
    rank: 3,
    name: "テック英語部",
    members: "65名",
    freq: "月4回活動",
    tone: "bg-primary-50 text-primary",
  },
];

interface AdminClub {
  id: string;
  initial: string;
  initialTone: string;
  name: string;
  category: string;
  leader: string;
  members: number;
  lastActive: string;
  idle: string;
  idleTone: string;
  priority?: boolean;
}

const ROWS: AdminClub[] = [
  {
    id: "ac-1",
    initial: "写",
    initialTone: "bg-orange-100 text-orange-600",
    name: "カメラ散策部",
    category: "趣味・ライフスタイル",
    leader: "佐藤 健太",
    members: 42,
    lastActive: "2023/07/15",
    idle: "101日 (停止候補)",
    idleTone: "bg-red-100 text-red-800",
    priority: true,
  },
  {
    id: "ac-2",
    initial: "フ",
    initialTone: "bg-blue-100 text-blue-600",
    name: "フットサル部",
    category: "スポーツ",
    leader: "田中 一郎",
    members: 142,
    lastActive: "2024/05/20",
    idle: "活動中",
    idleTone: "bg-green-100 text-green-700",
  },
  {
    id: "ac-3",
    initial: "英",
    initialTone: "bg-purple-100 text-purple-600",
    name: "テック英語部",
    category: "ビジネス/学習",
    leader: "鈴木 花子",
    members: 65,
    lastActive: "2024/05/18",
    idle: "活動中",
    idleTone: "bg-green-100 text-green-700",
  },
];

export function ClubsAdminClient() {
  return (
    <div className="max-w-[1600px] mx-auto w-full space-y-6">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-default-900">
            部活動管理一覧
          </h1>
          <p className="text-default-500 text-sm mt-1">
            全社のコミュニティ活動を健全に維持・管理するための統合ダッシュボード
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            className="px-4 py-2 bg-white border border-default-300 rounded-lg text-default-700 hover:bg-default-50 text-sm font-bold"
          >
            CSV出力
          </button>
          <button
            type="button"
            className="px-4 py-2 bg-white border border-default-300 rounded-lg text-default-700 hover:bg-default-50 text-sm font-bold"
          >
            監査ログ閲覧
          </button>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {KPIS.map((k) => (
          <div
            key={k.label}
            className={`bg-white p-6 rounded-xl border ${
              k.warn
                ? "border-primary/30 ring-2 ring-primary/5"
                : "border-default-200"
            }`}
          >
            <span
              className={`text-sm ${k.warn ? "text-primary font-bold" : "text-default-500"}`}
            >
              {k.label}
            </span>
            <div className="mt-4">
              <div
                className={`text-3xl font-bold ${k.warn ? "text-red-500" : "text-default-900"}`}
              >
                {k.value}
              </div>
              <div
                className={`text-xs mt-1 ${
                  k.warn
                    ? "text-default-500 italic"
                    : k.up
                      ? "text-green-600"
                      : "text-red-500"
                }`}
              >
                {k.delta}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart + ranking */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-default-200">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-base font-bold text-default-900">
              月別活動推移
            </h3>
            <span className="flex items-center gap-1 text-[11px] text-default-500">
              <span className="w-3 h-3 rounded-full bg-primary" />
              活動回数
            </span>
          </div>
          <div className="h-48 w-full flex items-end justify-between gap-4 px-2 border-b border-default-200">
            {CHART.map((c) => (
              <div
                key={c.label}
                className="flex-1 flex flex-col items-center justify-end h-full"
              >
                <div
                  className={`w-full rounded-t ${
                    c.current
                      ? "bg-primary border-2 border-primary-100"
                      : "bg-primary/70"
                  }`}
                  style={{ height: `${c.height}%` }}
                />
                <span
                  className={`text-[10px] mt-2 ${
                    c.current ? "text-primary font-bold" : "text-default-500"
                  }`}
                >
                  {c.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-default-200 flex flex-col">
          <h3 className="text-base font-bold text-default-900 mb-4">
            アクティブ数ランキング
          </h3>
          <div className="space-y-3 flex-1">
            {RANKING.map((r) => (
              <div
                key={r.rank}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-default-50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 flex items-center justify-center font-bold text-primary italic">
                    {r.rank}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-default-800">
                      {r.name}
                    </div>
                    <div className="text-[10px] text-default-500">
                      メンバー: {r.members}
                    </div>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${r.tone}`}>
                  {r.freq}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-default-200 flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[240px]">
          <input
            className="w-full bg-default-50 border border-default-200 rounded-lg py-2 px-4 text-sm focus:ring-2 focus:ring-primary outline-none"
            placeholder="部活動名、部長名で検索"
            type="text"
          />
        </div>
        <select className="w-48 bg-default-50 border border-default-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-primary outline-none">
          <option>全カテゴリ</option>
          <option>スポーツ</option>
          <option>インドア/趣味</option>
          <option>ビジネス/学習</option>
        </select>
        <select className="w-40 bg-default-50 border border-default-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-primary outline-none">
          <option>全ステータス</option>
          <option>公開中</option>
          <option>停止中</option>
        </select>
        <select className="w-52 bg-default-50 border border-default-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-primary outline-none">
          <option>未活動期間: 指定なし</option>
          <option>30日以上 (注意)</option>
          <option>60日以上 (要確認)</option>
          <option>90日以上 (停止候補)</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-default-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-default-50 border-b border-default-200">
              <tr className="text-xs text-default-500 uppercase">
                <th className="py-4 px-4">部活動名</th>
                <th className="py-4 px-4">カテゴリ</th>
                <th className="py-4 px-4">部長</th>
                <th className="py-4 px-4 text-right">メンバー</th>
                <th className="py-4 px-4">最終活動日</th>
                <th className="py-4 px-4">未活動期間</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-default-100">
              {ROWS.map((r) => (
                <tr
                  key={r.id}
                  className={`hover:bg-default-50 cursor-pointer transition-colors ${
                    r.priority ? "border-l-4 border-l-red-500" : ""
                  }`}
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${r.initialTone}`}
                      >
                        {r.initial}
                      </div>
                      <span className="font-bold text-sm text-default-800">
                        {r.name}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-xs text-default-600">
                    {r.category}
                  </td>
                  <td className="py-3 px-4 text-xs text-default-600">
                    {r.leader}
                  </td>
                  <td className="py-3 px-4 text-right text-sm">{r.members}</td>
                  <td className="py-3 px-4 text-xs text-default-500">
                    {r.lastActive}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${r.idleTone}`}
                    >
                      {r.idle}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
