import Link from "next/link";

interface Props {
  issueId: string;
  /** 困りごと一覧・詳細のベースパス（例: /app/issues, /company/issues-feed） */
  issuesBasePath?: string;
  /** 「提案する」導線のリンク先 */
  ideaNewHref?: string;
  /** 関連企画の詳細ベースパス */
  ideasBasePath?: string;
}

const TAGS = ["業務改善", "営業DX", "ツール導入"];

const BACKGROUND_POINTS = [
  "入力項目が重複しており、無駄な作業が多い。",
  "モバイル対応が不十分で、移動中の隙間時間が活用できない。",
  "過去の商談履歴との紐付けが手動で手間がかかる。",
];

const EFFECTS = [
  {
    title: "工数削減",
    body: "月間一人あたり20時間の残業時間削減",
  },
  {
    title: "質の向上",
    body: "商談直後の入力による、情報の精度と鮮度の向上",
  },
];

const RELATED_IDEAS = [
  {
    id: "idea-01",
    title: "音声解析AIを活用した商談自動要約ツール",
    status: "検証中",
    body: "商談中の音声を録音し、AIが自動的に重要事項を日報形式に…",
    likes: 24,
    comments: 8,
    author: "田中 健太",
    gradient: "from-slate-700 to-slate-900",
  },
  {
    id: "idea-02",
    title: "Slack連携型簡易日報投稿Bot",
    status: "検討中",
    body: "使い慣れたSlackから、対話形式で必要項目を入力するだけで…",
    likes: 15,
    comments: 3,
    author: "鈴木 龍馬",
    gradient: "from-cyan-700 to-blue-900",
  },
];

