import { Fragment, type ReactNode } from "react";

// ============================================================
// プレーンテキスト中の URL を、クリック可能なリンクに変換して表示する。
// - 生の URL（http:// https://）を自動でリンク化
// - Markdown 形式の [表示名](URL) を「表示名」リンクに変換
// 改行は呼び出し側の whitespace-pre-wrap に任せる（テキストノードとして保持）。
// 社内報など、ユーザーが本文に貼ったリンクを開けるようにするために使う。
// ============================================================

// [表示名](URL) または 生 URL にマッチ。URL は空白・全角空白・閉じ括弧手前まで。
const LINK_PATTERN =
  /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s　]+)/g;

const linkClass = "text-primary underline underline-offset-2 break-all";

/** 末尾の句読点・閉じ括弧はリンクに含めない（日本語文中の URL 対策）。 */
function trimTrailing(url: string): { url: string; trailing: string } {
  const match = url.match(/[)\]}、。，．,.!?！？]+$/);
  if (!match) return { url, trailing: "" };
  const trailing = match[0];
  return { url: url.slice(0, url.length - trailing.length), trailing };
}

export function LinkedText({ text }: { text: string }): ReactNode {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;

  for (const m of text.matchAll(LINK_PATTERN)) {
    const index = m.index ?? 0;
    if (index > lastIndex) {
      nodes.push(
        <Fragment key={`t-${key}`}>{text.slice(lastIndex, index)}</Fragment>,
      );
      key += 1;
    }

    if (m[1] && m[2]) {
      // Markdown 形式 [表示名](URL)
      nodes.push(
        <a
          key={`l-${key}`}
          href={m[2]}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClass}
        >
          {m[1]}
        </a>,
      );
    } else if (m[3]) {
      // 生 URL
      const { url, trailing } = trimTrailing(m[3]);
      nodes.push(
        <a
          key={`l-${key}`}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClass}
        >
          {url}
        </a>,
      );
      if (trailing) {
        nodes.push(<Fragment key={`tr-${key}`}>{trailing}</Fragment>);
      }
    }
    key += 1;
    lastIndex = index + m[0].length;
  }

  if (lastIndex < text.length) {
    nodes.push(<Fragment key={`t-${key}`}>{text.slice(lastIndex)}</Fragment>);
  }

  return <>{nodes}</>;
}
