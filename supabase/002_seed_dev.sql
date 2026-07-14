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

  -- ===== 社内SNS: community_posts UUID =====
  cp1  uuid := '6c000001-0000-0000-0000-000000000000'; -- co1 ORIGINAL  usr1（週替わりテーマ:ショートカット）
  cp2  uuid := '6c000002-0000-0000-0000-000000000000'; -- co1 ORIGINAL  adm1（お知らせ）
  cp3  uuid := '6c000003-0000-0000-0000-000000000000'; -- co1 ORIGINAL  usr1（タグ付き）
  cp4  uuid := '6c000004-0000-0000-0000-000000000000'; -- co1 QUOTE     adm1（cp1を引用）
  cp5  uuid := '6c000005-0000-0000-0000-000000000000'; -- co1 REPOST    usr1（cp2をリポスト）
  cp6  uuid := '6c000006-0000-0000-0000-000000000000'; -- co1 ORIGINAL  adm1（社外SNS取込: EXTERNAL_IMPORT）
  cp7  uuid := '6c000007-0000-0000-0000-000000000000'; -- co1 ORIGINAL  usr1（PRIVATE: 本人のみ）
  cp8  uuid := '6c000008-0000-0000-0000-000000000000'; -- co1 ORIGINAL  usr1（会社別テーマ:社内ランチ）
  cp11 uuid := '6c000011-0000-0000-0000-000000000000'; -- co2 ORIGINAL  usr2（週替わりテーマ:ショートカット）
  cp12 uuid := '6c000012-0000-0000-0000-000000000000'; -- co2 ORIGINAL  adm2（お知らせ）
  cp13 uuid := '6c000013-0000-0000-0000-000000000000'; -- co2 REPOST    usr2（cp12をリポスト）

  -- ===== 社内SNS: community_post_tags UUID =====
  tag1 uuid := '6f000001-0000-0000-0000-000000000000'; -- 業務効率化
  tag2 uuid := '6f000002-0000-0000-0000-000000000000'; -- ツール
  tag3 uuid := '6f000003-0000-0000-0000-000000000000'; -- 雑談
  tag4 uuid := '6f000004-0000-0000-0000-000000000000'; -- お知らせ

  -- ===== 社内SNS: community_post_comments UUID =====
  cm1 uuid := '6e000001-0000-0000-0000-000000000000'; -- cp1 へ adm1
  cm2 uuid := '6e000002-0000-0000-0000-000000000000'; -- cp1 へ usr1（本人）
  cm3 uuid := '6e000003-0000-0000-0000-000000000000'; -- cm1 への返信 usr1
  cm4 uuid := '6e000004-0000-0000-0000-000000000000'; -- cp3 へ adm1
  cm5 uuid := '6e000005-0000-0000-0000-000000000000'; -- cp11 へ adm2

  -- ===== 社内SNS: 会社別 週替わりテーマ UUID =====
  wt_co1 uuid := '72000001-0000-0000-0000-000000000000'; -- co1 限定テーマ

  -- ===== 社内SNS: community_external_drafts UUID =====
  ed1 uuid := '71000001-0000-0000-0000-000000000000'; -- PUBLISHED（cp6 として公開済）
  ed2 uuid := '71000002-0000-0000-0000-000000000000'; -- DRAFT（未公開・下書き）

  -- ===== 社内SNS: community_post_reports UUID =====
  rp1 uuid := '70000001-0000-0000-0000-000000000000'; -- cp6 を usr1 が通報（PENDING）

  -- 社内SNS: 全社共通テーマ（021で投入済み）の id を後で取得
  theme_global uuid;

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

  -- ==========================================================
  -- STEP 7: mobile future feature samples
  --
  -- Existing schema already supports saved posts, recent views,
  -- unread notifications, notification preferences, and message
  -- replies. Seed only the minimum rows needed to verify mobile
  -- UI states without adding mobile-specific columns.
  -- ==========================================================

  insert into public.post_bookmarks (id, user_id, post_id, created_at) values
    ('ee000001-0000-0000-0000-000000000000', usr1, p_off3, now() - interval '2 days'),
    ('ee000002-0000-0000-0000-000000000000', usr1, p_cas1, now() - interval '1 day'),
    ('ee000003-0000-0000-0000-000000000000', usr2, p_off1, now() - interval '6 hours')
  on conflict (id) do nothing;

  insert into public.post_view_logs (id, post_id, user_id, ip_hash, user_agent, viewed_at) values
    ('ef000001-0000-0000-0000-000000000000', p_off1, usr1, 'dev-user1-view-1', 'dev-mobile-safari', now() - interval '3 hours'),
    ('ef000002-0000-0000-0000-000000000000', p_off3, usr1, 'dev-user1-view-2', 'dev-mobile-safari', now() - interval '40 minutes'),
    ('ef000003-0000-0000-0000-000000000000', p_cas1, usr2, 'dev-user2-view-1', 'dev-android-chrome', now() - interval '20 minutes')
  on conflict (id) do nothing;

  insert into public.application_messages (id, application_id, sender_user_id, body, is_read, created_at) values
    ('f1000001-0000-0000-0000-000000000000', 'dd000002-0000-0000-0000-000000000000', usr3, 'Dev inquiry follow-up message for mobile unread/reply state.', true, now() - interval '2 hours'),
    ('f1000002-0000-0000-0000-000000000000', 'dd000002-0000-0000-0000-000000000000', adm1, 'Dev admin reply for mobile reply indicator.', false, now() - interval '30 minutes'),
    ('f1000003-0000-0000-0000-000000000000', 'dd000003-0000-0000-0000-000000000000', adm1, 'Dev review message for application detail.', false, now() - interval '20 minutes')
  on conflict (id) do nothing;

  insert into public.notifications (
    id, user_id, type, title, body, related_type, related_id, is_read, read_at, created_at
  ) values
    (
      'f2000001-0000-0000-0000-000000000000',
      usr3,
      'MESSAGE_RECEIVED',
      '返信が届いています',
      '問い合わせへの返信があります。',
      'application',
      'dd000002-0000-0000-0000-000000000000',
      false,
      null,
      now() - interval '30 minutes'
    ),
    (
      'f2000002-0000-0000-0000-000000000000',
      usr4,
      'APPLICATION_STATUS_CHANGED',
      '応募が確認中になりました',
      '応募ステータスが REVIEWING に更新されました。',
      'application',
      'dd000003-0000-0000-0000-000000000000',
      false,
      null,
      now() - interval '20 minutes'
    ),
    (
      'f2000003-0000-0000-0000-000000000000',
      usr5,
      'APPLICATION_STATUS_CHANGED',
      '応募が承認されました',
      '応募ステータスが ACCEPTED に更新されました。',
      'application',
      'dd000004-0000-0000-0000-000000000000',
      true,
      now() - interval '10 minutes',
      now() - interval '1 hour'
    )
  on conflict (id) do nothing;

  insert into public.notification_settings (id, user_id, event_type, in_app, email) values
    ('f3000001-0000-0000-0000-000000000000', usr1, 'MESSAGE_RECEIVED', true, true),
    ('f3000002-0000-0000-0000-000000000000', usr1, 'APPLICATION_STATUS_CHANGED', true, false),
    ('f3000003-0000-0000-0000-000000000000', usr2, 'APPLICATION_RECEIVED', true, true)
  on conflict (user_id, event_type) do update set
    in_app = excluded.in_app,
    email = excluded.email,
    updated_at = now();

  -- ==========================================================
  -- STEP 8: 社内SNS（コミュニティ）モデルケース
  --
  -- 対応 migration: 020_community_sns / 021_community_weekly_themes /
  --                 022_community_counters
  -- like_count / comment_count / repost_count は 022 のトリガーが
  -- 自動同期するため、ここでは手動設定しない（子行投入で同期される）。
  -- 同一会社メンバーのみ見え合う（RLS方針）ため、各社のリアクション/
  -- コメントはその会社の所属メンバーで構成する。
  --   - co1（T's agency holdings）: adm1 / usr1
  --   - co2（ゼロプライド株式会社）: adm2 / usr2
  -- ==========================================================

  -- 全社共通テーマ（021で投入済み）の id を取得
  select id into theme_global
    from public.community_weekly_themes
   where company_id is null and title = '便利だったショートカット'
   limit 1;

  -- ---- 8-0. 会社別 週替わりテーマ（co1 限定） ----
  insert into public.community_weekly_themes
    (id, company_id, title, description, starts_on, ends_on, is_active, sort_order, created_by)
  values
    (wt_co1, co1, '社内ランチおすすめ',
     'オフィス周辺やテレワーク中のおすすめランチを共有しよう。',
     current_date, current_date + 6, true, 0, adm1)
  on conflict (id) do nothing;

  -- ---- 8-1. タグ ----
  insert into public.community_post_tags (id, name, slug) values
    (tag1, '業務効率化', 'efficiency'),
    (tag2, 'ツール',     'tools'),
    (tag3, '雑談',       'chat'),
    (tag4, 'お知らせ',   'announce')
  on conflict (id) do nothing;

  -- ---- 8-2. 投稿（ORIGINAL） ----

  -- cp1: usr1 / 週替わりテーマ（全社共通:ショートカット）に沿った投稿
  insert into public.community_posts
    (id, company_id, author_user_id, body, visibility, post_kind, source_kind, weekly_theme_id, created_at)
  values
    (cp1, co1, usr1,
     E'今週のテーマ「便利だったショートカット」便乗です。\n' ||
     E'Windowsの「Win + V」でクリップボード履歴が出るの、最近知って世界変わりました。コピペ往復が激減します🙌',
     'COMPANY', 'ORIGINAL', 'INTERNAL', theme_global, now() - interval '5 hours')
  on conflict (id) do nothing;

  -- cp2: adm1 / 全社お知らせ
  insert into public.community_posts
    (id, company_id, author_user_id, body, visibility, post_kind, source_kind, created_at)
  values
    (cp2, co1, adm1,
     E'【お知らせ】来週の全社定例は水曜10:00からに変更します。アジェンダは前日までに共有予定です。よろしくお願いします。',
     'COMPANY', 'ORIGINAL', 'INTERNAL', now() - interval '8 hours')
  on conflict (id) do nothing;

  -- cp3: usr1 / タグ付き投稿
  insert into public.community_posts
    (id, company_id, author_user_id, body, visibility, post_kind, source_kind, created_at)
  values
    (cp3, co1, usr1,
     E'議事録の自動文字起こし、ツールを乗り換えたら精度がかなり上がりました。\n' ||
     E'同じように探している人いたら共有するので声かけてください。',
     'COMPANY', 'ORIGINAL', 'INTERNAL', now() - interval '1 day 2 hours')
  on conflict (id) do nothing;

  -- cp7: usr1 / PRIVATE（本人のみ閲覧。公開範囲の確認用）
  insert into public.community_posts
    (id, company_id, author_user_id, body, visibility, post_kind, source_kind, created_at)
  values
    (cp7, co1, usr1,
     E'（自分用メモ）来月の勉強会ネタ候補: ショートカット集 / 議事録ツール比較 / Notion整理術',
     'PRIVATE', 'ORIGINAL', 'INTERNAL', now() - interval '30 minutes')
  on conflict (id) do nothing;

  -- cp8: usr1 / 会社別テーマ（社内ランチ）に沿った投稿
  insert into public.community_posts
    (id, company_id, author_user_id, body, visibility, post_kind, source_kind, weekly_theme_id, created_at)
  values
    (cp8, co1, usr1,
     E'テーマ「社内ランチおすすめ」！オフィス裏の定食屋、日替わり800円で味噌汁おかわり自由です。早めに行かないと並びます🍚',
     'COMPANY', 'ORIGINAL', 'INTERNAL', wt_co1, now() - interval '3 hours')
  on conflict (id) do nothing;

  -- ---- 8-3. 社外SNS取込（external_drafts → EXTERNAL_IMPORT 投稿） ----

  -- cp6: 広報が社外発信をフィードへ取り込んだ投稿
  insert into public.community_posts
    (id, company_id, author_user_id, body, visibility, post_kind, source_kind, source_url, created_at)
  values
    (cp6, co1, adm1,
     E'【プレスリリース】当社の新サービスが公開されました🎉 社外向け発信を社内にも共有します。詳細は元記事をご覧ください。',
     'COMPANY', 'ORIGINAL', 'EXTERNAL_IMPORT',
     'https://example.com/news/new-service-launch', now() - interval '6 hours')
  on conflict (id) do nothing;

  -- external_drafts: PUBLISHED（cp6 として公開済）
  insert into public.community_external_drafts
    (id, company_id, created_by, source_url, og_title, og_description, og_image_url, og_site_name,
     draft_body, status, published_post_id, fetched_at)
  values
    (ed1, co1, adm1,
     'https://example.com/news/new-service-launch',
     '新サービス「ConnectX」提供開始のお知らせ',
     '業務コミュニケーションを効率化する新サービスを本日リリースしました。',
     'https://picsum.photos/seed/pressrelease/1200/630',
     'Example News',
     E'【プレスリリース】当社の新サービスが公開されました🎉',
     'PUBLISHED', cp6, now() - interval '6 hours')
  on conflict (id) do nothing;

  -- external_drafts: DRAFT（未公開・下書きのまま。取込→公開前の状態確認用）
  insert into public.community_external_drafts
    (id, company_id, created_by, source_url, og_title, og_description, og_image_url, og_site_name,
     draft_body, status, fetched_at)
  values
    (ed2, co1, adm1,
     'https://example.com/blog/teamwork-tips',
     'チームの生産性を上げる5つの習慣',
     'リモートワーク時代のチーム運営で意識したいポイントをまとめました。',
     'https://picsum.photos/seed/blogdraft/1200/630',
     'Example Blog',
     E'参考になりそうな記事を見つけたので共有用に下書きしています。',
     'DRAFT', now() - interval '2 hours')
  on conflict (id) do nothing;

  -- ---- 8-4. 引用（QUOTE）／リポスト（REPOST） ----
  --   repost_of_id 先のカウンタは 022 トリガーが自動更新する

  -- cp4: adm1 が cp1 を引用（QUOTE: body あり）
  insert into public.community_posts
    (id, company_id, author_user_id, body, visibility, post_kind, repost_of_id, source_kind, created_at)
  values
    (cp4, co1, adm1,
     E'これ便利ですね！全社で共有したい小ワザです。みんなのおすすめショートカットもこのスレに集めましょう。',
     'COMPANY', 'QUOTE', cp1, 'INTERNAL', now() - interval '4 hours')
  on conflict (id) do nothing;

  -- cp5: usr1 が cp2 をリポスト（REPOST: body 空）
  insert into public.community_posts
    (id, company_id, author_user_id, body, visibility, post_kind, repost_of_id, source_kind, created_at)
  values
    (cp5, co1, usr1,
     '', 'COMPANY', 'REPOST', cp2, 'INTERNAL', now() - interval '7 hours')
  on conflict (id) do nothing;

  -- ---- 8-5. co2（ゼロプライド株式会社）側のフィード ----

  insert into public.community_posts
    (id, company_id, author_user_id, body, visibility, post_kind, source_kind, weekly_theme_id, created_at)
  values
    (cp11, co2, usr2,
     E'「便利だったショートカット」テーマ便乗。Slackの「Ctrl + K」でチャンネル即移動、地味に毎日使ってます。',
     'COMPANY', 'ORIGINAL', 'INTERNAL', theme_global, now() - interval '6 hours')
  on conflict (id) do nothing;

  insert into public.community_posts
    (id, company_id, author_user_id, body, visibility, post_kind, source_kind, created_at)
  values
    (cp12, co2, adm2,
     E'【お知らせ】社内SNSの運用を今日から開始しました。気軽に投稿・リアクションしてみてください！',
     'COMPANY', 'ORIGINAL', 'INTERNAL', now() - interval '1 day')
  on conflict (id) do nothing;

  insert into public.community_posts
    (id, company_id, author_user_id, body, visibility, post_kind, repost_of_id, source_kind, created_at)
  values
    (cp13, co2, usr2,
     '', 'COMPANY', 'REPOST', cp12, 'INTERNAL', now() - interval '20 hours')
  on conflict (id) do nothing;

  -- ---- 8-6. タグ紐付け（relations） ----
  insert into public.community_post_tag_relations (post_id, tag_id) values
    (cp1, tag1), (cp1, tag2),   -- ショートカット投稿: 業務効率化 / ツール
    (cp3, tag1), (cp3, tag2),   -- 議事録ツール: 業務効率化 / ツール
    (cp8, tag3),                -- ランチ: 雑談
    (cp2, tag4)                 -- お知らせ
  on conflict (post_id, tag_id) do nothing;

  -- ---- 8-7. いいね（LIKE）+ 絵文字リアクション ----
  --   unique(post_id, user_id, reaction) / 022 が like_count を同期
  insert into public.community_post_reactions (id, post_id, user_id, reaction, created_at) values
    -- cp1（usr1の投稿）に adm1 がいいね + 絵文字
    ('6d000001-0000-0000-0000-000000000000', cp1, adm1, 'LIKE',   now() - interval '4 hours'),
    ('6d000002-0000-0000-0000-000000000000', cp1, adm1, 'THANKS', now() - interval '4 hours'),
    ('6d000003-0000-0000-0000-000000000000', cp1, usr1, 'EYES',   now() - interval '3 hours'),
    -- cp2（adm1のお知らせ）に usr1 がいいね
    ('6d000004-0000-0000-0000-000000000000', cp2, usr1, 'LIKE',   now() - interval '7 hours'),
    -- cp3（usr1の議事録投稿）に adm1 がいいね + CLAP
    ('6d000005-0000-0000-0000-000000000000', cp3, adm1, 'LIKE',   now() - interval '1 day'),
    ('6d000006-0000-0000-0000-000000000000', cp3, adm1, 'CLAP',   now() - interval '1 day'),
    -- cp8（ランチ投稿）に adm1 がいいね + PARTY
    ('6d000007-0000-0000-0000-000000000000', cp8, adm1, 'LIKE',   now() - interval '2 hours'),
    ('6d000008-0000-0000-0000-000000000000', cp8, adm1, 'PARTY',  now() - interval '2 hours'),
    -- co2: cp11 に adm2 / cp12 に usr2
    ('6d000011-0000-0000-0000-000000000000', cp11, adm2, 'LIKE',  now() - interval '5 hours'),
    ('6d000012-0000-0000-0000-000000000000', cp11, adm2, 'CLAP',  now() - interval '5 hours'),
    ('6d000013-0000-0000-0000-000000000000', cp12, usr2, 'LIKE',  now() - interval '22 hours')
  on conflict (id) do nothing;

  -- ---- 8-8. コメント（通常 + 1段返信） ----
  --   022 が comment_count を同期。返信は parent 投入後に挿入。
  insert into public.community_post_comments
    (id, post_id, author_user_id, parent_comment_id, body, created_at)
  values
    (cm1, cp1, adm1, null, E'これ知らなかった…！明日から使います。ありがとうございます🙏', now() - interval '3 hours 30 minutes'),
    (cm2, cp1, usr1, null, E'ぜひ！定型文の貼り付けが多い人ほど効きます。', now() - interval '3 hours'),
    (cm4, cp3, adm1, null, E'気になります。今度おすすめのツール教えてください。', now() - interval '23 hours'),
    (cm5, cp11, adm2, null, E'Ctrl + K 便利ですよね。チャンネル名うろ覚えでも飛べるのが助かります。', now() - interval '5 hours 30 minutes')
  on conflict (id) do nothing;

  -- cm3: cm1 への返信（親が存在してから挿入）
  insert into public.community_post_comments
    (id, post_id, author_user_id, parent_comment_id, body, created_at)
  values
    (cm3, cp1, usr1, cm1, E'お役に立てて良かったです！Macだと「Cmd + Shift + V」が近いです。', now() - interval '2 hours 50 minutes')
  on conflict (id) do nothing;

  -- ---- 8-9. 通報（モデレーション確認用） ----
  insert into public.community_post_reports
    (id, post_id, reported_by, reason, detail, status, created_at)
  values
    (rp1, cp6, usr1, 'OTHER',
     E'社外発信の取込ですが、掲載可否の確認が取れているか念のため確認したいです。',
     'PENDING', now() - interval '1 hour')
  on conflict (id) do nothing;

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
  raise notice '  --- 社内SNS（コミュニティ）---';
  raise notice '  community_posts: 11件 (ORIGINAL 7 / QUOTE 1 / REPOST 3)';
  raise notice '    co1: 8件 / co2: 3件 / EXTERNAL_IMPORT 1件 / PRIVATE 1件';
  raise notice '  reactions: 11件 / comments: 5件(返信1含) / tags: 4件+relations 6件';
  raise notice '  weekly_themes(会社別): 1件 / external_drafts: 2件 / reports: 1件';
  raise notice '  ※ like/comment/repost_count は 022 トリガーで自動同期';
  raise notice '  共通パスワード: password123';
  raise notice '===========================================';

