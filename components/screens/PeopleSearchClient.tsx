"use client";

import { useMemo, useState } from "react";

type Presence = "ONLINE" | "BUSY" | "AWAY" | "OFFLINE";

interface Person {
  id: string;
  name: string;
  department: string;
  role: string;
  presence: Presence;
  consultable: boolean;
  bio: string;
  skills: string[];
}

const PRESENCE_META: Record<Presence, { dot: string }> = {
  ONLINE: { dot: "bg-green-500" },
  BUSY: { dot: "bg-amber-500" },
  AWAY: { dot: "bg-default-400" },
  OFFLINE: { dot: "bg-default-300" },
};

const PEOPLE: Person[] = [
  {
    id: "p-01",
    name: "佐藤 結衣",
    department: "プロダクト開発部",
    role: "UIデザイナー",
    presence: "ONLINE",
    consultable: true,
    bio: "新規事業のUI/UX設計を担当しています。Figmaの使い方やデザインシステムの構築について相談可能です。",
    skills: ["Figma", "Design System", "React"],
  },
  {
    id: "p-02",
    name: "田中 健二",
    department: "エンジニアリング部",
    role: "リード開発",
    presence: "BUSY",
    consultable: false,
    bio: "バックエンド基盤の開発をメインに行っています。最近はAI（LLM）の業務活用に興味があります。",
    skills: ["Python", "AWS", "LLM"],
  },
  {
    id: "p-03",
    name: "小林 真理",
    department: "マーケティング部",
    role: "マネージャー",
    presence: "ONLINE",
    consultable: true,
    bio: "グローバルマーケティング戦略を担当。多言語対応や海外展開についての知見を共有できます。",
    skills: ["Marketing", "English", "SEO"],
  },
  {
    id: "p-04",
    name: "渡辺 翔太",
    department: "人事総務部",
    role: "採用担当",
    presence: "AWAY",
    consultable: false,
    bio: "エンジニア採用と研修プログラムを担当。キャリア相談や社内制度についてお気軽にお声がけください。",
    skills: ["HR", "Career", "Mentoring"],
  },
  {
    id: "p-05",
    name: "高橋 浩二",
    department: "営業本部",
    role: "アカウントマネージャー",
    presence: "ONLINE",
    consultable: true,
    bio: "大手クライアントの深耕営業を得意としています。プレゼンスキルや資料作成のコツをお伝えできます。",
    skills: ["Sales", "Presentation", "Excel"],
  },
  {
    id: "p-06",
    name: "斎藤 あかり",
    department: "技術研究所",
    role: "データサイエンティスト",
    presence: "ONLINE",
    consultable: true,
    bio: "機械学習モデルの構築とデータ分析が専門です。統計学の基礎やデータ可視化についてサポートします。",
    skills: ["Data Analysis", "SQL", "Tableau"],
  },
];

const FILTER_TABS = [
  "すべての社員",
  "相談可能",
  "マイチーム",
  "お気に入り",
] as const;
type FilterTab = (typeof FILTER_TABS)[number];

export function PeopleSearchClient() {
  const [filter, setFilter] = useState<FilterTab>("すべての社員");

  const visible = useMemo(
    () =>
      filter === "相談可能" ? PEOPLE.filter((p) => p.consultable) : PEOPLE,
    [filter],
  );

  return (
    <div className="max-w-[1400px] mx-auto w-full">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-default-900 mb-1">社員検索</h1>
          <p className="text-sm text-default-500">
            社内のエキスパートや共通の趣味を持つ仲間を見つけましょう
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-primary/90"
        >
          スキルを登録する
        </button>
      </div>

      {/* Search & filter */}
      <section className="bg-white rounded-xl border border-default-200 p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="space-y-1">
            <span className="block text-xs font-bold text-default-600 ml-1">
              氏名・キーワード
            </span>
            <input
              className="w-full px-4 py-2 border border-default-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              placeholder="名前で検索"
              type="text"
            />
          </div>
          <div className="space-y-1">
            <span className="block text-xs font-bold text-default-600 ml-1">
              部署
            </span>
            <select className="w-full px-4 py-2 border border-default-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none">
              <option>すべての部署</option>
              <option>プロダクト開発部</option>
              <option>マーケティング部</option>
              <option>人事総務部</option>
              <option>営業本部</option>
            </select>
          </div>
          <div className="space-y-1">
            <span className="block text-xs font-bold text-default-600 ml-1">
              スキルタグ
            </span>
            <input
              className="w-full px-4 py-2 border border-default-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
              placeholder="Python, デザイン..."
              type="text"
            />
          </div>
          <div className="space-y-1">
            <span className="block text-xs font-bold text-default-600 ml-1">
              ステータス
            </span>
            <select className="w-full px-4 py-2 border border-default-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none">
              <option>指定なし</option>
              <option>相談OK</option>
              <option>取り込み中</option>
              <option>外出中</option>
            </select>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-default-200 pt-4">
          <div className="flex flex-wrap gap-1">
            {FILTER_TABS.map((t) => {
              const active = filter === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setFilter(t)}
                  className={`px-4 py-1.5 rounded-full text-sm transition-colors ${
                    active
                      ? "bg-primary-50 text-primary font-bold"
                      : "text-default-500 hover:bg-default-100"
                  }`}
                >
                  {t}
                </button>
              );
            })}
          </div>
          <p className="text-sm text-default-500">
            検索結果: <span className="font-bold text-default-800">1,248</span>{" "}
            名
          </p>
        </div>
      </section>

      {/* Employee grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {visible.map((p) => (
          <div
            key={p.id}
            className="bg-white rounded-xl border border-default-200 p-5 hover:shadow-md transition-all group"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-primary-50 text-primary flex items-center justify-center text-xl font-bold">
                  {p.name.slice(0, 1)}
                </div>
                <span
                  className={`absolute -bottom-1 -right-1 w-4 h-4 border-2 border-white rounded-full ${PRESENCE_META[p.presence].dot}`}
                />
              </div>
              <button
                type="button"
                className="text-default-400 hover:text-primary transition-colors"
                aria-label="ブックマーク"
              >
                ☆
              </button>
            </div>
            <div className="mb-3">
              <h3 className="text-lg font-bold text-default-900 group-hover:text-primary transition-colors">
                {p.name}
              </h3>
              <p className="text-sm text-default-500">
                {p.department} / {p.role}
              </p>
            </div>
            <div className="mb-4">
              {p.consultable && (
                <span className="inline-flex items-center px-2 py-0.5 rounded bg-green-100 text-green-700 text-[11px] font-bold mb-2">
                  相談OK
                </span>
              )}
              <p className="text-sm text-default-600 line-clamp-2">{p.bio}</p>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-6">
              {p.skills.map((s) => (
                <span
                  key={s}
                  className="px-2 py-1 bg-default-100 text-default-600 rounded text-[11px]"
                >
                  {s}
                </span>
              ))}
            </div>
            <button
              type="button"
              className="w-full py-2.5 bg-primary-50 text-primary font-bold rounded-lg text-sm hover:bg-primary hover:text-white transition-all"
            >
              プロフィールを見る
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
