# スマホ版を見据えたDB追加要否

T's connect のスマホ版対応に向けて、保存・履歴・通知・問い合わせ・下書き・画像最適化のDB要否を確認した結果です。単なるレスポンシブ対応やUI表示で解決できるものはDBを追加しません。

## 判断サマリー

| 機能名 | 既存DBで対応可能か | 追加したDB | 追加しなかった理由 | 将来の利用イメージ | 関連画面 |
|---|---|---|---|---|---|
| お気に入り / あとで見る | 可能 | なし | `post_bookmarks` が `user_id`, `post_id`, `created_at`, `unique(user_id, post_id)` を持っており、`post_favorites` 相当として使えるため。 | スマホの案件カードや詳細画面で保存ボタンを押し、マイページの保存済み案件に表示する。 | 案件一覧、案件詳細、マイページ |
| 閲覧履歴 / 最近見た案件 | 可能 | なし | `post_view_logs` が `post_id`, `user_id`, `viewed_at` を持っており、ログインユーザーの最近見た案件を `viewed_at desc` で取得できるため。未ログイン閲覧は `user_id` NULL と `ip_hash` で分析用途に扱える。 | スマホのホームやマイページに「最近見た案件」を表示する。 | ホーム、案件詳細、マイページ |
| 通知 / 未読管理 | 可能 | なし | `notifications` が `is_read`, `read_at`, `related_type`, `related_id` を持ち、未読一覧と既読化に対応済み。`notifications_unread_idx` も存在するため。 | 応募受付、ステータス変更、返信受信をスマホ通知一覧やバッジに表示する。 | 通知一覧、ヘッダー、応募詳細 |
| メッセージ / 問い合わせ履歴 | 可能 | なし | 投稿に対する「応募する」「聞いてみる」は `applications.application_type` の `APPLY` / `INQUIRY` で同一テーブル管理済み。返信履歴は `application_messages` に紐づけられる。会社への直接問い合わせは `inquiries` / `inquiry_messages` がある。 | 「聞いてみる」送信後に応募詳細相当のスレッドを作り、返信あり・未読を表示する。 | 案件詳細、応募/問い合わせ詳細、メッセージ一覧 |
| 応募・問い合わせの状態管理 | 可能 | なし | `applications` に `application_type` と `application_status` があり、`APPLIED`, `REVIEWING`, `ACCEPTED`, `REJECTED`, `INQUIRY`, `COMPLETED`, `WITHDRAWN`, `CANCELED` を表現できるため。ステータス履歴は `application_status_histories` で追跡できる。 | スマホの案件カードに「応募済み」「確認中」「承認」「問い合わせ中」を表示する。 | 案件一覧、案件詳細、応募管理 |
| 画像・サムネイル最適化 | 可能 | なし | `posts.thumbnail_url` と `thumbnails` Storage bucket があり、スマホ専用URLは現時点では不要。レスポンシブ画像、CDN変換、Storage側の派生画像で対応できる。 | 案件カードで同じ `thumbnail_url` を使い、必要になった段階で配信側の画像変換を使う。 | 案件一覧、案件詳細 |
| 下書き / 入力途中保存 | 可能 | なし | `posts.post_status = 'DRAFT'` があり、投稿下書きは既存 `posts` で表現できる。別途 `post_drafts` を作ると投稿本体との同期が必要になり複雑化するため。 | スマホの投稿作成中に `DRAFT` として保存し、再編集画面で復元する。 | 投稿作成、投稿編集、管理画面 |
| スマホ通知設定 | 可能 | なし | ユーザー全体設定は `user_settings`、イベント単位の細かい設定は `notification_settings` に `in_app` / `email` があるため。スマホ専用の `mobile_` カラムは不要。 | 通知設定画面でアプリ内通知とメール通知をイベント別にON/OFFする。 | 通知設定、マイページ |

## 追加した開発用データ

`supabase/002_seed_dev.sql` に、既存テーブルを使った動作確認用データのみ追加しました。

| 対象 | 件数 | 目的 |
|---|---:|---|
| `post_bookmarks` | 3 | 保存済み案件の表示確認 |
| `post_view_logs` | 3 | 最近見た案件の表示確認 |
| `application_messages` | 3 | 問い合わせ・応募への返信あり/未読状態の確認 |
| `notifications` | 3 | 未読通知、既読通知、関連応募への導線確認 |
| `notification_settings` | 3 | イベント別の通知ON/OFF確認 |

## 「聞いてみる」と「応募する」の扱い

投稿に対する「聞いてみる」と「応募する」は、現行どおり `applications` で同じ親レコードとして扱う方針が妥当です。

理由は、どちらも「投稿」「送信ユーザー」「投稿者/企業」「メッセージ」「状態」「返信履歴」を共有するためです。`application_type` によって `APPLY` と `INQUIRY` を分けられ、`unique(post_id, applicant_user_id, application_type)` により同じ投稿へ応募と問い合わせを別々に1件ずつ保持できます。返信は `application_messages` に集約できるため、スマホ画面では「問い合わせ中」「返信あり」「応募済み」を同じ一覧UIで扱えます。

会社プロフィールなど投稿に紐づかない問い合わせは、既存の `inquiries` / `inquiry_messages` を使います。

## 今回追加しなかったもの

| 候補 | 判断 |
|---|---|
| `post_favorites` | `post_bookmarks` と重複するため追加しない。 |
| `post_views` | `post_view_logs` と重複するため追加しない。 |
| `messages` | 汎用DM要件が未確定で、現在の応募・問い合わせ用途は `application_messages` / `inquiry_messages` で足りるため追加しない。 |
| `post_inquiries` | 投稿への問い合わせは `applications.application_type = 'INQUIRY'` で足りるため追加しない。 |
| `thumbnail_mobile_url` | スマホ版という理由だけでは追加しない。まず `thumbnail_url` と配信側最適化で対応する。 |
| `post_drafts` | `posts.post_status = 'DRAFT'` と重複するため追加しない。 |
| `mobile_notification_enabled` | `user_settings` / `notification_settings` で表現できるため追加しない。 |

## 001_schema.sql への変更

今回の精査では、スマホ版に必要になりやすい保存・履歴・通知・未読・問い合わせ・下書きのDBは既存スキーマで足りると判断しました。そのため `supabase/001_schema.sql` への新規テーブル・カラム追加はありません。

ただし、問い合わせ履歴に関係する既存RLSでカラム名の不一致があったため、既存テーブル定義に合わせて修正しました。

| 対象 | 修正内容 |
|---|---|
| `application_cancellations` policy | 実カラム `canceled_by` に合わせ、`cancelled_by` 参照を修正。 |
| `inquiries` policy | 実カラム `sender_user_id` に合わせ、`user_id` 参照を修正。 |
| `inquiry_messages` policy | 実カラム `sender_id` と `inquiries.sender_user_id` に合わせ、存在しない `sender_user_id` / `i.user_id` 参照を修正。 |