end $seed$;

-- ============================================================
-- 002-2. フェーズ2 機能の検証用シード
--
-- 対象: マイページ拡張 / 社員検索 / 案件オススメ / 社内報
--   （いいね・リポスト・週替わりテーマは上のブロックで投入済み）
--
-- 「あなたへのオススメ」は user_profiles.skills + special_skills と
-- 案件に付いた post_tags.name の一致で出る（lib/recommend.ts）。
-- そのため下のスキルとタグは意図的に重ねてある。
--   例) 田中 太郎(usr1): HTML/CSS/Excel
--       → p_off3「コーポレートサイトの軽微な修正」(HTML, CSS)
--       → p_off1「経費精算レシートの整理」(Excel)
--
-- 上のブロックと同様、固定 UUID + upsert で何度流しても同じ状態になる。
-- ============================================================

do $seed2$
declare
  -- ===== 会社（上のブロックと同一） =====
  co1 uuid := '11111111-1111-1111-1111-111111111111'; -- T's agency holdings
  co2 uuid := '22222222-2222-2222-2222-222222222222'; -- ゼロプライド株式会社
  co3 uuid := '33333333-3333-3333-3333-333333333333'; -- 株式会社ULTI-ME
  co4 uuid := '44444444-4444-4444-4444-444444444444'; -- 株式会社T's grace
  co5 uuid := '55555555-5555-5555-5555-555555555555'; -- 株式会社TSHD

  -- ===== ユーザー（上のブロックと同一） =====
  adm1 uuid := 'aa000001-0000-0000-0000-000000000000'; -- 管理者A / co1
  adm2 uuid := 'aa000002-0000-0000-0000-000000000000'; -- 管理者B / co2
  adm3 uuid := 'aa000003-0000-0000-0000-000000000000'; -- 管理者C / co3
  usr1 uuid := 'bb000001-0000-0000-0000-000000000000'; -- 田中 太郎 / co1
  usr2 uuid := 'bb000002-0000-0000-0000-000000000000'; -- 佐藤 花子 / co2
  usr3 uuid := 'bb000003-0000-0000-0000-000000000000'; -- 鈴木 一郎 / co3
  usr4 uuid := 'bb000004-0000-0000-0000-000000000000'; -- 高橋 健太 / co4
  usr5 uuid := 'bb000005-0000-0000-0000-000000000000'; -- 伊藤 美紀 / co5

  -- ===== 公開中の公式案件（オススメの対象） =====
  p_off1 uuid := 'cc000001-0000-0000-0000-000000000000'; -- 経費精算レシートの整理・データ入力
  p_off3 uuid := 'cc000003-0000-0000-0000-000000000000'; -- コーポレートサイトの軽微な修正
  p_off4 uuid := 'cc000004-0000-0000-0000-000000000000'; -- 顧客アンケート結果の集計・レポート作成
  p_off6 uuid := 'cc000006-0000-0000-0000-000000000000'; -- 名刺データ入力・顧客マスタ整備

  -- ===== 部署 =====
  d_co1_admin uuid := '73000001-0000-0000-0000-000000000000';
  d_co1_dev   uuid := '73000002-0000-0000-0000-000000000000';
  d_co2_plan  uuid := '73000003-0000-0000-0000-000000000000';
  d_co3_mkt   uuid := '73000004-0000-0000-0000-000000000000';
  d_co4_desg  uuid := '73000005-0000-0000-0000-000000000000';
  d_co5_hr    uuid := '73000006-0000-0000-0000-000000000000';

  -- ===== 案件タグ（マッチング用） =====
  t_excel  uuid := '74000001-0000-0000-0000-000000000000'; -- Excel
  t_input  uuid := '74000002-0000-0000-0000-000000000000'; -- データ入力
  t_keiri  uuid := '74000003-0000-0000-0000-000000000000'; -- 経理
  t_html   uuid := '74000004-0000-0000-0000-000000000000'; -- HTML
  t_css    uuid := '74000005-0000-0000-0000-000000000000'; -- CSS
  t_web    uuid := '74000006-0000-0000-0000-000000000000'; -- Webサイト運用
  t_ppt    uuid := '74000007-0000-0000-0000-000000000000'; -- PowerPoint
  t_bunseki uuid := '74000008-0000-0000-0000-000000000000'; -- データ分析
  t_jimu   uuid := '74000009-0000-0000-0000-000000000000'; -- 事務
  t_design uuid := '74000010-0000-0000-0000-000000000000'; -- デザイン

  -- ===== 社内報 =====
  nl1 uuid := '75000001-0000-0000-0000-000000000000'; -- 全社 PUBLISHED / ピックアップ
  nl2 uuid := '75000002-0000-0000-0000-000000000000'; -- 全社 PUBLISHED / 社員紹介
  nl3 uuid := '75000003-0000-0000-0000-000000000000'; -- co1 限定 PUBLISHED / 特集
  nl4 uuid := '75000004-0000-0000-0000-000000000000'; -- 全社 PUBLISHED / お知らせ
  nl5 uuid := '75000005-0000-0000-0000-000000000000'; -- 全社 DRAFT（管理画面の下書き確認用）
