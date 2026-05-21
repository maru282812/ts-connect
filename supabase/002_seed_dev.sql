-- ============================================================
-- 002_seed_dev.sql
-- WorkMarket 開発・検証用シードデータ
--
-- 目的: 権限別の表示・操作動線を確認できるデータを投入する
-- 前提: 001_schema.sql を適用済みであること
--
-- ログイン情報（共通パスワード: password123）
--
--   MASTER_ADMIN:
--     master@example.com  （全社アクセス / company_members 所属なし）
--
--   ADMIN:
--     admin1@example.com  （管理者A / T's agency holdings）
--     admin2@example.com  （管理者B / ゼロプライド株式会社）
--     admin3@example.com  （管理者C / 株式会社ULTI-ME）
--
--   USER:
--     user1@example.com   （田中 太郎 / T's agency holdings）
--     user2@example.com   （佐藤 花子 / ゼロプライド株式会社）
--     user3@example.com   （鈴木 一郎 / 株式会社ULTI-ME + 株式会社T's grace 複数所属）
--     user4@example.com   （高橋 健太 / 株式会社T's grace）
--     user5@example.com   （伊藤 美紀 / 株式会社TSHD）
--
-- 注意:
--   auth.users への直接 INSERT はローカル Supabase 開発環境でのみ動作する。
--   本番 Supabase（cloud）では auth.users への直接 INSERT は不可のため、
--   先に Supabase Auth でユーザーを作成してから、
--   STEP 2 の public.users UPSERT のみを実行してください。
-- ============================================================

do $seed$
declare
  -- ===== 会社 UUID =====
  co1 uuid := '11111111-1111-1111-1111-111111111111'; -- T's agency holdings
  co2 uuid := '22222222-2222-2222-2222-222222222222'; -- ゼロプライド株式会社
  co3 uuid := '33333333-3333-3333-3333-333333333333'; -- 株式会社ULTI-ME
  co4 uuid := '44444444-4444-4444-4444-444444444444'; -- 株式会社T's grace
  co5 uuid := '55555555-5555-5555-5555-555555555555'; -- 株式会社TSHD

  -- ===== MASTER_ADMIN UUID =====
  mstr uuid := 'aa000000-0000-0000-0000-000000000000';

  -- ===== ADMIN UUID =====
  adm1 uuid := 'aa000001-0000-0000-0000-000000000000'; -- 管理者A
  adm2 uuid := 'aa000002-0000-0000-0000-000000000000'; -- 管理者B
  adm3 uuid := 'aa000003-0000-0000-0000-000000000000'; -- 管理者C

  -- ===== USER UUID =====
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

  -- ===== 追加投稿 UUID（ユーザー別・状態別確認用） =====
  p_var1 uuid := 'cc000101-0000-0000-0000-000000000000';
  p_var2 uuid := 'cc000102-0000-0000-0000-000000000000';
  p_var3 uuid := 'cc000103-0000-0000-0000-000000000000';
  p_var4 uuid := 'cc000104-0000-0000-0000-000000000000';
  p_var5 uuid := 'cc000105-0000-0000-0000-000000000000';
  p_var6 uuid := 'cc000106-0000-0000-0000-000000000000';
  p_var7 uuid := 'cc000107-0000-0000-0000-000000000000';
  p_var8 uuid := 'cc000108-0000-0000-0000-000000000000';

  -- bcrypt hash of 'password123'
  pw_hash text := crypt('password123', gen_salt('bf'));

