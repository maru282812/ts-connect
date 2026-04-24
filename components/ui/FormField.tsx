import type { ReactNode } from "react";

type Props = {
  label: string;
  required?: boolean;
  children: ReactNode;
  description?: string;
  error?: string;
  className?: string;
};

export function FormField({
  label,
  required,
  children,
  description,
  error,
  className = "",
}: Props) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label className="text-sm font-semibold text-slate-700">
        {label}
        {required && <span className="text-danger ml-0.5">*</span>}
      </label>
      {children}
      {description && (
        <p className="text-xs text-slate-400">{description}</p>
      )}
      {error && (
        <p className="text-xs text-danger">{error}</p>
      )}
    </div>
  );
}
