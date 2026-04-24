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

export const formInputClasses = {
  inputWrapper: "border-slate-300 hover:border-slate-400 bg-white h-12",
  input: "text-base",
} as const;

export const formTextareaClasses = {
  inputWrapper: "border-slate-300 hover:border-slate-400 bg-white",
  input: "text-base leading-relaxed py-2",
} as const;

export const formSelectClasses = {
  trigger: "border-slate-300 hover:border-slate-400 bg-white h-12",
  value: "text-base",
} as const;

export const formInputReadonlyClasses = {
  inputWrapper: "border-slate-200 bg-slate-50 h-12",
  input: "text-base",
} as const;
