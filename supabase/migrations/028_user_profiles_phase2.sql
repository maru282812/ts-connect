-- ============================================================
-- 028_user_profiles_phase2.sql
-- フェーズ2「マイページ拡張 + 社員検索」向け user_profiles 拡張（追加のみ・非破壊）
--
-- 目的:
--   - マイページで登録する 特技 / 趣味 / 興味テーマ / 相談に乗れること を保存する。
--     （スキル=既存 skills / 相談可否=既存 availability を再利用し、乱造しない）
--   - 社員検索で「同じ会社の在籍メンバー同士」が互いのプロフィールを閲覧できるよう
--     select ポリシーを1本追加する（既存の本人 + ADMIN 全件は温存）。
-- 方針:
--   - 001_schema.sql の user_profiles 定義・RLS を非破壊で拡張する。
--   - RLS ヘルパー public.get_user_company_ids() を再利用（021 と同方式）。
--   - GRANT は 001 で authenticated へ SELECT/INSERT/UPDATE 付与済みのため追加不要。
--   - 本ファイル適用後、プロジェクト規約に従い 001_schema.sql へ反映すること。
-- ============================================================

-- ============================================================
-- 1. カラム追加（特技 / 趣味 / 興味テーマ / 相談に乗れること）
-- ============================================================
alter table public.user_profiles
  add column if not exists bio             text,      -- 自己紹介（マイページ既存UI／従来DB未保存）
  add column if not exists special_skills  text[],   -- 特技（例: プレゼン, 中国語）
  add column if not exists hobbies         text[],   -- 趣味（例: キャンプ, サウナ）
  add column if not exists interest_themes text,      -- 興味テーマ（自由記述）
  add column if not exists consult_topics  text;      -- 相談に乗れること（自由記述・任意）

-- ============================================================
-- 2. RLS: 同じ会社の在籍メンバー同士は互いのプロフィールを閲覧可
--    （既存 "select own" / "admin or master select all" は残す。追加のみ）
-- ============================================================
drop policy if exists "user_profiles: select same company" on public.user_profiles;
create policy "user_profiles: select same company" on public.user_profiles
  for select using (
    exists (
      select 1
      from public.company_members cm
      where cm.user_id = user_profiles.user_id
        and cm.status = 'active'
        and cm.company_id = any(public.get_user_company_ids())
    )
  );

-- ============================================================
-- 3. 社員検索ディレクトリ RPC（026/027 と同じ安全方針・SECURITY DEFINER）
--    public.users の RLS は本人 + ADMIN のみのため、同僚の氏名/アバターを
--    直接 join できない。自社の在籍メンバーに限り、検索表示に必要な最小列だけ返す。
--    target を渡すと該当1名のみ（社員プロフィール詳細用）。
-- ============================================================
create or replace function public.people_directory(target uuid default null)
returns table (
  user_id         uuid,
  display_name    text,
  avatar_url      text,
  department_name text,
  job_title       text,
  bio             text,
  skills          text[],
  special_skills  text[],
  hobbies         text[],
  interest_themes text,
  consult_topics  text,
  availability    text
)
language sql
security definer
set search_path = public
as $$
  select
    u.id,
    u.display_name,
    u.avatar_url,
    d.name,
    cm.job_title,
    p.bio,
    p.skills,
    p.special_skills,
    p.hobbies,
    p.interest_themes,
    p.consult_topics,
    p.availability
  from public.company_members cm
  join public.users u on u.id = cm.user_id
  left join public.departments d on d.id = cm.department_id
  left join public.user_profiles p on p.user_id = cm.user_id
  where cm.company_id = any(public.get_user_company_ids())
    and cm.status = 'active'
    and u.deleted_at is null
    and (target is null or u.id = target)
  order by u.display_name;
$$;

grant execute on function public.people_directory(uuid) to authenticated;
grant execute on function public.people_directory(uuid) to service_role;