begin

  -- ==========================================================
  -- STEP 0: companies を確実に投入（001_schema.sql 未実行環境の保険）
  -- ==========================================================

  insert into public.companies (id, name) values
    (co1, 'T''s agency holdings'),
    (co2, 'ゼロプライド株式会社'),
    (co3, '株式会社ULTI-ME'),
    (co4, '株式会社T''s grace'),
    (co5, '株式会社TSHD')
  on conflict (id) do update set name = excluded.name;

  -- ==========================================================
  -- STEP 1: auth.users へユーザーを作成
  --   → on_auth_user_created トリガーが public.users を自動挿入
  --
  -- 注意: ローカル Supabase 開発環境でのみ動作する。
  --       本番 Supabase では先に Supabase Auth でユーザー作成後、
  --       STEP 2 の public.users UPSERT のみ実行すること。
  -- ==========================================================

  insert into auth.users (
    instance_id, id, aud, role, email,
    encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    is_super_admin, created_at, updated_at,
    confirmation_token, recovery_token,
    email_change_token_new, email_change
  ) values
    -- MASTER_ADMIN
    ('00000000-0000-0000-0000-000000000000', mstr,
     'authenticated', 'authenticated', 'master@example.com',
     pw_hash, now(),
     '{"provider":"email","providers":["email"]}',
     '{"display_name":"マスター管理者"}',
     false, now(), now(), '', '', '', ''),
    -- 管理者A
    ('00000000-0000-0000-0000-000000000000', adm1,
     'authenticated', 'authenticated', 'admin1@example.com',
     pw_hash, now(),
     '{"provider":"email","providers":["email"]}',
     '{"display_name":"管理者A"}',
     false, now(), now(), '', '', '', ''),
    -- 管理者B
    ('00000000-0000-0000-0000-000000000000', adm2,
     'authenticated', 'authenticated', 'admin2@example.com',
     pw_hash, now(),
     '{"provider":"email","providers":["email"]}',
     '{"display_name":"管理者B"}',
     false, now(), now(), '', '', '', ''),
    -- 管理者C
    ('00000000-0000-0000-0000-000000000000', adm3,
     'authenticated', 'authenticated', 'admin3@example.com',
     pw_hash, now(),
     '{"provider":"email","providers":["email"]}',
     '{"display_name":"管理者C"}',
     false, now(), now(), '', '', '', ''),
    -- 田中 太郎
    ('00000000-0000-0000-0000-000000000000', usr1,
     'authenticated', 'authenticated', 'user1@example.com',
     pw_hash, now(),
     '{"provider":"email","providers":["email"]}',
     '{"display_name":"田中 太郎"}',
     false, now(), now(), '', '', '', ''),
    -- 佐藤 花子
    ('00000000-0000-0000-0000-000000000000', usr2,
     'authenticated', 'authenticated', 'user2@example.com',
     pw_hash, now(),
     '{"provider":"email","providers":["email"]}',
     '{"display_name":"佐藤 花子"}',
     false, now(), now(), '', '', '', ''),
    -- 鈴木 一郎
    ('00000000-0000-0000-0000-000000000000', usr3,
     'authenticated', 'authenticated', 'user3@example.com',
     pw_hash, now(),
     '{"provider":"email","providers":["email"]}',
     '{"display_name":"鈴木 一郎"}',
     false, now(), now(), '', '', '', ''),
    -- 高橋 健太
    ('00000000-0000-0000-0000-000000000000', usr4,
     'authenticated', 'authenticated', 'user4@example.com',
     pw_hash, now(),
     '{"provider":"email","providers":["email"]}',
     '{"display_name":"高橋 健太"}',
     false, now(), now(), '', '', '', ''),
    -- 伊藤 美紀
    ('00000000-0000-0000-0000-000000000000', usr5,
     'authenticated', 'authenticated', 'user5@example.com',
     pw_hash, now(),
     '{"provider":"email","providers":["email"]}',
     '{"display_name":"伊藤 美紀"}',
     false, now(), now(), '', '', '', '')
  on conflict (id) do update set
    encrypted_password = excluded.encrypted_password,
    email_confirmed_at = excluded.email_confirmed_at,
    raw_app_meta_data = excluded.raw_app_meta_data,
    raw_user_meta_data = excluded.raw_user_meta_data,
    updated_at = now();

  -- ==========================================================
  -- STEP 2: public.users を明示 UPSERT（トリガー未発火の保険）
  --         system_role をここで正しい値に設定する
  -- ==========================================================

  insert into public.users (id, email, display_name, system_role, account_status) values
    (mstr, 'master@example.com', 'マスター管理者', 'MASTER_ADMIN', 'ACTIVE'),
    (adm1, 'admin1@example.com', '管理者A',        'ADMIN',        'ACTIVE'),
    (adm2, 'admin2@example.com', '管理者B',        'ADMIN',        'ACTIVE'),
    (adm3, 'admin3@example.com', '管理者C',        'ADMIN',        'ACTIVE'),
    (usr1, 'user1@example.com',  '田中 太郎',      'USER',         'ACTIVE'),
    (usr2, 'user2@example.com',  '佐藤 花子',      'USER',         'ACTIVE'),
    (usr3, 'user3@example.com',  '鈴木 一郎',      'USER',         'ACTIVE'),
    (usr4, 'user4@example.com',  '高橋 健太',      'USER',         'ACTIVE'),
    (usr5, 'user5@example.com',  '伊藤 美紀',      'USER',         'ACTIVE')
  on conflict (id) do update set
    display_name   = excluded.display_name,
    system_role    = excluded.system_role,
    account_status = excluded.account_status;

  -- ==========================================================
  -- STEP 3: company_members 所属登録
  --
  -- 管理者A: T's agency holdings (ADMIN/active) + 株式会社TSHD (USER/inactive)
  -- 管理者B: ゼロプライド株式会社 (ADMIN/active)
  -- 管理者C: 株式会社ULTI-ME (ADMIN/active)
  -- 田中 太郎: T's agency holdings (USER/active)
  -- 佐藤 花子: ゼロプライド株式会社 (USER/active)
  -- 鈴木 一郎: 株式会社ULTI-ME (USER/active) + 株式会社T's grace (USER/inactive)
  -- 高橋 健太: 株式会社T's grace (USER/active)
  -- 伊藤 美紀: 株式会社TSHD (USER/active)
  -- MASTER_ADMIN: company_members 所属なし（全社アクセスは RLS で直接保証）
  -- ==========================================================

  insert into public.company_members (user_id, company_id, role, status) values
    (adm1, co1, 'ADMIN', 'active'),
    (adm1, co5, 'USER',  'inactive'),
    (adm2, co2, 'ADMIN', 'active'),
    (adm3, co3, 'ADMIN', 'active'),
    (usr1, co1, 'USER',  'active'),
    (usr2, co2, 'USER',  'active'),
    (usr3, co3, 'USER',  'active'),
    (usr3, co4, 'USER',  'inactive'),
    (usr4, co4, 'USER',  'active'),
    (usr5, co5, 'USER',  'active')
  on conflict (user_id, company_id) do nothing;

  -- ==========================================================
  -- STEP 4: 公式案件（OFFICIAL）8件
  --
  -- 確認できる状態:
  --   OPEN: p_off1 / p_off3 / p_off4 / p_off6
  --   DRAFT: p_off2 / p_off7
  --   IN_PROGRESS: p_var1
  --   CLOSED: p_off5 / p_off8 / p_var3
  -- ==========================================================

  -- ---- 1. 経費精算レシート整理 / OPEN / 締切近い / サムネあり / 募集1名 ----
  insert into public.posts (
    id, company_id, created_by_user_id,
    title, body, post_type, post_status,
    price_text, contact_person_name,
    deadline_at, published_at, thumbnail_url,
    application_limit, is_application_limit_enabled, requirements
  ) values (
    p_off1, co1, adm1,
    '経費精算レシートの整理・データ入力サポート',
    E'毎月末に溜まる経費精算レシートの整理と Excel へのデータ入力をお願いできる方を募集しています。\n\n' ||
    E'■ 業務内容\n' ||
    E'・紙レシートのスキャン（スキャナ操作）\n' ||
    E'・Excel への金額・日付・項目の転記\n' ||
    E'・合計金額の確認と差異チェック\n\n' ||
    E'■ 条件\n' ||
    E'・作業場所: 本社オフィス（リモート不可）\n' ||
    E'・所要時間: 月末 2〜3 日程度（各日 4〜6 時間）\n' ||
    E'・単発案件のため、今月限りの対応となります',
    'OFFICIAL', 'OPEN',
    '1,500円/時間', '管理者A',
    now() + interval '3 days', now() - interval '5 days',
    'https://picsum.photos/seed/receipt001/800/450',
    1, true,
    E'・Excel の基本操作（入力・集計）\n' ||
    E'・正確かつ丁寧な作業ができる方\n' ||
    E'・守秘義務を守れる方'
  ) on conflict (id) do nothing;

  -- ---- 2. FAQ整理 / DRAFT / サムネなし ----
  insert into public.posts (
    id, company_id, created_by_user_id,
    title, body, post_type, post_status, price_text
  ) values (
    p_off2, co2, adm2,
    'カスタマーサポート FAQ 整理・ライティング',
    E'自社サービスのよくある質問（FAQ）を整理し、ユーザーが読みやすい形に書き直してくれる方を探しています。\n\n' ||
    E'■ 業務内容\n' ||
    E'・既存 FAQ（約 50 件）の読みやすさ改善\n' ||
    E'・問い合わせログを参考にした新規 FAQ の追加（10〜20 件）\n' ||
    E'・Notion または Word ドキュメントへの記載\n\n' ||
    E'※ 現在下書き中のため、詳細は後日追記予定です。',
    'OFFICIAL', 'DRAFT',
    '30,000〜50,000円（固定）'
  ) on conflict (id) do nothing;

  -- ---- 3. Webサイト軽微修正 / OPEN / 募集3名 / サムネあり ----
  insert into public.posts (
    id, company_id, created_by_user_id,
    title, body, post_type, post_status,
    price_text, contact_person_name,
    deadline_at, published_at, thumbnail_url,
    application_limit, is_application_limit_enabled, requirements
  ) values (
    p_off3, co1, adm1,
    'コーポレートサイトの軽微な修正・更新対応（複数名募集）',
    E'コーポレートサイトのテキスト更新や画像差し替えなど、軽微な修正作業を複数名で並行対応いただきます。\n\n' ||
    E'■ 業務内容\n' ||
    E'・指定ページのテキスト修正・追記\n' ||
    E'・バナー画像の差し替え（Figma でのサイズ調整含む）\n' ||
    E'・採用ページ HTML/CSS 実装（デザインカンプあり）\n\n' ||
    E'リモートワーク可。作業期間 2 週間程度を想定。',
    'OFFICIAL', 'OPEN',
    '3,000円/時間', '管理者A',
    now() + interval '14 days', now() - interval '3 days',
    'https://picsum.photos/seed/webfix003/800/450',
    3, true,
    E'・HTML / CSS（必須）、JavaScript（尚可）\n' ||
    E'・Figma 閲覧・書き出し操作'
  ) on conflict (id) do nothing;

  -- ---- 4. アンケート結果レポート作成 / OPEN / 締切近い ----
  insert into public.posts (
    id, company_id, created_by_user_id,
    title, body, post_type, post_status,
    price_text, contact_person_name,
    deadline_at, published_at, requirements
  ) values (
    p_off4, co3, adm3,
    '顧客アンケート結果の集計・レポート作成',
    E'先月実施した顧客向けアンケート（回答数 約 200 件）の結果を集計し、経営陣向けのレポートを作成していただきたいと思っています。\n\n' ||
    E'■ 業務内容\n' ||
    E'・Google フォームからエクスポートした CSV データの集計\n' ||
    E'・グラフ・チャートの作成（Excel または Google スプレッドシート）\n' ||
    E'・考察・サマリーの文章化\n' ||
    E'・PowerPoint / Google スライドへのまとめ',
    'OFFICIAL', 'OPEN',
    '50,000〜80,000円（固定）', '管理者C',
    now() + interval '5 days', now() - interval '2 days',
    E'・Excel / スプレッドシートでのピボット・グラフ作成経験\n' ||
    E'・定量データを分かりやすくまとめる力'
  ) on conflict (id) do nothing;

  -- ---- 5. 社内資料体裁調整 / CLOSED / サムネあり ----
  insert into public.posts (
    id, company_id, created_by_user_id,
    title, body, post_type, post_status,
    price_text, contact_person_name,
    published_at, closed_at, thumbnail_url
  ) values (
    p_off5, co2, adm2,
    '社内向け研修資料の体裁調整・デザイン統一',
    E'新入社員研修で使用する資料 15 点の体裁を統一する作業をお手伝いいただける方を募集しておりました。\n\n' ||
    E'本案件は応募期間が終了しています。',
    'OFFICIAL', 'CLOSED',
    '40,000円（固定）', '管理者B',
    now() - interval '20 days', now() - interval '5 days',
    'https://picsum.photos/seed/slides005/800/450'
  ) on conflict (id) do nothing;

  -- ---- 6. データ入力支援 / OPEN / 担当者あり / 募集5名 ----
  insert into public.posts (
    id, company_id, created_by_user_id,
    title, body, post_type, post_status,
    price_text, contact_person_name,
    deadline_at, published_at,
    application_limit, is_application_limit_enabled
  ) values (
    p_off6, co5, adm1,
    '名刺データ入力・顧客マスタ整備サポート（5名募集）',
    E'展示会で収集した名刺（約 500 枚）のデータ入力と、既存顧客マスタとの照合作業をお願いできる方を複数名募集します。\n\n' ||
    E'■ 業務内容\n' ||
    E'・名刺情報（氏名・会社名・部署・電話・メール）の Excel 入力\n' ||
    E'・既存マスタとの重複チェック・統合\n\n' ||
    E'完全リモート可。',
    'OFFICIAL', 'OPEN',
    '1,200円/時間', '管理者A',
    now() + interval '10 days', now() - interval '1 day',
    5, true
  ) on conflict (id) do nothing;

  -- ---- 7. 営業資料レビュー / DRAFT ----
  insert into public.posts (
    id, company_id, created_by_user_id,
    title, body, post_type, post_status
  ) values (
    p_off7, co3, adm3,
    '新規顧客向け営業資料のフィードバック・レビュー',
    E'新しく作成した営業提案資料について、外部の視点でフィードバックをいただきたいと考えています。\n\n' ||
    E'※ 詳細条件は調整中のため、現在は下書きとして保存しています。',
    'OFFICIAL', 'DRAFT'
  ) on conflict (id) do nothing;

  -- ---- 8. バナー画像作成補助 / CLOSED / サムネあり ----
  insert into public.posts (
    id, company_id, created_by_user_id,
    title, body, post_type, post_status,
    price_text, published_at, closed_at, thumbnail_url
  ) values (
    p_off8, co1, adm1,
    'Web 広告バナー画像作成補助（Illustrator / Figma）',
    E'夏のキャンペーン用 Web バナーの制作補助をお願いできる方を募集しておりました（現在は終了）。\n\n' ||
    E'本案件は応募・制作ともに完了しています。',
    'OFFICIAL', 'CLOSED',
    '5,000〜8,000円/点',
    now() - interval '30 days', now() - interval '10 days',
    'https://picsum.photos/seed/banner008/800/450'
  ) on conflict (id) do nothing;

  -- ==========================================================
  -- STEP 5: 気軽投稿（CASUAL）11件
  -- ==========================================================

  -- ---- cas1. UI レビューお願い / OPEN / サムネあり / user1 ----
  insert into public.posts (
    id, company_id, created_by_user_id,
    title, body, post_type, post_status, published_at, thumbnail_url
  ) values (
    p_cas1, co1, usr1,
    '新機能のダッシュボード UI をレビューしてもらえませんか？',
    E'現在開発中の社内ツールに新しいダッシュボード機能を追加しました。\n' ||
    E'ユーザー目線で UI のフィードバックをいただけると助かります。\n\n' ||
    E'特に以下の点が気になっています:\n' ||
    E'・情報の優先度\n' ||
    E'・ボタン配置の分かりやすさ\n' ||
    E'・モバイル表示時の見やすさ\n\n' ||
    E'30 分〜1 時間程度でOK。お気軽にどうぞ！',
    'CASUAL', 'OPEN',
    now() - interval '2 days',
    'https://picsum.photos/seed/ui011/800/450'
  ) on conflict (id) do nothing;

  -- ---- cas2. Excel マクロ相談 / OPEN / user2 ----
  insert into public.posts (
    id, company_id, created_by_user_id,
    title, body, post_type, post_status, published_at
  ) values (
    p_cas2, co2, usr2,
    'Excel の VBA マクロについて相談したい',
    E'毎月の集計作業をマクロで自動化しようとしていますが、ループ処理でエラーが出て詰まっています。VBA 経験者の方、少し見ていただけますか？',
    'CASUAL', 'OPEN',
    now() - interval '1 day'
  ) on conflict (id) do nothing;

  -- ---- cas3. Figma デザイン壁打ち / DRAFT / user3 ----
  insert into public.posts (
    id, company_id, created_by_user_id,
    title, body, post_type, post_status
  ) values (
    p_cas3, co3, usr3,
    'Figma コンポーネント設計の壁打ち相手を募集',
    E'Figma でデザインシステムを構築しようとしているのですが、コンポーネントの粒度や命名規則について相談相手を探しています。\n\n' ||
    E'※ まだ下書きです。',
    'CASUAL', 'DRAFT'
  ) on conflict (id) do nothing;

  -- ---- cas4. 社内向け資料の見せ方相談 / OPEN / adm1 ----
  insert into public.posts (
    id, company_id, created_by_user_id,
    title, body, post_type, post_status, published_at
  ) values (
    p_cas4, co1, adm1,
    '経営会議向け資料の構成・見せ方について相談したい',
    E'来週の経営会議で新規事業の提案をする予定なのですが、資料の構成や見せ方について意見をいただけると嬉しいです。\n\n' ||
    E'■ 悩んでいること\n' ||
    E'・エグゼクティブサマリーをどのタイミングで入れるか\n' ||
    E'・数値計画はグラフに変換すべきか\n' ||
    E'・「懸念事項」を先に出すか後に出すか\n\n' ||
    E'プレゼン経験豊富な方のご意見をお待ちしています！',
    'CASUAL', 'OPEN',
    now() - interval '3 days'
  ) on conflict (id) do nothing;

  -- ---- cas5. Java 例外設計の相談 / OPEN / user4 ----
  insert into public.posts (
    id, company_id, created_by_user_id,
    title, body, post_type, post_status, published_at
  ) values (
    p_cas5, co4, usr4,
    'Java 例外設計について壁打ちしてほしい',
    E'Spring Boot で新しい API を設計しているのですが、例外処理の方針について迷っています。\n\n' ||
    E'カスタム例外クラスをドメイン層に置くか、インフラ層に置くかで議論になっています。\n' ||
    E'Java 歴 5 年以上の方や、DDD でのエラー設計経験がある方のご意見を聞かせてください。',
    'CASUAL', 'OPEN',
    now() - interval '4 days'
  ) on conflict (id) do nothing;

  -- ---- cas6. PowerPoint 構成レビュー / CLOSED / user1 ----
  insert into public.posts (
    id, company_id, created_by_user_id,
    title, body, post_type, post_status, published_at, closed_at
  ) values (
    p_cas6, co1, usr1,
    'PowerPoint の構成をレビューしてほしい（募集終了）',
    E'先日の社内勉強会で発表した PowerPoint の構成についてフィードバックをもらいたいと思っていました。\n\n' ||
    E'おかげさまで複数の方から意見をいただき、大変参考になりました。ありがとうございました。\n\n' ||
    E'本投稿は締め切りとさせていただきます。',
    'CASUAL', 'CLOSED',
    now() - interval '10 days', now() - interval '2 days'
  ) on conflict (id) do nothing;

  -- ---- cas7. ノーコードツール比較相談 / OPEN / サムネあり / user5 ----
  insert into public.posts (
    id, company_id, created_by_user_id,
    title, body, post_type, post_status, published_at, thumbnail_url
  ) values (
    p_cas7, co5, usr5,
    'ノーコードツール選定の相談に乗ってほしい',
    E'社内の業務フロー自動化にノーコードツールを導入しようとしています。\n' ||
    E'Make / Zapier / n8n / Power Automate あたりで迷っています。\n\n' ||
    E'実際に使ったことがある方、選定経験のある方に話を聞いてみたいです。',
    'CASUAL', 'OPEN',
    now() - interval '1 day',
    'https://picsum.photos/seed/nocode017/800/450'
  ) on conflict (id) do nothing;

  -- ---- cas8. アンケート設問レビュー / OPEN / user3 ----
  insert into public.posts (
    id, company_id, created_by_user_id,
    title, body, post_type, post_status, published_at
  ) values (
    p_cas8, co3, usr3,
    'ユーザーアンケートの設問設計をレビューしてほしい',
    E'新機能リリース後に実施予定のユーザーアンケートを設計しています。\n' ||
    E'設問の表現・順序・回答選択肢の適切さについてフィードバックをもらえますか？\n\n' ||
    E'特に気になる点:\n' ||
    E'・リッカート尺度（5段階）の使い方が適切かどうか\n' ||
    E'・オープン質問の数が多すぎないか',
    'CASUAL', 'OPEN',
    now() - interval '2 days'
  ) on conflict (id) do nothing;

  -- ---- cas9. コーディングテストの見直し相談 / DRAFT / user2 ----
  insert into public.posts (
    id, company_id, created_by_user_id,
    title, body, post_type, post_status
  ) values (
    p_cas9, co2, usr2,
    '採用コーディングテストの問題を見直したい',
    E'現在使っているコーディングテストの問題が実務との乖離を感じています。\n' ||
    E'TypeScript / React を使ったより実践的な問題に改訂したいのですが、相談できる方いますか？\n\n' ||
    E'※ まだ下書き中です。',
    'CASUAL', 'DRAFT'
  ) on conflict (id) do nothing;

  -- ---- cas10. SaaS プライシング壁打ち / OPEN / adm2 ----
  insert into public.posts (
    id, company_id, created_by_user_id,
    title, body, post_type, post_status, published_at
  ) values (
    p_cas10, co2, adm2,
    'SaaS プライシング戦略についてちょっと壁打ちしたい',
    E'自社 SaaS のプランを見直し中です。フリーミアム vs サブスクの議論でもやもやしています。SaaS プライシングの経験がある方、30 分ほどお話しできますか？',
    'CASUAL', 'OPEN',
    now() - interval '6 hours'
  ) on conflict (id) do nothing;

  -- ---- cas11. デザインシステム整備の壁打ち / OPEN / サムネあり / user1 ----
  insert into public.posts (
    id, company_id, created_by_user_id,
    title, body, post_type, post_status, published_at, thumbnail_url
  ) values (
    p_cas11, co1, usr1,
    'デザインシステム整備について相談に乗ってほしい',
    E'フロントエンドのコンポーネント設計とデザインシステムの整備を進めています。\n' ||
    E'Tailwind CSS + shadcn/ui をベースにしているのですが、カスタマイズの方針や命名規則で迷っています。\n\n' ||
    E'経験者の方のアドバイスをいただけると助かります！',
    'CASUAL', 'OPEN',
    now() - interval '12 hours',
    'https://picsum.photos/seed/design021/800/450'
  ) on conflict (id) do nothing;

  -- ==========================================================
  -- STEP 5.5: 追加投稿 8件（ユーザー別・状態別確認用）
  --
  -- OFFICIAL / CASUAL × DRAFT / OPEN / IN_PROGRESS / CLOSED
  -- をすべての管理者・一般ユーザーで確認できるパターン
  -- ==========================================================

  -- ---- var1. adm1: 進行中の公式案件 / IN_PROGRESS / サムネあり ----
  insert into public.posts (
    id, company_id, created_by_user_id,
    title, body, post_type, post_status,
    price_text, contact_person_name,
    deadline_at, published_at, thumbnail_url,
    application_limit, is_application_limit_enabled,
    requirements, reference_url
  ) values (
    p_var1, co1, adm1,
    'AI議事録ツールの比較表作成と導入メモ作成',
    E'複数の AI 議事録ツールを比較し、社内導入の判断材料になる一覧表と短い導入メモを作成していただきたいです。\n\n' ||
    E'■ 作業内容\n' ||
    E'・5〜8サービスの料金、対応言語、録音連携、セキュリティ項目を整理\n' ||
    E'・実務利用時のメリット / 注意点を簡潔にまとめる\n' ||
    E'・Google スプレッドシートで納品',
    'OFFICIAL', 'IN_PROGRESS',
    '25,000円〜40,000円', '管理者A',
    now() + interval '10 days', now() - interval '4 days',
    'https://picsum.photos/seed/ai-meeting-var101/800/450',
    2, true,
    E'・SaaS 比較記事やサービス仕様の読み取りができる方\n' ||
    E'・ビジネス向けに要点を短くまとめられる方',
    'https://example.com/research/ai-meeting-tools'
  ) on conflict (id) do nothing;

  -- ---- var2. adm2: 公開中の公式案件 / OPEN ----
  insert into public.posts (
    id, company_id, created_by_user_id,
    title, body, post_type, post_status,
    price_text, contact_person_name,
    deadline_at, published_at,
    application_limit, is_application_limit_enabled, requirements
  ) values (
    p_var2, co2, adm2,
    '採用広報記事の構成案レビュー',
    E'採用ページに掲載予定の記事構成をレビューし、候補者に伝わりやすい流れに整える仕事です。\n\n' ||
    E'■ 依頼したいこと\n' ||
    E'・記事タイトルと見出し構成の改善\n' ||
    E'・候補者が知りたい情報の抜け漏れ確認\n' ||
    E'・会社紹介が宣伝寄りになりすぎていないかのチェック',
    'OFFICIAL', 'OPEN',
    '15,000円/本', '管理者B',
    now() + interval '21 days', now() - interval '1 day',
    3, true,
    E'・採用広報または編集経験\n' ||
    E'・読み手目線でフィードバックできる方'
  ) on conflict (id) do nothing;

  -- ---- var3. adm3: 終了した公式案件 / CLOSED / サムネあり ----
  insert into public.posts (
    id, company_id, created_by_user_id,
    title, body, post_type, post_status,
    price_text, contact_person_name,
    published_at, closed_at, thumbnail_url
  ) values (
    p_var3, co3, adm3,
    '営業資料の数字チェックと表記ゆれ修正',
    E'営業提案書の金額、導入社数、日付表記を確認し、表記ゆれを整えるスポット作業です。\n\n' ||
    E'本案件は終了済みの確認用データです。',
    'OFFICIAL', 'CLOSED',
    '10,000円', '管理者C',
    now() - interval '45 days', now() - interval '20 days',
    'https://picsum.photos/seed/sales-doc-var103/800/450'
  ) on conflict (id) do nothing;

  -- ---- var4. usr1: 公開中の気軽投稿 / OPEN / サムネあり ----
  insert into public.posts (
    id, company_id, created_by_user_id,
    title, body, post_type, post_status, published_at, thumbnail_url
  ) values (
    p_var4, co1, usr1,
    'Notion の社内ポータル設計について相談したい',
    E'部署ごとにページが増えてきて、必要な情報にたどり着きにくくなっています。\n' ||
    E'Notion の社内ポータルを整理した経験がある方に、情報設計や権限設計の考え方を相談したいです。',
    'CASUAL', 'OPEN',
    now() - interval '3 hours',
    'https://picsum.photos/seed/notion-portal-var104/800/450'
  ) on conflict (id) do nothing;

  -- ---- var5. usr2: 進行中の気軽投稿 / IN_PROGRESS ----
  insert into public.posts (
    id, company_id, created_by_user_id,
    title, body, post_type, post_status, published_at
  ) values (
    p_var5, co2, usr2,
    'SQL の集計クエリを一緒に見直してほしい',
    E'月次レポート用の SQL を書いていますが、JOIN が増えて読みづらくなってきました。\n' ||
    E'すでに相談相手は見つかっています（IN_PROGRESS 表示確認用）。',
    'CASUAL', 'IN_PROGRESS',
    now() - interval '2 days'
  ) on conflict (id) do nothing;

  -- ---- var6. usr3: 終了した気軽投稿 / CLOSED ----
  insert into public.posts (
    id, company_id, created_by_user_id,
    title, body, post_type, post_status, published_at, closed_at
  ) values (
    p_var6, co3, usr3,
    'オンライン勉強会のテーマ選びを相談したい',
    E'社内外向けのオンライン勉強会テーマについて相談していました。\n' ||
    E'テーマが決まったため、CLOSED 表示確認用の投稿として残しています。',
    'CASUAL', 'CLOSED',
    now() - interval '18 days', now() - interval '6 days'
  ) on conflict (id) do nothing;

  -- ---- var7. usr4: 下書きの気軽投稿 / DRAFT ----
  insert into public.posts (
    id, company_id, created_by_user_id,
    title, body, post_type, post_status
  ) values (
    p_var7, co4, usr4,
    'プロダクト分析イベントの告知文を添削してほしい',
    E'イベント告知文の下書きを作っています。対象者、得られる学び、参加条件の見せ方を整理してから公開予定です。',
    'CASUAL', 'DRAFT'
  ) on conflict (id) do nothing;

  -- ---- var8. usr5: 公開中の気軽投稿 / OPEN / reference_url あり ----
  insert into public.posts (
    id, company_id, created_by_user_id,
    title, body, post_type, post_status, published_at, reference_url
  ) values (
    p_var8, co5, usr5,
    '小規模チームのタスク管理ルールを聞きたい',
    E'5人前後のチームでタスク管理をするとき、Issue、Slack、定例の使い分けに悩んでいます。\n' ||
    E'実際に運用しているルールや、破綻しやすいポイントを教えてほしいです。',
    'CASUAL', 'OPEN',
    now() - interval '8 hours',
    'https://example.com/team/task-management'
  ) on conflict (id) do nothing;

  -- ==========================================================
  -- STEP 6: applications 14件
  --
  -- 確認できる導線:
  --   ○ 他社からの応募（有効ケース）
  --   ○ 同一投稿への複数応募
  --   ○ APPLY → REVIEWING → ACCEPTED の遷移
  --   ○ INQUIRY（問い合わせ）ケース
  --   ○ DRAFT 投稿は表示されないため応募なし（p_off2, p_off7）
  -- ==========================================================

  -- [1] user2 → p_off1 / APPLY / APPLIED
  insert into public.applications (
    id, post_id, applicant_user_id,
    message, application_type, application_status,
    applicant_name_snapshot, applicant_email_snapshot, applicant_company_snapshot,
    post_title_snapshot, application_sequence
  ) values (
    'dd000001-0000-0000-0000-000000000000',
    p_off1, usr2,
    '経費精算作業の経験があります。前職で同様の作業を 2 年間担当しており、正確な入力には自信があります。',
    'APPLY', 'APPLIED',
    '佐藤 花子', 'user2@example.com', 'ゼロプライド株式会社',
    '経費精算レシートの整理・データ入力サポート', 1
  ) on conflict (id) do nothing;

  -- [2] user3 → p_off1 / INQUIRY / INQUIRY
  insert into public.applications (
    id, post_id, applicant_user_id,
    message, application_type, application_status,
    applicant_name_snapshot, applicant_email_snapshot, applicant_company_snapshot,
    post_title_snapshot, application_sequence
  ) values (
    'dd000002-0000-0000-0000-000000000000',
    p_off1, usr3,
    '稼働可能な時期についていくつか確認させてください。月末の具体的な作業日程はいつ頃でしょうか？',
    'INQUIRY', 'INQUIRY',
    '鈴木 一郎', 'user3@example.com', '株式会社ULTI-ME',
    '経費精算レシートの整理・データ入力サポート', 2
  ) on conflict (id) do nothing;

  -- [3] user4 → p_off3 / APPLY / REVIEWING
  insert into public.applications (
    id, post_id, applicant_user_id,
    message, application_type, application_status,
    applicant_name_snapshot, applicant_email_snapshot, applicant_company_snapshot,
    post_title_snapshot, application_sequence, reviewed_at
  ) values (
    'dd000003-0000-0000-0000-000000000000',
    p_off3, usr4,
    'HTML/CSS の実務経験 3 年あります。Figma での書き出しも問題なく対応できます。',
    'APPLY', 'REVIEWING',
    '高橋 健太', 'user4@example.com', '株式会社T''s grace',
    'コーポレートサイトの軽微な修正・更新対応（複数名募集）', 1,
    now() - interval '1 day'
  ) on conflict (id) do nothing;

  -- [4] user5 → p_off3 / APPLY / ACCEPTED
  insert into public.applications (
    id, post_id, applicant_user_id,
    message, application_type, application_status,
    applicant_name_snapshot, applicant_email_snapshot, applicant_company_snapshot,
    post_title_snapshot, application_sequence, reviewed_at
  ) values (
    'dd000004-0000-0000-0000-000000000000',
    p_off3, usr5,
    'Web 制作の経験 5 年以上です。HTML/CSS/JS はもちろん、Figma も日常的に使用しています。',
    'APPLY', 'ACCEPTED',
    '伊藤 美紀', 'user5@example.com', '株式会社TSHD',
    'コーポレートサイトの軽微な修正・更新対応（複数名募集）', 2,
    now() - interval '12 hours'
  ) on conflict (id) do nothing;

  -- [5] user2 → p_off4 / APPLY / APPLIED
  insert into public.applications (
    id, post_id, applicant_user_id,
    message, application_type, application_status,
    applicant_name_snapshot, applicant_email_snapshot, applicant_company_snapshot,
    post_title_snapshot, application_sequence
  ) values (
    'dd000005-0000-0000-0000-000000000000',
    p_off4, usr2,
    'データ分析・レポート作成が得意です。Excel のピボットテーブルや PowerPoint への可視化も対応できます。',
    'APPLY', 'APPLIED',
    '佐藤 花子', 'user2@example.com', 'ゼロプライド株式会社',
    '顧客アンケート結果の集計・レポート作成', 1
  ) on conflict (id) do nothing;

  -- [6] user1 → p_off6 / APPLY / APPLIED
  insert into public.applications (
    id, post_id, applicant_user_id,
    message, application_type, application_status,
    applicant_name_snapshot, applicant_email_snapshot, applicant_company_snapshot,
    post_title_snapshot, application_sequence
  ) values (
    'dd000006-0000-0000-0000-000000000000',
    p_off6, usr1,
    '名刺データの入力作業、喜んでお手伝いします。タイピング速度も速く、正確な作業が得意です。',
    'APPLY', 'APPLIED',
    '田中 太郎', 'user1@example.com', 'T''s agency holdings',
    '名刺データ入力・顧客マスタ整備サポート（5名募集）', 1
  ) on conflict (id) do nothing;

  -- [7] user3 → p_off6 / APPLY / APPLIED
  insert into public.applications (
    id, post_id, applicant_user_id,
    message, application_type, application_status,
    applicant_name_snapshot, applicant_email_snapshot, applicant_company_snapshot,
    post_title_snapshot, application_sequence
  ) values (
    'dd000007-0000-0000-0000-000000000000',
    p_off6, usr3,
    'リモートでのデータ入力作業、対応できます。週 20 時間程度の稼働が可能です。',
    'APPLY', 'APPLIED',
    '鈴木 一郎', 'user3@example.com', '株式会社ULTI-ME',
    '名刺データ入力・顧客マスタ整備サポート（5名募集）', 2
  ) on conflict (id) do nothing;

  -- [8] user2 → p_cas1 / APPLY / APPLIED（user1 の投稿に user2 が応募）
  insert into public.applications (
    id, post_id, applicant_user_id,
    message, application_type, application_status,
    applicant_name_snapshot, applicant_email_snapshot, applicant_company_snapshot,
    post_title_snapshot, application_sequence
  ) values (
    'dd000008-0000-0000-0000-000000000000',
    p_cas1, usr2,
    'UX デザインの知識があります。フィードバックお手伝いします！Figma のリンクをお送りください。',
    'APPLY', 'APPLIED',
    '佐藤 花子', 'user2@example.com', 'ゼロプライド株式会社',
    '新機能のダッシュボード UI をレビューしてもらえませんか？', 1
  ) on conflict (id) do nothing;

  -- [9] user3 → p_cas1 / INQUIRY / INQUIRY
  insert into public.applications (
    id, post_id, applicant_user_id,
    message, application_type, application_status,
    applicant_name_snapshot, applicant_email_snapshot, applicant_company_snapshot,
    post_title_snapshot, application_sequence
  ) values (
    'dd000009-0000-0000-0000-000000000000',
    p_cas1, usr3,
    'どのような技術スタックで作っていますか？レビューする前にもう少し背景を教えていただけますか？',
    'INQUIRY', 'INQUIRY',
    '鈴木 一郎', 'user3@example.com', '株式会社ULTI-ME',
    '新機能のダッシュボード UI をレビューしてもらえませんか？', 2
  ) on conflict (id) do nothing;

  -- [10] user4 → p_cas2 / APPLY / APPLIED
  insert into public.applications (
    id, post_id, applicant_user_id,
    message, application_type, application_status,
    applicant_name_snapshot, applicant_email_snapshot, applicant_company_snapshot,
    post_title_snapshot, application_sequence
  ) values (
    'dd000010-0000-0000-0000-000000000000',
    p_cas2, usr4,
    'VBA は 3 年使っています。エラーコードを教えていただければ、原因を特定できると思います。',
    'APPLY', 'APPLIED',
    '高橋 健太', 'user4@example.com', '株式会社T''s grace',
    'Excel の VBA マクロについて相談したい', 1
  ) on conflict (id) do nothing;

  -- [11] user1 → p_cas5 / INQUIRY / INQUIRY
  insert into public.applications (
    id, post_id, applicant_user_id,
    message, application_type, application_status,
    applicant_name_snapshot, applicant_email_snapshot, applicant_company_snapshot,
    post_title_snapshot, application_sequence
  ) values (
    'dd000011-0000-0000-0000-000000000000',
    p_cas5, usr1,
    'DDD での例外設計の経験があります。チェック例外を使うケースについては独自の見解があります。少し話しましょうか？',
    'INQUIRY', 'INQUIRY',
    '田中 太郎', 'user1@example.com', 'T''s agency holdings',
    'Java 例外設計について壁打ちしてほしい', 1
  ) on conflict (id) do nothing;

  -- [12] user5 → p_cas4 / APPLY / APPLIED
  insert into public.applications (
    id, post_id, applicant_user_id,
    message, application_type, application_status,
    applicant_name_snapshot, applicant_email_snapshot, applicant_company_snapshot,
    post_title_snapshot, application_sequence
  ) values (
    'dd000012-0000-0000-0000-000000000000',
    p_cas4, usr5,
    '経営企画でのプレゼン資料作成を多数経験しています。エグゼクティブサマリーの位置づけについては特に意見があります。',
    'APPLY', 'APPLIED',
    '伊藤 美紀', 'user5@example.com', '株式会社TSHD',
    '経営会議向け資料の構成・見せ方について相談したい', 1
  ) on conflict (id) do nothing;

  -- [13] user2 → p_cas7 / APPLY / APPLIED
  insert into public.applications (
    id, post_id, applicant_user_id,
    message, application_type, application_status,
    applicant_name_snapshot, applicant_email_snapshot, applicant_company_snapshot,
    post_title_snapshot, application_sequence
  ) values (
    'dd000013-0000-0000-0000-000000000000',
    p_cas7, usr2,
    'Make と Zapier の両方を使った経験があります。用途によっておすすめが変わりますが、お話しましょうか！',
    'APPLY', 'APPLIED',
    '佐藤 花子', 'user2@example.com', 'ゼロプライド株式会社',
    'ノーコードツール選定の相談に乗ってほしい', 1
  ) on conflict (id) do nothing;

  -- [14] user4 → p_cas8 / INQUIRY / INQUIRY
  insert into public.applications (
    id, post_id, applicant_user_id,
    message, application_type, application_status,
    applicant_name_snapshot, applicant_email_snapshot, applicant_company_snapshot,
    post_title_snapshot, application_sequence
  ) values (
    'dd000014-0000-0000-0000-000000000000',
    p_cas8, usr4,
    'リッカート尺度の使い方については UX リサーチの観点からアドバイスできます。どんな KPI を測定したいですか？',
    'INQUIRY', 'INQUIRY',
    '高橋 健太', 'user4@example.com', '株式会社T''s grace',
    'ユーザーアンケートの設問設計をレビューしてほしい', 1
  ) on conflict (id) do nothing;

  raise notice '===========================================';
  raise notice '002_seed_dev.sql の投入が完了しました。';
  raise notice '  MASTER_ADMIN: 1件 (master@example.com)';
  raise notice '  ADMIN: 3件 (admin1〜3@example.com)';
  raise notice '  USER: 5件 (user1〜5@example.com)';
  raise notice '  company_members: 10件';
  raise notice '  公式案件 (OFFICIAL): 11件';
  raise notice '    OPEN: 4件 / DRAFT: 2件 / IN_PROGRESS: 1件 / CLOSED: 4件';
  raise notice '  気軽投稿 (CASUAL): 16件';
  raise notice '    OPEN: 9件 / DRAFT: 3件 / IN_PROGRESS: 1件 / CLOSED: 3件';
  raise notice '  applications: 14件 (APPLY: 9件 / INQUIRY: 5件)';
  raise notice '  共通パスワード: password123';
  raise notice '===========================================';

end $seed$;
