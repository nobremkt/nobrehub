-- ═══════════════════════════════════════════════════════════════════════
-- HOTFIX: RLS phase 1 usability + legacy policy cleanup
-- ═══════════════════════════════════════════════════════════════════════
-- Why:
-- - Allow sales users to update/claim unassigned conversations/leads.
-- - Remove legacy policies that are now redundant/confusing.

-- ─── Conversations: allow UPDATE on unassigned rows (claim flow) ────────
DROP POLICY IF EXISTS conv_update_scoped ON public.conversations;

CREATE POLICY conv_update_scoped ON public.conversations
  FOR UPDATE
  USING (
    public.user_role() IN ('admin', 'leader')
    OR assigned_to = auth.uid()
    OR assigned_to IS NULL
  )
  WITH CHECK (
    public.user_role() IN ('admin', 'leader')
    OR assigned_to = auth.uid()
    OR assigned_to IS NULL
  );

-- ─── Leads: allow UPDATE on unassigned rows (triage/claim flow) ─────────
DROP POLICY IF EXISTS leads_update_scoped ON public.leads;

CREATE POLICY leads_update_scoped ON public.leads
  FOR UPDATE
  USING (
    public.user_role() IN ('admin', 'leader')
    OR responsible_id = auth.uid()
    OR post_sales_id = auth.uid()
    OR responsible_id IS NULL
  )
  WITH CHECK (
    public.user_role() IN ('admin', 'leader')
    OR responsible_id = auth.uid()
    OR post_sales_id = auth.uid()
    OR responsible_id IS NULL
  );

-- ─── Legacy policy cleanup (replaced by scoped policies) ────────────────
DROP POLICY IF EXISTS conv_admin ON public.conversations;
DROP POLICY IF EXISTS conv_agent_w ON public.conversations;

DROP POLICY IF EXISTS leads_admin ON public.leads;
DROP POLICY IF EXISTS leads_ps_r ON public.leads;
DROP POLICY IF EXISTS leads_ps_w ON public.leads;
DROP POLICY IF EXISTS leads_sales_w ON public.leads;

DROP POLICY IF EXISTS msg_admin ON public.messages;
DROP POLICY IF EXISTS msg_insert ON public.messages;

