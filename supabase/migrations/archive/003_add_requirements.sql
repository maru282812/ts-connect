-- ============================================================
-- Migration 003: posts テーブルに requirements カラムを追加
-- ============================================================

alter table public.posts
  add column if not exists requirements text;
