-- ═══════════════════════════════════════════════════════════════════════
-- PHASE 1: RLS hardening for Inbox core tables (conversations/leads/messages)
-- ═══════════════════════════════════════════════════════════════════════
-- Goals:
-- 1) Remove broad "all authenticated" access on sensitive inbox tables.
-- 2) Keep operation continuity for admin/leader and frontline teams.
-- 3) Scope reads by ownership/unassigned queues for sales workflows.
--
-- Role model uses public.user_role():
-- - admin, leader => full operational access
-- - sales         => restricted to owned/unassigned records
-- ═══════════════════════════════════════════════════════════════════════

-- ─── Optional performance indexes for RLS predicates ───────────────────
CREATE INDEX IF NOT EXISTS idx_conversations_assigned_to_status
  ON public.conversations (assigned_to, status);

CREATE INDEX IF NOT EXISTS idx_leads_responsible_postsales
  ON public.leads (responsible_id, post_sales_id);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id
  ON public.messages (conversation_id);


-- ─── Drop permissive/legacy policies (if present) ──────────────────────

-- Conversations
DROP POLICY IF EXISTS "conversations_all_authenticated" ON public.conversations;
DROP POLICY IF EXISTS conv_authenticated_read ON public.conversations;
DROP POLICY IF EXISTS conv_unassigned_r ON public.conversations;

-- Leads
DROP POLICY IF EXISTS "leads_all_authenticated" ON public.leads;
DROP POLICY IF EXISTS leads_authenticated_read ON public.leads;
DROP POLICY IF EXISTS leads_unassigned_r ON public.leads;
DROP POLICY IF EXISTS leads_sales_r ON public.leads;

-- Messages
DROP POLICY IF EXISTS "messages_all_authenticated" ON public.messages;
DROP POLICY IF EXISTS msg_authenticated_read ON public.messages;
DROP POLICY IF EXISTS msg_by_conv ON public.messages;


-- ─── CONVERSATIONS ──────────────────────────────────────────────────────

-- SELECT
CREATE POLICY conv_select_scoped ON public.conversations
  FOR SELECT
  USING (
    public.user_role() IN ('admin', 'leader')
    OR assigned_to = auth.uid()
    OR assigned_to IS NULL
  );

-- INSERT
CREATE POLICY conv_insert_authenticated ON public.conversations
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
  );

-- UPDATE
CREATE POLICY conv_update_scoped ON public.conversations
  FOR UPDATE
  USING (
    public.user_role() IN ('admin', 'leader')
    OR assigned_to = auth.uid()
  )
  WITH CHECK (
    public.user_role() IN ('admin', 'leader')
    OR assigned_to = auth.uid()
    OR assigned_to IS NULL
  );

-- DELETE
CREATE POLICY conv_delete_admin_leader ON public.conversations
  FOR DELETE
  USING (
    public.user_role() IN ('admin', 'leader')
  );


-- ─── LEADS ──────────────────────────────────────────────────────────────

-- SELECT
CREATE POLICY leads_select_scoped ON public.leads
  FOR SELECT
  USING (
    public.user_role() IN ('admin', 'leader')
    OR responsible_id = auth.uid()
    OR post_sales_id = auth.uid()
    OR responsible_id IS NULL
  );

-- INSERT
CREATE POLICY leads_insert_authenticated ON public.leads
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
  );

-- UPDATE
CREATE POLICY leads_update_scoped ON public.leads
  FOR UPDATE
  USING (
    public.user_role() IN ('admin', 'leader')
    OR responsible_id = auth.uid()
    OR post_sales_id = auth.uid()
  )
  WITH CHECK (
    public.user_role() IN ('admin', 'leader')
    OR responsible_id = auth.uid()
    OR post_sales_id = auth.uid()
    OR responsible_id IS NULL
  );

-- DELETE
CREATE POLICY leads_delete_admin_leader ON public.leads
  FOR DELETE
  USING (
    public.user_role() IN ('admin', 'leader')
  );


-- ─── MESSAGES ───────────────────────────────────────────────────────────

-- SELECT
CREATE POLICY msg_select_scoped ON public.messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND (
          public.user_role() IN ('admin', 'leader')
          OR c.assigned_to = auth.uid()
          OR c.assigned_to IS NULL
        )
    )
  );

-- INSERT
CREATE POLICY msg_insert_scoped ON public.messages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND (
          public.user_role() IN ('admin', 'leader')
          OR c.assigned_to = auth.uid()
          OR c.assigned_to IS NULL
        )
    )
    AND (
      sender_id IS NULL
      OR sender_id = auth.uid()
      OR public.user_role() IN ('admin', 'leader')
    )
  );

-- UPDATE
CREATE POLICY msg_update_scoped ON public.messages
  FOR UPDATE
  USING (
    public.user_role() IN ('admin', 'leader')
    OR sender_id = auth.uid()
  )
  WITH CHECK (
    public.user_role() IN ('admin', 'leader')
    OR sender_id = auth.uid()
  );

-- DELETE
CREATE POLICY msg_delete_admin_leader ON public.messages
  FOR DELETE
  USING (
    public.user_role() IN ('admin', 'leader')
  );

