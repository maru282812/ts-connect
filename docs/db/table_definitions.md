# テーブル定義詳細

> 各テーブルの目的・カラム・利用画面・フェーズを記載。  
> `001_schema.sql` の定義と常に同期すること。

---

## グループ 1: ユーザー・企業基盤

### users
**目的**: 認証ユーザーの基本情報。`auth.users` と `handle_new_user` トリガーで自動同期。

| カラム | 型 | 制約 | 説明 |
|--------|----|------|------|
| id | uuid | PK, FK auth.users | auth.users.id と一致 |
| email | text | NOT NULL UNIQUE | メールアドレス |
| display_name | text | NOT NULL | 表示名 |
| system_role | text | CHECK(USER/ADMIN/MASTER_ADMIN) DEFAULT 'USER' | システム権限 |
| avatar_url | text | NULL | アバター画像URL |
| bio | text | NULL | 自己紹介文 |
| status | text | CHECK(ACTIVE/PRO/SUSPENDED/DELETED) DEFAULT 'ACTIVE' | アカウント状態 |
| deleted_at | timestamptz | NULL | 論理削除日時 |
| created_at | timestamptz | NOT NULL DEFAULT now() | 作成日時 |
| updated_at | timestamptz | NOT NULL DEFAULT now() | 更新日時 |

**利用画面**: ログイン・登録、プロフィール表示、管理画面  
**フェーズ**: Phase 1

---

### user_profiles
**目的**: ユーザーの詳細プロフィール（スキル・ポートフォリオ等）。users と 1:1。

| カラム | 型 | 制約 | 説明 |
|--------|----|------|------|
| id | uuid | PK | |
| user_id | uuid | NOT NULL UNIQUE FK users | |
| skills | text[] | NULL | スキルタグ配列 |
| portfolio_url | text | NULL | ポートフォリオURL |
| linkedin_url | text | NULL | LinkedIn URL |
| github_url | text | NULL | GitHub URL |
| twitter_url | text | NULL | Twitter/X URL |
| availability | text | CHECK(AVAILABLE/BUSY/NOT_AVAILABLE) NULL | 稼働状況 |
| preferred_work_style | text[] | NULL | 希望勤務スタイル配列 |
| created_at / updated_at | timestamptz | NOT NULL DEFAULT now() | |

**利用画面**: プロフィール編集、ユーザー詳細  
**フェーズ**: Phase 1

---

### user_settings
**目的**: ユーザーごとの通知・表示設定。users と 1:1。

| カラム | 型 | 制約 | 説明 |
|--------|----|------|------|
| user_id | uuid | PK FK users | |
| notify_application_update | bool | NOT NULL DEFAULT true | 応募状況通知 |
| notify_message | bool | NOT NULL DEFAULT true | メッセージ通知 |
| notify_announcement | bool | NOT NULL DEFAULT true | お知らせ通知 |
| notify_marketing | bool | NOT NULL DEFAULT false | マーケティングメール |
| language | text | NOT NULL DEFAULT 'ja' | UI言語 |
| timezone | text | NOT NULL DEFAULT 'Asia/Tokyo' | タイムゾーン |
| created_at / updated_at | timestamptz | NOT NULL DEFAULT now() | |

**利用画面**: 設定画面  
**フェーズ**: Phase 1

---

### user_status_histories
**目的**: ユーザーステータス変更の監査ログ。

| カラム | 型 | 制約 | 説明 |
|--------|----|------|------|
| id | uuid | PK | |
| user_id | uuid | NOT NULL FK users | |
| from_status | text | NULL | 変更前ステータス |
| to_status | text | NOT NULL | 変更後ステータス |
| changed_by | uuid | NULL FK users | 変更実行者（NULL=システム） |
| reason | text | NULL | 変更理由 |
| created_at | timestamptz | NOT NULL DEFAULT now() | ※updated_at なし |

**利用画面**: 管理画面 > ユーザー詳細  
**フェーズ**: Phase 2

---

### companies
**目的**: 企業情報。

| カラム | 型 | 制約 | 説明 |
|--------|----|------|------|
| id | uuid | PK | |
| name | text | NOT NULL | 企業名 |
| description | text | NULL | 企業説明 |
| logo_url | text | NULL | ロゴ画像URL |
| website_url | text | NULL | 公式サイト |
| industry | text | NULL | 業界 |
| size_range | text | CHECK(1-10/11-50/51-200/201-500/501+) NULL | 従業員規模 |
| prefecture | text | NULL | 都道府県 |
| address | text | NULL | 住所 |
| phone | text | NULL | 電話番号 |
| deleted_at | timestamptz | NULL | 論理削除 |
| created_at / updated_at | timestamptz | NOT NULL DEFAULT now() | |

