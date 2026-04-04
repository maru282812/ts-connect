# WorkMarket

会社・運営が掲載する「公式案件」を一般ユーザーが閲覧・応募・問い合わせできる仕事マッチングサービスです。
一般ユーザーは「気軽に投稿」を作成・公開することもできます。
管理者は管理画面から投稿管理・掲載状態管理・過去案件管理を行えます。

## 技術スタック

| カテゴリ | 技術 |
|---|---|
| フロントエンド | Next.js 15 (App Router) |
| UI ライブラリ | HeroUI v2 |
| 認証 / DB | Supabase (Auth + PostgreSQL) |
| 認可 | Supabase RLS |
| メール通知 | Resend / コンソール出力 (切替可能) |
| スタイリング | Tailwind CSS |
| 言語 | TypeScript |

## ディレクトリ構成

```
internal-work-market/
├── app/
│   ├── (auth)/                   # 認証画面 (ログイン/登録)
│   │   ├── login/page.tsx        # G-01 ログイン
│   │   ├── signup/page.tsx       # G-02 新規会員登録
│   │   └── signup/complete/page.tsx # G-03 登録完了
│   ├── app/                      # 一般ユーザー画面
│   │   ├── layout.tsx            # UserLayout (サイドバー + ヘッダー)
│   │   ├── official-posts/       # P-02/P-03 公式案件
│   │   ├── casual-posts/         # P-04/P-05/P-06 気軽に投稿
│   │   ├── applications/         # P-08 応募一覧
│   │   └── settings/             # P-07 基本設定
│   ├── company/                  # 管理画面
│   │   ├── layout.tsx            # AdminLayout
│   │   ├── posts/                # C-02/C-03/C-04 投稿管理
│   │   ├── archive/              # C-05/C-06 過去案件
│   │   └── settings/             # C-07 管理設定
│   ├── api/applications/         # 応募・問い合わせ API
│   ├── layout.tsx                # ルートレイアウト
│   └── globals.css
├── components/
│   ├── common/                   # 共通コンポーネント
│   │   ├── PostCard.tsx
│   │   ├── PostDetailCard.tsx
│   │   ├── SearchBar.tsx
│   │   ├── PageHeader.tsx
│   │   ├── ApplicationTable.tsx
│   │   ├── ApplicationModal.tsx
│   │   └── PostForm.tsx
│   ├── user/UserSidebar.tsx      # ユーザーサイドバー
│   └── admin/AdminSidebar.tsx    # 管理者サイドバー
├── lib/
│   ├── supabase/                 # Supabase クライアント
│   │   ├── client.ts             # ブラウザ用
│   │   ├── server.ts             # サーバー用
│   │   └── admin.ts              # Service Role 用
│   ├── mail/                     # メール送信
│   │   ├── index.ts              # 抽象化レイヤー
│   │   └── templates/application.ts
│   └── auth/actions.ts           # Server Actions
├── types/database.ts             # 型定義
├── middleware.ts                 # 認証ガード
├── supabase/
│   ├── migrations/001_initial.sql
│   └── seed.sql
└── .env.local.example
```

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. Supabase プロジェクトの作成

[Supabase](https://supabase.com) でプロジェクトを作成し、以下の情報を取得します。

- Project URL
- Anon Key
- Service Role Key

### 3. 環境変数の設定

```bash
cp .env.local.example .env.local
```

`.env.local` を編集して Supabase の情報を設定します。

### 4. データベースのマイグレーション

Supabase の SQL Editor で `supabase/migrations/001_initial.sql` を実行します。

### 5. シードデータの投入

1. Supabase Auth で以下のユーザーを作成します:
   - `admin@example.com` / `password123`
   - `user1@example.com` / `password123`
   - `user2@example.com` / `password123`

2. Supabase の SQL Editor で `supabase/seed.sql` を実行します。

### 6. 開発サーバーの起動

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) でアクセスできます。

## 画面一覧

### 一般ユーザー

