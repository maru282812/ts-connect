---
name: WorkMarket プロジェクト概要
description: Next.js + Supabase + HeroUI で構築する会社-個人マッチングサービスの設計・実装状況
type: project
---

Phase1 初回実装完了（2026-03-19）

**Why:** 会社や運営が掲載する「公式案件」を一般ユーザーが応募・問い合わせできるサービス。ユーザーも気軽に投稿できる。

**技術スタック:** Next.js 15 App Router / HeroUI v2 / Supabase Auth + PostgreSQL / Resend (メール)

**実装済み画面:**
- G-01〜G-03: ログイン/登録/登録完了
- P-02〜P-08: 公式案件・気軽に投稿・応募一覧・基本設定
- C-02〜C-07: 管理画面全画面
- /api/applications: 応募・問い合わせ + メール通知

**URL設計:**
- 一般: /login, /signup, /app/official-posts, /app/casual-posts, /app/applications, /app/settings
- 管理: /company/posts, /company/archive, /company/settings

**重要な設計決定:**
- system_role は user_metadata に保存（middleware でチェック）
- posts テーブルに post_type (OFFICIAL/CASUAL) を持たせて統合管理
- applications テーブルに snapshot フィールドを持たせて履歴を保持
- メール送信は MAIL_PROVIDER 環境変数でプロバイダー切替可能

**How to apply:** 機能追加時はこの設計方針を引き継ぐこと。
