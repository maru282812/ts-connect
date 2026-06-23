-- ============================================================
-- 002_fix_rls_patch.sql
-- 001_schema.sql の RLS ポリシー修正パッチ
--
-- 001_schema.sql の旧版実行時にカラム名不一致等で失敗したポリシーを
-- drop → recreate し、不足ポリシーを追加する。
-- 新規 DB に 001_schema.sql を再実行する場合はこのファイル不要。
-- 既存 DB に対して適用する場合に Supabase SQL Editor で実行する。
-- ============================================================

-- ── application_messages ─────────────────────────────────────
-- 旧: cm.role in ('ADMIN', 'OWNER') → 'OWNER' は存在しないロール

drop policy if exists "application_messages: 当事者SELECT" on public.application_messages;
create policy "application_messages: 当事者SELECT"
  on public.application_messages for select
  using (
    auth.uid() in (
      select a.applicant_user_id from public.applications a where a.id = application_id
    )
    or exists (
      select 1 from public.applications a
      join public.posts p on p.id = a.post_id
      join public.company_members cm on cm.company_id = p.company_id
      where a.id = application_id
        and cm.user_id = auth.uid()
        and cm.role = 'ADMIN'
        and cm.status = 'active'
    )
    or public.get_user_role() = 'MASTER_ADMIN'
  );

drop policy if exists "application_messages: 当事者INSERT" on public.application_messages;
create policy "application_messages: 当事者INSERT"
  on public.application_messages for insert
  with check (
    sender_user_id = auth.uid()
    and (
      auth.uid() in (
        select a.applicant_user_id from public.applications a where a.id = application_id
      )
      or exists (
        select 1 from public.applications a
        join public.posts p on p.id = a.post_id
        join public.company_members cm on cm.company_id = p.company_id
        where a.id = application_id
          and cm.user_id = auth.uid()
          and cm.role = 'ADMIN'
          and cm.status = 'active'
      )
    )
  );

drop policy if exists "application_messages: 既読UPDATE" on public.application_messages;
create policy "application_messages: 既読UPDATE"
  on public.application_messages for update
  using (
    auth.uid() in (
      select a.applicant_user_id from public.applications a where a.id = application_id
    )
    or exists (
      select 1 from public.applications a
      join public.posts p on p.id = a.post_id
      join public.company_members cm on cm.company_id = p.company_id
      where a.id = application_id
        and cm.user_id = auth.uid()
        and cm.role = 'ADMIN'
        and cm.status = 'active'
    )
    or public.get_user_role() = 'MASTER_ADMIN'
  );

-- ── admin_notes ──────────────────────────────────────────────
-- 旧: created_by → 正: admin_id

drop policy if exists "admin_notes: ADMIN以上INSERT" on public.admin_notes;
create policy "admin_notes: ADMIN以上INSERT"
  on public.admin_notes for insert
  with check (
    admin_id = auth.uid()
    and public.get_user_role() in ('ADMIN', 'MASTER_ADMIN')
  );

drop policy if exists "admin_notes: 作成者UPDATE" on public.admin_notes;
create policy "admin_notes: 作成者UPDATE"
  on public.admin_notes for update
  using  (admin_id = auth.uid() or public.get_user_role() = 'MASTER_ADMIN')
  with check (admin_id = auth.uid() or public.get_user_role() = 'MASTER_ADMIN');

-- ── announcements ────────────────────────────────────────────
-- 旧: is_published → 正: is_active

drop policy if exists "announcements: 公開済みSELECT" on public.announcements;
create policy "announcements: 公開済みSELECT"
  on public.announcements for select
  using (
    is_active = true
    or public.get_user_role() in ('ADMIN', 'MASTER_ADMIN')
  );

-- ── moderation_actions ───────────────────────────────────────
-- 旧: actioned_by → 正: moderator_id

drop policy if exists "moderation_actions: ADMIN以上INSERT" on public.moderation_actions;
create policy "moderation_actions: ADMIN以上INSERT"
  on public.moderation_actions for insert
  with check (
    moderator_id = auth.uid()
    and public.get_user_role() in ('ADMIN', 'MASTER_ADMIN')
  );

-- ── contracts ────────────────────────────────────────────────
-- 旧: client_user_id / worker_user_id → 正: contractor_user_id + company_members join

drop policy if exists "contracts: 当事者SELECT" on public.contracts;
create policy "contracts: 当事者SELECT"
  on public.contracts for select
  using (
    contractor_user_id = auth.uid()
    or exists (
      select 1 from public.company_members cm
      where cm.company_id = company_id
        and cm.user_id = auth.uid()
        and cm.status = 'active'
    )
    or public.get_user_role() = 'MASTER_ADMIN'
  );

