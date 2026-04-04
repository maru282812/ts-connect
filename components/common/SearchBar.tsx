"use client";

import { Input } from "@heroui/react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchBar({
  value,
  onChange,
  placeholder = "キーワードで検索",
  className,
}: SearchBarProps) {
  return (
    <Input
      value={value}
      onValueChange={onChange}
      placeholder={placeholder}
      startContent={
        <svg
          className="text-default-400 shrink-0"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
      }
      className={className}
      classNames={{ inputWrapper: "bg-white shadow-sm" }}
    />
  );
}
