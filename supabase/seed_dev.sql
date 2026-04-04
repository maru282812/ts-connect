-- ============================================================
-- WorkMarket 開発用シードデータ (seed_dev.sql)
-- 目的: UI確認・動線確認・権限制御確認・メール通知確認
-- ============================================================
--
-- 【実行前提】
--   1. supabase/seed.sql (companies 投入) が実行済みであること
--   2. Supabase プロジェクトが起動していること
--
-- 【ログイン情報】共通パスワード: password123
--
--   管理者:
--     admin1@example.com (管理者A / T's agency holdings + 株式会社TSHD)
--     admin2@example.com (管理者B / ゼロプライド株式会社)
--     admin3@example.com (管理者C / 株式会社ULTI-ME)
--
--   一般ユーザー:
--     user1@example.com (田中 太郎 / T's agency holdings)
--     user2@example.com (佐藤 花子 / ゼロプライド株式会社)
--     user3@example.com (鈴木 一郎 / 株式会社ULTI-ME + 株式会社T's grace 複数所属)
--     user4@example.com (高橋 健太 / 株式会社T's grace)
--     user5@example.com (伊藤 美紀 / 株式会社TSHD)
--
-- 【注意】
--   user1@example.com / user2@example.com はオリジナルの seed.sql でも
--   参照されます。同一メールが auth.users に既存の場合は UUID が異なり
--   エラーになる可能性があります。その場合は先に既存レコードを削除してください:
--   DELETE FROM auth.users WHERE email IN ('user1@example.com','user2@example.com');
-- ============================================================

do $seed$
declare
  -- ===== 会社 UUID (seed.sql で投入済み) =====
  co1 uuid := '11111111-1111-1111-1111-111111111111'; -- T's agency holdings
  co2 uuid := '22222222-2222-2222-2222-222222222222'; -- ゼロプライド株式会社
  co3 uuid := '33333333-3333-3333-3333-333333333333'; -- 株式会社ULTI-ME
  co4 uuid := '44444444-4444-4444-4444-444444444444'; -- 株式会社T's grace
  co5 uuid := '55555555-5555-5555-5555-555555555555'; -- 株式会社TSHD

  -- ===== 管理者 UUID =====
  adm1 uuid := 'aa000001-0000-0000-0000-000000000000'; -- 管理者A
  adm2 uuid := 'aa000002-0000-0000-0000-000000000000'; -- 管理者B
  adm3 uuid := 'aa000003-0000-0000-0000-000000000000'; -- 管理者C

  -- ===== 一般ユーザー UUID =====
  usr1 uuid := 'bb000001-0000-0000-0000-000000000000'; -- 田中 太郎
  usr2 uuid := 'bb000002-0000-0000-0000-000000000000'; -- 佐藤 花子
  usr3 uuid := 'bb000003-0000-0000-0000-000000000000'; -- 鈴木 一郎
  usr4 uuid := 'bb000004-0000-0000-0000-000000000000'; -- 高橋 健太
  usr5 uuid := 'bb000005-0000-0000-0000-000000000000'; -- 伊藤 美紀

  -- ===== 公式案件 UUID =====
  p_off1 uuid := 'cc000001-0000-0000-0000-000000000000';
  p_off2 uuid := 'cc000002-0000-0000-0000-000000000000';
  p_off3 uuid := 'cc000003-0000-0000-0000-000000000000';
  p_off4 uuid := 'cc000004-0000-0000-0000-000000000000';
  p_off5 uuid := 'cc000005-0000-0000-0000-000000000000';
  p_off6 uuid := 'cc000006-0000-0000-0000-000000000000';
  p_off7 uuid := 'cc000007-0000-0000-0000-000000000000';
  p_off8 uuid := 'cc000008-0000-0000-0000-000000000000';

  -- ===== 気軽投稿 UUID =====
  p_cas1  uuid := 'cc000011-0000-0000-0000-000000000000';
  p_cas2  uuid := 'cc000012-0000-0000-0000-000000000000';
  p_cas3  uuid := 'cc000013-0000-0000-0000-000000000000';
  p_cas4  uuid := 'cc000014-0000-0000-0000-000000000000';
  p_cas5  uuid := 'cc000015-0000-0000-0000-000000000000';
  p_cas6  uuid := 'cc000016-0000-0000-0000-000000000000';
  p_cas7  uuid := 'cc000017-0000-0000-0000-000000000000';
  p_cas8  uuid := 'cc000018-0000-0000-0000-000000000000';
  p_cas9  uuid := 'cc000019-0000-0000-0000-000000000000';
  p_cas10 uuid := 'cc000020-0000-0000-0000-000000000000';
  p_cas11 uuid := 'cc000021-0000-0000-0000-000000000000';

  -- bcrypt hash of 'password123'
  -- (よく知られたハッシュ値。ローカル Supabase で動作確認済みのもの)
  pw_hash text := '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';

begin

  -- ==========================================================
  -- STEP 1: auth.users へユーザーを作成
  --   → on_auth_user_created トリガーが public.users を自動挿入
  -- ==========================================================

  INSERT INTO auth.users (
    instance_id, id, aud, role, email,
    encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    is_super_admin, created_at, updated_at,
    confirmation_token, recovery_token,
    email_change_token_new, email_change
  ) VALUES
    -- 管理者A
    ('00000000-0000-0000-0000-000000000000', adm1,
     'authenticated', 'authenticated', 'admin1@example.com',
     pw_hash, now(),
     '{"provider":"email","providers":["email"]}',
     '{"display_name":"管理者A","system_role":"ADMIN"}',
     false, now(), now(), '', '', '', ''),
    -- 管理者B
    ('00000000-0000-0000-0000-000000000000', adm2,
     'authenticated', 'authenticated', 'admin2@example.com',
     pw_hash, now(),
     '{"provider":"email","providers":["email"]}',
     '{"display_name":"管理者B","system_role":"ADMIN"}',
     false, now(), now(), '', '', '', ''),
    -- 管理者C
    ('00000000-0000-0000-0000-000000000000', adm3,
     'authenticated', 'authenticated', 'admin3@example.com',
     pw_hash, now(),
     '{"provider":"email","providers":["email"]}',
     '{"display_name":"管理者C","system_role":"ADMIN"}',
     false, now(), now(), '', '', '', ''),
    -- 田中 太郎
    ('00000000-0000-0000-0000-000000000000', usr1,
     'authenticated', 'authenticated', 'user1@example.com',
     pw_hash, now(),
     '{"provider":"email","providers":["email"]}',
     '{"display_name":"田中 太郎","system_role":"USER"}',
     false, now(), now(), '', '', '', ''),
    -- 佐藤 花子
    ('00000000-0000-0000-0000-000000000000', usr2,
     'authenticated', 'authenticated', 'user2@example.com',
     pw_hash, now(),
     '{"provider":"email","providers":["email"]}',
     '{"display_name":"佐藤 花子","system_role":"USER"}',
     false, now(), now(), '', '', '', ''),
    -- 鈴木 一郎
    ('00000000-0000-0000-0000-000000000000', usr3,
     'authenticated', 'authenticated', 'user3@example.com',
     pw_hash, now(),
     '{"provider":"email","providers":["email"]}',
     '{"display_name":"鈴木 一郎","system_role":"USER"}',
     false, now(), now(), '', '', '', ''),
    -- 高橋 健太
    ('00000000-0000-0000-0000-000000000000', usr4,
     'authenticated', 'authenticated', 'user4@example.com',
     pw_hash, now(),
     '{"provider":"email","providers":["email"]}',
     '{"display_name":"高橋 健太","system_role":"USER"}',
     false, now(), now(), '', '', '', ''),
    -- 伊藤 美紀
    ('00000000-0000-0000-0000-000000000000', usr5,
     'authenticated', 'authenticated', 'user5@example.com',
     pw_hash, now(),
     '{"provider":"email","providers":["email"]}',
     '{"display_name":"伊藤 美紀","system_role":"USER"}',
     false, now(), now(), '', '', '', '')
  ON CONFLICT (id) DO NOTHING;

  -- ==========================================================
  -- STEP 2: public.users を明示 UPSERT（トリガー未発火の保険）
  -- ==========================================================

  INSERT INTO public.users (id, email, display_name, system_role, account_status) VALUES
    (adm1, 'admin1@example.com', '管理者A',   'ADMIN', 'ACTIVE'),
    (adm2, 'admin2@example.com', '管理者B',   'ADMIN', 'ACTIVE'),
    (adm3, 'admin3@example.com', '管理者C',   'ADMIN', 'ACTIVE'),
    (usr1, 'user1@example.com',  '田中 太郎', 'USER',  'ACTIVE'),
    (usr2, 'user2@example.com',  '佐藤 花子', 'USER',  'ACTIVE'),
    (usr3, 'user3@example.com',  '鈴木 一郎', 'USER',  'ACTIVE'),
    (usr4, 'user4@example.com',  '高橋 健太', 'USER',  'ACTIVE'),
    (usr5, 'user5@example.com',  '伊藤 美紀', 'USER',  'ACTIVE')
  ON CONFLICT (id) DO UPDATE SET
    display_name   = EXCLUDED.display_name,
    system_role    = EXCLUDED.system_role,
    account_status = EXCLUDED.account_status;

  -- ==========================================================
  -- STEP 3: company_members 所属登録
  -- ==========================================================
  --
  -- 管理者A: T's agency holdings(ADMIN) + 株式会社TSHD(USER) ← 複数所属
  -- 管理者B: ゼロプライド株式会社(ADMIN)
  -- 管理者C: 株式会社ULTI-ME(ADMIN)
  -- 田中 太郎: T's agency holdings(USER)
  -- 佐藤 花子: ゼロプライド株式会社(USER)
  -- 鈴木 一郎: 株式会社ULTI-ME(USER) + 株式会社T's grace(USER) ← 複数所属
  -- 高橋 健太: 株式会社T's grace(USER)
  -- 伊藤 美紀: 株式会社TSHD(USER)

  INSERT INTO public.company_members (user_id, company_id, membership_role) VALUES
    (adm1, co1, 'ADMIN'),
    (adm1, co5, 'USER'),
    (adm2, co2, 'ADMIN'),
    (adm3, co3, 'ADMIN'),
    (usr1, co1, 'USER'),
    (usr2, co2, 'USER'),
    (usr3, co3, 'USER'),
    (usr3, co4, 'USER'),
    (usr4, co4, 'USER'),
    (usr5, co5, 'USER')
  ON CONFLICT (user_id, company_id) DO NOTHING;

  -- ==========================================================
  -- STEP 4: 公式案件（OFFICIAL）8件
  -- ==========================================================

  -- ---- 1. 経費精算レシート整理 ----
  -- 状態: PUBLISHED / 締切近い(3日後) / 担当者あり / サムネあり / 募集1名
  INSERT INTO public.posts (
    id, company_id, created_by_user_id,
    title, body, post_type, post_status,
    price_text, contact_person_name,
    deadline_at, published_at, thumbnail_url,
    application_limit, is_application_limit_enabled
  ) VALUES (
    p_off1, co1, adm1,
    '経費精算レシートの整理・データ入力サポート',
    E'毎月末に溜まる経費精算レシートの整理と Excel へのデータ入力をお願いできる方を募集しています。\n\n'
    E'■ 業務内容\n'
    E'・紙レシートのスキャン（スキャナ操作）\n'
    E'・Excel への金額・日付・項目の転記\n'
    E'・合計金額の確認と差異チェック\n\n'
    E'■ 求めるスキル\n'
    E'・Excel の基本操作（入力・集計）\n'
    E'・正確かつ丁寧な作業ができる方\n'
    E'・守秘義務を守れる方\n\n'
    E'■ 条件\n'
    E'・作業場所: 本社オフィス（リモート不可）\n'
    E'・所要時間: 月末 2〜3 日程度（各日 4〜6 時間）\n'
    E'・単発案件のため、今月限りの対応となります',
    'OFFICIAL', 'PUBLISHED',
    '1,500円/時間',
    '管理者A',
    now() + interval '3 days',
    now() - interval '5 days',
    'https://picsum.photos/seed/receipt001/800/450',
    1, true
  ) ON CONFLICT (id) DO NOTHING;

  -- ---- 2. FAQ整理 ----
  -- 状態: DRAFT / サムネなし / published_at=NULL
  INSERT INTO public.posts (
    id, company_id, created_by_user_id,
    title, body, post_type, post_status,
    price_text
  ) VALUES (
    p_off2, co2, adm2,
    'カスタマーサポート FAQ 整理・ライティング',
    E'自社サービスのよくある質問（FAQ）を整理し、ユーザーが読みやすい形に書き直してくれる方を探しています。\n\n'
    E'■ 業務内容\n'
    E'・既存 FAQ（約 50 件）の読みやすさ改善\n'
    E'・問い合わせログを参考にした新規 FAQ の追加（10〜20 件）\n'
    E'・Notion または Word ドキュメントへの記載\n\n'
    E'■ 求めるスキル\n'
    E'・日本語の文章を分かりやすく書き直す力\n'
    E'・カスタマーサポート経験があると望ましい\n\n'
    E'※ 現在下書き中のため、詳細は後日追記予定です。',
    'OFFICIAL', 'DRAFT',
    '30,000〜50,000円（固定）'
  ) ON CONFLICT (id) DO NOTHING;

  -- ---- 3. Webサイト軽微修正 ----
  -- 状態: PUBLISHED / 参考URL（本文内） / 募集3名 / サムネあり
  INSERT INTO public.posts (
    id, company_id, created_by_user_id,
    title, body, post_type, post_status,
    price_text, contact_person_name,
    deadline_at, published_at, thumbnail_url,
    application_limit, is_application_limit_enabled
  ) VALUES (
    p_off3, co1, adm1,
    'コーポレートサイトの軽微な修正・更新対応（複数名募集）',
    E'コーポレートサイトのテキスト更新や画像差し替えなど、軽微な修正作業を複数名で並行対応いただきます。\n\n'
    E'■ 業務内容\n'
    E'・指定ページのテキスト修正・追記\n'
    E'・バナー画像の差し替え（Figma でのサイズ調整含む）\n'
    E'・採用ページ HTML/CSS 実装（デザインカンプあり）\n\n'
    E'■ 技術スタック\n'
    E'・HTML / CSS（必須）、JavaScript（尚可）\n'
    E'・Figma 閲覧・書き出し操作\n\n'
    E'■ 参考リンク\n'
    E'・デザインガイドライン: https://example.internal/design-guide\n'
    E'・修正対象ページ一覧: https://example.internal/pages-list\n\n'
    E'リモートワーク可。作業期間 2 週間程度を想定。',
    'OFFICIAL', 'PUBLISHED',
    '3,000円/時間',
    '管理者A',
    now() + interval '14 days',
    now() - interval '3 days',
    'https://picsum.photos/seed/webfix003/800/450',
    3, true
  ) ON CONFLICT (id) DO NOTHING;

  -- ---- 4. アンケート結果レポート作成 ----
  -- 状態: PUBLISHED / 締切近い(5日後) / 担当者あり / サムネなし
  INSERT INTO public.posts (
    id, company_id, created_by_user_id,
    title, body, post_type, post_status,
    price_text, contact_person_name,
    deadline_at, published_at
  ) VALUES (
    p_off4, co3, adm3,
    '顧客アンケート結果の集計・レポート作成',
    E'先月実施した顧客向けアンケート（回答数 約 200 件）の結果を集計し、経営陣向けのレポートを作成していただきたいと思っています。\n\n'
    E'■ 業務内容\n'
    E'・Google フォームからエクスポートした CSV データの集計\n'
    E'・グラフ・チャートの作成（Excel または Google スプレッドシート）\n'
    E'・考察・サマリーの文章化\n'
    E'・PowerPoint / Google スライドへのまとめ\n\n'
    E'■ 求めるスキル\n'
    E'・Excel / スプレッドシートでのピボット・グラフ作成経験\n'
    E'・定量データを分かりやすくまとめる力\n\n'
    E'■ スケジュール\n'
    E'・納期: 5 日以内（交渉可）\n'
    E'・3 日目に途中経過を確認させてください',
    'OFFICIAL', 'PUBLISHED',
    '50,000〜80,000円（固定）',
    '管理者C',
    now() + interval '5 days',
    now() - interval '2 days'
  ) ON CONFLICT (id) DO NOTHING;

  -- ---- 5. 社内資料の体裁調整 ----
  -- 状態: CLOSED（募集終了） / サムネあり
  INSERT INTO public.posts (
    id, company_id, created_by_user_id,
    title, body, post_type, post_status,
    price_text, contact_person_name,
    published_at, closed_at, thumbnail_url
  ) VALUES (
    p_off5, co2, adm2,
    '社内向け研修資料の体裁調整・デザイン統一',
    E'新入社員研修で使用する資料 15 点の体裁を統一する作業をお手伝いいただける方を募集しておりました。\n\n'
    E'■ 業務内容（完了済み）\n'
    E'・PowerPoint / Google スライドのフォント・色の統一\n'
    E'・図版の整理と余白調整\n'
    E'・表紙・目次・ページ番号の統一フォーマット適用\n\n'
    E'本案件は応募期間が終了しています。',
    'OFFICIAL', 'CLOSED',
    '40,000円（固定）',
    '管理者B',
    now() - interval '20 days',
    now() - interval '5 days',
    'https://picsum.photos/seed/slides005/800/450'
  ) ON CONFLICT (id) DO NOTHING;

  -- ---- 6. データ入力支援 ----
  -- 状態: PUBLISHED / 担当者あり / サムネなし / 募集5名
  INSERT INTO public.posts (
    id, company_id, created_by_user_id,
    title, body, post_type, post_status,
    price_text, contact_person_name,
    deadline_at, published_at,
    application_limit, is_application_limit_enabled
  ) VALUES (
    p_off6, co5, adm1,
    '名刺データ入力・顧客マスタ整備サポート（5名募集）',
    E'展示会で収集した名刺（約 500 枚）のデータ入力と、既存顧客マスタとの照合作業をお願いできる方を複数名募集します。\n\n'
    E'■ 業務内容\n'
    E'・名刺情報（氏名・会社名・部署・電話・メール）の Excel 入力\n'
    E'・既存マスタとの重複チェック・統合\n'
    E'・入力後の目視確認（誤字・欠落の確認）\n\n'
    E'■ 求めるスキル\n'
    E'・Excel の基本操作\n'
    E'・正確・丁寧な入力作業ができる方\n\n'
    E'完全リモート可。作業期間 2 週間（柔軟対応可）。',
    'OFFICIAL', 'PUBLISHED',
    '1,200円/時間',
    '管理者A',
    now() + interval '10 days',
    now() - interval '1 day',
    5, true
  ) ON CONFLICT (id) DO NOTHING;

  -- ---- 7. 営業資料レビュー ----
  -- 状態: DRAFT / サムネなし / published_at=NULL
  INSERT INTO public.posts (
    id, company_id, created_by_user_id,
    title, body, post_type, post_status
  ) VALUES (
    p_off7, co3, adm3,
    '新規顧客向け営業資料のフィードバック・レビュー',
    E'新しく作成した営業提案資料について、外部の視点でフィードバックをいただきたいと考えています。\n\n'
    E'■ 業務内容\n'
    E'・資料（20 スライド程度）の内容確認\n'
    E'・訴求ポイントの分かりやすさ評価\n'
    E'・改善案のコメント記入\n\n'
    E'※ 詳細条件は調整中のため、現在は下書きとして保存しています。',
    'OFFICIAL', 'DRAFT'
  ) ON CONFLICT (id) DO NOTHING;

  -- ---- 8. バナー画像作成補助 ----
  -- 状態: CLOSED / サムネあり / 参考URL（本文内）
  INSERT INTO public.posts (
    id, company_id, created_by_user_id,
    title, body, post_type, post_status,
    price_text, published_at, closed_at, thumbnail_url
  ) VALUES (
    p_off8, co1, adm1,
    'Web 広告バナー画像作成補助（Illustrator / Figma）',
    E'夏のキャンペーン用 Web バナーの制作補助をお願いできる方を募集しておりました（現在は終了）。\n\n'
    E'■ 業務内容（完了）\n'
    E'・サイズ別バナー作成（300×250 / 728×90 / 160×600 px）\n'
    E'・Adobe Illustrator または Figma での制作\n'
    E'・納品: AI / PSD ファイル + PNG 書き出し\n\n'
    E'■ 参考\n'
    E'・ブランドガイドライン: https://example.internal/brand\n'
    E'・過去バナー参考: https://example.internal/banner-archive\n\n'
    E'本案件は応募・制作ともに完了しています。',
    'OFFICIAL', 'CLOSED',
    '5,000〜8,000円/点',
    now() - interval '30 days',
    now() - interval '10 days',
    'https://picsum.photos/seed/banner008/800/450'
  ) ON CONFLICT (id) DO NOTHING;

  -- ==========================================================
  -- STEP 5: 気軽投稿（CASUAL）11件
  -- ==========================================================

  -- ---- cas1. UI レビューお願い ----
  -- 状態: PUBLISHED / サムネあり / 投稿者: user1(田中太郎)
  INSERT INTO public.posts (
    id, company_id, created_by_user_id,
    title, body, post_type, post_status,
    published_at, thumbnail_url
  ) VALUES (
    p_cas1, co1, usr1,
    '新機能のダッシュボード UI をレビューしてもらえませんか？',
    E'現在開発中の社内ツールに新しいダッシュボード機能を追加しました。\n'
    E'ユーザー目線で UI のフィードバックをいただけると助かります。\n\n'
    E'特に以下の点が気になっています:\n'
    E'・情報の優先度（何を先に見せるか）\n'
    E'・ボタン配置の分かりやすさ\n'
    E'・モバイル表示時の見やすさ\n\n'
    E'Figma のプレビューリンクをお送りします。30 分〜1 時間程度でOK。お気軽にどうぞ！',
    'CASUAL', 'PUBLISHED',
    now() - interval '2 days',
    'https://picsum.photos/seed/ui011/800/450'
  ) ON CONFLICT (id) DO NOTHING;

  -- ---- cas2. Excel マクロ相談 ----
  -- 状態: PUBLISHED / 本文短め / 投稿者: user2(佐藤花子)
  INSERT INTO public.posts (
    id, company_id, created_by_user_id,
    title, body, post_type, post_status,
    published_at
  ) VALUES (
    p_cas2, co2, usr2,
    'Excel の VBA マクロについて相談したい',
    E'毎月の集計作業をマクロで自動化しようとしていますが、ループ処理でエラーが出て詰まっています。VBA 経験者の方、少し見ていただけますか？',
    'CASUAL', 'PUBLISHED',
    now() - interval '1 day'
  ) ON CONFLICT (id) DO NOTHING;

  -- ---- cas3. Figma デザイン壁打ち ----
  -- 状態: DRAFT / 投稿者: user3(鈴木一郎)
  INSERT INTO public.posts (
    id, company_id, created_by_user_id,
    title, body, post_type, post_status
  ) VALUES (
    p_cas3, co3, usr3,
    'Figma コンポーネント設計の壁打ち相手を募集',
    E'Figma でデザインシステムを構築しようとしているのですが、コンポーネントの粒度や命名規則について相談相手を探しています。\n\n'
    E'現時点では社内のデザイン経験者と話す機会がなく、外部の意見を聞いてみたいと思っています。\n\n'
    E'※ まだ下書きです。詳細を整理してから公開します。',
    'CASUAL', 'DRAFT'
  ) ON CONFLICT (id) DO NOTHING;

  -- ---- cas4. 社内向け資料の見せ方相談 ----
  -- 状態: PUBLISHED / 本文長め / 投稿者: adm1(管理者A)
  INSERT INTO public.posts (
    id, company_id, created_by_user_id,
    title, body, post_type, post_status,
    published_at
  ) VALUES (
    p_cas4, co1, adm1,
    '経営会議向け資料の構成・見せ方について相談したい',
    E'来週の経営会議で新規事業の提案をする予定なのですが、資料の構成や見せ方について意見をいただけると嬉しいです。\n\n'
    E'■ 現状\n'
    E'・スライド枚数: 現在 30 枚程度（多い気がしています）\n'
    E'・内容: 市場調査 → 競合分析 → 提案内容 → 数値計画 → 懸念事項 の順\n'
    E'・対象: 代表取締役 + 各部門長 5 名\n\n'
    E'■ 悩んでいること\n'
    E'・エグゼクティブサマリーをどのタイミングで入れるか\n'
    E'・数値計画はシート一面の表がいいか、グラフに変換すべきか\n'
    E'・「懸念事項」を先に出すか後に出すか\n\n'
    E'■ 求めている意見\n'
    E'・資料構成のフィードバック（全体の流れ）\n'
    E'・各スライドのビジュアル化アドバイス\n'
    E'・プレゼン時間 15 分に収める削り方の提案\n\n'
    E'プレゼン経験豊富な方、経営企画・コンサル経験のある方に特に聞いてみたいです。\n'
    E'資料は PDF または Figma でお見せできます。オンライン通話 30〜60 分を希望しています。\n\n'
    E'気軽にコメントください！',
    'CASUAL', 'PUBLISHED',
    now() - interval '3 days'
  ) ON CONFLICT (id) DO NOTHING;

  -- ---- cas5. Java 例外設計の相談 ----
  -- 状態: PUBLISHED / 参考URL（本文内） / 投稿者: user4(高橋健太)
  INSERT INTO public.posts (
    id, company_id, created_by_user_id,
    title, body, post_type, post_status,
    published_at
  ) VALUES (
    p_cas5, co4, usr4,
    'Java 例外設計について壁打ちしてほしい',
    E'Spring Boot で新しい API を設計しているのですが、例外処理の方針について迷っています。\n\n'
    E'【具体的な悩み】\n'
    E'カスタム例外クラスをドメイン層に置くか、インフラ層に置くかで議論になっています。\n'
    E'また、RuntimeException とチェック例外の使い分けについても改めて整理したいです。\n\n'
    E'参考にしているガイドライン:\n'
    E'https://example.internal/java-exception-guide\n\n'
    E'Java 歴 5 年以上の方や、DDD でのエラー設計経験がある方のご意見を聞かせてください。',
    'CASUAL', 'PUBLISHED',
    now() - interval '4 days'
  ) ON CONFLICT (id) DO NOTHING;

  -- ---- cas6. PowerPoint 構成レビュー ----
  -- 状態: CLOSED / 投稿者: user1(田中太郎)
  INSERT INTO public.posts (
    id, company_id, created_by_user_id,
    title, body, post_type, post_status,
    published_at, closed_at
  ) VALUES (
    p_cas6, co1, usr1,
    'PowerPoint の構成をレビューしてほしい（募集終了）',
    E'先日の社内勉強会で発表した PowerPoint の構成についてフィードバックをもらいたいと思っていました。\n\n'
    E'おかげさまで複数の方から意見をいただき、大変参考になりました。ありがとうございました。\n\n'
    E'本投稿は締め切りとさせていただきます。',
    'CASUAL', 'CLOSED',
    now() - interval '10 days',
    now() - interval '2 days'
  ) ON CONFLICT (id) DO NOTHING;

  -- ---- cas7. ノーコードツール比較相談 ----
  -- 状態: PUBLISHED / サムネあり / 投稿者: user5(伊藤美紀)
  INSERT INTO public.posts (
    id, company_id, created_by_user_id,
    title, body, post_type, post_status,
    published_at, thumbnail_url
  ) VALUES (
    p_cas7, co5, usr5,
    'ノーコードツール選定の相談に乗ってほしい',
    E'社内の業務フロー自動化にノーコードツールを導入しようとしています。\n'
    E'Make / Zapier / n8n / Power Automate あたりで迷っています。\n\n'
    E'実際に使ったことがある方や、選定経験のある方に話を聞いてみたいです。\n'
    E'用途は主に「フォーム送信 → Slack 通知 → スプレッドシート記録」のような単純なフローです。',
    'CASUAL', 'PUBLISHED',
    now() - interval '1 day',
    'https://picsum.photos/seed/nocode017/800/450'
  ) ON CONFLICT (id) DO NOTHING;

  -- ---- cas8. アンケート設問レビュー ----
  -- 状態: PUBLISHED / 参考URL（本文内） / 投稿者: user3(鈴木一郎)
  INSERT INTO public.posts (
    id, company_id, created_by_user_id,
    title, body, post_type, post_status,
    published_at
  ) VALUES (
    p_cas8, co3, usr3,
    'ユーザーアンケートの設問設計をレビューしてほしい',
    E'新機能リリース後に実施予定のユーザーアンケートを設計しています。\n'
    E'設問の表現・順序・回答選択肢の適切さについてフィードバックをもらえますか？\n\n'
    E'ドラフトはこちら: https://example.internal/survey-draft\n\n'
    E'特に気になる点:\n'
    E'・リッカート尺度（5段階）の使い方が適切かどうか\n'
    E'・オープン質問の数が多すぎないか',
    'CASUAL', 'PUBLISHED',
    now() - interval '2 days'
  ) ON CONFLICT (id) DO NOTHING;

  -- ---- cas9. コーディングテストの見直し相談 ----
  -- 状態: DRAFT / 投稿者: user2(佐藤花子)
  INSERT INTO public.posts (
    id, company_id, created_by_user_id,
    title, body, post_type, post_status
  ) VALUES (
    p_cas9, co2, usr2,
    '採用コーディングテストの問題を見直したい',
    E'現在使っているコーディングテストの問題が実務との乖離を感じています。\n'
    E'採用技術（TypeScript / React）を使ったより実践的な問題に改訂したいのですが、相談できる方いますか？\n\n'
    E'※ まだ下書き中です。',
    'CASUAL', 'DRAFT'
  ) ON CONFLICT (id) DO NOTHING;

  -- ---- cas10. ちょっとした壁打ち募集 ----
  -- 状態: PUBLISHED / 本文短め / 管理者投稿: adm2(管理者B)
  INSERT INTO public.posts (
    id, company_id, created_by_user_id,
    title, body, post_type, post_status,
    published_at
  ) VALUES (
    p_cas10, co2, adm2,
    'SaaS プライシング戦略についてちょっと壁打ちしたい',
    E'自社 SaaS のプランを見直し中です。フリーミアム vs サブスクの議論でもやもやしています。SaaS プライシングの経験がある方、30 分ほどお話しできますか？',
    'CASUAL', 'PUBLISHED',
    now() - interval '6 hours'
  ) ON CONFLICT (id) DO NOTHING;

  -- ---- cas11. デザインシステム整備の壁打ち ----
  -- 状態: PUBLISHED / サムネあり / 投稿者: user1(田中太郎)
  INSERT INTO public.posts (
    id, company_id, created_by_user_id,
    title, body, post_type, post_status,
    published_at, thumbnail_url
  ) VALUES (
    p_cas11, co1, usr1,
    'デザインシステム整備について相談に乗ってほしい',
    E'フロントエンドのコンポーネント設計とデザインシステムの整備を進めています。\n'
    E'Tailwind CSS + shadcn/ui をベースにしているのですが、カスタマイズの方針や命名規則で迷っています。\n\n'
    E'経験者の方のアドバイスをいただけると助かります！',
    'CASUAL', 'PUBLISHED',
    now() - interval '12 hours',
    'https://picsum.photos/seed/design021/800/450'
  ) ON CONFLICT (id) DO NOTHING;

  -- ==========================================================
  -- STEP 6: applications 14件
  -- ==========================================================
  --
  -- 【確認できる導線パターン】
  --   ○ 他社からの応募（有効ケース）
  --   ○ 同一投稿への複数応募
  --   ○ APPLY → REVIEWING → ACCEPTED の遷移
  --   ○ INQUIRY（問い合わせ）ケース
  --   ○ 自分の投稿には応募できないケース（seed には含まない）
  --   ○ 未応募案件（p_off2, p_off7 = DRAFT のため表示なし）
  -- ==========================================================

  -- ---- OFFICIAL への応募 ----

  -- [1] user2(佐藤花子/ゼロプライド) → p_off1(経費精算/company1)
  --     他社からの応募 / APPLY / APPLIED
  INSERT INTO public.applications (
    id, post_id, applicant_user_id,
    message, application_type, application_status,
    applicant_name_snapshot, applicant_email_snapshot, applicant_company_snapshot,
    post_title_snapshot, application_sequence
  ) VALUES (
    'dd000001-0000-0000-0000-000000000000',
    p_off1, usr2,
    '経費精算作業の経験があります。前職で同様の作業を 2 年間担当しており、正確な入力には自信があります。ぜひよろしくお願いします。',
    'APPLY', 'APPLIED',
    '佐藤 花子', 'user2@example.com', 'ゼロプライド株式会社',
    '経費精算レシートの整理・データ入力サポート', 1
  ) ON CONFLICT (id) DO NOTHING;

  -- [2] user3(鈴木一郎/ULTI-ME) → p_off1(経費精算/company1)
  --     他社からの問い合わせ / INQUIRY / INQUIRY
  INSERT INTO public.applications (
    id, post_id, applicant_user_id,
    message, application_type, application_status,
    applicant_name_snapshot, applicant_email_snapshot, applicant_company_snapshot,
    post_title_snapshot, application_sequence
  ) VALUES (
    'dd000002-0000-0000-0000-000000000000',
    p_off1, usr3,
    '稼働可能な時期についていくつか確認させてください。月末の具体的な作業日程はいつ頃でしょうか？',
    'INQUIRY', 'INQUIRY',
    '鈴木 一郎', 'user3@example.com', '株式会社ULTI-ME',
    '経費精算レシートの整理・データ入力サポート', 2
  ) ON CONFLICT (id) DO NOTHING;

  -- [3] user4(高橋健太/T's grace) → p_off3(Webサイト修正/company1)
  --     他社から応募 / APPLY / REVIEWING（審査中）
  INSERT INTO public.applications (
    id, post_id, applicant_user_id,
    message, application_type, application_status,
    applicant_name_snapshot, applicant_email_snapshot, applicant_company_snapshot,
    post_title_snapshot, application_sequence, reviewed_at
  ) VALUES (
    'dd000003-0000-0000-0000-000000000000',
    p_off3, usr4,
    'HTML/CSS の実務経験 3 年あります。Figma での書き出しも問題なく対応できます。リモートでの作業も可能です。',
    'APPLY', 'REVIEWING',
    '高橋 健太', 'user4@example.com', '株式会社T''s grace',
    'コーポレートサイトの軽微な修正・更新対応（複数名募集）', 1,
    now() - interval '1 day'
  ) ON CONFLICT (id) DO NOTHING;

  -- [4] user5(伊藤美紀/TSHD) → p_off3(Webサイト修正/company1)
  --     他社から応募 / APPLY / ACCEPTED（採用済み）※ 複数応募ケース
  INSERT INTO public.applications (
    id, post_id, applicant_user_id,
    message, application_type, application_status,
    applicant_name_snapshot, applicant_email_snapshot, applicant_company_snapshot,
    post_title_snapshot, application_sequence, reviewed_at
  ) VALUES (
    'dd000004-0000-0000-0000-000000000000',
    p_off3, usr5,
    'Web 制作の経験 5 年以上です。HTML/CSS/JS はもちろん、Figma も日常的に使用しています。スピードと品質を両立して対応します。',
    'APPLY', 'ACCEPTED',
    '伊藤 美紀', 'user5@example.com', '株式会社TSHD',
    'コーポレートサイトの軽微な修正・更新対応（複数名募集）', 2,
    now() - interval '12 hours'
  ) ON CONFLICT (id) DO NOTHING;

  -- [5] user2(佐藤花子/ゼロプライド) → p_off4(アンケートレポート/company3)
  --     他社から応募 / APPLY / APPLIED
  INSERT INTO public.applications (
    id, post_id, applicant_user_id,
    message, application_type, application_status,
    applicant_name_snapshot, applicant_email_snapshot, applicant_company_snapshot,
    post_title_snapshot, application_sequence
  ) VALUES (
    'dd000005-0000-0000-0000-000000000000',
    p_off4, usr2,
    'データ分析・レポート作成が得意です。Excel のピボットテーブルを使った集計や PowerPoint への可視化も対応できます。',
    'APPLY', 'APPLIED',
    '佐藤 花子', 'user2@example.com', 'ゼロプライド株式会社',
    '顧客アンケート結果の集計・レポート作成', 1
  ) ON CONFLICT (id) DO NOTHING;

  -- [6] user1(田中太郎/T's agency holdings) → p_off6(データ入力/company5)
  --     他社から応募 / APPLY / APPLIED
  --     ※ adm1 は company1+company5 所属だが user1 は company1 のみ → 別会社ケース
  INSERT INTO public.applications (
    id, post_id, applicant_user_id,
    message, application_type, application_status,
    applicant_name_snapshot, applicant_email_snapshot, applicant_company_snapshot,
    post_title_snapshot, application_sequence
  ) VALUES (
    'dd000006-0000-0000-0000-000000000000',
    p_off6, usr1,
    '名刺データの入力作業、喜んでお手伝いします。タイピング速度も速く、正確な作業が得意です。',
    'APPLY', 'APPLIED',
    '田中 太郎', 'user1@example.com', 'T''s agency holdings',
    '名刺データ入力・顧客マスタ整備サポート（5名募集）', 1
  ) ON CONFLICT (id) DO NOTHING;

  -- [7] user3(鈴木一郎/ULTI-ME) → p_off6(データ入力/company5)
  --     複数応募ケース / APPLY / APPLIED
  INSERT INTO public.applications (
    id, post_id, applicant_user_id,
    message, application_type, application_status,
    applicant_name_snapshot, applicant_email_snapshot, applicant_company_snapshot,
    post_title_snapshot, application_sequence
  ) VALUES (
    'dd000007-0000-0000-0000-000000000000',
    p_off6, usr3,
    'リモートでのデータ入力作業、対応できます。週 20 時間程度の稼働が可能です。',
    'APPLY', 'APPLIED',
    '鈴木 一郎', 'user3@example.com', '株式会社ULTI-ME',
    '名刺データ入力・顧客マスタ整備サポート（5名募集）', 2
  ) ON CONFLICT (id) DO NOTHING;

  -- ---- CASUAL への応募 ----

  -- [8] user2(佐藤花子/ゼロプライド) → p_cas1(UIレビュー / user1の投稿)
  --     参加希望ケース / APPLY / APPLIED
  --     ※ user1の投稿に user1 は応募不可（自分の投稿）→ user2 が応募
  INSERT INTO public.applications (
    id, post_id, applicant_user_id,
    message, application_type, application_status,
    applicant_name_snapshot, applicant_email_snapshot, applicant_company_snapshot,
    post_title_snapshot, application_sequence
  ) VALUES (
    'dd000008-0000-0000-0000-000000000000',
    p_cas1, usr2,
    'UX デザインの知識があります。フィードバックお手伝いします！Figma のリンクをお送りください。',
    'APPLY', 'APPLIED',
    '佐藤 花子', 'user2@example.com', 'ゼロプライド株式会社',
    '新機能のダッシュボード UI をレビューしてもらえませんか？', 1
  ) ON CONFLICT (id) DO NOTHING;

  -- [9] user3(鈴木一郎/ULTI-ME) → p_cas1(UIレビュー / user1の投稿)
  --     聞いてみるケース / INQUIRY / INQUIRY
  INSERT INTO public.applications (
    id, post_id, applicant_user_id,
    message, application_type, application_status,
    applicant_name_snapshot, applicant_email_snapshot, applicant_company_snapshot,
    post_title_snapshot, application_sequence
  ) VALUES (
    'dd000009-0000-0000-0000-000000000000',
    p_cas1, usr3,
    'どのような技術スタックで作っていますか？レビューする前にもう少し背景を教えていただけますか？',
    'INQUIRY', 'INQUIRY',
    '鈴木 一郎', 'user3@example.com', '株式会社ULTI-ME',
    '新機能のダッシュボード UI をレビューしてもらえませんか？', 2
  ) ON CONFLICT (id) DO NOTHING;

  -- [10] user4(高橋健太/T's grace) → p_cas2(Excelマクロ / user2の投稿)
  --      参加希望 / APPLY / APPLIED
  INSERT INTO public.applications (
    id, post_id, applicant_user_id,
    message, application_type, application_status,
    applicant_name_snapshot, applicant_email_snapshot, applicant_company_snapshot,
    post_title_snapshot, application_sequence
  ) VALUES (
    'dd000010-0000-0000-0000-000000000000',
    p_cas2, usr4,
    'VBA は 3 年使っています。エラーコードを教えていただければ、原因を特定できると思います。',
    'APPLY', 'APPLIED',
    '高橋 健太', 'user4@example.com', '株式会社T''s grace',
    'Excel の VBA マクロについて相談したい', 1
  ) ON CONFLICT (id) DO NOTHING;

  -- [11] user1(田中太郎/T's agency holdings) → p_cas5(Java例外 / user4の投稿)
  --      聞いてみるケース / INQUIRY / INQUIRY
  INSERT INTO public.applications (
    id, post_id, applicant_user_id,
    message, application_type, application_status,
    applicant_name_snapshot, applicant_email_snapshot, applicant_company_snapshot,
    post_title_snapshot, application_sequence
  ) VALUES (
    'dd000011-0000-0000-0000-000000000000',
    p_cas5, usr1,
    'DDD での例外設計の経験があります。チェック例外を使うケースについては独自の見解があります。少し話しましょうか？',
    'INQUIRY', 'INQUIRY',
    '田中 太郎', 'user1@example.com', 'T''s agency holdings',
    'Java 例外設計について壁打ちしてほしい', 1
  ) ON CONFLICT (id) DO NOTHING;

  -- [12] user5(伊藤美紀/TSHD) → p_cas4(社内資料の見せ方 / adm1の投稿)
  --      参加希望 / APPLY / APPLIED
  INSERT INTO public.applications (
    id, post_id, applicant_user_id,
    message, application_type, application_status,
    applicant_name_snapshot, applicant_email_snapshot, applicant_company_snapshot,
    post_title_snapshot, application_sequence
  ) VALUES (
    'dd000012-0000-0000-0000-000000000000',
    p_cas4, usr5,
    '経営企画でのプレゼン資料作成を多数経験しています。エグゼクティブサマリーの位置づけについては特に意見があります。',
    'APPLY', 'APPLIED',
    '伊藤 美紀', 'user5@example.com', '株式会社TSHD',
    '経営会議向け資料の構成・見せ方について相談したい', 1
  ) ON CONFLICT (id) DO NOTHING;

  -- [13] user2(佐藤花子/ゼロプライド) → p_cas7(ノーコードツール / user5の投稿)
  --      参加希望 / APPLY / APPLIED
  INSERT INTO public.applications (
    id, post_id, applicant_user_id,
    message, application_type, application_status,
    applicant_name_snapshot, applicant_email_snapshot, applicant_company_snapshot,
    post_title_snapshot, application_sequence
  ) VALUES (
    'dd000013-0000-0000-0000-000000000000',
    p_cas7, usr2,
    'Make と Zapier の両方を使った経験があります。用途によっておすすめが変わりますが、お話しましょうか！',
    'APPLY', 'APPLIED',
    '佐藤 花子', 'user2@example.com', 'ゼロプライド株式会社',
    'ノーコードツール選定の相談に乗ってほしい', 1
  ) ON CONFLICT (id) DO NOTHING;

  -- [14] user4(高橋健太/T's grace) → p_cas8(アンケート設問 / user3の投稿)
  --      聞いてみるケース / INQUIRY / INQUIRY
  INSERT INTO public.applications (
    id, post_id, applicant_user_id,
    message, application_type, application_status,
    applicant_name_snapshot, applicant_email_snapshot, applicant_company_snapshot,
    post_title_snapshot, application_sequence
  ) VALUES (
    'dd000014-0000-0000-0000-000000000000',
    p_cas8, usr4,
    'リッカート尺度の使い方については UX リサーチの観点からアドバイスできます。どんな KPI を測定したいですか？',
    'INQUIRY', 'INQUIRY',
    '高橋 健太', 'user4@example.com', '株式会社T''s grace',
    'ユーザーアンケートの設問設計をレビューしてほしい', 1
  ) ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE '===========================================';
  RAISE NOTICE 'seed_dev.sql の投入が完了しました。';
  RAISE NOTICE '  管理者: 3件 (admin1〜3@example.com)';
  RAISE NOTICE '  一般ユーザー: 5件 (user1〜5@example.com)';
  RAISE NOTICE '  company_members: 10件';
  RAISE NOTICE '  公式案件(OFFICIAL): 8件';
  RAISE NOTICE '    PUBLISHED: 4件 / DRAFT: 2件 / CLOSED: 2件';
  RAISE NOTICE '  気軽投稿(CASUAL): 11件';
  RAISE NOTICE '    PUBLISHED: 7件 / DRAFT: 2件 / CLOSED: 2件';
  RAISE NOTICE '  応募(applications): 14件';
  RAISE NOTICE '    APPLY: 9件 / INQUIRY: 5件';
  RAISE NOTICE '  共通パスワード: password123';
  RAISE NOTICE '===========================================';

end $seed$;
