-- ============================================================
-- Migration 002: posts テーブルに thumbnail_url カラムを追加
-- ============================================================

alter table public.posts
  add column if not exists thumbnail_url text;
