"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// ============================================================
// ヘッダーの全体検索（コンテンツ横断）
// 案件(posts) と 社内SNS(community_posts) を client-side Supabase + RLS で
// ilike 横断検索し、ヘッダー直下のドロップダウンに候補を出す。
// RLS により「自社・公開済みで自分に見える範囲」だけが返る（既存パターン踏襲）。
// surface でユーザー/管理のトーンと遷移先ルートを切り替える。
// ============================================================

export type GlobalSearchSurface = "user" | "admin";

type ResultKind = "post" | "community";

interface SearchResult {
  id: string;
  kind: ResultKind;
  title: string;
  snippet: string;
  href: string;
}

const KIND_LABEL: Record<ResultKind, string> = {
  post: "案件",
  community: "社内SNS",
};

const KIND_BADGE: Record<ResultKind, string> = {
  post: "bg-blue-100 text-blue-700",
  community: "bg-emerald-100 text-emerald-700",
};

const MIN_QUERY_LENGTH = 2;
const PER_KIND_LIMIT = 6;

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

// 単一行のスニペットに整形（改行をつぶし、長すぎる場合は切り詰める）
function toSnippet(text: string | null | undefined, max = 80): string {
  if (!text) return "";
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max)}…` : flat;
}

async function runSearch(
  rawQuery: string,
  surface: GlobalSearchSurface,
): Promise<SearchResult[]> {
  // PostgREST の or() 構文を壊す文字を除去し、ilike 用にエスケープ不要な形にする。
  const sanitized = rawQuery.replace(/[,()%\\]/g, " ").trim();
  if (sanitized.length < MIN_QUERY_LENGTH) return [];
  const like = `%${sanitized}%`;

  const supabase = createClient();
  const [postsRes, communityRes] = await Promise.all([
    supabase
      .from("posts")
      .select("id, title, body")
      .or(`title.ilike.${like},body.ilike.${like}`)
      .order("created_at", { ascending: false })
      .limit(PER_KIND_LIMIT),
    supabase
      .from("community_posts")
      .select("id, body")
      .ilike("body", like)
      .is("deleted_at", null)
      .eq("is_hidden", false)
      .eq("is_draft", false)
      .order("created_at", { ascending: false })
      .limit(PER_KIND_LIMIT),
  ]);

  const postHref = (id: string) =>
    surface === "user" ? `/app/posts/${id}` : `/company/posts/${id}/edit`;
  const communityHref = (id: string) =>
    surface === "user"
      ? `/app/community#community-post-${id}`
      : `/company/community#community-post-${id}`;

  const postResults: SearchResult[] = (postsRes.data ?? []).map((p) => ({
    id: p.id,
    kind: "post",
    title: p.title || "(無題の案件)",
    snippet: toSnippet(p.body),
    href: postHref(p.id),
  }));

  const communityResults: SearchResult[] = (communityRes.data ?? []).map(
    (c) => ({
      id: c.id,
      kind: "community",
      title: toSnippet(c.body, 40) || "(本文なし)",
      snippet: toSnippet(c.body),
      href: communityHref(c.id),
    }),
  );

  return [...postResults, ...communityResults];
}

interface GlobalSearchProps {
  surface: GlobalSearchSurface;
}

export function GlobalSearch({ surface }: GlobalSearchProps) {
  const router = useRouter();
  const dark = surface === "admin";
  const listboxId = useId();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  // 連続リクエストの取り違え（古い結果が後着で上書き）を防ぐためのシーケンス番号。
  const requestSeq = useRef(0);

  const trimmed = query.trim();
  const canSearch = trimmed.length >= MIN_QUERY_LENGTH;

  useEffect(() => {
    if (!canSearch) {
      setResults([]);
      setLoading(false);
      setActiveIndex(-1);
      return;
    }
    setLoading(true);
    const seq = ++requestSeq.current;
    const handle = setTimeout(async () => {
      try {
        const found = await runSearch(trimmed, surface);
        if (seq !== requestSeq.current) return; // 後発リクエストが走っていれば破棄
        setResults(found);
        setActiveIndex(found.length > 0 ? 0 : -1);
      } finally {
        if (seq === requestSeq.current) setLoading(false);
      }
    }, 250);
    return () => clearTimeout(handle);
  }, [trimmed, canSearch, surface]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const go = (result: SearchResult) => {
    setOpen(false);
    setQuery("");
    setResults([]);
    router.push(result.href);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }
    if (!open || results.length === 0) {
      if (event.key === "ArrowDown" && canSearch) setOpen(true);
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => (i + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => (i - 1 + results.length) % results.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      const target = results[activeIndex] ?? results[0];
      if (target) go(target);
    }
  };

  const showDropdown = open && canSearch;
  const inputClass = dark
    ? "w-full pl-10 pr-4 py-2 bg-slate-700 rounded-lg border-none text-sm text-white placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 outline-none"
    : "w-full pl-10 pr-4 py-2 bg-default-100 rounded-lg border-none text-sm text-default-800 placeholder:text-default-400 focus:ring-2 focus:ring-primary outline-none";
  const iconColor = dark ? "text-slate-400" : "text-default-400";

  const statusText = useMemo(() => {
    if (!canSearch) return null;
    if (loading) return "検索中…";
    if (results.length === 0) return "該当する案件・投稿が見つかりませんでした";
    return null;
  }, [canSearch, loading, results.length]);

  return (
    <div ref={containerRef} className="relative hidden md:block w-56 lg:w-80">
      <SearchIcon
        className={`absolute left-3 top-1/2 -translate-y-1/2 ${iconColor}`}
      />
      <input
        type="text"
        value={query}
        placeholder="キーワードで検索..."
        className={inputClass}
        role="combobox"
        aria-expanded={showDropdown}
        aria-controls={listboxId}
        aria-autocomplete="list"
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
      />

      {showDropdown && (
        <div
          id={listboxId}
          role="listbox"
          className="absolute left-0 top-full mt-2 w-full lg:w-[26rem] max-h-[70vh] overflow-y-auto rounded-xl border border-default-100 bg-white shadow-xl z-50 py-1"
        >
          {statusText && (
            <p className="px-4 py-3 text-sm text-default-400">{statusText}</p>
          )}
          {results.map((result, index) => (
            <button
              key={`${result.kind}-${result.id}`}
              type="button"
              role="option"
              aria-selected={index === activeIndex}
              className={`w-full text-left px-4 py-2.5 flex items-start gap-3 ${
                index === activeIndex ? "bg-default-100" : "hover:bg-default-50"
              }`}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => go(result)}
            >
              <span
                className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold ${KIND_BADGE[result.kind]}`}
              >
                {KIND_LABEL[result.kind]}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-default-800">
                  {result.title}
                </span>
                {result.snippet && (
                  <span className="block truncate text-xs text-default-400">
                    {result.snippet}
                  </span>
                )}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
