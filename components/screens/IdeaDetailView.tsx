import Link from "next/link";

interface Props {
  ideaId: string;
  /** 企画・アイデア一覧のベースパス（例: /app/ideas, /company/ideas-feed） */
  ideasBasePath?: string;
  /** 関連する困りごとのベースパス */
  issuesBasePath?: string;
}

/* ===== Icons (inline SVG / Material Symbols 非依存) ===== */
type IconProps = { className?: string };

function HeartIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className ?? "h-5 w-5"}
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M12 21s-6.7-4.35-9.33-8.04C.9 10.27 1.4 6.9 4.06 5.5a4.6 4.6 0 0 1 5.43.9L12 8.9l2.51-2.5a4.6 4.6 0 0 1 5.43-.9c2.66 1.4 3.16 4.77 1.39 7.46C18.7 16.65 12 21 12 21z" />
    </svg>
  );
}

function BookmarkIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className ?? "h-5 w-5"}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function ShareIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className ?? "h-5 w-5"}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
    </svg>
  );
}

function LinkIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className ?? "h-[18px] w-[18px]"}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M10 13a5 5 0 0 0 7.07 0l2.83-2.83a5 5 0 0 0-7.07-7.07L11.5 4.5" />
      <path d="M14 11a5 5 0 0 0-7.07 0L4.1 13.83a5 5 0 0 0 7.07 7.07L12.5 19.5" />
    </svg>
  );
}

function MailIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className ?? "h-5 w-5"}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

function UsersIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className ?? "h-5 w-5"}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function TrendingUpIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className ?? "h-4 w-4"}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="m3 17 6-6 4 4 8-8" />
      <path d="M17 7h4v4" />
    </svg>
  );
}

/* ===== Mock data (U-06 デザインテンプレ準拠) ===== */
const SECTIONS = [
  {
    heading: "【概要】",
    body: "全社員が毎週作成している週報業務を、SlackのログやJiraのチケット更新情報を元に生成AIが下書きを自動生成するツールを開発・導入します。",
  },
  {
    heading: "【解決したい課題】",
    body: "週報作成に平均して1人あたり週30分〜1時間を費やしており、全社規模で見ると膨大な工数損失となっています。また、内容の属人化や形骸化も進んでおり、情報の透明性に課題があります。",
  },
];

const ACTIONS = [
  "OpenAI APIを利用した要約エンジンの構築",
  "Slack / Jira APIとの連携モジュール開発",
  "プロトタイプ版をDX推進部にて試験運用",
  "全社展開およびフィードバックに基づく改善",
];

const RESOURCES = [
  "Python/Node.jsでのAPI開発経験があるエンジニア (2名)",
  "UI/UXデザインのアドバイザー (1名)",
  "初期テストに協力いただけるマネージャー職の方々",
];

