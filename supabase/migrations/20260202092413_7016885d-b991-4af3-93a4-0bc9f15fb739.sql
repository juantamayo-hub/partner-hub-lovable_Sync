-- Create app_role enum for RBAC
CREATE TYPE public.app_role AS ENUM ('admin', 'partner_manager', 'viewer');

-- Create partners table (multi-tenant core)
CREATE TABLE public.partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create profiles table (linked to auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    partner_id UUID REFERENCES public.partners(id) ON DELETE SET NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create user_roles table (RBAC - separate from profiles)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    UNIQUE (user_id, role)
);

-- Create leads table
CREATE TABLE public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID REFERENCES public.partners(id) ON DELETE CASCADE NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    full_name TEXT,
    source TEXT,
    status TEXT DEFAULT 'new',
    converted BOOLEAN DEFAULT false,
    external_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create duplicates table
CREATE TABLE public.duplicates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
    duplicate_lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
    duplicate_type TEXT NOT NULL CHECK (duplicate_type IN ('same_partner', 'cross_partner')),
    match_field TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create integrations table
CREATE TABLE public.integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID REFERENCES public.partners(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL,
    name TEXT NOT NULL,
    config JSONB DEFAULT '{}'::jsonb,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'inactive',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create column_mappings table
CREATE TABLE public.column_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_id UUID REFERENCES public.integrations(id) ON DELETE CASCADE NOT NULL,
    source_column TEXT NOT NULL,
    target_column TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create audit_events table
CREATE TABLE public.audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    partner_id UUID REFERENCES public.partners(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.duplicates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.column_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
        AND role = _role
    )
$$;

-- Security definer function to get user's partner_id
CREATE OR REPLACE FUNCTION public.get_user_partner_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT partner_id
    FROM public.profiles
    WHERE user_id = _user_id
$$;

-- RLS Policies for partners
CREATE POLICY "Admins can view all partners"
ON public.partners FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own partner"
ON public.partners FOR SELECT
TO authenticated
USING (id = public.get_user_partner_id(auth.uid()));

CREATE POLICY "Admins can manage partners"
ON public.partners FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for leads
CREATE POLICY "Users can view leads from their partner"
ON public.leads FOR SELECT
TO authenticated
USING (
    partner_id = public.get_user_partner_id(auth.uid())
    OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Partner managers can manage their partner's leads"
ON public.leads FOR ALL
TO authenticated
USING (
    (partner_id = public.get_user_partner_id(auth.uid()) AND public.has_role(auth.uid(), 'partner_manager'))
    OR public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
    (partner_id = public.get_user_partner_id(auth.uid()) AND public.has_role(auth.uid(), 'partner_manager'))
    OR public.has_role(auth.uid(), 'admin')
);

-- RLS Policies for duplicates
CREATE POLICY "Users can view duplicates from their partner's leads"
ON public.duplicates FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.leads 
        WHERE leads.id = original_lead_id 
        AND (leads.partner_id = public.get_user_partner_id(auth.uid()) OR public.has_role(auth.uid(), 'admin'))
    )
);

-- RLS Policies for integrations
CREATE POLICY "Users can view their partner's integrations"
ON public.integrations FOR SELECT
TO authenticated
USING (
    partner_id = public.get_user_partner_id(auth.uid())
    OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Partner managers can manage their partner's integrations"
ON public.integrations FOR ALL
TO authenticated
USING (
    (partner_id = public.get_user_partner_id(auth.uid()) AND public.has_role(auth.uid(), 'partner_manager'))
    OR public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
    (partner_id = public.get_user_partner_id(auth.uid()) AND public.has_role(auth.uid(), 'partner_manager'))
    OR public.has_role(auth.uid(), 'admin')
);

-- RLS Policies for column_mappings
CREATE POLICY "Users can view mappings for their partner's integrations"
ON public.column_mappings FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.integrations 
        WHERE integrations.id = integration_id 
        AND (integrations.partner_id = public.get_user_partner_id(auth.uid()) OR public.has_role(auth.uid(), 'admin'))
    )
);

-- RLS Policies for audit_events
CREATE POLICY "Users can view their partner's audit events"
ON public.audit_events FOR SELECT
TO authenticated
USING (
    partner_id = public.get_user_partner_id(auth.uid())
    OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "System can insert audit events"
ON public.audit_events FOR INSERT
TO authenticated
WITH CHECK (true);

-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add updated_at triggers
CREATE TRIGGER update_partners_updated_at BEFORE UPDATE ON public.partners FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_integrations_updated_at BEFORE UPDATE ON public.integrations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, full_name)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
    
    -- Default role is viewer
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'viewer');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to auto-create profile and role on signup
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();