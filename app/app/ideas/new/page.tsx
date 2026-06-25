import Link from "next/link";

const FIELDS: { label: string; placeholder: string; textarea?: boolean }[] = [
  { label: "タイトル", placeholder: "企画・アイデアのタイトル" },
  {
    label: "概要",
    placeholder: "どんな企画・アイデアか、ひとことで",
    textarea: true,
  },
  {
    label: "解決したい課題",
    placeholder: "この企画で解決したい課題",
    textarea: true,
  },
  { label: "実施内容", placeholder: "具体的に何をするか", textarea: true },
  { label: "想定効果", placeholder: "期待される効果", textarea: true },
  { label: "必要な協力者", placeholder: "巻き込みたい部署・人材" },
  { label: "必要な予算・リソース", placeholder: "概算の費用や工数" },
  { label: "参考URL", placeholder: "https://" },
];

export default function NewIdeaPage() {
  return (
    <div className="max-w-[1200px] mx-auto w-full">
      <nav className="flex items-center gap-2 text-sm text-default-500 mb-3">
        <Link href="/app/ideas" className="hover:text-primary">
          企画・アイデア
        </Link>
        <span>/</span>
        <span className="text-default-700">投稿</span>
      </nav>
      <h1 className="text-2xl font-bold text-default-900 mb-6">
        企画・アイデアを投稿
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2 space-y-5">
          {/* Linked issue selector */}
          <div className="bg-white border border-default-200 rounded-xl p-6">
            <span className="block text-sm font-bold text-default-700 mb-1.5">
              紐づく困りごと（任意）
            </span>
            <select className="w-full bg-default-50 border border-default-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none">
              <option>選択しない（単独の企画として投稿）</option>
              <option>経費精算フローの電子化・簡素化について</option>
              <option>オフィス内リフレッシュスペースの活用案</option>
            </select>
          </div>

          <div className="bg-white border border-default-200 rounded-xl p-6 space-y-5">
            {FIELDS.map((f) => (
              <div key={f.label}>
                <span className="block text-sm font-bold text-default-700 mb-1.5">
                  {f.label}
                </span>
                {f.textarea ? (
                  <textarea
                    className="w-full bg-default-50 border border-default-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                    rows={3}
                    placeholder={f.placeholder}
                  />
                ) : (
                  <input
                    className="w-full bg-default-50 border border-default-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                    placeholder={f.placeholder}
                    type="text"
                  />
                )}
              </div>
            ))}
            <div>
              <span className="block text-sm font-bold text-default-700 mb-1.5">
                タグ
              </span>
              <input
                className="w-full bg-default-50 border border-default-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                placeholder="#DX #業務効率化 （スペース区切り）"
                type="text"
              />
            </div>
            <div>
              <span className="block text-sm font-bold text-default-700 mb-1.5">
                添付画像
              </span>
              <div className="border-2 border-dashed border-default-300 rounded-lg p-8 text-center text-default-400 text-sm">
                画像をドラッグ＆ドロップ、またはクリックして選択
              </div>
            </div>
          </div>
        </div>

        {/* Right rail */}
        <div className="space-y-4">
          <div className="bg-white border border-default-200 rounded-xl p-6 lg:sticky lg:top-6 space-y-5">
            <div>
              <h2 className="text-sm font-bold text-default-900 mb-2">
                投稿前チェック
              </h2>
              <ul className="space-y-1.5 text-sm text-default-600">
                <li>☑ タイトルを入力した</li>
                <li>☐ 概要を入力した</li>
                <li>☐ 実施内容を入力した</li>
              </ul>
            </div>
            <div>
              <h2 className="text-sm font-bold text-default-900 mb-2">
                NGワードチェック
              </h2>
              <p className="text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">
                問題は検出されませんでした
              </p>
            </div>
            <div>
              <h2 className="text-sm font-bold text-default-900 mb-2">
                公開範囲
              </h2>
              <select className="w-full bg-default-50 border border-default-200 rounded-lg px-3 py-2 text-sm">
                <option>全社に公開</option>
                <option>自部署のみ</option>
              </select>
            </div>
            <div>
              <h2 className="text-sm font-bold text-default-900 mb-2">
                入力進捗
              </h2>
              <div className="h-2 bg-default-100 rounded-full overflow-hidden">
                <div className="h-full w-1/3 bg-primary" />
              </div>
              <p className="text-xs text-default-500 mt-1">33% 入力済み</p>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                className="w-full bg-primary text-white px-4 py-2.5 rounded-lg text-sm font-bold hover:bg-primary/90"
              >
                投稿する
              </button>
              <button
                type="button"
                className="w-full border border-default-300 text-default-700 px-4 py-2.5 rounded-lg text-sm font-bold hover:bg-default-50"
              >
                下書き保存
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