**利用画面**: 企業ページ、企業登録・編集  
**フェーズ**: Phase 1

---

### company_members
**目的**: ユーザーと企業の所属関係。role で権限を管理。

| カラム | 型 | 制約 | 説明 |
|--------|----|------|------|
| id | uuid | PK | |
| company_id | uuid | NOT NULL FK companies | |
| user_id | uuid | NOT NULL FK users | |
| role | text | CHECK(OWNER/ADMIN/MEMBER) NOT NULL DEFAULT 'MEMBER' | |
| department_id | uuid | NULL FK departments | |
| job_title | text | NULL | 役職名 |
| status | text | CHECK(active/inactive) NOT NULL DEFAULT 'active' | |
| joined_at | timestamptz | NOT NULL DEFAULT now() | 参加日時 |
| created_at / updated_at | timestamptz | NOT NULL DEFAULT now() | |

**利用画面**: 企業メンバー管理  
**フェーズ**: Phase 1

---

### departments
**目的**: 企業内部署。parent_id による階層構造。

| カラム | 型 | 制約 | 説明 |
|--------|----|------|------|
| id | uuid | PK | |
| company_id | uuid | NOT NULL FK companies | |
| name | text | NOT NULL | 部署名 |
| description | text | NULL | 説明 |
| parent_id | uuid | NULL FK departments | 親部署（NULL=最上位） |
| sort_order | int | NOT NULL DEFAULT 0 | 表示順 |
| created_at / updated_at | timestamptz | NOT NULL DEFAULT now() | |

**利用画面**: 企業設定 > 部署管理  
**フェーズ**: Phase 2

---

### company_invitations
**目的**: 企業への招待メール管理。トークンはユニーク。

| カラム | 型 | 制約 | 説明 |
|--------|----|------|------|
| id | uuid | PK | |
| company_id | uuid | NOT NULL FK companies | |
| invited_by | uuid | NOT NULL FK users | 招待者 |
| email | text | NOT NULL | 招待先メール |
| role | text | CHECK(ADMIN/MEMBER) NOT NULL DEFAULT 'MEMBER' | 付与役割 |
| token | text | NOT NULL UNIQUE DEFAULT gen_random_uuid()::text | |
| status | text | CHECK(PENDING/ACCEPTED/EXPIRED/CANCELLED) NOT NULL DEFAULT 'PENDING' | |
| expires_at | timestamptz | NOT NULL DEFAULT now()+7days | |
| created_at / updated_at | timestamptz | NOT NULL DEFAULT now() | |

**利用画面**: 企業設定 > メンバー招待  
**フェーズ**: Phase 2

---

### company_settings
**目的**: 企業ごとのシステム設定。

| カラム | 型 | 制約 | 説明 |
|--------|----|------|------|
| company_id | uuid | PK FK companies | |
| max_active_posts | int | NOT NULL DEFAULT 10 | 同時公開可能な投稿数 |
| application_auto_close_days | int | NULL | 自動締め切り日数 |
| notification_emails | text[] | NULL | 通知先メールアドレス一覧 |
| allow_casual_posts | bool | NOT NULL DEFAULT true | カジュアル面談投稿許可 |
| require_application_message | bool | NOT NULL DEFAULT false | 応募時メッセージ必須 |
| created_at / updated_at | timestamptz | NOT NULL DEFAULT now() | |

**利用画面**: 企業設定  
**フェーズ**: Phase 2

---

## グループ 2: 投稿・案件

### posts
**目的**: 求人・案件・カジュアル面談の投稿本体。

| カラム | 型 | 制約 | 説明 |
|--------|----|------|------|
| id | uuid | PK | |
| company_id | uuid | NOT NULL FK companies | |
| created_by_user_id | uuid | NOT NULL FK users | |
| title | text | NOT NULL | タイトル |
| description | text | NOT NULL | 詳細説明 |
| post_type | text | CHECK(JOB/PROJECT/CASUAL) NOT NULL DEFAULT 'JOB' | 投稿種別 |
| status | text | CHECK(DRAFT/OPEN/CLOSED/ARCHIVED) NOT NULL DEFAULT 'DRAFT' | 公開状態 |
| category_id | uuid | NULL FK post_categories | |
| recruit_count | int | NOT NULL DEFAULT 1 | 募集人数 |
| is_featured | bool | NOT NULL DEFAULT false | 注目掲載フラグ |
| is_recommended | bool | NOT NULL DEFAULT false | おすすめフラグ |
| scheduled_publish_at | timestamptz | NULL | 予約公開日時 |
| archived_at | timestamptz | NULL | アーカイブ日時 |
| deleted_at | timestamptz | NULL | 論理削除 |
| view_count | int | NOT NULL DEFAULT 0 | 閲覧数（非正規化） |
| application_count | int | NOT NULL DEFAULT 0 | 応募数（非正規化） |
| created_at / updated_at | timestamptz | NOT NULL DEFAULT now() | |

