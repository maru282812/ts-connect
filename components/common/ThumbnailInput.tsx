"use client";

import { useCallback, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

interface ThumbnailInputProps {
  value: string;
  onChange: (url: string) => void;
  onError?: (msg: string) => void;
}

type InputMode = "url" | "file";

function validateImageUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export function ThumbnailInput({ value, onChange, onError }: ThumbnailInputProps) {
  const [mode, setMode] = useState<InputMode>("url");
  const [urlInput, setUrlInput] = useState(value);
  const [preview, setPreview] = useState(value || "");
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reportError = useCallback(
    (msg: string) => {
      setUploadError(msg);
      onError?.(msg);
    },
    [onError],
  );

  // ── URL モード ────────────────────────────────────────────
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setUrlInput(v);
    setUploadError(null);
    setPreviewError(false);
    if (!v) {
      setPreview("");
      onChange("");
      return;
    }
    if (validateImageUrl(v)) {
      setPreview(v);
      onChange(v);
    }
  };

  const handleUrlBlur = () => {
    if (urlInput && !validateImageUrl(urlInput)) {
      reportError("有効な画像URLを入力してください（http:// または https://）");
    }
  };

  // ── ファイル処理 ──────────────────────────────────────────
  const processFile = useCallback(
    async (file: File) => {
      setUploadError(null);
      setPreviewError(false);

      if (!ACCEPTED_TYPES.includes(file.type)) {
        reportError("対応形式は PNG / JPEG / WebP / GIF です");
        return;
      }
      if (file.size > MAX_SIZE_BYTES) {
        reportError("ファイルサイズは 5MB 以下にしてください");
        return;
      }

      // ローカルプレビュー
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
      setIsUploading(true);

      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("ログインが必要です");

        const ext = file.name.split(".").pop() ?? "jpg";
        const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

        const { error: uploadErr } = await supabase.storage
          .from("thumbnails")
          .upload(path, file, { upsert: false, contentType: file.type });

        if (uploadErr) throw new Error(uploadErr.message);

        const { data: { publicUrl } } = supabase.storage
          .from("thumbnails")
          .getPublicUrl(path);

        URL.revokeObjectURL(objectUrl);
        setPreview(publicUrl);
        onChange(publicUrl);
      } catch (err) {
        URL.revokeObjectURL(objectUrl);
        setPreview("");
        reportError(
          err instanceof Error ? err.message : "アップロードに失敗しました",
        );
      } finally {
        setIsUploading(false);
      }
    },
    [onChange, reportError],
  );

  // ── ドラッグ & ドロップ ──────────────────────────────────
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  const handleDragLeave = () => setIsDragOver(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  };

  const handleClear = () => {
    setPreview("");
    setUrlInput("");
    setUploadError(null);
    setPreviewError(false);
    onChange("");
  };

  const switchMode = (next: InputMode) => {
    setMode(next);
    setUploadError(null);
    setPreviewError(false);
  };

  return (
    <div className="flex flex-col gap-3">
      {/* モード切替タブ */}
      <div className="flex rounded-lg border border-slate-200 overflow-hidden self-start text-sm">
        <button
          type="button"
          onClick={() => switchMode("url")}
          className={`px-3 py-1.5 font-medium transition-colors ${
            mode === "url"
              ? "bg-slate-800 text-white"
              : "bg-white text-slate-500 hover:bg-slate-50"
          }`}
        >
          URL入力
        </button>
        <button
          type="button"
          onClick={() => switchMode("file")}
          className={`px-3 py-1.5 font-medium transition-colors border-l border-slate-200 ${
            mode === "file"
              ? "bg-slate-800 text-white"
              : "bg-white text-slate-500 hover:bg-slate-50"
          }`}
        >
          ファイル選択
        </button>
      </div>

      {/* URL入力モード */}
      {mode === "url" && (
        <input
          type="url"
          value={urlInput}
          onChange={handleUrlChange}
          onBlur={handleUrlBlur}
          placeholder="https://example.com/image.png"
          className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 placeholder:text-slate-400"
        />
      )}

      {/* ファイルアップロードモード */}
      {mode === "file" && (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            w-full min-h-[96px] flex flex-col items-center justify-center gap-1.5
            border-2 border-dashed rounded-xl cursor-pointer transition-colors select-none
            ${
              isDragOver
                ? "border-blue-400 bg-blue-50"
                : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100"
            }
            ${isUploading ? "pointer-events-none opacity-60" : ""}
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_TYPES.join(",")}
            onChange={handleFileChange}
            className="hidden"
          />
          {isUploading ? (
            <p className="text-sm text-slate-500">アップロード中...</p>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-7 h-7 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                />
              </svg>
              <p className="text-sm text-slate-500 text-center px-4">
                ここにドラッグ＆ドロップ、またはクリックして選択
              </p>
              <p className="text-xs text-slate-400">PNG / JPEG / WebP / GIF・最大 5MB</p>
            </>
          )}
        </div>
      )}

      {/* エラー */}
      {uploadError && (
        <p className="text-xs text-red-600">{uploadError}</p>
      )}

      {/* プレビュー */}
      {preview && !previewError && (
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="サムネイルプレビュー"
            onError={() => setPreviewError(true)}
            className="w-full max-h-48 object-cover rounded-lg border border-slate-200"
          />
          <button
            type="button"
            onClick={handleClear}
            aria-label="画像を削除"
            className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs leading-none transition-colors"
          >
            ✕
          </button>
        </div>
      )}

      {/* プレビューエラー時のクリア誘導 */}
      {previewError && (
        <div className="flex items-center gap-2 text-xs text-red-600">
          <span>画像を読み込めませんでした。</span>
          <button type="button" onClick={handleClear} className="underline">
            クリア
          </button>
        </div>
      )}

      {/* 未設定かつプレビューなし */}
      {!preview && !previewError && (
        <p className="text-xs text-slate-400">未設定（任意）</p>
      )}
    </div>
  );
}