-- 新規: ADMIN が自社のcontractを作成・更新可能（旧版に存在しなかったポリシー）
drop policy if exists "contracts: ADMIN INSERT" on public.contracts;
create policy "contracts: ADMIN INSERT"
  on public.contracts for insert
  with check (
    public.get_user_role() = 'ADMIN'
    and company_id = any(public.get_user_company_ids())
  );

drop policy if exists "contracts: ADMIN UPDATE" on public.contracts;
create policy "contracts: ADMIN UPDATE"
  on public.contracts for update
  using (
    public.get_user_role() = 'ADMIN'
    and company_id = any(public.get_user_company_ids())
  )
  with check (
    public.get_user_role() = 'ADMIN'
    and company_id = any(public.get_user_company_ids())
  );

-- ── contract_status_histories ────────────────────────────────
-- 旧: client_user_id / worker_user_id → 正: contractor_user_id + company_members join

drop policy if exists "contract_status_histories: 当事者SELECT" on public.contract_status_histories;
create policy "contract_status_histories: 当事者SELECT"
  on public.contract_status_histories for select
  using (
    exists (
      select 1 from public.contracts c
      where c.id = contract_id
        and (c.contractor_user_id = auth.uid()
             or exists (
               select 1 from public.company_members cm
               where cm.company_id = c.company_id
                 and cm.user_id = auth.uid()
                 and cm.status = 'active'
             )
             or public.get_user_role() = 'MASTER_ADMIN')
    )
  );

-- 新規: ADMIN が自社contractのステータス変更を記録可能
drop policy if exists "contract_status_histories: ADMIN INSERT" on public.contract_status_histories;
create policy "contract_status_histories: ADMIN INSERT"
  on public.contract_status_histories for insert
  with check (
    changed_by = auth.uid()
    and public.get_user_role() in ('ADMIN', 'MASTER_ADMIN')
  );

-- ── deliverables ─────────────────────────────────────────────
-- 旧: client_user_id / worker_user_id → 正: contractor_user_id + company_members join

drop policy if exists "deliverables: 当事者SELECT" on public.deliverables;
create policy "deliverables: 当事者SELECT"
  on public.deliverables for select
  using (
    exists (
      select 1 from public.contracts c
      where c.id = contract_id
        and (c.contractor_user_id = auth.uid()
             or exists (
               select 1 from public.company_members cm
               where cm.company_id = c.company_id
                 and cm.user_id = auth.uid()
                 and cm.status = 'active'
             )
             or public.get_user_role() = 'MASTER_ADMIN')
    )
  );

drop policy if exists "deliverables: ワーカーINSERT/UPDATE" on public.deliverables;
drop policy if exists "deliverables: ワーカーINSERT" on public.deliverables;
create policy "deliverables: ワーカーINSERT"
  on public.deliverables for insert
  with check (
    exists (
      select 1 from public.contracts c
      where c.id = contract_id and c.contractor_user_id = auth.uid()
    )
    or public.get_user_role() = 'MASTER_ADMIN'
  );

drop policy if exists "deliverables: 当事者UPDATE" on public.deliverables;
create policy "deliverables: 当事者UPDATE"
  on public.deliverables for update
  using (
    exists (
      select 1 from public.contracts c
      where c.id = contract_id
        and (c.contractor_user_id = auth.uid()
             or exists (
               select 1 from public.company_members cm
               where cm.company_id = c.company_id
                 and cm.user_id = auth.uid()
                 and cm.status = 'active'
             ))
    )
    or public.get_user_role() = 'MASTER_ADMIN'
  );

-- ── deliverable_files ────────────────────────────────────────
-- 旧: client_user_id / worker_user_id / uploaded_by → 正: contractor_user_id + submitted_by

drop policy if exists "deliverable_files: 当事者SELECT" on public.deliverable_files;
create policy "deliverable_files: 当事者SELECT"
  on public.deliverable_files for select
  using (
    exists (
      select 1 from public.deliverables d
      join public.contracts c on c.id = d.contract_id
      where d.id = deliverable_id
        and (c.contractor_user_id = auth.uid()
             or exists (
               select 1 from public.company_members cm
               where cm.company_id = c.company_id
                 and cm.user_id = auth.uid()
                 and cm.status = 'active'
             )
             or public.get_user_role() = 'MASTER_ADMIN')
    )
  );

drop policy if exists "deliverable_files: アップロードINSERT" on public.deliverable_files;
create policy "deliverable_files: アップロードINSERT"
  on public.deliverable_files for insert
  with check (
    exists (
      select 1 from public.deliverables d
      where d.id = deliverable_id and d.submitted_by = auth.uid()
    )
    or public.get_user_role() = 'MASTER_ADMIN'
  );

