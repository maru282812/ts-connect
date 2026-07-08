import Link from "next/link";

interface Props {
  /** 企画・アイデア一覧のベースパス（例: /app/ideas, /company/ideas-feed） */
  ideasBasePath?: string;
}

const CHECKLIST = [
  "タイトルは具体的ですか？",
  "想定効果は明確ですか？",
  "必要なリソースを記載しましたか？",
];

export function IdeaNewView({ ideasBasePath = "/app/ideas" }: Props) {
  return (
    <div className="max-w-[1200px] mx-auto w-full">
      {/* 紐づく困りごと（任意） */}
      <div className="bg-white border border-default-200 rounded-xl p-6 mb-6">
        <span className="block text-sm font-bold text-default-700 mb-2">
          紐づく困りごと（任意）
        </span>
        <div className="relative">
          <select className="w-full appearance-none bg-default-50 border border-default-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none">
            <option>営業日報の入力負荷を軽減したい</option>
            <option>選択しない（単独の企画として投稿）</option>
            <option>経費精算フローの電子化・簡素化について</option>
          </select>
        </div>

        {/* 選択中の困りごとプレビュー */}
        <div className="mt-4 flex gap-4 bg-primary-50/60 border border-primary-100 rounded-lg p-4">
          <span className="shrink-0 w-10 h-10 rounded-lg bg-primary text-white flex items-center justify-center">
            <DocIcon />
          </span>
          <div className="min-w-0">
            <p className="text-base font-bold text-primary">
              営業日報の入力負荷を軽減したい
            </p>
            <p className="text-sm text-default-600 mt-1">
              外出先からのスマホ入力が難しく、帰社後の入力が1時間以上かかっている現状を改善したい。解決策にはインセンティブあり。
            </p>
            <div className="flex flex-wrap items-center gap-4 mt-3 text-xs">
              <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 font-bold px-2 py-1 rounded">
                🎁 報酬: Amazonギフト券 ¥3,000
              </span>
              <span className="text-default-500">募集期限: 2024/12/31</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Form */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-default-200 rounded-xl p-6 space-y-5">
            {/* タイトル */}
            <div>
              <span className="block text-sm font-bold text-default-700 mb-1.5">
                タイトル <span className="text-red-500">*</span>
              </span>
              <input
                className="w-full bg-default-50 border border-default-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                placeholder="AI音声認識を活用した日報入力支援ツールの導入"
                type="text"
              />
            </div>

            {/* 概要 */}
            <div>
              <span className="block text-sm font-bold text-default-700 mb-1.5">
                概要
              </span>
              <textarea
                className="w-full bg-default-50 border border-default-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                rows={3}
                placeholder="企画の核となる部分を簡潔に記載してください"
              />
            </div>

            {/* 解決したい課題 / 実施内容 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <span className="block text-sm font-bold text-default-700 mb-1.5">
                  解決したい課題
                </span>
                <textarea
                  className="w-full bg-default-50 border border-default-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                  rows={3}
                  placeholder="現状のボトルネックなど"
                />
              </div>
              <div>
                <span className="block text-sm font-bold text-default-700 mb-1.5">
                  実施内容
                </span>
                <textarea
                  className="w-full bg-default-50 border border-default-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                  rows={3}
                  placeholder="具体的なアクションプラン"
                />
              </div>
            </div>

            {/* 想定効果 */}
            <div>
              <span className="block text-sm font-bold text-default-700 mb-1.5">
                想定効果
              </span>
              <input
                className="w-full bg-default-50 border border-default-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                placeholder="定量的・定性的なメリット"
                type="text"
              />
            </div>

            {/* 必要な協力者 / 必要な予算・リソース */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <span className="block text-sm font-bold text-default-700 mb-1.5">
                  必要な協力者
                </span>
                <input
                  className="w-full bg-default-50 border border-default-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                  placeholder="エンジニア、各拠点リーダー等"
                  type="text"
                />
              </div>
              <div>
                <span className="block text-sm font-bold text-default-700 mb-1.5">
                  必要な予算・リソース
                </span>
                <input
                  className="w-full bg-default-50 border border-default-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                  placeholder="ライセンス費用、検証用端末など"
                  type="text"
                />
              </div>
            </div>

            {/* タグ */}
            <div>
              <span className="block text-sm font-bold text-default-700 mb-1.5">
                タグ
              </span>
              <div className="flex flex-wrap gap-2 mb-2">
                {["#業務効率化", "#AI", "#DX"].map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary-50 text-primary text-xs rounded-full border border-primary-100"
                  >
                    {t}
                    <span className="text-primary/60">×</span>
                  </span>
                ))}
              </div>
              <input
                className="w-full bg-default-50 border border-default-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                placeholder="タグを入力してEnter（例: #テレワーク）"
                type="text"
              />
            </div>

            {/* 参考資料・画像 */}
            <div>
              <span className="block text-sm font-bold text-default-700 mb-1.5">
                参考資料・画像
              </span>
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-default-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary hover:bg-primary-50/40 transition-colors">
                <UploadIcon />
                <span className="text-sm text-default-600 mt-2">
                  クリックまたはファイルをドラッグ＆ドロップ
                </span>
                <span className="text-xs text-default-400 mt-1 font-bold">
                  PDF, JPG, PNG (最大 10MB)
                </span>
                <input className="sr-only" type="file" />
              </label>
            </div>

            {/* 参考URL */}
            <div>
              <span className="block text-sm font-bold text-default-700 mb-1.5">
                参考URL
              </span>
              <input
                className="w-full bg-default-50 border border-default-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                placeholder="https://example.com"
                type="url"
              />
            </div>
          </div>
        </div>

        {/* Right rail */}
        <div className="lg:sticky lg:top-6">
          <div className="bg-white border border-default-200 rounded-xl p-6">
            <h2 className="text-base font-bold text-default-900 mb-4">
              投稿前チェックリスト
            </h2>
            <div className="space-y-4">
              {CHECKLIST.map((c) => (
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
            <div className="mt-5 pt-5 border-t border-default-100">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-bold text-default-700">
                  入力進捗
                </span>
                <span className="text-sm font-bold text-primary">85%</span>
              </div>
              <div className="h-2 bg-default-100 rounded-full overflow-hidden">
                <div className="h-full w-[85%] bg-primary" />
              </div>
              <p className="text-xs text-default-400 mt-2">
                ※必須項目がすべて埋まると100%になります
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action bar */}
      <div className="flex items-center justify-between mt-8">
        <Link
          href={ideasBasePath}
          className="inline-flex items-center gap-2 text-sm font-bold text-default-600 hover:text-default-900"
        >
          ← 一覧に戻る
        </Link>
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="px-5 py-3 border border-default-300 text-default-700 rounded-lg text-sm font-bold hover:bg-default-50"
          >
            下書き保存
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 shadow-sm"
          >
            企画を投稿する ▷
          </button>
        </div>
      </div>
    </div>
  );
}

function DocIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
    </svg>
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