begin

  -- ============================================================
  -- 1. 部署（社員検索の「部署」表示に使う）
  -- ============================================================
  insert into public.departments (id, company_id, name, sort_order) values
    (d_co1_admin, co1, '管理部',           0),
    (d_co1_dev,   co1, '開発部',           1),
    (d_co2_plan,  co2, '企画部',           0),
    (d_co3_mkt,   co3, 'マーケティング部', 0),
    (d_co4_desg,  co4, '制作部',           0),
    (d_co5_hr,    co5, '人事部',           0)
  on conflict (id) do update
    set company_id = excluded.company_id,
        name       = excluded.name,
        sort_order = excluded.sort_order;

  -- 所属メンバーに部署・役職を割り当てる（社員検索の表示項目）
  update public.company_members set department_id = d_co1_admin, job_title = '管理部 部長'       where user_id = adm1 and company_id = co1;
  update public.company_members set department_id = d_co1_dev,   job_title = 'フロントエンド'    where user_id = usr1 and company_id = co1;
  update public.company_members set department_id = d_co2_plan,  job_title = '企画部 マネージャー' where user_id = adm2 and company_id = co2;
  update public.company_members set department_id = d_co2_plan,  job_title = 'プランナー'        where user_id = usr2 and company_id = co2;
  update public.company_members set department_id = d_co3_mkt,   job_title = 'マーケ部 部長'     where user_id = adm3 and company_id = co3;
  update public.company_members set department_id = d_co3_mkt,   job_title = 'データアナリスト'  where user_id = usr3 and company_id = co3;
  update public.company_members set department_id = d_co4_desg,  job_title = 'デザイナー'        where user_id = usr4 and company_id = co4;
  update public.company_members set department_id = d_co5_hr,    job_title = '人事担当'          where user_id = usr5 and company_id = co5;

  -- ============================================================
  -- 2. マイページ拡張 / 社員検索用プロフィール
  --    skills・special_skills は下の案件タグと意図的に重ねてある（オススメ検証用）
  -- ============================================================
  insert into public.user_profiles
    (user_id, bio, skills, special_skills, hobbies, interest_themes, consult_topics, availability)
  values
    (usr1,
     '受託開発チームでフロントエンドを担当しています。社内ツールの改善も好きです。',
     array['HTML','CSS','JavaScript'], array['Excel'],
     array['キャンプ','サウナ'],
     '業務効率化・社内ツール開発',
     'フロントエンド全般、Excel での自動化', 'AVAILABLE'),
    (usr2,
     '企画部で新規サービスの立ち上げを担当。数字を見るのが得意です。',
     array['Excel','データ入力'], array['PowerPoint'],
     array['読書','カフェ巡り'],
     '新規事業・マーケティング',
     '資料作成、アンケート設計', 'PART_TIME'),
    (usr3,
     'マーケ部でデータ分析をしています。SQL とダッシュボード作りが本業。',
     array['データ分析','Excel'], array['SQL'],
     array['ランニング','写真'],
     'データ活用・可視化',
     'データ分析、ダッシュボード設計', 'AVAILABLE'),
    (usr4,
     '制作部のデザイナー。UI からグラフィックまで幅広くやります。',
     array['デザイン','Figma'], array['イラスト'],
     array['映画鑑賞','料理'],
     'UI/UX・ブランディング',
     'デザインレビュー、Figma の使い方', 'AVAILABLE'),
    (usr5,
     '人事担当。採用と社内制度づくりをしています。気軽に相談してください。',
     array['採用','労務'], array['キャリア相談'],
     array['ヨガ','旅行'],
     '組織づくり・働き方',
     'キャリア相談、社内制度について', 'PART_TIME'),
    (adm1,
     '管理部の部長です。社内の困りごとは一通り拾います。',
     array['マネジメント','経理'], array['Excel'],
     array['ゴルフ'],
     '業務改善・コスト最適化',
     '経費精算まわり、社内フローの相談', 'UNAVAILABLE'),
    (adm2,
     '企画部マネージャー。新規案件の相談歓迎です。',
     array['企画','マーケティング'], array['PowerPoint'],
     array['音楽鑑賞'],
     '新規事業',
     '企画の壁打ち', 'PART_TIME'),
    (adm3,
     'マーケティング部長。数字と現場の橋渡しをしています。',
     array['マーケティング','データ分析'], array['Excel'],
     array['登山'],
     'データドリブンな意思決定',
     'マーケ施策の相談', 'PART_TIME')
  on conflict (user_id) do update
    set bio             = excluded.bio,
        skills          = excluded.skills,
        special_skills  = excluded.special_skills,
        hobbies         = excluded.hobbies,
        interest_themes = excluded.interest_themes,
        consult_topics  = excluded.consult_topics,
        availability    = excluded.availability;

  -- ============================================================
  -- 3. 案件タグ（「あなたへのオススメ」のマッチング元）
  -- ============================================================
  insert into public.post_tags (id, name, slug, is_active) values
    (t_excel,   'Excel',         'excel',          true),
    (t_input,   'データ入力',    'data-input',     true),
    (t_keiri,   '経理',          'keiri',          true),
    (t_html,    'HTML',          'html',           true),
    (t_css,     'CSS',           'css',            true),
    (t_web,     'Webサイト運用', 'web-operation',  true),
    (t_ppt,     'PowerPoint',    'powerpoint',     true),
    (t_bunseki, 'データ分析',    'data-analysis',  true),
    (t_jimu,    '事務',          'jimu',           true),
    (t_design,  'デザイン',      'design',         true)
  on conflict (id) do update
    set name      = excluded.name,
        is_active = excluded.is_active;

  -- 公開中(OPEN)の公式案件にタグを付与する
  insert into public.post_tag_relations (post_id, tag_id) values
    -- 経費精算レシートの整理・データ入力サポート
    (p_off1, t_excel), (p_off1, t_input), (p_off1, t_keiri),
    -- コーポレートサイトの軽微な修正・更新対応（画像差し替えを含むため デザイン も付与）
    (p_off3, t_html), (p_off3, t_css), (p_off3, t_web), (p_off3, t_design),
    -- 顧客アンケート結果の集計・レポート作成
    (p_off4, t_excel), (p_off4, t_ppt), (p_off4, t_bunseki),
    -- 名刺データ入力・顧客マスタ整備サポート
    (p_off6, t_input), (p_off6, t_excel), (p_off6, t_jimu)
  on conflict (post_id, tag_id) do nothing;

  -- ============================================================
  -- 4. 社内報
  --    一般ユーザーには PUBLISHED のみ見える（DRAFT は管理画面専用）
  -- ============================================================
  insert into public.newsletter_issues
    (id, company_id, title, category, summary, body, cover_image_url,
     status, published_at, is_pickup, view_count, created_by)
  values
    (nl1, null,
     '2026年7月号：新体制と今期の重点テーマ',
     'MONTHLY',
     '新しい期のはじまりにあたり、今期のグループ全体の重点テーマを共有します。',
     E'今期のグループ全体の重点テーマは「現場の困りごとを、現場の手で解決する」です。\n\n' ||
     E'■ 今期の3つの柱\n' ||
     E'1. 部署を越えた協力をあたりまえにする\n' ||
     E'2. 社内の知見をためて、使えるようにする\n' ||
     E'3. 小さな改善をすぐ試せる状態をつくる\n\n' ||
     E'このポータルもその一環です。困りごとの相談、案件の募集、日々の気づきの共有に使ってください。',
     'https://picsum.photos/seed/news202607/1200/630',
     'PUBLISHED', now() - interval '2 days', true, 128, adm1),

    (nl2, null,
     '社員インタビュー：入社1年目のリアル',
     'PEOPLE',
     '今年入社したメンバーに、入社前の不安と入社後のギャップを聞きました。',
     E'「入社前は、こんなに早く現場を任されるとは思っていませんでした」\n\n' ||
     E'今回話を聞いたのは、昨年春に入社した3名。入社前の不安、実際に働いてみて感じたギャップ、\n' ||
     E'そして今いちばん面白いと感じている仕事について語ってもらいました。\n\n' ||
     E'■ 「わからないことを聞ける空気」がいちばん助かった\n' ||
     E'配属直後はとにかく用語がわからず、議事録を取るだけで精一杯だったといいます。',
     'https://picsum.photos/seed/interview01/1200/630',
     'PUBLISHED', now() - interval '9 days', false, 74, adm1),

    (nl3, co1,
     '【T''s agency holdings】オフィス移転のお知らせと新レイアウト紹介',
     'FEATURE',
     '来月のオフィス移転にともなう新レイアウトと、フリーアドレスの運用ルールを紹介します。',
     E'来月、本社オフィスを移転します。新オフィスはフリーアドレスを基本とし、\n' ||
     E'集中したいときに使える個室ブースと、雑談しやすいオープンスペースを分けて配置しました。\n\n' ||
     E'■ 席の使い方\n' ||
     E'・固定席はありません。朝、空いている席を自由に使ってください。\n' ||
     E'・Web会議は個室ブースを優先的に使ってください。',
     'https://picsum.photos/seed/office2026/1200/630',
     'PUBLISHED', now() - interval '5 days', false, 43, adm1),

    (nl4, null,
     '年末年始の休業期間について',
     'NOTICE',
     '年末年始の休業期間と、期間中の問い合わせ対応についてお知らせします。',
     E'年末年始の休業期間は下記のとおりです。\n\n' ||
     E'■ 休業期間\n12月29日（月）〜 1月4日（日）\n\n' ||
     E'期間中の緊急連絡は各部署の代表者までお願いします。',
     null,
     'PUBLISHED', now() - interval '20 days', false, 201, adm1),

    (nl5, null,
     '【下書き】8月号：夏のリフレッシュ特集',
     'MONTHLY',
     '夏季休暇の過ごし方アンケートの結果をまとめる予定です。',
     E'（執筆中）夏季休暇の過ごし方について社内アンケートを実施しました。',
     null,
     'DRAFT', null, false, 0, adm1)
  on conflict (id) do update
    set company_id      = excluded.company_id,
        title           = excluded.title,
        category        = excluded.category,
        summary         = excluded.summary,
        body            = excluded.body,
        cover_image_url = excluded.cover_image_url,
        status          = excluded.status,
        published_at    = excluded.published_at,
        is_pickup       = excluded.is_pickup,
        view_count      = excluded.view_count,
        created_by      = excluded.created_by;

  raise notice '===========================================';
  raise notice 'フェーズ2 シードの投入が完了しました。';
  raise notice '  departments: 6件 / company_members に部署・役職を設定';
  raise notice '  user_profiles: 8件（スキル・特技・趣味・興味テーマ・相談可否）';
  raise notice '  post_tags: 10件 / post_tag_relations: 13件（OPEN な公式案件4件に付与）';
  raise notice '  newsletter_issues: 5件（PUBLISHED 4 / DRAFT 1 / ピックアップ 1）';
  raise notice '  ---';
  raise notice '  「あなたへのオススメ」の確認例:';
  raise notice '    user1@example.com → HTML/CSS/Excel なので「コーポレートサイト修正」「経費精算レシート整理」が出る';
  raise notice '    user3@example.com → データ分析/Excel/SQL なので「顧客アンケート集計」が出る';
  raise notice '===========================================';

end $seed2$;
