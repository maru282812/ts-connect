# WorkMarket DB スキーマ概要

> ファイル: `supabase/001_schema.sql`  
> 総テーブル数: 71  
> 最終更新: Phase 2+ 対応済み (Phase 1 リリース前に全テーブル定義完了)

---

## テーブル一覧・分類

### グループ 1: ユーザー・企業基盤 (11テーブル)

| テーブル | 用途 |
|----------|------|
| `users` | 認証ユーザー（auth.users と 1:1 同期） |
| `user_profiles` | プロフィール詳細（スキル、SNS URL等） |
| `user_settings` | 通知・言語・タイムゾーン設定 |
| `user_status_histories` | ステータス変更履歴 |
| `companies` | 企業情報 |
| `company_members` | 企業メンバー（role: OWNER/ADMIN/MEMBER） |
| `departments` | 部署（自己参照ツリー構造） |
| `company_invitations` | 招待トークン管理 |
| `company_settings` | 企業ごとの設定（最大投稿数等） |

### グループ 2: 投稿・案件 (11テーブル)

| テーブル | 用途 |
|----------|------|
| `posts` | 求人・案件投稿 |
| `post_categories` | 投稿カテゴリー（マスターデータ） |
| `post_files` | 投稿添付ファイル |
| `post_tags` | タグマスター |
| `post_tag_relations` | 投稿↔タグ中間テーブル |
| `post_status_histories` | 投稿ステータス変更履歴 |
| `featured_posts` | 注目・バナー掲載管理 |
| `post_templates` | 投稿テンプレート |
| `post_bookmarks` | ユーザーのブックマーク |
| `post_view_logs` | 閲覧ログ（匿名含む） |
| `post_reports` | 不正報告 |

### グループ 3: 応募・コミュニケーション (6テーブル)

| テーブル | 用途 |
|----------|------|
| `applications` | 応募本体 |
| `application_messages` | 応募チャット |
| `application_status_histories` | 応募ステータス履歴 |
| `application_limits` | 企業ごとの応募上限設定 |
| `application_cancellations` | キャンセル理由・記録 |
| `inquiries` | お問い合わせ（運営宛） |
| `inquiry_messages` | お問い合わせ返信 |

### グループ 4: 通知・メール (5テーブル)

| テーブル | 用途 |
|----------|------|
| `notifications` | インアプリ通知 |
| `notification_settings` | 通知ON/OFF設定 |
| `email_delivery_logs` | メール送信ログ（Resend等） |
| `email_templates` | メールテンプレート |
| `notification_events` | 通知トリガーイベント定義 |

### グループ 5: 管理・運営 (6テーブル)

| テーブル | 用途 |
|----------|------|
| `admin_audit_logs` | 管理操作監査ログ |
| `admin_notes` | 管理者メモ（ユーザー・企業等に紐付け） |
| `announcements` | お知らせ・バナー |
| `moderation_actions` | モデレーション記録 |
| `system_settings` | システム設定KVS |
| `feature_flags` | 機能フラグ |

### グループ 6: 契約・成果物・評価 (10テーブル)

| テーブル | 用途 |
|----------|------|
| `contracts` | 契約（応募成立後） |
| `contract_status_histories` | 契約ステータス履歴 |
| `deliverables` | 成果物提出 |
| `deliverable_files` | 成果物ファイル |
| `disputes` | 異議申立 |
| `dispute_messages` | 異議申立メッセージ |
| `reviews` | 評価（ユーザー/企業宛） |
| `review_replies` | 評価への返信 |
| `user_scores` | ユーザー集計スコア |
| `company_scores` | 企業集計スコア |

### グループ 7: ポイント・ウォレット (6テーブル)

| テーブル | 用途 |
|----------|------|
| `wallets` | ポイント残高（ユーザーごと） |
| `point_transactions` | ポイント増減履歴 |
| `point_rules` | ポイント付与ルール定義 |
| `point_expirations` | ポイント有効期限管理 |
| `point_grants` | 手動付与記録 |
| `point_redemptions` | ポイント使用（注文紐付け） |

### グループ 8: EC・購買 (13テーブル)

| テーブル | 用途 |
|----------|------|
| `product_categories` | 商品カテゴリー（自己参照） |
| `product_tags` | 商品タグ |
| `products` | 商品（デジタル/物理） |
| `product_files` | 商品ファイル（デジタル販売用） |
| `product_tag_relations` | 商品↔タグ中間テーブル |
| `carts` | カート（ユーザーごと1つ） |
| `cart_items` | カート内商品 |
| `orders` | 注文 |
| `order_items` | 注文明細（スナップショット保持） |
| `payments` | 決済記録 |
| `coupons` | クーポン |
| `coupon_redemptions` | クーポン使用記録 |
| `invoices` | 請求書 |

### グループ 9: ログ・分析 (4テーブル)

| テーブル | 用途 |
|----------|------|
| `user_action_logs` | ユーザー操作ログ |
| `search_logs` | 検索ログ |
| `page_view_logs` | ページビューログ |
| `conversion_events` | コンバージョンイベント |

---

## 主要リレーション

```
auth.users
  └── users (1:1, handle_new_user trigger)
        ├── user_profiles (1:1)
        ├── user_settings (1:1)
        ├── wallets (1:1)
        └── company_members (1:N)
              └── companies (N:1)
                    ├── posts (1:N)
                    │     └── applications (1:N)
                    │           └── application_messages (1:N)
                    └── contracts (1:N)
                          └── deliverables (1:N)
```

---

## アクセス制御設計

### system_role (users テーブル)
- `USER` — 一般ユーザー
- `ADMIN` — 管理者（運営スタッフ）
- `MASTER_ADMIN` — 最高権限

### company_members.role
- `OWNER` — 企業オーナー
- `ADMIN` — 企業内管理者
- `MEMBER` — 一般メンバー

### RLS 基本方針
| データ種別 | SELECT | INSERT | UPDATE | DELETE |
|-----------|--------|--------|--------|--------|
| 自分のデータ | ○ 本人 | ○ 本人 | ○ 本人 | △ 本人のみ |
| 企業データ | ○ メンバー | ○ ADMIN+ | ○ ADMIN+ | ✗ |
| 公開データ | ○ 全認証ユーザー | - | - | - |
| 管理データ | ○ ADMIN+ | ○ ADMIN+ | ○ ADMIN+ | ○ MASTER_ADMIN |
| ログデータ | ✗/MASTER_ADMIN | ○ 本人 | ✗ | ✗ |

### ヘルパー関数
- `public.get_user_role()` — 現在ユーザーの system_role を返す
- `public.get_user_company_ids()` — 現在ユーザーが所属する company_id 一覧を返す

---

## ソフトデリート方針

- `deleted_at TIMESTAMPTZ` — 論理削除（復元可能）
- `archived_at TIMESTAMPTZ` — アーカイブ（公開停止）
- 物理 DELETE は原則禁止（audit_log 用に履歴保持）

---

## インデックス方針

- 外部キーカラムには基本的にインデックスを作成
- `WHERE deleted_at IS NULL` の部分インデックスで通常クエリを高速化
- `WHERE is_featured = true` など条件付き部分インデックス
- 全文検索が必要なカラムには GIN インデックス
