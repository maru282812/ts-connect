-- ============================================================
-- 022_community_counters.sql
-- 社内SNS カウンタ整合トリガー（追加のみ・非破壊）
--
-- 020 で作成した community_posts.like_count / comment_count / repost_count を
-- 子テーブルの増減に合わせて自動同期する。アプリ層の二重計上・取りこぼしを防ぐ。
-- 集計のため SECURITY DEFINER + search_path 固定（RLS をバイパスして正確に数える）。
--   - 本ファイル適用後、プロジェクト規約に従い 001_schema.sql へ反映すること。
-- ============================================================

-- ── like_count: community_post_reactions の reaction='LIKE' を数える ──
create or replace function public.community_sync_like_count()
returns trigger as $$
begin
  update public.community_posts p
     set like_count = (
       select count(*) from public.community_post_reactions r
        where r.post_id = p.id and r.reaction = 'LIKE'
     )
   where p.id = coalesce(new.post_id, old.post_id);
  return null;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists trg_community_like_count on public.community_post_reactions;
create trigger trg_community_like_count
  after insert or delete on public.community_post_reactions
  for each row execute function public.community_sync_like_count();

-- ── comment_count: 非削除コメント件数 ──
create or replace function public.community_sync_comment_count()
returns trigger as $$
begin
  update public.community_posts p
     set comment_count = (
       select count(*) from public.community_post_comments c
        where c.post_id = p.id and c.deleted_at is null
     )
   where p.id = coalesce(new.post_id, old.post_id);
  return null;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists trg_community_comment_count on public.community_post_comments;
create trigger trg_community_comment_count
  after insert or update or delete on public.community_post_comments
  for each row execute function public.community_sync_comment_count();

-- ── repost_count: repost_of_id 先（元投稿）の被リポスト数 ──
-- community_posts 自身への自己参照トリガー。更新先は repost_of_id が NULL の元投稿のため
-- 再帰しても内側 if が false になり無限ループしない。
create or replace function public.community_sync_repost_count()
returns trigger as $$
declare
  target uuid := coalesce(new.repost_of_id, old.repost_of_id);
begin
  if target is not null then
    update public.community_posts p
       set repost_count = (
         select count(*) from public.community_posts r
          where r.repost_of_id = p.id and r.deleted_at is null
       )
     where p.id = target;
  end if;
  return null;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists trg_community_repost_count on public.community_posts;
create trigger trg_community_repost_count
  after insert or update of repost_of_id, deleted_at or delete on public.community_posts
  for each row execute function public.community_sync_repost_count();
