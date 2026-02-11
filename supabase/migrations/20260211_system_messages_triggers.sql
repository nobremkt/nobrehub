-- ═══════════════════════════════════════════════════════════════════════════════
-- SYSTEM MESSAGES VIA POSTGRES TRIGGERS
-- Auto-generates system messages in chat when conversation state changes
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. Add new columns to conversations
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS deal_status text DEFAULT 'open';
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS loss_reason text;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS updated_by text;

-- 2. Create trigger function
CREATE OR REPLACE FUNCTION fn_conversation_system_message()
RETURNS TRIGGER AS $$
DECLARE
    system_content text;
    actor_name text;
BEGIN
    actor_name := COALESCE(NEW.updated_by, 'Sistema');

    -- Assigned to changed (new assignment)
    IF OLD.assigned_to IS DISTINCT FROM NEW.assigned_to THEN
        IF OLD.assigned_to IS NULL AND NEW.assigned_to IS NOT NULL THEN
            system_content := actor_name || ' assumiu o atendimento';
        ELSIF NEW.assigned_to IS NULL THEN
            system_content := 'Atendimento desatribuído';
        ELSE
            system_content := 'Atendimento transferido para ' || actor_name;
        END IF;

        INSERT INTO public.messages (conversation_id, content, type, sender_type, sender_id, sender_name, status, created_at)
        VALUES (NEW.id, system_content, 'system', 'system', NULL, 'Sistema', 'sent', NOW());
    END IF;

    -- Status changed (open/closed)
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        IF NEW.status = 'closed' THEN
            system_content := 'Conversa encerrada';
        ELSIF NEW.status = 'open' AND OLD.status = 'closed' THEN
            system_content := 'Conversa reaberta';
        END IF;

        IF system_content IS NOT NULL THEN
            INSERT INTO public.messages (conversation_id, content, type, sender_type, sender_id, sender_name, status, created_at)
            VALUES (NEW.id, system_content, 'system', 'system', NULL, 'Sistema', 'sent', NOW());
        END IF;
    END IF;

    -- Context changed (sales → post_sales)
    IF OLD.context IS DISTINCT FROM NEW.context THEN
        IF NEW.context = 'post_sales' THEN
            system_content := 'Conversa transferida para Pós-vendas';
        ELSIF NEW.context = 'sales' THEN
            system_content := 'Conversa retornada para Vendas';
        END IF;

        IF system_content IS NOT NULL THEN
            INSERT INTO public.messages (conversation_id, content, type, sender_type, sender_id, sender_name, status, created_at)
            VALUES (NEW.id, system_content, 'system', 'system', NULL, 'Sistema', 'sent', NOW());
        END IF;
    END IF;

    -- Deal status changed (won/lost)
    IF OLD.deal_status IS DISTINCT FROM NEW.deal_status THEN
        IF NEW.deal_status = 'won' THEN
            system_content := '✅ Venda fechada';
        ELSIF NEW.deal_status = 'lost' THEN
            system_content := '❌ Lead perdido';
            IF NEW.loss_reason IS NOT NULL AND NEW.loss_reason != '' THEN
                system_content := system_content || ' — ' || NEW.loss_reason;
            END IF;
        ELSIF NEW.deal_status = 'open' AND OLD.deal_status IN ('won', 'lost') THEN
            system_content := 'Status do negócio reaberto';
        END IF;

        IF system_content IS NOT NULL THEN
            INSERT INTO public.messages (conversation_id, content, type, sender_type, sender_id, sender_name, status, created_at)
            VALUES (NEW.id, system_content, 'system', 'system', NULL, 'Sistema', 'sent', NOW());
        END IF;
    END IF;

    -- Reset system_content for next trigger call
    system_content := NULL;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Attach trigger to conversations table
DROP TRIGGER IF EXISTS trg_conversation_system_message ON public.conversations;
CREATE TRIGGER trg_conversation_system_message
    AFTER UPDATE ON public.conversations
    FOR EACH ROW
    EXECUTE FUNCTION fn_conversation_system_message();