**利用画面**: 投稿一覧・詳細、投稿作成・編集  
**フェーズ**: Phase 1

---

### applications
**目的**: 投稿への応募。UNIQUE(post_id, applicant_user_id, application_type) で重複防止。

| カラム | 型 | 制約 | 説明 |
|--------|----|------|------|
| id | uuid | PK | |
| post_id | uuid | NOT NULL FK posts | |
| applicant_user_id | uuid | NOT NULL FK users | |
| application_type | text | CHECK(JOB/PROJECT/CASUAL) NOT NULL | 応募種別 |
| status | text | CHECK(PENDING/REVIEWING/ACCEPTED/REJECTED/COMPLETED/WITHDRAWN/CANCELLED) NOT NULL DEFAULT 'PENDING' | |
| message | text | NULL | 応募メッセージ |
| cancel_reason | text | NULL | キャンセル理由 |
| reject_reason | text | NULL | 不採用理由 |
| completed_at | timestamptz | NULL | 完了日時 |
| deleted_at | timestamptz | NULL | 論理削除 |
| applicant_name_snapshot | text | NOT NULL | 応募時点の表示名スナップショット |
| post_title_snapshot | text | NOT NULL | 応募時点の投稿タイトルスナップショット |
| company_name_snapshot | text | NOT NULL | 応募時点の企業名スナップショット |
| created_at / updated_at | timestamptz | NOT NULL DEFAULT now() | |

**利用画面**: 応募一覧、応募詳細、企業側受付管理  
**フェーズ**: Phase 1

---

### post_categories / post_tags / post_tag_relations
**目的**: 投稿のカテゴリー・タグ分類。

**利用画面**: 投稿作成、絞り込み検索  
**フェーズ**: Phase 2

---

### post_bookmarks
**目的**: ユーザーの投稿ブックマーク。UNIQUE(user_id, post_id)。

**利用画面**: マイページ > ブックマーク一覧  
**フェーズ**: Phase 2

---

### post_view_logs
**目的**: 投稿閲覧ログ。ユーザーは NULL 可（未認証）。ip_hash でユニーク判定。

**利用画面**: 投稿分析（管理画面）  
**フェーズ**: Phase 2

---

### post_reports
**目的**: 投稿への不正報告。

| reason | 説明 |
|--------|------|
| SPAM | スパム |
| INAPPROPRIATE | 不適切コンテンツ |
| MISLEADING | 誤解を招く内容 |
| DUPLICATE | 重複投稿 |
| OTHER | その他 |

**利用画面**: 投稿詳細 > 報告ボタン、管理画面 > モデレーション  
**フェーズ**: Phase 2

---

## グループ 3: 応募・コミュニケーション

### application_messages
**目的**: 応募に紐付くチャットメッセージ。送受信双方向。

| カラム | 型 | 説明 |
|--------|-----|------|
| application_id | uuid FK | 対象応募 |
| sender_user_id | uuid FK | 送信者 |
| content | text | メッセージ本文 |
| is_read | bool DEFAULT false | 既読フラグ |

**利用画面**: 応募詳細 > チャット  
**フェーズ**: Phase 2

---

### inquiries / inquiry_messages
**目的**: ユーザーから運営へのお問い合わせ。スレッド形式。

**利用画面**: お問い合わせフォーム、管理画面 > 問い合わせ一覧  
**フェーズ**: Phase 2

---

## グループ 4: 通知・メール

### notifications
**目的**: インアプリ通知。未読/既読管理。

| type 値 | 説明 |
|---------|------|
| APPLICATION_RECEIVED | 応募受付 |
| APPLICATION_STATUS_CHANGED | 応募状態変更 |
| MESSAGE_RECEIVED | メッセージ受信 |
| CONTRACT_CREATED | 契約作成 |
| CONTRACT_STATUS_CHANGED | 契約状態変更 |
| REVIEW_RECEIVED | 評価受信 |
| POINT_GRANTED | ポイント付与 |
| ANNOUNCEMENT | お知らせ |
| SYSTEM | システム通知 |

