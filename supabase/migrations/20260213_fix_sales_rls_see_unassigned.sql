-- ═══════════════════════════════════════════════════════════════════════
-- FIX: Allow sales users to see unassigned conversations and leads
-- ═══════════════════════════════════════════════════════════════════════
-- Problem: Sales users (Vendedor, Pós-Vendedor, Produtor) see 0 data
-- because all conversations have assigned_to = null and leads have
-- responsible_id = null. Current policies only match auth.uid().
-- Fix: Add policies for unassigned records (WHERE column IS NULL).
-- ═══════════════════════════════════════════════════════════════════════

-- ─── CONVERSATIONS ──────────────────────────────────────────────────────

-- Allow sales users to READ unassigned conversations (for "Novos" tab)
CREATE POLICY conv_unassigned_r ON public.conversations
  FOR SELECT USING (assigned_to IS NULL);

-- ─── LEADS ──────────────────────────────────────────────────────────────

-- Allow sales users to READ unassigned leads
CREATE POLICY leads_unassigned_r ON public.leads
  FOR SELECT USING (responsible_id IS NULL);
