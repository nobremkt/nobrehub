-- Allow ALL authenticated users to READ messages from any conversation.
-- This enables the "Todos" tab to show full conversation content.
-- WRITE operations remain restricted (msg_admin for admin/leader, msg_insert for general).
DROP POLICY IF EXISTS msg_by_conv ON public.messages;

CREATE POLICY msg_authenticated_read ON public.messages
  FOR SELECT USING (auth.uid() IS NOT NULL);
