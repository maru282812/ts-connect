# 将来拡張・未実装機能ロードマップ

> Phase 2+ を見据えた DB 設計の補足。実装予定の機能・テーブル拡張・RLS戦略を記載。

---

## フェーズ別実装計画

### Phase 1 (現在)
テーブル定義は全フェーズ分完了済み。Phase 1 では以下のみ実際に利用する。

**稼働テーブル**:
- users, companies, company_members
- posts, applications
- user_profiles, user_settings

**Phase 1 で使わないテーブル**: 定義済みだが UI 未実装。データは空のままで問題なし。

---

### Phase 2: コアコミュニティ機能

**解禁テーブル**:
- `notifications`, `notification_settings` — インアプリ通知
- `post_bookmarks` — ブックマーク
- `post_categories`, `post_tags`, `post_tag_relations` — 分類・検索改善
- `application_messages` — 応募チャット
- `inquiries`, `inquiry_messages` — お問い合わせ
- `announcements` — お知らせ
- `post_view_logs` — PV計測（posts.view_count との整合）
- `user_action_logs`, `search_logs`, `page_view_logs` — 行動ログ収集開始

**実装メモ**:
- `posts.view_count` は `post_view_logs` への INSERT トリガーで自動更新することを推奨
- `posts.application_count` は `applications` INSERT/DELETE トリガーで更新

---

### Phase 3: 契約・評価システム

**解禁テーブル**:
- `contracts`, `contract_status_histories`
- `deliverables`, `deliverable_files`
- `disputes`, `dispute_messages`
- `reviews`, `review_replies`, `user_scores`, `company_scores`
- `wallets`, `point_transactions`, `point_rules`, `point_expirations`, `point_grants`

**実装メモ**:
- `user_scores.average_rating` は `reviews` テーブルの集計値。INSERT/UPDATE/DELETE トリガーで自動更新する。
- ポイント残高変更は必ず `point_transactions` を経由し、`wallets.balance` を更新するストアドプロシージャ（または Edge Function）を使う。直接 UPDATE は禁止。
- `wallets.balance CHECK (balance >= 0)` があるため、残高不足時はトランザクション全体がロールバックされる。

---

### Phase 4: EC・購買機能

**解禁テーブル**:
- `product_categories`, `product_tags`, `products`, `product_files`, `product_tag_relations`
- `carts`, `cart_items`
- `orders`, `order_items`, `payments`
- `coupons`, `coupon_redemptions`, `invoices`
- `point_redemptions` — ポイント使用での注文割引

**実装メモ**:
- `order_items` には `product_name_snapshot` / `unit_price_snapshot` を保持するため、商品を後から変更・削除しても注文履歴は正確に表示できる。
- `payments.metadata` (JSONB) に Stripe の PaymentIntent ID 等を格納する。
- `invoices` は `order_id` または `contract_id` のいずれかに紐付く（両方同時は不可）。CHECK 制約の追加を将来検討。
- `coupons.used_count` は `coupon_redemptions` INSERT トリガーで自動インクリメント推奨。

---

## 未実装テーブル（将来検討）

以下はスキーマに未定義。必要になった時点で `001_schema.sql` に追加 + マイグレーション適用。

### チーム・プロジェクト管理
```sql
-- project_teams: プロジェクトへの複数ワーカーアサイン
-- project_milestones: マイルストーン管理
-- project_comments: プロジェクト内コメント
```

### スキルマーケット
```sql
-- skills_master: スキルマスターデータ
-- user_skill_relations: ユーザー↔スキル中間テーブル（verified フラグ）
-- skill_assessments: スキルテスト結果
```

### メッセージング拡張
```sql
-- direct_messages: 応募外の DM（1:1）
-- message_threads: スレッド管理
-- message_attachments: 添付ファイル
```

### サブスクリプション
```sql
-- subscription_plans: プラン定義（FREE/PRO/ENTERPRISE）
-- user_subscriptions: ユーザーサブスク状態
-- subscription_invoices: サブスク請求
```

### 求人エージェント
```sql
-- agent_profiles: エージェント情報
-- agent_matches: エージェントによるマッチング提案
-- agent_contracts: エージェント手数料管理
```

---

## RLS 拡張戦略

### 現状の課題と対応策

**課題 1: get_user_role() のパフォーマンス**  
全リクエストで `users` テーブルを参照するため、高負荷時に遅延が出る可能性がある。

**対応策**:
- `users.system_role` への partial index (`WHERE system_role != 'USER'`)
- JWT カスタムクレームへの system_role 埋め込みを検討（Edge Function でトークン生成時に付加）

**課題 2: get_user_company_ids() の N+1**  
company_members を SELECT するため、企業数が多いユーザーでクエリが重くなる。

**対応策**:
- `company_members(user_id, status)` の複合インデックスが既に存在
- 将来的には users テーブルに `company_ids uuid[]` の非正規化カラム追加を検討

---

### service_role の使い分け

| ユースケース | 使用ロール |
|-----------|-----------|
| Edge Function（サーバーサイド処理） | `service_role` (RLS バイパス) |
| Supabase Auth Webhook | `service_role` |
| クライアント直接呼び出し | `authenticated` (RLS 適用) |
| 定期バッチ（有効期限チェック等） | `service_role` |

---

## ポイントシステム詳細設計メモ

### 残高整合性の保証

```
① service_role が point_transactions を INSERT
② トリガーが wallets.balance を更新
③ balance CHECK (>= 0) で不整合を防止
```

クライアントから直接 `wallets` を UPDATE することは禁止。  
RLS の UPDATE ポリシーを意図的に付与していない。

### ポイント有効期限

- `point_expirations` で個々の獲得ポイントの有効期限を管理
- 夜間バッチで `expires_at < now() AND is_expired = false` を検索して失効処理
- 失効時に `point_transactions(type='EXPIRE')` を INSERT して残高を減算

---

## 注意事項

### Phase 1 リリース前チェックリスト
- [ ] `001_schema.sql` を Supabase ダッシュボードで実行（SQLエディタ）
- [ ] `002_seed_dev.sql` を開発環境で実行
- [ ] RLS が全テーブルで有効になっていることを確認（`pg_tables` or ダッシュボード）
- [ ] `get_user_role()` / `get_user_company_ids()` ヘルパー関数が作成されていることを確認
- [ ] Storage バケット（thumbnails, post-files, avatars）が作成されていることを確認

### スキーマ変更ルール（Phase 1 以降）
- `001_schema.sql` を直接編集し、差分を手動で Supabase に適用する（マイグレーションファイルは使わない）
- 本番適用前に必ず開発環境でテスト
- 破壊的変更（カラム削除・リネーム）は必ずデプロイと同日に行い、コード変更と同期させる
