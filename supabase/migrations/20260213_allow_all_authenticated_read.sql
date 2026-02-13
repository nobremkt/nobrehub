-- Allow ALL authenticated users to SELECT all conversations.
-- Tab filtering (Todos/Meus/Novos) is done client-side.
-- Drop the old restrictive policies that are now redundant.
DROP POLICY IF EXISTS conv_agent_r ON public.conversations;
DROP POLICY IF EXISTS conv_unassigned_r ON public.conversations;

CREATE POLICY conv_authenticated_read ON public.conversations
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Same for leads — all authenticated users should see all leads
DROP POLICY IF EXISTS leads_unassigned_r ON public.leads;
DROP POLICY IF EXISTS leads_sales_r ON public.leads;

CREATE POLICY leads_authenticated_read ON public.leads
  FOR SELECT USING (auth.uid() IS NOT NULL);