| ID | URL | 画面名 |
|---|---|---|
| G-01 | `/login` | ログイン |
| G-02 | `/signup` | 新規会員登録 |
| G-03 | `/signup/complete` | 登録完了 |
| P-02 | `/app/official-posts` | 公式案件一覧 |
| P-03 | `/app/official-posts/[postId]` | 公式案件詳細 |
| P-04 | `/app/casual-posts` | 気軽に投稿一覧 |
| P-05 | `/app/casual-posts/[postId]` | 気軽に投稿詳細 |
| P-06 | `/app/casual-posts/new` | 気軽に投稿 新規作成 |
| P-07 | `/app/settings` | 基本設定 |
| P-08 | `/app/applications` | 応募一覧 |

### 管理者

| ID | URL | 画面名 |
|---|---|---|
| C-01 | `/login` | 管理者ログイン (共通ログイン画面) |
| C-02 | `/company/posts` | 投稿管理一覧 |
| C-03 | `/company/posts/new` | 投稿 新規作成 |
| C-04 | `/company/posts/[postId]/edit` | 投稿 編集 |
| C-05 | `/company/archive` | 過去案件一覧 |
| C-06 | `/company/archive/[postId]` | 過去案件詳細 |
| C-07 | `/company/settings` | 管理設定 |

## アクセス制御

| ロール | 権限 |
|---|---|
| USER | PUBLISHED の投稿を閲覧、CASUAL 投稿を作成、自分の応募を閲覧 |
| ADMIN | すべての投稿を管理、応募一覧を閲覧、過去案件を閲覧 |

### ロールの設定方法

新規ユーザーはデフォルトで `USER` ロールが割り当てられます。
管理者を作成する場合は、Supabase の SQL Editor で以下を実行します:

```sql
update public.users set system_role = 'ADMIN' where email = 'admin@example.com';
```

また、Supabase Auth の `user_metadata` も更新が必要です:

```sql
update auth.users
set raw_user_meta_data = raw_user_meta_data || '{"system_role": "ADMIN"}'::jsonb
where email = 'admin@example.com';
```

## メール通知

応募・問い合わせ時にメール通知を送信します。

### 設定

`.env.local` で送信プロバイダーを設定します:

```bash
# 開発用 (コンソール出力)
MAIL_PROVIDER=console

# Resend を使用
MAIL_PROVIDER=resend
RESEND_API_KEY=re_xxxxxxxxxx
MAIL_FROM_ADDRESS=noreply@yourdomain.com
ADMIN_NOTIFICATION_EMAIL=admin@example.com
```

### 拡張方針

現在は固定の管理者通知先メールアドレスに送信します。
将来的には `companies` テーブルに `notification_email` カラムを追加し、
会社ごとの通知先に拡張する予定です。

## 開発ガイド

### 型定義

すべての型は `types/database.ts` に集約されています。

### Supabase クライアント

- ブラウザ (Client Component): `import { createClient } from "@/lib/supabase/client"`
- サーバー (Server Component/Actions): `import { createClient } from "@/lib/supabase/server"`
- 管理者 (Server のみ): `import { createAdminClient } from "@/lib/supabase/admin"`

### テーマ

| 領域 | 特徴 |
|---|---|
| 一般ユーザー | 明るい青系背景、白カード、青アクセント |
| 管理画面 | スレート系ダーク背景/サイドバー、ブルーグレー背景 |

## Phase 1 実装対象

- [x] ユーザー登録 / ログイン / ログアウト
- [x] 公式案件 一覧・詳細
- [x] 気軽に投稿 一覧・詳細・新規作成
- [x] 基本設定
- [x] 応募一覧
- [x] 応募 / 問い合わせ + メール通知
- [x] 管理画面 (投稿管理・過去案件・管理設定)

## Phase 2 予定

- [ ] チャット機能
- [ ] 日程調整
- [ ] 会社ごとの通知先設定
- [ ] ポイントシステム
