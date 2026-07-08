import Link from "next/link";

interface IssueConsultClientProps {
  /** 困りごと一覧へ戻るリンク先（例: /app/issues, /company/issues-feed） */
  issuesBasePath?: string;
}

const IMPACT_LEVELS = ["軽微", "中程度", "重大"];

const PRE_SEND_CHECKS = [
  "個人情報や機密情報は含まれていませんか？",
  "困りごとの内容が第三者にも伝わる内容ですか？",
  "過去のナレッジベースに関連する解決策はありませんでしたか？",
];

const FLOW_STEPS = [
  "管理者が内容を確認し、優先度を判定します。",
  "詳細確認のため、チャット等で連絡がくる場合があります。",
  "解決に向けたアクションプランが提示されます。",
];

/** U-02r 困りごとを相談する（相談リクエスト） */
export function IssueConsultClient({
  issuesBasePath = "/app/issues",
}: IssueConsultClientProps = {}) {
  return (
    <div className="max-w-[1400px] mx-auto w-full">
      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-2 text-sm text-default-500">
        <Link href={issuesBasePath} className="hover:text-primary">
          困りごと
        </Link>
        <span>›</span>
        <span className="text-default-900 font-semibold">相談リクエスト</span>
      </nav>

      {/* Title */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-default-900">
          困りごとを相談する
        </h1>
        <p className="text-sm text-default-500 mt-2">
          業務上の課題や悩みについて、管理者に相談リクエストを送ることができます。
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-xl border border-default-200 p-8 space-y-7">
            {/* 発生部署・拠点 / 業務領域 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <span className="block text-sm font-bold text-default-800">
                  発生部署・拠点
                </span>
                <select className="w-full border border-default-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary outline-none">
                  <option>マーケティング部</option>
                  <option>営業部</option>
                  <option>開発部</option>
                  <option>人事総務部</option>
                </select>
              </div>
              <div className="space-y-2">
                <span className="block text-sm font-bold text-default-800">
                  業務領域
                </span>
                <select className="w-full border border-default-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary outline-none">
                  <option>社内ツール・システム</option>
                  <option>業務プロセス</option>
                  <option>組織・コミュニケーション</option>
                  <option>その他</option>
                </select>
              </div>
            </div>

            <div className="border-t border-default-100" />

            {/* 相談のタイトル */}
            <div className="space-y-2">
              <span className="flex items-center gap-2 text-sm font-bold text-default-800">
                相談のタイトル
                <span className="text-red-500 text-xs font-bold">必須</span>
              </span>
              <input
                className="w-full border border-default-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                placeholder="例：経費精算システムのログイン不具合について"
                type="text"
              />
            </div>

            {/* どのようなことで困っていますか？ */}
            <div className="space-y-2">
              <span className="flex items-center gap-2 text-sm font-bold text-default-800">
                どのようなことで困っていますか？
                <span className="text-red-500 text-xs font-bold">必須</span>
              </span>
              <textarea
                className="w-full border border-default-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                rows={4}
                placeholder="現状の課題を具体的に記載してください"
              />
            </div>

            {/* 解決したい状態・理想の姿 */}
            <div className="space-y-2">
              <span className="block text-sm font-bold text-default-800">
                解決したい状態・理想の姿
              </span>
              <textarea
                className="w-full border border-default-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                rows={3}
                placeholder="この相談を通じてどのようになれば良いかを記載してください"
              />
            </div>

            <div className="border-t border-default-100" />

            {/* 業務への影響度 / 発生頻度 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <span className="block text-sm font-bold text-default-800">
                  業務への影響度
                </span>
                <div className="flex gap-3">
                  {IMPACT_LEVELS.map((level) => (
                    <label
                      key={level}
                      className="flex-1 flex items-center justify-center px-3 py-2.5 border border-default-200 rounded-lg cursor-pointer text-sm font-bold text-default-700 hover:bg-default-50 has-[:checked]:bg-primary-50 has-[:checked]:border-primary has-[:checked]:text-primary"
                    >
                      <input className="sr-only" name="impact" type="radio" />
                      {level}
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <span className="block text-sm font-bold text-default-800">
                  発生頻度
                </span>
                <select className="w-full border border-default-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary outline-none">
                  <option>毎日</option>
                  <option>週に数回</option>
                  <option>月に数回</option>
                  <option>不定期</option>
                </select>
              </div>
            </div>

            {/* すでに試したこと・相談した相手 */}
            <div className="space-y-2">
              <span className="block text-sm font-bold text-default-800">
                すでに試したこと・相談した相手
              </span>
              <textarea
                className="w-full border border-default-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                rows={2}
                placeholder="ご自身で試された対処法や、既に周りに相談していればその内容を記載してください"
              />
            </div>

            {/* 関連資料・スクリーンショット */}
            <div className="space-y-2">
              <span className="block text-sm font-bold text-default-800">
                関連資料・スクリーンショット
              </span>
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-default-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary hover:bg-primary-50/40 transition-colors">
                <UploadIcon />
                <span className="text-sm text-default-600 mt-2">
                  クリック、またはファイルをドラッグ＆ドロップ
                </span>
                <span className="text-xs text-default-400 mt-1 font-bold">
                  最大10MB (PDF, JPG, PNG)
                </span>
                <input className="sr-only" type="file" />
              </label>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 lg:sticky lg:top-6 space-y-6">
          <div className="bg-default-50 rounded-xl border border-default-200 p-6">
            <h3 className="flex items-center gap-2 text-base font-bold text-default-900 mb-4">
              <CheckSquareIcon />
              送信前チェック
            </h3>
            <div className="space-y-4">
              {PRE_SEND_CHECKS.map((c) => (
                <label
                  key={c}
                  className="flex items-start gap-3 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    className="mt-0.5 w-4 h-4 rounded border-default-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-default-600">{c}</span>
                </label>
              ))}
            </div>
            <div className="mt-5 pt-5 border-t border-default-200">
              <p className="text-sm font-bold text-default-800 mb-3">
                送信後の流れ
              </p>
              <ol className="space-y-2">
                {FLOW_STEPS.map((s, i) => (
                  <li key={s} className="flex gap-2 text-xs text-default-600">
                    <span className="font-bold text-primary">{i + 1}.</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <div className="bg-primary-50 rounded-xl border border-primary-100 p-6">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-base font-bold text-default-900">
                相談窓口：DX推進室
              </p>
            </div>
            <p className="text-[10px] tracking-wide text-primary font-bold mb-3">
              RESPONSE WITHIN 24H
            </p>
            <p className="text-sm text-default-600 leading-relaxed">
              お急ぎの場合や、システムに起因しない組織的なトラブルについては、直接所属長への相談もご検討ください。
            </p>
          </div>
        </div>
      </div>

      {/* Action bar */}
      <div className="flex items-center justify-between mt-8">
        <Link
          href={issuesBasePath}
          className="inline-flex items-center gap-2 text-sm font-bold text-default-600 hover:text-default-900"
        >
          ← 一覧に戻る
        </Link>
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="text-sm font-bold text-primary hover:underline"
          >
            下書き保存
          </button>
          <button
            type="button"
            className="px-6 py-3 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 shadow-sm"
          >
            管理者にリクエストを送る
          </button>
        </div>
      </div>
    </div>
  );
}

function UploadIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-8 w-8 text-default-400"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="M17 8l-5-5-5 5" />
      <path d="M12 3v12" />
    </svg>
  );
}

function CheckSquareIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5 text-primary"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  );
}
