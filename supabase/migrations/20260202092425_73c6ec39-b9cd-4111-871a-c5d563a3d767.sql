-- Fix the permissive audit_events INSERT policy
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "System can insert audit events" ON public.audit_events;

-- Create a more restrictive policy - users can only insert events for themselves or their partner
CREATE POLICY "Users can insert their own audit events"
ON public.audit_events FOR INSERT
TO authenticated
WITH CHECK (
    user_id = auth.uid() 
    AND (
        partner_id IS NULL 
        OR partner_id = public.get_user_partner_id(auth.uid())
        OR public.has_role(auth.uid(), 'admin')
    )
);