"use client";

const RECOMMENDED = [
  {
    id: "r-1",
    title: "フットサルメンバー急募！",
    company: "ゼロプライド株式会社",
  },
  {
    id: "r-2",
    title: "英語を教えられる人募集！！",
    company: "ゼロプライド株式会社",
  },
];

const POPULAR_ISSUES = [
  { rank: 1, title: "PCの動作が重い時の対処法", views: 450, comments: 12 },
  { rank: 2, title: "新しい福利厚生のアイデア", views: 320, comments: 45 },
  { rank: 3, title: "ランチのおすすめスポット", views: 280, comments: 18 },
];

const POPULAR_TAGS = [
  "#業務改善",
  "#DX",
  "#福利厚生",
  "#社内イベント",
  "#スキルシェア",
];

export function PostsSidebar() {
  return (
    <div className="space-y-6">
      <section className="bg-white p-6 rounded-xl border border-default-200">
        <h2 className="font-bold text-default-800 mb-4">
          ⭐ あなたへのおすすめ
        </h2>
        <div className="space-y-4">
          {RECOMMENDED.map((r) => (
            <button
              key={r.id}
              type="button"
              className="group block text-left w-full"
            >
              <div className="h-28 rounded-lg overflow-hidden mb-2 bg-default-100 flex items-center justify-center text-default-300 text-xs">
                画像
              </div>
              <p className="text-sm font-bold text-default-800 line-clamp-1 group-hover:text-primary">
                {r.title}
              </p>
              <p className="text-xs text-default-500">{r.company}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="bg-white p-6 rounded-xl border border-default-200">
        <h2 className="font-bold text-default-800 mb-4">
          人気困りごとランキング
        </h2>
        <div className="space-y-4">
          {POPULAR_ISSUES.map((p) => (
            <div key={p.rank} className="flex gap-3">
              <span
                className={`text-lg font-bold ${
                  p.rank === 1 ? "text-primary" : "text-default-400"
                }`}
              >
                {p.rank}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold text-default-800 line-clamp-1">
                  {p.title}
                </p>
                <p className="text-xs text-default-400">
                  👁 {p.views} 💬 {p.comments}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white p-6 rounded-xl border border-default-200">
        <h2 className="font-bold text-default-800 mb-4">人気タグ</h2>
        <div className="flex flex-wrap gap-2">
          {POPULAR_TAGS.map((t) => (
            <button
              key={t}
              type="button"
              className="px-3 py-1 bg-default-50 hover:bg-default-100 text-default-600 text-xs rounded-full transition-colors"
            >
              {t}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