drop policy if exists "deliverable_files: アップロード者DELETE" on public.deliverable_files;
create policy "deliverable_files: アップロード者DELETE"
  on public.deliverable_files for delete
  using (
    exists (
      select 1 from public.deliverables d
      where d.id = deliverable_id and d.submitted_by = auth.uid()
    )
    or public.get_user_role() = 'MASTER_ADMIN'
  );

-- ── disputes ─────────────────────────────────────────────────
-- 旧: initiated_by → 正: raised_by / client_user_id→contractor_user_id

drop policy if exists "disputes: 当事者SELECT" on public.disputes;
create policy "disputes: 当事者SELECT"
  on public.disputes for select
  using (
    raised_by = auth.uid()
    or exists (
      select 1 from public.contracts c
      where c.id = contract_id
        and (c.contractor_user_id = auth.uid()
             or exists (
               select 1 from public.company_members cm
               where cm.company_id = c.company_id
                 and cm.user_id = auth.uid()
                 and cm.status = 'active'
             ))
    )
    or public.get_user_role() in ('ADMIN', 'MASTER_ADMIN')
  );

drop policy if exists "disputes: 当事者INSERT" on public.disputes;
create policy "disputes: 当事者INSERT"
  on public.disputes for insert
  with check (
    raised_by = auth.uid()
    and exists (
      select 1 from public.contracts c
      where c.id = contract_id
        and (c.contractor_user_id = auth.uid()
             or exists (
               select 1 from public.company_members cm
               where cm.company_id = c.company_id
                 and cm.user_id = auth.uid()
                 and cm.status = 'active'
             ))
    )
  );

-- ── dispute_messages ─────────────────────────────────────────
-- 旧: d.initiated_by / c.client_user_id / c.worker_user_id / sender_user_id
-- 正: d.raised_by / c.contractor_user_id + company_members / sender_id

drop policy if exists "dispute_messages: 当事者SELECT" on public.dispute_messages;
create policy "dispute_messages: 当事者SELECT"
  on public.dispute_messages for select
  using (
    exists (
      select 1 from public.disputes d
      join public.contracts c on c.id = d.contract_id
      where d.id = dispute_id
        and (d.raised_by = auth.uid()
             or c.contractor_user_id = auth.uid()
             or exists (
               select 1 from public.company_members cm
               where cm.company_id = c.company_id
                 and cm.user_id = auth.uid()
                 and cm.status = 'active'
             )
             or public.get_user_role() in ('ADMIN', 'MASTER_ADMIN'))
    )
  );

drop policy if exists "dispute_messages: 当事者INSERT" on public.dispute_messages;
create policy "dispute_messages: 当事者INSERT"
  on public.dispute_messages for insert
  with check (
    sender_id = auth.uid()
    and (
      not is_internal
      or public.get_user_role() in ('ADMIN', 'MASTER_ADMIN')
    )
  );

-- ── reviews ──────────────────────────────────────────────────
-- 旧: reviewer_user_id → 正: reviewer_id

drop policy if exists "reviews: 本人INSERT" on public.reviews;
create policy "reviews: 本人INSERT"
  on public.reviews for insert
  with check (reviewer_id = auth.uid());

-- ── review_replies ───────────────────────────────────────────
-- 旧: replied_by → 正: author_id / ポリシー名も変更

drop policy if exists "review_replies: 本人INSERT/UPDATE" on public.review_replies;
drop policy if exists "review_replies: 本人INSERT" on public.review_replies;
create policy "review_replies: 本人INSERT"
  on public.review_replies for insert
  with check (author_id = auth.uid());

drop policy if exists "review_replies: 本人UPDATE" on public.review_replies;
create policy "review_replies: 本人UPDATE"
  on public.review_replies for update
  using  (author_id = auth.uid())
  with check (author_id = auth.uid());

-- ── point_expirations ────────────────────────────────────────
-- 旧: user_id = auth.uid() (point_expirations に user_id カラムは存在しない)
-- 正: wallets テーブルを経由

drop policy if exists "point_expirations: 本人SELECT" on public.point_expirations;
create policy "point_expirations: 本人SELECT"
  on public.point_expirations for select
  using (
    exists (
      select 1 from public.wallets w
      where w.id = wallet_id and w.user_id = auth.uid()
    )
    or public.get_user_role() = 'MASTER_ADMIN'
  );

-- ── invoices ─────────────────────────────────────────────────
-- 旧: issued_to_user_id → 正: user_id

drop policy if exists "invoices: 本人SELECT" on public.invoices;
create policy "invoices: 本人SELECT"
  on public.invoices for select
  using (
    user_id = auth.uid()
    or public.get_user_role() in ('ADMIN', 'MASTER_ADMIN')
  );
