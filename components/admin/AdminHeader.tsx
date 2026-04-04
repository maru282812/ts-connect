"use client";

import { usePathname } from "next/navigation";

interface AdminHeaderProps {
  displayName: string;
  email: string;
}

function isOfficialRoute(pathname: string): boolean {
  return (
    pathname.startsWith("/company/posts/new/official") ||
    pathname.startsWith("/company/posts/new/official")
  );
}

export function AdminHeader({ displayName, email }: AdminHeaderProps) {
  const pathname = usePathname();
  const official = isOfficialRoute(pathname);

  if (official) {
    return (
      <header className="bg-blue-950 px-6 py-3 flex items-center justify-between sticky top-0 z-10 border-b border-blue-900">
        <div className="text-sm text-blue-300">
          <span className="font-semibold text-white">WorkMarket</span>
          <span className="ml-2 text-blue-400">公式案件 管理</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium text-white">{displayName}</p>
            <p className="text-xs text-blue-400">{email}</p>
          </div>
          <div className="w-8 h-8 bg-blue-700 rounded-full flex items-center justify-center text-white text-sm font-bold">
            {displayName.charAt(0)}
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-slate-800 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
      <div className="text-sm text-slate-300">
        <span className="font-semibold text-white">WorkMarket</span>
        <span className="ml-2 text-slate-400">管理画面</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-medium text-white">{displayName}</p>
          <p className="text-xs text-slate-400">{email}</p>
        </div>
        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
          {displayName.charAt(0)}
        </div>
      </div>
    </header>
  );
}
