-- Phase 1 schema extensions for Partner Site

-- Enums
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lead_dup_type') THEN
    CREATE TYPE public.lead_dup_type AS ENUM ('same_partner', 'other_partners');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'integration_type') THEN
    CREATE TYPE public.integration_type AS ENUM ('google_sheets');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'integration_status') THEN
    CREATE TYPE public.integration_status AS ENUM ('active', 'inactive', 'error');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sync_status') THEN
    CREATE TYPE public.sync_status AS ENUM ('running', 'success', 'error');
  END IF;
END $$;

-- partners: add status if missing
ALTER TABLE public.partners
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- profiles: add email and role
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS role public.app_role DEFAULT 'viewer';

-- leads: add normalized/raw fields and extra metadata
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS email_raw TEXT,
  ADD COLUMN IF NOT EXISTS phone_raw TEXT,
  ADD COLUMN IF NOT EXISTS email_norm TEXT,
  ADD COLUMN IF NOT EXISTS phone_norm TEXT,
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT,
  ADD COLUMN IF NOT EXISTS company TEXT,
  ADD COLUMN IF NOT EXISTS stage TEXT,
  ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES auth.users(id);

-- lead_events
CREATE TABLE IF NOT EXISTS public.lead_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
  partner_id UUID REFERENCES public.partners(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL,
  event_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- lead_duplicates
CREATE TABLE IF NOT EXISTS public.lead_duplicates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
  partner_id UUID REFERENCES public.partners(id) ON DELETE CASCADE NOT NULL,
  dup_type public.lead_dup_type NOT NULL,
  matched_lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
  matched_partner_id UUID REFERENCES public.partners(id) ON DELETE CASCADE NOT NULL,
  rule TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- metrics_daily
CREATE TABLE IF NOT EXISTS public.metrics_daily (
  partner_id UUID REFERENCES public.partners(id) ON DELETE CASCADE NOT NULL,
  day DATE NOT NULL,
  leads_created INTEGER DEFAULT 0,
  leads_contacted INTEGER DEFAULT 0,
  leads_won INTEGER DEFAULT 0,
  duplicates_same_partner INTEGER DEFAULT 0,
  duplicates_other_partners INTEGER DEFAULT 0,
  PRIMARY KEY (partner_id, day)
);

-- integrations: adjust types
ALTER TABLE public.integrations
  ADD COLUMN IF NOT EXISTS status_new public.integration_status,
  ADD COLUMN IF NOT EXISTS type_new public.integration_type;

UPDATE public.integrations
SET status_new = CASE
  WHEN status = 'active' THEN 'active'::public.integration_status
  WHEN status = 'inactive' THEN 'inactive'::public.integration_status
  WHEN status = 'error' THEN 'error'::public.integration_status
  ELSE 'inactive'::public.integration_status
END,
type_new = CASE
  WHEN type = 'google_sheets' THEN 'google_sheets'::public.integration_type
  ELSE 'google_sheets'::public.integration_type
END
WHERE status_new IS NULL OR type_new IS NULL;

ALTER TABLE public.integrations
  DROP COLUMN IF EXISTS status,
  DROP COLUMN IF EXISTS type;

ALTER TABLE public.integrations
  RENAME COLUMN status_new TO status;

ALTER TABLE public.integrations
  RENAME COLUMN type_new TO type;

-- sync_runs
CREATE TABLE IF NOT EXISTS public.sync_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID REFERENCES public.integrations(id) ON DELETE CASCADE NOT NULL,
  partner_id UUID REFERENCES public.partners(id) ON DELETE CASCADE NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  finished_at TIMESTAMP WITH TIME ZONE,
  status public.sync_status NOT NULL DEFAULT 'running',
  inserted_count INTEGER DEFAULT 0,
  updated_count INTEGER DEFAULT 0,
  errors JSONB DEFAULT '{}'::jsonb
);

-- audit_events: align naming
ALTER TABLE public.audit_events
  ADD COLUMN IF NOT EXISTS actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS action TEXT;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS leads_email_norm_idx ON public.leads (email_norm);
CREATE INDEX IF NOT EXISTS leads_phone_norm_idx ON public.leads (phone_norm);
CREATE INDEX IF NOT EXISTS leads_partner_created_idx ON public.leads (partner_id, created_at);
CREATE INDEX IF NOT EXISTS lead_duplicates_partner_created_idx ON public.lead_duplicates (partner_id, created_at);

-- Enable RLS on new tables
ALTER TABLE public.lead_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_duplicates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metrics_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_runs ENABLE ROW LEVEL SECURITY;

-- RLS policies: lead_events
CREATE POLICY "Users can view their partner lead events"
ON public.lead_events FOR SELECT
TO authenticated
USING (
  partner_id = public.get_user_partner_id(auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Partner managers can manage lead events"
ON public.lead_events FOR ALL
TO authenticated
USING (
  (partner_id = public.get_user_partner_id(auth.uid()) AND public.has_role(auth.uid(), 'partner_manager'))
  OR public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  (partner_id = public.get_user_partner_id(auth.uid()) AND public.has_role(auth.uid(), 'partner_manager'))
  OR public.has_role(auth.uid(), 'admin')
);

-- RLS policies: lead_duplicates
CREATE POLICY "Users can view lead duplicates by partner"
ON public.lead_duplicates FOR SELECT
TO authenticated
USING (
  partner_id = public.get_user_partner_id(auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Partner managers can manage lead duplicates"
ON public.lead_duplicates FOR ALL
TO authenticated
USING (
  (partner_id = public.get_user_partner_id(auth.uid()) AND public.has_role(auth.uid(), 'partner_manager'))
  OR public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  (partner_id = public.get_user_partner_id(auth.uid()) AND public.has_role(auth.uid(), 'partner_manager'))
  OR public.has_role(auth.uid(), 'admin')
);

-- RLS policies: metrics_daily
CREATE POLICY "Users can view metrics by partner"
ON public.metrics_daily FOR SELECT
TO authenticated
USING (
  partner_id = public.get_user_partner_id(auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Partner managers can manage metrics"
ON public.metrics_daily FOR ALL
TO authenticated
USING (
  (partner_id = public.get_user_partner_id(auth.uid()) AND public.has_role(auth.uid(), 'partner_manager'))
  OR public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  (partner_id = public.get_user_partner_id(auth.uid()) AND public.has_role(auth.uid(), 'partner_manager'))
  OR public.has_role(auth.uid(), 'admin')
);

-- RLS policies: sync_runs
CREATE POLICY "Users can view sync runs by partner"
ON public.sync_runs FOR SELECT
TO authenticated
USING (
  partner_id = public.get_user_partner_id(auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Partner managers can manage sync runs"
ON public.sync_runs FOR ALL
TO authenticated
USING (
  (partner_id = public.get_user_partner_id(auth.uid()) AND public.has_role(auth.uid(), 'partner_manager'))
  OR public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  (partner_id = public.get_user_partner_id(auth.uid()) AND public.has_role(auth.uid(), 'partner_manager'))
  OR public.has_role(auth.uid(), 'admin')
);

-- Ensure new profiles capture email on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.email);

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'viewer')
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

