-- ============================================================
-- WorkMarket シードデータ
-- ============================================================
-- 注意: このシードは開発・テスト用です。
-- Supabase Auth ユーザーを先に作成してから実行してください。
-- Admin ユーザー:  admin@example.com / password123
-- 一般ユーザー:    user1@example.com / password123
--                 user2@example.com / password123
-- ============================================================

-- ============================================================
-- 1. 企業データ
-- ============================================================
insert into public.companies (id, name) values
('11111111-1111-1111-1111-111111111111', 'T''s agency holdings'),
('22222222-2222-2222-2222-222222222222', 'ゼロプライド株式会社'),
('33333333-3333-3333-3333-333333333333', '株式会社ULTI-ME'),
('44444444-4444-4444-4444-444444444444', '株式会社T''s grace'),
('55555555-5555-5555-5555-555555555555', '株式会社TSHD'),
('66666666-6666-6666-6666-666666666666', '株式会社T''s Nexus Solution')
on conflict (id) do nothing;

-- ============================================================
-- 2. 開発用ユーザー（Supabase Auth でサインアップ後に手動で system_role を変更）
-- ============================================================
-- admin ユーザーの system_role を ADMIN に変更する例:
-- update public.users set system_role = 'ADMIN' where email = 'admin@example.com';

-- ============================================================
-- 3. 公式案件（OFFICIAL）投稿サンプル
-- ============================================================
-- ※ created_by_user_id は実際のユーザー UUID に変更してください
-- 開発中は下記のようにプレースホルダーを使用します

do $$
declare
  v_admin_id uuid;
  v_user1_id uuid;
  v_company1 uuid := '11111111-1111-1111-1111-111111111111';
  v_company2 uuid := '22222222-2222-2222-2222-222222222222';
begin
  -- 管理者ユーザーID取得
  select id into v_admin_id from public.users where email = 'admin@example.com' limit 1;
  -- 一般ユーザーID取得
  select id into v_user1_id from public.users where email = 'user1@example.com' limit 1;

  if v_admin_id is null then
    raise notice 'admin@example.com が見つかりません。Supabase Auth で先にユーザーを作成してください。';
    return;
  end if;

  -- 管理者ユーザーのロールを ADMIN に更新
  update public.users set system_role = 'ADMIN' where id = v_admin_id;

  -- company_members に紐付け
  insert into public.company_members (user_id, company_id, membership_role)
  values (v_admin_id, v_company1, 'ADMIN')
  on conflict (user_id, company_id) do nothing;

  if v_user1_id is not null then
    insert into public.company_members (user_id, company_id, membership_role)
    values (v_user1_id, v_company2, 'USER')
    on conflict (user_id, company_id) do nothing;
  end if;

  -- 公式案件: PUBLISHED
  insert into public.posts
    (company_id, created_by_user_id, title, body, post_type, post_status,
     price_text, contact_person_name, deadline_at, published_at)
  values
    (
      v_company1, v_admin_id,
      'Webアプリ開発エンジニア募集（React / TypeScript）',
      '当社の新規 SaaS プロダクト開発に参加いただけるエンジニアを募集しています。
■ 業務内容
- Next.js / TypeScript を使ったフロントエンド開発
- Supabase / PostgreSQL を使ったバックエンド連携
- チームメンバーとのアジャイル開発

■ 求めるスキル
- React / TypeScript の実務経験 2 年以上
- REST API / GraphQL の設計・実装経験
- Git を使ったチーム開発経験

■ 歓迎スキル
- Next.js App Router の経験
- CI/CD パイプラインの構築経験
- デザインシステム / Tailwind CSS の経験

■ 働き方
- リモートワーク可（週 1 回程度の出社あり）
- フルタイム / パートタイム応相談',
      'OFFICIAL', 'PUBLISHED',
      '600,000〜900,000円/月',
      '山田 花子',
      now() + interval '30 days',
      now()
    ),
    (
      v_company1, v_admin_id,
      'UI/UXデザイナー（フリーランス案件）',
      '新規サービスのUI設計・デザインをお任せします。

■ 業務内容
- サービスのワイヤーフレーム作成
- Figma を使ったUIデザイン
- デザインシステムの構築

■ 求めるスキル
- Figma の操作に慣れていること
- ユーザビリティを考慮したデザイン経験
- Web / モバイルアプリのデザイン経験

■ 条件
- 業務委託
- 週 20〜40 時間（応相談）',
      'OFFICIAL', 'PUBLISHED',
      '5,000円/時間',
      '鈴木 一郎',
      now() + interval '14 days',
      now()
    ),
    (
      v_company2, v_admin_id,
      'コピーライター募集（Web広告）',
      'Web 広告のコピーライティング案件です。複数のクライアントのWeb広告を担当していただきます。

■ 業務内容
- LP（ランディングページ）のコピー作成
- SNS 広告テキストの作成
- A/B テスト用バリエーション作成

■ 求めるスキル
- Webマーケティングの知識
- 実績に基づくコピーライティング経験
- 数値（CTR、CVR）を意識した文章作成力',
      'OFFICIAL', 'PUBLISHED',
      '3,000〜5,000円/件',
      '佐藤 美奈',
      now() + interval '60 days',
      now()
    );

  -- 公式案件: CLOSED（過去案件）
  insert into public.posts
    (company_id, created_by_user_id, title, body, post_type, post_status,
     price_text, contact_person_name, deadline_at, published_at, closed_at)
  values
    (
      v_company1, v_admin_id,
      '【終了】バックエンドエンジニア（Go言語）',
      '本案件は応募終了となりました。',
      'OFFICIAL', 'CLOSED',
      '700,000円/月',
      '田中 次郎',
      now() - interval '7 days',
      now() - interval '30 days',
      now() - interval '1 day'
    );

  -- 気軽に投稿（CASUAL）
  if v_user1_id is not null then
    insert into public.posts
      (company_id, created_by_user_id, title, body, post_type, post_status, published_at)
    values
      (
        v_company2, v_user1_id,
        'Webサイトのデザインレビューをお願いできる方を探しています',
        '個人で制作しているポートフォリオサイトについて、デザインのフィードバックをもらいたいと考えています。
プロのデザイナーさんや経験豊富な方にご意見いただければ幸いです。
完全にカジュアルな相談ですので、気軽にコメントください。',
        'CASUAL', 'PUBLISHED', now()
      ),
      (
        v_company2, v_user1_id,
        'Next.js の勉強会を一緒にやりませんか？',
        'Next.js App Router を学び始めたばかりです。
一緒に勉強会やもくもく会をやれる方を探しています。
週 1 回くらいのペースでオンライン開催を考えています。
興味ある方は問い合わせください！',
        'CASUAL', 'PUBLISHED', now()
      );
  end if;
end $$;

-- 完了メッセージ
select 'シードデータの投入が完了しました。' as message;
