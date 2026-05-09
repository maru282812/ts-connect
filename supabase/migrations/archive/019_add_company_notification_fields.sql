-- ============================================================
-- Migration 019: companies テーブルに通知・拡張カラムを追加
-- ============================================================
-- 今回利用: notification_email（管理設定画面で編集可能）
-- 将来用  : notification_enabled / description / logo_url
-- ============================================================

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS notification_email    text,
  ADD COLUMN IF NOT EXISTS notification_enabled  boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS description           text,
  ADD COLUMN IF NOT EXISTS logo_url              text;
