/**
 * FormField — 共通フォームフィールドラッパー
 *
 * HeroUI の Input / Textarea / Select / DateInput を内包し、
 * ラベル・入力欄・補助文の3層を一貫したレイアウトで表示する。
 *
 * 使い方:
 *   <FormField>
 *     <Input labelPlacement="outside" label="タイトル" ... />
 *   </FormField>
 *
 * - 各 HeroUI 要素には必ず labelPlacement="outside" を付ける
 * - 補助文は Input の description prop で渡す（FormField の外に置かない）
 * - 項目間の余白はこのラッパーの mb クラスで一元管理する
 */

interface FormFieldProps {
  children: React.ReactNode;
  className?: string;
}

export function FormField({ children, className = "" }: FormFieldProps) {
  return <div className={`w-full ${className}`}>{children}</div>;
}

/**
 * FormSection — フォーム内のセクション区切り
 * セクションタイトルとフォームグループをまとめる。
 */
interface FormSectionProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormSection({
  title,
  children,
  className = "",
}: FormSectionProps) {
  return (
    <div className={`flex flex-col gap-5 ${className}`}>
      {title && (
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          {title}
        </p>
      )}
      {children}
    </div>
  );
}

/**
 * 共通ラベルスタイル — HeroUI Input の classNames.label に渡す
 */
export const formLabelClasses = {
  label: "text-sm font-medium text-slate-700 pb-0.5",
  description: "text-xs text-slate-400 mt-1",
  errorMessage: "text-xs text-danger mt-1",
} as const;
