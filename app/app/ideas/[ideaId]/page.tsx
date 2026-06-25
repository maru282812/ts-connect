import Link from "next/link";

interface Props {
  params: Promise<{ ideaId: string }>;
}

const SECTIONS = [
  {
    title: "概要",
    body: "営業部の10名で経費精算SaaS『楽精算』を1ヶ月トライアルし、効果測定の上で全社展開を判断する段階的導入案です。",
  },
  {
    title: "解決したい課題",
    body: "紙の領収書と承認印に依存した精算フローを電子化し、出社せずに精算を完結できる状態にします。",
  },
  {
    title: "実施内容",
    body: "トライアルアカウントの発行、運用ルールの策定、利用状況の計測、月末の振り返りまでを実施します。",
  },
  {
    title: "想定効果",
    body: "精算リードタイムを平均5営業日から1営業日へ短縮、月次の処理集中を平準化します。",
  },
  {
    title: "必要な協力者・リソース",
    body: "情シス1名（アカウント発行）、経理2名（運用確認）。費用は月額30,000円〜。",
  },
];

export default async function IdeaDetailPage({ params }: Props) {
  const { ideaId } = await params;

  return (
    <div className="max-w-[1200px] mx-auto w-full">
      <nav className="flex items-center gap-2 text-sm text-default-500 mb-3">
        <Link href="/app/ideas" className="hover:text-primary">
          企画・アイデア
        </Link>
        <span>/</span>
        <span className="text-default-700">詳細</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-default-200 rounded-xl p-6">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="px-2 py-0.5 text-xs rounded font-bold bg-green-100 text-green-700">
                提案中
              </span>
              <span className="px-2 py-0.5 bg-primary-50 text-primary text-xs rounded border border-primary-100">
                #DX
              </span>
              <span className="px-2 py-0.5 bg-primary-50 text-primary text-xs rounded border border-primary-100">
                #業務効率化
              </span>
            </div>
            <h1 className="text-2xl font-bold text-default-900 mb-2">
              経費精算SaaS『楽精算』の試験導入
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-default-500">
              <span>提案: 営業部 佐藤 健</span>
              <span>作成日: 2026/06/15</span>
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

          <div className="bg-white border border-default-200 rounded-xl p-6">
            <h2 className="text-base font-bold text-default-900 mb-4">
              コメント・問い合わせ
            </h2>
            <textarea
              className="w-full bg-default-50 border border-default-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
              rows={3}
              placeholder="応援コメントや質問を書けます"
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

        <div className="space-y-4">
          <div className="bg-white border border-default-200 rounded-xl p-6 lg:sticky lg:top-6">
            <div className="flex gap-2 mb-4">
              <button
                type="button"
                className="flex-1 bg-primary text-white px-4 py-2.5 rounded-lg text-sm font-bold hover:bg-primary/90"
              >
                ❤ いいね（18）
              </button>
              <button
                type="button"
                className="border border-default-300 text-default-700 px-4 py-2.5 rounded-lg text-sm font-bold hover:bg-default-50"
              >
                🔖
              </button>
            </div>
            <div className="p-3 bg-amber-50 rounded-lg mb-4">
              <p className="text-xs text-amber-700 font-bold">報酬条件</p>
              <p className="text-sm font-bold text-default-800">
                支援金 5,000円相当
              </p>
            </div>
            <dl className="space-y-2 text-sm mb-4">
              <div className="flex justify-between">
                <dt className="text-default-500">採用状態</dt>
                <dd className="font-semibold text-default-800">検討中</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-default-500">支援額相当</dt>
                <dd className="font-semibold text-default-800">5,000円</dd>
              </div>
            </dl>
            <div className="pt-4 border-t border-default-200">
              <p className="text-xs text-default-500 mb-1">関連する困りごと</p>
              <Link
                href="/app/issues/issue-01"
                className="text-sm text-primary font-semibold hover:underline"
              >
                経費精算フローの電子化・簡素化について
              </Link>
            </div>
          </div>
          <p className="text-[11px] text-default-400 px-1">ID: {ideaId}</p>
        </div>
      </div>
    </div>
  );
}
