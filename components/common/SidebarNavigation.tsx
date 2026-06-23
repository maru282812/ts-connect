"use client";

import Link from "next/link";
import { useState } from "react";
import type {
  SidebarGroupId,
  SidebarGroupSpec,
  SidebarItemSpec,
} from "@/constants/navigationParts";
import { NavigationIcon } from "@/components/common/NavigationIcon";

type SidebarTone = "light" | "dark";

interface SidebarNavigationProps {
  groups: SidebarGroupSpec[];
  pathname: string;
  tone: SidebarTone;
  onNavigate?: () => void;
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className={cx(
        "h-4 w-4 transition-transform duration-200",
        open && "rotate-180",
      )}
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function isItemActive(item: SidebarItemSpec, pathname: string) {
  return item.matchHrefs.some((href) => pathname.startsWith(href));
}

export function SidebarNavigation({
  groups,
  pathname,
  tone,
  onNavigate,
}: SidebarNavigationProps) {
  const [openGroups, setOpenGroups] = useState<
    Partial<Record<SidebarGroupId, boolean>>
  >({});
  const dark = tone === "dark";

  const renderItem = (item: SidebarItemSpec) => {
    const active = isItemActive(item, pathname);
    const planned = item.lifecycle === "planned";
    const iconClassName = cx(
      "h-[18px] w-[18px] shrink-0",
      active && dark && "text-blue-400",
      active && !dark && "text-primary",
      !active && dark && "text-slate-500",
      !active && !dark && "text-default-400",
    );
    const itemClassName = cx(
      "flex min-h-[40px] items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
      dark &&
        (active
          ? "bg-slate-700 text-white"
          : "text-slate-300 hover:bg-slate-700 hover:text-white"),
      !dark &&
        (active
          ? "border-l-4 border-primary bg-primary-50 text-primary"
          : "text-default-600 hover:bg-default-100 hover:text-default-900"),
      planned && "cursor-not-allowed opacity-45 hover:bg-transparent",
    );

    const content = (
      <>
        <NavigationIcon name={item.icon} className={iconClassName} />
        <span className="truncate">{item.label}</span>
      </>
    );

    if (planned) {
      return (
        <button
          key={item.id}
          type="button"
          aria-disabled="true"
          className={cx(itemClassName, "w-full")}
          title="未実装"
        >
          {content}
        </button>
      );
    }

    return (
      <Link
        key={item.id}
        href={item.href}
        onClick={onNavigate}
        className={itemClassName}
      >
        {content}
      </Link>
    );
  };

  return (
    <div className="space-y-2">
      {groups.map((group) => {
        const hasActiveItem = group.items.some((item) =>
          isItemActive(item, pathname),
        );
        const open =
          openGroups[group.id] ?? (hasActiveItem || group.defaultOpen);
        const groupIsActive = hasActiveItem || open;

        return (
          <section key={group.id} className="space-y-1">
            <button
              type="button"
              className={cx(
                "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition-colors",
                dark
                  ? "text-slate-400 hover:text-white"
                  : "text-default-500 hover:bg-default-100 hover:text-default-900",
                groupIsActive && dark && "text-slate-200",
                groupIsActive && !dark && "text-primary",
              )}
              aria-expanded={open}
              onClick={() =>
                setOpenGroups((current) => ({
                  ...current,
                  [group.id]: !open,
                }))
              }
            >
              <span className="flex min-w-0 items-center gap-3">
                <NavigationIcon
                  name={group.icon}
                  className="h-[18px] w-[18px] shrink-0"
                />
                <span className="truncate text-[11px] font-bold uppercase tracking-wider">
                  {group.label}
                </span>
              </span>
              <ChevronIcon open={open} />
            </button>

            {open && (
              <div className="ml-4 flex flex-col gap-1">
                {group.items.map(renderItem)}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
