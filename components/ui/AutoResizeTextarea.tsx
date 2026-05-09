"use client";

import { useEffect, useRef } from "react";

interface AutoResizeTextareaProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  isRequired?: boolean;
  minRows?: number;
  className?: string;
  id?: string;
}

export function AutoResizeTextarea({
  value,
  onValueChange,
  placeholder,
  isRequired,
  minRows = 5,
  className = "",
  id,
}: AutoResizeTextareaProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const resize = (el: HTMLTextAreaElement) => {
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };

  useEffect(() => {
    if (ref.current) resize(ref.current);
  }, [value]);

  const minHeightPx = minRows * 1.6 * 16;

  return (
    <textarea
      ref={ref}
      id={id}
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
      onInput={(e) => resize(e.currentTarget)}
      placeholder={placeholder}
      required={isRequired}
      style={{ minHeight: `${minHeightPx}px` }}
      className={`w-full rounded-md border border-slate-300 bg-white px-3 py-3 text-base leading-relaxed text-slate-900 caret-black outline-none resize-vertical transition-colors hover:border-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${className}`}
    />
  );
}