export function IssueDetailView({
  issueId,
  issuesBasePath = "/app/issues",
  ideaNewHref = "/app/ideas/new",
  ideasBasePath = "/app/ideas",
}: Props) {
  return (
    <div className="max-w-[1280px] mx-auto w-full">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-default-500 mb-4">
        <Link href={issuesBasePath} className="hover:text-primary">
          困りごと
        </Link>
        <span>›</span>
        <span className="text-default-700">詳細</span>
      </nav>

      {/* Title card */}
      <div className="bg-white border border-default-200 rounded-xl p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1 px-3 py-1 text-xs rounded-full font-bold bg-green-100 text-green-700">
                ・募集中
              </span>
              {TAGS.map((t) => (
                <span
                  key={t}
                  className="px-3 py-1 bg-default-100 text-default-600 text-xs rounded-full"
                >
                  {t}
                </span>
              ))}
            </div>
            <h1 className="text-2xl font-bold text-default-900 mb-3">
              営業日報の入力負荷を軽減し、顧客への接触時間を増やしたい
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-default-500">
              <span className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-default-200" />
                投稿者: 営業推進部 山田 華子
              </span>
              <span>募集期限: 2024年10月31日まで</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              className="inline-flex items-center gap-2 px-4 py-2 border border-default-300 text-default-700 rounded-lg text-sm font-bold hover:bg-default-50"
            >
              <ShareIcon />
              共有
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 px-4 py-2 border border-default-300 text-default-700 rounded-lg text-sm font-bold hover:bg-default-50"
            >
              <BookmarkIcon />
              保存
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left / main */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-default-200 rounded-xl p-6 space-y-8">
            {/* 背景・現状の課題 */}
            <section>
              <h2 className="text-lg font-bold text-default-900 border-l-4 border-primary pl-3 mb-3">
                背景・現状の課題
              </h2>
              <p className="text-sm text-default-600 leading-relaxed mb-3">
                現在、営業部では1日の活動終了後に日報入力を行っていますが、独自のシステムが使いづらく、平均して1時間以上の時間を要しています。特に出先からの入力が困難なため、帰社してからの作業となり、残業の主な原因となっています。
              </p>
              <ul className="space-y-2">
                {BACKGROUND_POINTS.map((p) => (
                  <li
                    key={p}
                    className="flex gap-2 text-sm text-default-600 leading-relaxed"
                  >
                    <span className="text-primary mt-1">•</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* 解決したい状態 */}
            <section>
              <h2 className="text-lg font-bold text-default-900 border-l-4 border-primary pl-3 mb-3">
                解決したい状態
              </h2>
              <p className="text-sm text-default-600 leading-relaxed">
                日報入力が5〜10分程度で完結し、商談直後にスマートフォン等から気軽に行える環境を整えたいと考えています。音声入力や自動転記などの技術を活用し、「入力のための作業」を極限まで減らしたいです。
              </p>
            </section>

            {/* 期待する効果 */}
            <section>
              <h2 className="text-lg font-bold text-default-900 border-l-4 border-primary pl-3 mb-3">
                期待する効果
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {EFFECTS.map((e) => (
                  <div
                    key={e.title}
                    className="bg-primary-50/60 border border-primary-100 rounded-lg p-4"
                  >
                    <p className="text-sm font-bold text-primary mb-1">
                      {e.title}
                    </p>
                    <p className="text-sm text-default-700">{e.body}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* 募集するアイデアの方向性 */}
            <section>
              <h2 className="text-lg font-bold text-default-900 border-l-4 border-primary pl-3 mb-3">
                募集するアイデアの方向性
              </h2>
              <div className="bg-default-50 border border-default-200 rounded-lg p-4">
                <p className="text-sm text-default-600 leading-relaxed">
                  既存ツールの活用、あるいはノーコードツール等を用いた内製ツールの開発、外部SaaSの導入検討など、手法は問いません。現場の営業員が「使いたい」と思えるような、UI/UXに配慮した具体的な仕組みの提案をお待ちしています。
                </p>
              </div>
            </section>
          </div>

          {/* コメント・質問 */}
          <div className="bg-white border border-default-200 rounded-xl p-6">
            <h2 className="text-lg font-bold text-default-900 mb-5">
              コメント・質問 <span className="text-default-400">(4)</span>
            </h2>

            <div className="flex gap-3 mb-5">
              <span className="shrink-0 w-9 h-9 rounded-full bg-default-200" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-default-800">
                    伊藤 哲也
                  </p>
                  <span className="text-xs text-default-400">2日前</span>
                </div>
                <div className="bg-default-50 rounded-lg p-3 mt-1.5 text-sm text-default-600">
                  既存のCRMシステムとの連携は必須でしょうか？それとも単独のツールとしての提案でも可能ですか？
                </div>
                <div className="flex items-center gap-4 mt-2 text-xs text-default-500">
                  <button
                    type="button"
                    className="font-bold hover:text-primary"
                  >
                    返信する
                  </button>
                  <span>👍 2</span>
                </div>

                {/* Reply */}
                <div className="flex gap-3 mt-4 pl-4 border-l-2 border-default-100">
                  <span className="shrink-0 w-8 h-8 rounded-full bg-default-200" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-default-800 flex items-center gap-2">
                        山田 華子
                        <span className="px-2 py-0.5 bg-primary-50 text-primary text-[10px] rounded font-bold">
                          投稿者
                        </span>
                      </p>
                      <span className="text-xs text-default-400">1日前</span>
                    </div>
                    <p className="text-sm text-default-600 mt-1.5">
                      ご質問ありがとうございます。最終的にはCRMとの連携が必要になりますが、まずはプロトタイプとして単独動作する形での提案も歓迎します！
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* New comment */}
            <div className="flex gap-3 pt-4 border-t border-default-100">
              <span className="shrink-0 w-9 h-9 rounded-full bg-default-200" />
              <div className="flex-1">
                <textarea
                  className="w-full bg-default-50 border border-default-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                  rows={3}
                  placeholder="コメントを入力..."
                />
                <div className="mt-2 text-right">
                  <button
                    type="button"
                    className="bg-primary text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-primary/90"
                  >
                    コメントを投稿
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right rail: 紐づく企画・アイデア */}
        <div className="space-y-4 lg:sticky lg:top-6">
          <Link
            href={ideaNewHref}
            className="block text-center bg-primary text-white px-4 py-3 rounded-lg text-sm font-bold hover:bg-primary/90 shadow-sm"
          >
            この困りごとに提案する
          </Link>

          <h2 className="text-lg font-bold text-default-900 pt-2">
            紐づく企画・アイデア
          </h2>

          {RELATED_IDEAS.map((idea) => (
            <Link
              key={idea.id}
              href={`${ideasBasePath}/${idea.id}`}
              className="block bg-white border border-default-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className={`h-32 bg-gradient-to-br ${idea.gradient}`} />
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="text-sm font-bold text-default-900 leading-snug">
                    {idea.title}
                  </h3>
                  <span className="shrink-0 px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] rounded font-bold">
                    {idea.status}
                  </span>
                </div>
                <p className="text-xs text-default-500 mb-3 line-clamp-2">
                  {idea.body}
                </p>
                <div className="flex items-center justify-between text-xs text-default-500">
                  <div className="flex items-center gap-3">
                    <span>👍 {idea.likes}</span>
                    <span>💬 {idea.comments}</span>
                  </div>
                  <span className="font-semibold text-default-700">
                    {idea.author}
                  </span>
                </div>
              </div>
            </Link>
          ))}

          <Link
            href={ideasBasePath}
            className="block text-center border border-default-300 text-primary px-4 py-2.5 rounded-lg text-sm font-bold hover:bg-default-50"
          >
            すべてのアイデアを見る (5件)
          </Link>
          <p className="text-[11px] text-default-400 px-1">ID: {issueId}</p>
        </div>
      </div>
    </div>
  );
}

function ShareIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" />
    </svg>
  );
}

function BookmarkIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}
