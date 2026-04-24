-- ============================================================
-- Migration 007: posts テーブルに reference_url カラムを追加
-- ============================================================

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS reference_url text;
