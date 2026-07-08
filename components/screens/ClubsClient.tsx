"use client";

interface Club {
  id: string;
  category: string;
  name: string;
  description: string;
  frequency: string;
  members: number;
  recruiting: boolean;
}

const CLUBS: Club[] = [
  {
    id: "club-coffee",
    category: "ライフスタイル",
    name: "ハンドドリップコーヒー部",
    description:
      "美味しい豆の選び方から淹れ方まで、月替りで様々な豆を楽しみます。初心者大歓迎です！",
    frequency: "月1回活動",
    members: 12,
    recruiting: true,
  },
  {
    id: "club-oss",
    category: "技術・スキル",
    name: "OSSコントリビュート部",
    description:
      "週末に集まってOSSへのプルリク作成を行います。最新技術のキャッチアップにも最適。",
    frequency: "週1回活動",
    members: 8,
    recruiting: true,
  },
  {
    id: "club-yoga",
    category: "スポーツ",
    name: "モーニングヨガサークル",
    description:
      "出勤前にリフレッシュ。社内の多目的室とオンラインのハイブリッドで開催しています。",
    frequency: "週2回活動",
    members: 35,
    recruiting: false,
  },
  {
    id: "club-sketch",
    category: "文化・芸術",
    name: "スケッチ・デッサン部",
    description:
      "身近なものから風景まで、無心に描く時間を共有しましょう。道具の貸し出しもあります。",
    frequency: "月1回活動",
    members: 15,
    recruiting: true,
  },
];

const TRENDING = [
  { rank: "01", name: "サウナ＆温活サークル", meta: "今週 +12名参加" },
  { rank: "02", name: "ChatGPT研究会", meta: "今週 +8名参加" },
  { rank: "03", name: "ボードゲーム部", meta: "今週 +5名参加" },
];

const NEW_CLUBS = [
  { name: "マインドフルネス書道部", meta: "昨日作成 | 文化" },
  { name: "英語ディベートクラブ", meta: "2日前作成 | スキル" },
  { name: "週末ハイキング同好会", meta: "3日前作成 | スポーツ" },
];

const POPULAR_TAGS = [
  "#フットサル",
  "#技術",
  "#コーヒー",
  "#健康",
  "#読書",
  "#初心者歓迎",
  "#交流",
  "#オンライン",
];

export function ClubsClient() {
  return (
    <div className="max-w-[1400px] mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-default-900">部活動を探す</h1>
          <p className="text-sm text-default-500 mt-1">
            共通の趣味や目的でつながる、社内の部活動を見つけましょう
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 bg-primary text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-primary/90 shadow-sm"
        >
          新しい部活動を作成
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-6 mb-8 border border-default-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <span className="block text-xs font-bold text-default-600 mb-1">
              キーワード
            </span>
            <input
              className="w-full px-4 py-2 rounded-lg border border-default-200 text-sm focus:ring-2 focus:ring-primary outline-none"
              placeholder="部活動名、タグ、内容..."
              type="text"
            />
          </div>
          {[
            {
              label: "カテゴリ",
              options: [
                "すべて",
                "スポーツ",
                "文化・芸術",
                "技術・スキル",
                "ライフスタイル",
              ],
            },
            {
              label: "活動頻度",
              options: ["すべて", "週1回以上", "月1〜2回", "不定期"],
            },
            {
              label: "参加形式",
              options: ["すべて", "対面のみ", "オンライン", "ハイブリッド"],
            },
          ].map((f) => (
            <div key={f.label}>
              <span className="block text-xs font-bold text-default-600 mb-1">
                {f.label}
              </span>
              <select className="w-full px-4 py-2 rounded-lg border border-default-200 text-sm focus:ring-2 focus:ring-primary outline-none">
                {f.options.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: list */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-default-900">部活動一覧</h2>
            <span className="text-sm text-default-500">全48件</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {CLUBS.map((c) => (
              <div
                key={c.id}
                className="bg-white rounded-xl border border-default-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="h-32 bg-default-100 relative flex items-center justify-center">
                  <span className="text-default-300 text-xs">画像</span>
                  {c.recruiting && (
                    <span className="absolute top-3 left-3 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                      募集中
                    </span>
                  )}
                  <div className="absolute bottom-3 right-3 bg-black/50 text-white text-[10px] px-2 py-1 rounded-md">
                    {c.frequency}
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-primary text-[11px] font-bold">
                        {c.category}
                      </span>
                      <h4 className="font-bold text-default-900">{c.name}</h4>
                    </div>
                    <button
                      type="button"
                      className="text-default-400 hover:text-primary"
                      aria-label="お気に入り"
                    >
                      ♡
                    </button>
                  </div>
                  <p className="text-sm text-default-500 line-clamp-2">
                    {c.description}
                  </p>
                  <div className="flex items-center justify-between pt-2 border-t border-default-100">
                    <span className="text-sm text-default-500">
                      {c.members}名
                    </span>
                    <button
                      type="button"
                      className="text-primary font-bold text-sm hover:underline"
                    >
                      詳細・参加
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: side panel */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-primary-50 border border-primary-100 rounded-xl p-6">
            <h3 className="font-bold text-primary mb-4">
              ✨ あなたへのおすすめ
            </h3>
            <div className="flex gap-4 items-start mb-4">
              <div className="w-16 h-16 rounded-lg bg-white shadow-sm shrink-0 flex items-center justify-center text-default-300 text-xs">
                画像
              </div>
              <div>
                <h4 className="font-bold text-sm text-default-900">
                  社内広報フォトグラファー部
                </h4>
                <p className="text-xs text-default-500 mt-1 line-clamp-2">
                  あなたのカメラ趣味を業務にも活かしませんか？技術共有も盛んです。
                </p>
              </div>
            </div>
            <button
              type="button"
              className="w-full bg-primary text-white py-2 rounded-lg font-bold text-sm hover:bg-primary/90"
            >
              チェックする
            </button>
          </div>

          <div className="bg-white border border-default-200 rounded-xl p-6">
            <h3 className="font-bold text-default-900 mb-4">📈 人気上昇中</h3>
            <div className="space-y-4">
              {TRENDING.map((t) => (
                <div key={t.rank} className="flex items-center gap-3">
                  <span className="text-lg font-black text-default-300 w-6 italic">
                    {t.rank}
                  </span>
                  <div className="flex-1">
                    <p className="font-bold text-sm text-default-800">
                      {t.name}
                    </p>
                    <span className="text-xs text-default-500">{t.meta}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-default-200 rounded-xl p-6">
            <h3 className="font-bold text-default-900 mb-4">新着部活動</h3>
            <div className="space-y-3">
              {NEW_CLUBS.map((n) => (
                <div
                  key={n.name}
                  className="border-b border-default-100 pb-3 last:border-0 last:pb-0"
                >
                  <p className="text-sm font-bold text-default-800">{n.name}</p>
                  <span className="text-xs text-default-500">{n.meta}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-default-200 rounded-xl p-6">
            <h3 className="font-bold text-default-900 mb-4">人気のタグ</h3>
            <div className="flex flex-wrap gap-2">
              {POPULAR_TAGS.map((t) => (
                <span
                  key={t}
                  className="px-3 py-1 bg-default-100 text-default-600 rounded-full text-sm cursor-pointer hover:bg-primary-50 hover:text-primary transition-colors"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
