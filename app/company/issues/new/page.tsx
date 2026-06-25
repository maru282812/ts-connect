import Link from "next/link";

const MAIN_FIELDS: {
  label: string;
  placeholder: string;
  textarea?: boolean;
}[] = [
  { label: "タイトル", placeholder: "困りごとのタイトル" },
  { label: "困りごとの内容", placeholder: "何に困っているか", textarea: true },
  { label: "背景・経緯", placeholder: "発生の背景", textarea: true },
  {
    label: "解決したい状態",
    placeholder: "どうなれば解決か",
    textarea: true,
  },
  { label: "期待する効果", placeholder: "期待される効果", textarea: true },
  {
    label: "募集するアイデアの方向性",
    placeholder: "どんな提案を求めるか",
    textarea: true,
  },
];

export default function NewCompanyIssuePage() {
  return (
    <div className="max-w-[1200px] mx-auto w-full">
      <nav className="flex items-center gap-2 text-sm text-default-500 mb-3">
        <Link href="/company/issues" className="hover:text-primary">
          困りごと管理
        </Link>
        <span>/</span>
        <span className="text-default-700">新規作成</span>
      </nav>
      <h1 className="text-2xl font-bold text-default-900 mb-6">
        困りごと作成・編集
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white border border-default-200 rounded-xl p-6 space-y-5">
            {MAIN_FIELDS.map((f) => (
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="block text-sm font-bold text-default-700 mb-1.5">
                  発生部署・業務領域
                </span>
                <select className="w-full bg-default-50 border border-default-200 rounded-lg px-3 py-2 text-sm">
                  <option>営業部</option>
                  <option>開発部</option>
                  <option>人事総務部</option>
                </select>
              </div>
              <div>
                <span className="block text-sm font-bold text-default-700 mb-1.5">
                  募集期限
                </span>
                <input
                  className="w-full bg-default-50 border border-default-200 rounded-lg px-3 py-2 text-sm"
                  type="date"
                />
              </div>
            </div>
            <div>
              <span className="block text-sm font-bold text-default-700 mb-1.5">
                タグ
              </span>
              <input
                className="w-full bg-default-50 border border-default-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                placeholder="#DX #業務効率化"
                type="text"
              />
            </div>
          </div>
        </div>

        {/* Right rail */}
        <div className="space-y-4">
          <div className="bg-white border border-default-200 rounded-xl p-6 lg:sticky lg:top-6 space-y-5">
            <div>
              <h2 className="text-sm font-bold text-default-900 mb-3">
                報酬条件設定
              </h2>
              <label className="flex items-center gap-2 text-sm text-default-600 mb-3">
                <input
                  className="w-4 h-4 rounded border-default-300 text-primary focus:ring-primary"
                  type="checkbox"
                />
                報酬を設定する
              </label>
              <select className="w-full bg-default-50 border border-default-200 rounded-lg px-3 py-2 text-sm mb-2">
                <option>報酬種別を選択</option>
                <option>支援金（ギフト券）</option>
                <option>社内ポイント</option>
                <option>特別ボーナス</option>
              </select>
              <input
                className="w-full bg-default-50 border border-default-200 rounded-lg px-3 py-2 text-sm"
                placeholder="金額・相当額"
                type="text"
              />
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
                公開状態
              </h2>
              <select className="w-full bg-default-50 border border-default-200 rounded-lg px-3 py-2 text-sm">
                <option>下書き</option>
                <option>公開</option>
              </select>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                className="w-full bg-primary text-white px-4 py-2.5 rounded-lg text-sm font-bold hover:bg-primary/90"
              >
                公開する
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
