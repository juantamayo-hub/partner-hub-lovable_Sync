-- Seed data for Partner Site (Phase 1)

-- Partners
INSERT INTO public.partners (id, name, slug, status)
VALUES
  (gen_random_uuid(), 'Partner Alpha', 'partner-alpha', 'active'),
  (gen_random_uuid(), 'Partner Beta', 'partner-beta', 'active'),
  (gen_random_uuid(), 'Partner Gamma', 'partner-gamma', 'active')
ON CONFLICT (slug) DO NOTHING;

WITH partner_ids AS (
  SELECT id, name, slug FROM public.partners ORDER BY created_at
),
admin_user AS (
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_sso_user, role)
  VALUES (
    gen_random_uuid(),
    'admin@partnersite.dev',
    crypt('Password123!', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Admin Partner Site"}',
    false,
    'authenticated'
  )
  RETURNING id, email
),
partner_users AS (
  SELECT
    gen_random_uuid() AS user_id,
    concat('manager+', p.slug, '@partnersite.dev') AS email,
    concat('Manager ', p.name) AS full_name,
    p.id AS partner_id,
    'partner_manager'::public.app_role AS role
  FROM partner_ids p
  UNION ALL
  SELECT
    gen_random_uuid() AS user_id,
    concat('viewer+', p.slug, '@partnersite.dev') AS email,
    concat('Viewer ', p.name) AS full_name,
    p.id AS partner_id,
    'viewer'::public.app_role AS role
  FROM partner_ids p
),
insert_partner_users AS (
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_sso_user, role)
  SELECT
    user_id,
    email,
    crypt('Password123!', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('full_name', full_name),
    false,
    'authenticated'
  FROM partner_users
  RETURNING id, email
)
INSERT INTO public.profiles (user_id, email, full_name, partner_id, role)
SELECT id, email, 'Admin Partner Site', NULL, 'admin'::public.app_role FROM admin_user
UNION ALL
SELECT pu.user_id, pu.email, pu.full_name, pu.partner_id, pu.role
FROM partner_users pu;

-- Roles
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, role FROM public.profiles
ON CONFLICT DO NOTHING;

-- Leads (200, with intentional duplicates)
WITH partner_ids AS (
  SELECT id, slug FROM public.partners ORDER BY created_at
),
lead_rows AS (
  SELECT
    g AS idx,
    (SELECT id FROM partner_ids OFFSET ((g - 1) % 3) LIMIT 1) AS partner_id,
    (SELECT slug FROM partner_ids OFFSET ((g - 1) % 3) LIMIT 1) AS partner_slug
  FROM generate_series(1, 200) g
),
normalized AS (
  SELECT
    gen_random_uuid() AS id,
    partner_id,
    now() - (idx || ' days')::interval AS created_at,
    CASE WHEN idx % 4 = 0 THEN 'google_sheets' ELSE 'manual' END AS source,
    'Nombre' || idx AS first_name,
    'Apellido' || idx AS last_name,
    CASE
      WHEN idx % 10 = 0 THEN lower('lead' || (idx - 1) || '@' || partner_slug || '.com')
      ELSE lower('lead' || idx || '@' || partner_slug || '.com')
    END AS email_norm,
    CASE
      WHEN idx % 15 = 0 THEN regexp_replace('+34 600 000 ' || lpad((idx - 1)::text, 3, '0'), '\\D', '', 'g')
      ELSE regexp_replace('+34 600 000 ' || lpad(idx::text, 3, '0'), '\\D', '', 'g')
    END AS phone_norm,
    CASE
      WHEN idx % 10 = 0 THEN 'lead' || (idx - 1) || '@' || partner_slug || '.com'
      ELSE 'lead' || idx || '@' || partner_slug || '.com'
    END AS email_raw,
    '+34 600 000 ' || lpad(idx::text, 3, '0') AS phone_raw,
    'Empresa ' || partner_slug AS company,
    CASE
      WHEN idx % 5 = 0 THEN 'contacted'
      WHEN idx % 7 = 0 THEN 'won'
      ELSE 'new'
    END AS status,
    CASE
      WHEN idx % 3 = 0 THEN 'qualified'
      WHEN idx % 4 = 0 THEN 'proposal'
      ELSE 'new'
    END AS stage
  FROM lead_rows
)
INSERT INTO public.leads (
  id, partner_id, created_at, source, first_name, last_name, email_norm, phone_norm,
  email_raw, phone_raw, company, status, stage
)
SELECT
  id, partner_id, created_at, source, first_name, last_name, email_norm, phone_norm,
  email_raw, phone_raw, company, status, stage
FROM normalized;

-- Lead duplicates based on email_norm
WITH email_matches AS (
  SELECT DISTINCT ON (l1.email_norm)
    l1.id AS lead_id,
    l1.partner_id,
    l2.id AS matched_lead_id,
    l2.partner_id AS matched_partner_id
  FROM public.leads l1
  JOIN public.leads l2
    ON l1.email_norm = l2.email_norm
   AND l1.id <> l2.id
  WHERE l1.email_norm IS NOT NULL
)
INSERT INTO public.lead_duplicates (
  lead_id, partner_id, dup_type, matched_lead_id, matched_partner_id, rule
)
SELECT
  lead_id,
  partner_id,
  CASE WHEN partner_id = matched_partner_id THEN 'same_partner'::public.lead_dup_type
       ELSE 'other_partners'::public.lead_dup_type
  END,
  matched_lead_id,
  matched_partner_id,
  'email'
FROM email_matches;