const RELATED = [
  {
    id: "idea-related-01",
    title: "Slackによる社内申請ワークフローの構築",
    author: "田中 次郎",
    likes: 84,
    status: { label: "採用済み", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    gradient: "from-sky-100 to-indigo-100",
  },
  {
    id: "idea-related-02",
    title: "全社ナレッジ共有ベースとしてのNotion導入",
    author: "鈴木 一郎",
    likes: 56,
    status: { label: "検討中", badge: "bg-amber-50 text-amber-700 border-amber-200" },
    gradient: "from-amber-100 to-rose-100",
  },
  {
    id: "idea-related-03",
    title: "フリーアドレス席の予約システム開発",
    author: "渡辺 恵",
    likes: 32,
    status: { label: "新規募集", badge: "bg-default-100 text-default-600 border-default-200" },
    gradient: "from-emerald-100 to-teal-100",
  },
];

function Avatar({
  name,
  className = "h-10 w-10",
}: {
  name: string;
  className?: string;
}) {
  return (
    <div
      className={`${className} rounded-full bg-primary-100 text-primary flex items-center justify-center font-bold shrink-0 overflow-hidden`}
    >
      {name.slice(0, 1)}
    </div>
  );
}

export function IdeaDetailView({
  ideaId,
  ideasBasePath = "/app/ideas",
  issuesBasePath = "/app/issues",
}: Props) {
  return (
    <div className="max-w-6xl mx-auto w-full space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-default-500">
        <Link href={ideasBasePath} className="hover:text-primary">
          企画・アイデア
        </Link>
        <span>/</span>
        <span className="text-default-700">詳細</span>
      </nav>

      {/* Title & header */}
      <section className="bg-white rounded-xl p-6 shadow-sm border border-default-200">
        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full border border-amber-200">
                検討中
              </span>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs text-default-600 bg-default-100 px-2 py-0.5 rounded">
                  #業務効率化
                </span>
                <span className="text-xs text-default-600 bg-default-100 px-2 py-0.5 rounded">
                  #AI活用
                </span>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-default-900 leading-snug">
              生成AIを活用した週報自動作成ツールの導入提案
            </h1>
            <div className="flex items-center gap-3">
              <Avatar name="佐藤 健太" />
              <div>
                <p className="text-sm font-bold text-default-900">佐藤 健太</p>
                <p className="text-sm text-default-500">
                  DX推進部 / シニアエンジニア
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <button
              type="button"
              className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 active:scale-95 transition-all"
            >
              <HeartIcon className="h-5 w-5" />
              応援する
            </button>
            <button
              type="button"
              aria-label="ブックマーク"
              className="p-2.5 border border-default-300 text-default-600 rounded-lg hover:bg-default-50 transition-colors"
            >
              <BookmarkIcon />
            </button>
            <button
              type="button"
              aria-label="共有"
              className="p-2.5 border border-default-300 text-default-600 rounded-lg hover:bg-default-50 transition-colors"
            >
              <ShareIcon />
            </button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl p-6 md:p-8 border border-default-200 space-y-8">
            {/* 背景と詳細 */}
            <div>
              <h2 className="text-base font-bold text-primary mb-4">
                企画の背景と詳細
              </h2>
              <div className="space-y-6 text-default-600 leading-relaxed">
                {SECTIONS.map((s) => (
                  <section key={s.heading}>
                    <h3 className="text-sm font-bold text-default-900 mb-2">
                      {s.heading}
                    </h3>
                    <p className="text-sm">{s.body}</p>
                  </section>
                ))}
                <section>
                  <h3 className="text-sm font-bold text-default-900 mb-2">
                    【実施内容】
                  </h3>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {ACTIONS.map((a) => (
                      <li key={a}>{a}</li>
                    ))}
                  </ul>
                </section>
                <section>
                  <h3 className="text-sm font-bold text-default-900 mb-2">
                    【想定効果】
                  </h3>
                  <p className="text-sm">
                    週報作成時間を50%以上削減。空いた時間を本来の業務やスキルアップに充てることが可能になります。また、客観的なデータに基づく一貫した週報形式が維持されます。
                  </p>
                </section>
              </div>
            </div>

            <hr className="border-default-200" />

            {/* 協力者・リソース */}
            <div>
              <h2 className="text-base font-bold text-primary mb-4">
                必要な協力者・リソース
              </h2>
              <div className="bg-primary-50 p-4 rounded-lg border border-primary-100">
                <ul className="space-y-2 text-sm text-default-700">
                  {RESOURCES.map((r) => (
                    <li key={r} className="flex items-start gap-2">
                      <span className="text-primary font-bold">•</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* 参考資料・添付画像 */}
            <div>
              <h2 className="text-base font-bold text-primary mb-4">
                参考資料・添付画像
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="aspect-video rounded-lg border border-default-200 bg-gradient-to-br from-sky-100 to-indigo-100" />
                <div className="aspect-video rounded-lg border border-default-200 bg-gradient-to-br from-violet-100 to-fuchsia-100" />
              </div>
              <div className="mt-4">
                <button
                  type="button"
                  className="text-primary hover:underline inline-flex items-center gap-1 text-sm"
                >
                  <LinkIcon />
                  プロジェクト企画詳細ドキュメント(PDF)
                </button>
              </div>
            </div>
          </div>

          {/* コメント */}
          <section className="bg-white rounded-xl p-6 md:p-8 border border-default-200 space-y-6">
            <h2 className="text-base font-bold text-default-900 flex items-center gap-2">
              コメント・問い合わせ
              <span className="text-sm text-default-500 font-normal">
                (12件)
              </span>
            </h2>
            <div className="flex gap-4">
              <Avatar name="あなた" className="h-8 w-8 text-sm" />
              <div className="flex-1 space-y-2">
                <textarea
                  className="w-full rounded-lg border border-default-200 bg-default-50 px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none min-h-[80px]"
                  placeholder="コメントを入力してください..."
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="bg-primary text-white px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-primary/90"
                  >
                    投稿する
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-6 mt-2">
              <div className="flex gap-4">
                <Avatar name="田中 美咲" className="h-8 w-8 text-sm" />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-default-900">
                      田中 美咲
                      <span className="text-default-500 font-normal ml-2">
                        人事部
                      </span>
                    </span>
                    <span className="text-xs text-default-500">2時間前</span>
                  </div>
                  <p className="text-sm text-default-600">
                    これ、本当に欲しいツールです！導入にあたってセキュリティ面の課題などはクリアできそうでしょうか？
                  </p>
                  <div className="flex gap-4 pt-2 text-sm">
                    <button
                      type="button"
                      className="text-primary hover:underline"
                    >
                      返信する
                    </button>
                    <button
                      type="button"
                      className="text-default-500 hover:text-primary inline-flex items-center gap-1"
                    >
                      👍 3
                    </button>
                  </div>

                  {/* 返信 */}
                  <div className="mt-4 pl-4 border-l-2 border-default-200 space-y-4">
                    <div className="flex gap-3">
                      <Avatar name="佐藤 健太" className="h-6 w-6 text-xs" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-default-900">
                            佐藤 健太
                            <span className="bg-primary-50 text-primary text-[10px] px-1.5 py-0.5 rounded ml-2">
                              提案者
                            </span>
                          </span>
                          <span className="text-xs text-default-500">
                            1時間前
                          </span>
                        </div>
                        <p className="text-sm text-default-600 mt-1">
                          ご質問ありがとうございます！社内セキュリティガイドラインに準拠したAzure
                          OpenAI Serviceを利用予定なので、その点はクリアできる見込みです。
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Status card */}
          <div className="bg-white rounded-xl p-6 border border-default-200 space-y-6">
            <div>
              <p className="text-[11px] text-default-500 mb-1 uppercase tracking-wider font-semibold">
                Status
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xl font-bold text-amber-600">
                  進行中
                </span>
                <div className="flex items-center gap-1 text-emerald-600">
                  <TrendingUpIcon />
                  <span className="text-sm font-bold">+15%</span>
                </div>
              </div>
              <div className="w-full bg-default-100 h-2 rounded-full mt-3 overflow-hidden">
                <div className="bg-amber-500 w-3/4 h-full" />
              </div>
              <p className="text-sm text-default-500 mt-2 text-right">
                目標達成度 75%
              </p>
            </div>

            <hr className="border-default-200" />

            <dl className="space-y-4">
              <div className="flex justify-between items-center">
                <dt className="flex items-center gap-2 text-default-600 text-sm">
                  <HeartIcon className="h-[18px] w-[18px] text-default-400" />
                  現在の支援数
                </dt>
                <dd className="text-sm font-bold text-default-900">142名</dd>
              </div>
              <div className="flex justify-between items-center">
                <dt className="flex items-center gap-2 text-default-600 text-sm">
                  <span className="text-default-400 font-bold">¥</span>
                  支援額相当
                </dt>
                <dd className="text-sm font-bold text-default-900">¥42,600</dd>
              </div>
              <div className="flex justify-between items-center">
                <dt className="flex items-center gap-2 text-default-600 text-sm">
                  <LinkIcon className="h-[18px] w-[18px] text-default-400" />
                  関連する困りごと
                </dt>
                <dd>
                  <Link
                    href={`${issuesBasePath}/issue-01`}
                    className="text-primary hover:underline text-sm font-semibold"
                  >
                    Q-0122
                  </Link>
                </dd>
              </div>
            </dl>
          </div>

          {/* Reward card */}
          <div className="bg-white rounded-xl p-6 border border-default-200 bg-gradient-to-br from-white to-primary-50">
            <h2 className="text-base font-bold text-default-900 mb-4 flex items-center gap-2">
              🎁 報酬条件
            </h2>
            <div className="space-y-4">
              <div className="p-4 bg-white rounded-lg border border-primary-100 shadow-sm">
                <p className="text-sm text-default-500 mb-1">
                  採用時インセンティブ
                </p>
                <p className="text-base font-bold text-primary">
                  Amazonギフト券 30,000円分
                </p>
              </div>
              <div className="p-4 bg-white rounded-lg border border-default-200 shadow-sm">
                <p className="text-sm text-default-500 mb-1">
                  協力者報酬 (完成時)
                </p>
                <p className="text-sm font-bold text-default-900">
                  特別休暇 1日 または 10,000pt
                </p>
              </div>
              <p className="text-xs text-default-500 leading-relaxed">
                ※
                報酬の付与は、経営会議にて企画が正式採用された際に行われます。
              </p>
            </div>
          </div>

          {/* Quick actions */}
          <div className="space-y-3">
            <button
              type="button"
              className="w-full inline-flex items-center justify-center gap-2 py-3 bg-white border border-primary text-primary font-bold rounded-lg hover:bg-primary-50 transition-all"
            >
              <MailIcon />
              提案者に問い合わせる
            </button>
            <button
              type="button"
              className="w-full inline-flex items-center justify-center gap-2 py-3 bg-white border border-default-300 text-default-700 font-bold rounded-lg hover:bg-default-50 transition-all"
            >
              <UsersIcon />
              協力者として参加する
            </button>
          </div>
        </div>
      </div>

      {/* 関連する企画 */}
      <section className="space-y-4">
        <h2 className="text-base font-bold text-default-900">関連する企画</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {RELATED.map((item) => (
            <Link
              key={item.id}
              href={`${ideasBasePath}/${item.id}`}
              className="bg-white rounded-xl p-4 border border-default-200 hover:shadow-md transition-all group"
            >
              <div
                className={`aspect-video rounded-lg mb-3 bg-gradient-to-br ${item.gradient}`}
              />
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded border mb-2 inline-block ${item.status.badge}`}
              >
                {item.status.label}
              </span>
              <h3 className="text-sm font-semibold text-default-900 line-clamp-2">
                {item.title}
              </h3>
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Avatar name={item.author} className="h-6 w-6 text-xs" />
                  <span className="text-sm text-default-500">
                    {item.author}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-default-500">
                  <HeartIcon className="h-4 w-4" />
                  <span className="text-sm">{item.likes}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <p className="text-[11px] text-default-400 px-1">ID: {ideaId}</p>
    </div>
  );
}
