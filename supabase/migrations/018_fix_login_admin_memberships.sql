-- ============================================================
-- Migration 018: Fix loginable ADMIN memberships for seeded data
-- ============================================================
-- 017 tightened ADMIN visibility to active company memberships.
-- Some auth users that can actually log in were attached to companies that have
-- no seeded posts, or had no active membership at all. This keeps RLS strict and
-- fixes the data so those ADMIN accounts can see the intended company data.

WITH admin_company_map(email, company_id) AS (
  VALUES
    ('admin@example.com',       '11111111-1111-1111-1111-111111111111'::uuid),
    ('admin.alpha@example.com', '11111111-1111-1111-1111-111111111111'::uuid),
    ('admin.beta@example.com',  '22222222-2222-2222-2222-222222222222'::uuid),
    ('t87089803@gmail.com',     '11111111-1111-1111-1111-111111111111'::uuid)
)
UPDATE public.company_members cm
SET status = 'inactive',
    updated_at = now()
FROM admin_company_map m
JOIN public.users u ON u.email = m.email
WHERE cm.user_id = u.id
  AND cm.status = 'active'
  AND cm.company_id <> m.company_id;

WITH admin_company_map(email, company_id) AS (
  VALUES
    ('admin@example.com',       '11111111-1111-1111-1111-111111111111'::uuid),
    ('admin.alpha@example.com', '11111111-1111-1111-1111-111111111111'::uuid),
    ('admin.beta@example.com',  '22222222-2222-2222-2222-222222222222'::uuid),
    ('t87089803@gmail.com',     '11111111-1111-1111-1111-111111111111'::uuid)
)
INSERT INTO public.company_members (user_id, company_id, role, status)
SELECT
  u.id,
  m.company_id,
  'ADMIN',
  'active'
FROM admin_company_map m
JOIN public.users u ON u.email = m.email
JOIN public.companies c ON c.id = m.company_id
WHERE u.system_role = 'ADMIN'
ON CONFLICT (user_id, company_id) DO UPDATE
  SET role = 'ADMIN',
      status = 'active',
      updated_at = now();

-- Keep metadata company_id aligned for the loginable seeded admin accounts.
-- App authorization does not depend on this, but it prevents future manual
-- debugging from being misled by stale auth metadata.
WITH admin_company_map(email, company_id) AS (
  VALUES
    ('admin@example.com',       '11111111-1111-1111-1111-111111111111'::uuid),
    ('admin.alpha@example.com', '11111111-1111-1111-1111-111111111111'::uuid),
    ('admin.beta@example.com',  '22222222-2222-2222-2222-222222222222'::uuid),
    ('t87089803@gmail.com',     '11111111-1111-1111-1111-111111111111'::uuid)
)
UPDATE auth.users au
SET raw_user_meta_data =
  COALESCE(au.raw_user_meta_data, '{}'::jsonb)
  || jsonb_build_object('company_id', m.company_id::text, 'system_role', 'ADMIN')
FROM admin_company_map m
WHERE au.email = m.email;
