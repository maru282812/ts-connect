import Link from "next/link";

interface Props {
  reqId: string;
  /** 戻り先（相談リクエスト一覧）のパス */
  backHref?: string;
}

const DETAIL_FIELDS: {
  label: string;
  placeholder?: string;
  value?: string;
  required?: boolean;
  textarea?: boolean;
}[] = [
  {
    label: "困りごとの内容",
    placeholder:
      "現状どのような状況で、何に困っているかを具体的に入力してください",
    required: true,
    textarea: true,
  },
  {
    label: "発生の背景・経緯",
    placeholder:
      "これまでに試したことや、なぜ解決が必要なのかの背景を入力してください",
    textarea: true,
  },
];

export function IssueRequestDetailView({
  reqId,
  backHref = "/company/issues-feed",
}: Props) {
  return (
    <div className="max-w-[1600px] mx-auto w-full">
      {/* Header */}
      <header className="flex justify-between items-center mb-8">
        <div>
          <nav className="flex items-center gap-2 text-default-500 mb-1 text-xs">
            <span>コンテンツ</span>
            <span>›</span>
            <span>困りごと</span>
            <span>›</span>
            <span className="font-bold text-primary">リクエスト詳細</span>
          </nav>
          <h1 className="text-2xl font-bold text-default-900">
            リクエスト詳細・困りごと化
          </h1>
        </div>
        <Link
          href={backHref}
          className="px-4 py-2 text-default-600 border border-default-200 bg-white rounded-lg text-sm hover:bg-default-50"
        >
          一覧へ戻る
        </Link>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-10 gap-8">
        {/* Left: form */}
        <div className="lg:col-span-7 space-y-6">
          <section className="bg-white rounded-xl border border-default-200 p-6">
            <h3 className="text-base font-bold text-default-900 mb-6">
              基本情報
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <span className="block text-sm text-default-500">
                  タイトル <span className="text-red-500">*</span>
                </span>
                <input
                  className="w-full border border-default-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                  defaultValue="パッケージデザイン案の作成についての相談"
                  type="text"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <span className="block text-sm text-default-500">
                    発生部署・業務領域
                  </span>
                  <select className="w-full border border-default-200 rounded-lg p-3 text-sm bg-white focus:ring-2 focus:ring-primary outline-none">
                    <option>部署を選択してください</option>
                    <option>広報部</option>
                    <option>情報システム部</option>
                    <option>営業推進部</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <span className="block text-sm text-default-500">
                    タグ（複数選択可）
                  </span>
                  <input
                    className="w-full border border-default-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                    placeholder="タグを入力..."
                    type="text"
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-xl border border-default-200 p-6">
            <h3 className="text-base font-bold text-default-900 mb-6">
              詳細内容
            </h3>
            <div className="space-y-6">
              {DETAIL_FIELDS.map((f) => (
                <div key={f.label} className="space-y-2">
                  <span className="block text-sm text-default-500">
                    {f.label}
                    {f.required && <span className="text-red-500"> *</span>}
                  </span>
                  <textarea
                    className="w-full border border-default-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                    rows={4}
                    placeholder={f.placeholder}
                  />
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white rounded-xl border border-default-200 p-6">
            <h3 className="text-base font-bold text-default-900 mb-6">
              ゴールと期待
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <span className="block text-sm text-default-500">
                  解決したい状態（ゴール）
                </span>
                <input
                  className="w-full border border-default-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                  placeholder="例：検索時間が従来の半分以下になる"
                  type="text"
                />
              </div>
              <div className="space-y-2">
                <span className="block text-sm text-default-500">
                  期待する効果
                </span>
                <input
                  className="w-full border border-default-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                  placeholder="例：月間100時間の工数削減"
                  type="text"
                />
              </div>
            </div>
          </section>

          <section className="bg-white rounded-xl border border-default-200 p-6">
            <h3 className="text-base font-bold text-default-900 mb-6">
              募集・公開設定
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <span className="block text-sm text-default-500">募集期限</span>
                <input
                  className="w-full border border-default-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                  type="date"
                />
              </div>
              <div className="space-y-2">
                <span className="block text-sm text-default-500">公開状態</span>
                <select className="w-full border border-default-200 rounded-lg p-3 text-sm bg-white focus:ring-2 focus:ring-primary outline-none">
                  <option>下書き</option>
                  <option>公開（即時）</option>
                  <option>非公開</option>
                </select>
              </div>
            </div>
          </section>
        </div>

        {/* Right: panels */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-xl border border-default-200 overflow-hidden">
            <div className="bg-primary text-white p-4">
              <h4 className="font-bold">報酬条件</h4>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-2">
                <span className="block text-sm text-default-500">報酬種別</span>
                <select className="w-full border border-default-200 rounded-lg p-2 text-sm bg-white">
                  <option>ギフト券 (Amazon等)</option>
                  <option>社内ポイント</option>
                  <option>特別休暇</option>
                </select>
              </div>
              <div className="space-y-2">
                <span className="block text-sm text-default-500">
                  金額 / 相当額
                </span>
                <input
                  className="w-full border border-default-200 rounded-lg p-2 text-sm outline-none"
                  type="number"
                  defaultValue={3000}
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-default-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-default-200 bg-default-50">
              <h3 className="text-sm font-bold text-default-600">
                🔗 紐づく相談リクエスト
              </h3>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex justify-between items-start">
                <span className="bg-default-100 px-2 py-0.5 rounded text-[10px] font-bold text-default-600">
                  {reqId}
                </span>
                <span className="text-[11px] text-default-400">2023.10.15</span>
              </div>
              <h4 className="text-sm font-bold text-default-800">
                パッケージデザイン案の作成についての相談
              </h4>
              <p className="text-xs text-default-500">相談者: 佐藤 健司 様</p>
              <button
                type="button"
                className="inline-flex items-center gap-1 text-primary text-sm font-bold hover:underline"
              >
                元の相談内容を見る
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <button
              type="button"
              className="w-full py-3 bg-primary text-white rounded-lg font-bold hover:bg-primary/90 shadow-sm"
            >
              困りごととして公開
            </button>
            <button
              type="button"
              className="w-full py-3 bg-white text-default-600 border border-default-200 rounded-lg text-sm hover:bg-default-50"
            >
              下書き保存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