**フェーズ**: Phase 2

---

### email_delivery_logs
**目的**: 外部メール送信（Resend等）の送信ログ。provider, status, metadata(JSONB) を保持。

**フェーズ**: Phase 2

---

## グループ 5: 管理・運営

### admin_audit_logs
**目的**: 管理者操作の完全な監査証跡。before_data / after_data を JSONB で保持。

**フェーズ**: Phase 2（ADMIN機能実装時）

---

### system_settings
**目的**: key-value 形式のシステム設定。value_type(string/number/boolean/json) で型管理。

**フェーズ**: Phase 2

---

### feature_flags
**目的**: 機能のON/OFF制御。target_roles text[] で対象ロールを絞り込める。

**フェーズ**: Phase 2

---

## グループ 6: 契約・成果物・評価

### contracts
**目的**: 応募成立後の契約。client_user_id / worker_user_id / company_id の三者関係。

| status 値 | 説明 |
|----------|------|
| DRAFT | 下書き |
| ACTIVE | 進行中 |
| COMPLETED | 完了 |
| CANCELLED | キャンセル |
| DISPUTED | 異議申立中 |
| EXPIRED | 期限切れ |

**フェーズ**: Phase 3

---

### reviews
**目的**: ユーザーまたは企業への評価。CHECK制約で reviewed_user_id XOR reviewed_company_id（どちらか一方必須）。

| カラム | 説明 |
|--------|------|
| rating | CHECK(1-5) |
| reviewed_user_id | NULL FK users（企業評価時はNULL） |
| reviewed_company_id | NULL FK companies（ユーザー評価時はNULL） |

**フェーズ**: Phase 3

---

### user_scores / company_scores
**目的**: レビュー集計の非正規化キャッシュ。average_rating は numeric(3,2)。

**フェーズ**: Phase 3（reviews 実装後に自動更新）

---

## グループ 7: ポイント・ウォレット

### wallets
**目的**: ユーザーごとのポイント残高。balance CHECK >= 0 で負残高防止。

### point_transactions
**目的**: ポイント増減の全履歴。balance_before / balance_after で残高推移を追跡可能。

| transaction_type | 説明 |
|----------------|------|
| EARN | 獲得 |
| SPEND | 使用 |
| EXPIRE | 失効 |
| REFUND | 返還 |
| GRANT | 手動付与 |
| DEDUCT | 手動減算 |

**フェーズ**: Phase 3

---

## グループ 8: EC・購買

### orders / order_items
**目的**: 注文管理。order_items は product_name / unit_price のスナップショットを保持（商品変更後も注文履歴が正しく表示される）。

### payments
**目的**: 決済記録。provider_tx_id（Stripe等の外部ID）と metadata JSONB でプロバイダー固有データを保持。

**フェーズ**: Phase 4

---

### coupons
**目的**: 割引クーポン。

| discount_type | 説明 |
|--------------|------|
| PERCENT | パーセント割引 |
| FIXED | 固定額割引 |

**フェーズ**: Phase 4

---

## グループ 9: ログ・分析

### user_action_logs
**目的**: ユーザー操作のイベントログ。metadata JSONB で追加パラメーターを格納。

| action_type 値 |
|----------------|
| VIEW_POST / APPLY / BOOKMARK / SEARCH / PURCHASE / REVIEW / MESSAGE / LOGIN / LOGOUT / PROFILE_UPDATE |

### search_logs / page_view_logs / conversion_events
**目的**: 行動分析・CVR計測用ログ。user_id は NULL 可（未認証ユーザー含む）。

**RLS**: INSERT のみ認証ユーザーに許可。SELECT は MASTER_ADMIN 専用。

**フェーズ**: Phase 2（計測開始） → Phase 4（本格分析）

---

## 共通制約事項

### 命名規則
- PK: `id uuid DEFAULT gen_random_uuid()`
- タイムスタンプ: `created_at NOT NULL DEFAULT now()`, `updated_at NOT NULL DEFAULT now()`
- 論理削除: `deleted_at TIMESTAMPTZ NULL`（NULL=有効）
- 外部キー: `<table_singular>_id` 形式

### updated_at 自動更新
全テーブル（updated_at を持つもの）に `update_updated_at()` トリガーを設置。

### ソフトデリート適用テーブル
`users`, `companies`, `posts`, `applications`（deleted_at）、`posts`（archived_at）
