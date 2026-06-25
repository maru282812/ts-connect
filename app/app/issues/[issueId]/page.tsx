import Link from "next/link";

interface Props {
  params: Promise<{ issueId: string }>;
}

const SECTIONS = [
  {
    title: "背景・経緯",
    body: "現在、経費精算は紙の領収書を台紙に貼り付け、上長の承認印をもらう運用です。リモートワークが増えたことで出社しないと精算が進まず、月末に処理が集中しています。",
  },
  {
    title: "困っている内容",
    body: "承認のための出社が必要で、精算までのリードタイムが長い。差し戻しも紙のやり取りになるため、修正に時間がかかります。",
  },
  {
    title: "解決したい状態",
    body: "領収書の電子化と承認のオンライン化により、出社せずに精算が完結する状態を目指します。",
  },
  {
    title: "募集するアイデアの方向性",
    body: "既存SaaSの活用、承認フローの簡素化、運用ルールの見直しなど、コストを抑えて実現できる案を歓迎します。",
  },
];

const RELATED_IDEAS = [
  {
    id: "idea-01",
    title: "経費精算SaaS『楽精算』の試験導入",
    author: "佐藤 健",
    likes: 18,
  },
  {
    id: "idea-02",
    title: "承認ステップを2段階から1段階へ簡素化",
    author: "鈴木 一郎",
    likes: 9,
  },
];

export default async function IssueDetailPage({ params }: Props) {
  const { issueId } = await params;

  return (
    <div className="max-w-[1200px] mx-auto w-full">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-default-500 mb-3">
        <Link href="/app/issues" className="hover:text-primary">
          困りごと
        </Link>
        <span>/</span>
        <span className="text-default-700">詳細</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left / main */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-default-200 rounded-xl p-6">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="px-2 py-0.5 text-xs rounded font-bold bg-green-100 text-green-700">
                募集中
              </span>
              <span className="px-2 py-0.5 bg-primary-50 text-primary text-xs rounded border border-primary-100">
                #業務効率化
              </span>
              <span className="px-2 py-0.5 bg-primary-50 text-primary text-xs rounded border border-primary-100">
                #DX
              </span>
            </div>
            <h1 className="text-2xl font-bold text-default-900 mb-2">
              経費精算フローの電子化・簡素化について
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-default-500">
              <span>投稿: 管理部 山田 太郎</span>
              <span>発生部署: 営業部</span>
              <span>募集期限: 2026/07/20</span>
            </div>
          </div>

          {SECTIONS.map((s) => (
            <div
              key={s.title}
              className="bg-white border border-default-200 rounded-xl p-6"
            >
              <h2 className="text-base font-bold text-default-900 mb-2">
                {s.title}
              </h2>
              <p className="text-sm text-default-600 leading-relaxed">
                {s.body}
              </p>
            </div>
          ))}

          {/* Related ideas */}
          <div className="bg-white border border-default-200 rounded-xl p-6">
            <h2 className="text-base font-bold text-default-900 mb-4">
              紐づく企画・アイデア（{RELATED_IDEAS.length}）
            </h2>
            <div className="space-y-3">
              {RELATED_IDEAS.map((idea) => (
                <Link
                  key={idea.id}
                  href={`/app/ideas/${idea.id}`}
                  className="flex items-center justify-between p-3 rounded-lg border border-default-200 hover:bg-default-50"
                >
                  <div>
                    <p className="text-sm font-semibold text-default-800">
                      {idea.title}
                    </p>
                    <p className="text-xs text-default-500">
                      提案: {idea.author}
                    </p>
                  </div>
                  <span className="text-xs text-default-500">
                    ❤ {idea.likes}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* Comments */}
          <div className="bg-white border border-default-200 rounded-xl p-6">
            <h2 className="text-base font-bold text-default-900 mb-4">
              コメント・問い合わせ
            </h2>
            <textarea
              className="w-full bg-default-50 border border-default-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
              rows={3}
              placeholder="質問や補足をコメントできます"
            />
            <div className="mt-3 text-right">
              <button
                type="button"
                className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-primary/90"
              >
                コメントする
              </button>
            </div>
          </div>
        </div>

        {/* Right rail */}
        <div className="space-y-4">
          <div className="bg-white border border-default-200 rounded-xl p-6 lg:sticky lg:top-6">
            <div className="p-3 bg-amber-50 rounded-lg mb-4">
              <p className="text-xs text-amber-700 font-bold">報酬条件</p>
              <p className="text-sm font-bold text-default-800">
                支援金 5,000円相当（Amazonギフト券）
              </p>
            </div>
            <dl className="space-y-2 text-sm mb-4">
              <div className="flex justify-between">
                <dt className="text-default-500">募集期限</dt>
                <dd className="font-semibold text-default-800">2026/07/20</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-default-500">提案数</dt>
                <dd className="font-semibold text-default-800">12</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-default-500">いいね</dt>
                <dd className="font-semibold text-default-800">24</dd>
              </div>
            </dl>
            <Link
              href="/app/ideas/new"
              className="block text-center bg-primary text-white px-4 py-2.5 rounded-lg text-sm font-bold hover:bg-primary/90"
            >
              この困りごとに提案する
            </Link>
            <button
              type="button"
              className="mt-2 w-full border border-default-300 text-default-700 px-4 py-2.5 rounded-lg text-sm font-bold hover:bg-default-50"
            >
              ブックマーク
            </button>
          </div>
          <p className="text-[11px] text-default-400 px-1">ID: {issueId}</p>
        </div>
      </div>
    </div>
  );
}
