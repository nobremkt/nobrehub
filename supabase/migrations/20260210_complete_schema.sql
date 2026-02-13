-- ═══════════════════════════════════════════════════════════════════════════════
-- NOBRE HUB - COMPLETE DATABASE SCHEMA (single-file migration)
-- ═══════════════════════════════════════════════════════════════════════════════
-- Tables are ordered by dependency (parents first).
-- ═══════════════════════════════════════════════════════════════════════════════


-- ─── 1. ROLES ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    permissions text[] DEFAULT '{}',
    active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "roles_all_authenticated" ON public.roles
    FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- ─── 2. SECTORS ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sectors (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    manager text,
    display_order integer NOT NULL DEFAULT 0,
    leader_permissions text[],
    active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.sectors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sectors_all_authenticated" ON public.sectors
    FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- ─── 3. PERMISSIONS ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.permissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "permissions_all_authenticated" ON public.permissions
    FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- ─── 4. USERS ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    email text NOT NULL,
    phone text,
    avatar_url text,
    firebase_uid text,
    role_id uuid REFERENCES public.roles(id),
    sector_id uuid REFERENCES public.sectors(id),
    active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_all_authenticated" ON public.users
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "users_anon_select" ON public.users
    FOR SELECT TO anon USING (true);


-- ─── 5. ROLE PERMISSIONS (junction) ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.role_permissions (
    role_id uuid NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    permission text NOT NULL,
    PRIMARY KEY (role_id, permission)
);
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "role_permissions_all" ON public.role_permissions
    FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);


-- ─── 6. ORGANIZATION SETTINGS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.organization_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name text NOT NULL DEFAULT '',
    logo_url text,
    primary_color text NOT NULL DEFAULT '#dc2626',
    updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.organization_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_settings_all_authenticated" ON public.organization_settings
    FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- ─── 7. HOLIDAYS CONFIG ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.holidays_config (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    custom_days_off jsonb NOT NULL DEFAULT '[]'::jsonb,
    updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.holidays_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "holidays_all_authenticated" ON public.holidays_config
    FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- ─── 8. PRODUCTS ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.products (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    category text,
    base_points integer,
    active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products_all_authenticated" ON public.products
    FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- ─── 9. LOSS REASONS ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.loss_reasons (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);
ALTER TABLE public.loss_reasons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "loss_reasons_all_authenticated" ON public.loss_reasons
    FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- ─── 10. PIPELINE STAGES ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.pipeline_stages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    pipeline text NOT NULL,
    "order" integer NOT NULL,
    color text NOT NULL DEFAULT '#6b7280',
    active boolean DEFAULT true,
    is_system_stage boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);
ALTER TABLE public.pipeline_stages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pipeline_stages_all_authenticated" ON public.pipeline_stages
    FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- ─── 11. LEADS ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.leads (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    phone text NOT NULL,
    email text,
    company text,
    pipeline text NOT NULL DEFAULT 'default',
    stage_id uuid REFERENCES public.pipeline_stages(id),
    responsible_id uuid REFERENCES public.users(id),
    post_sales_id uuid REFERENCES public.users(id),
    deal_status text DEFAULT 'open',
    deal_value numeric,
    estimated_value numeric,
    deal_product_id uuid REFERENCES public.products(id),
    deal_notes text,
    deal_closed_at timestamptz,
    lost_reason_id uuid REFERENCES public.loss_reasons(id),
    lost_at timestamptz,
    source text,
    temperature text,
    tags text[] DEFAULT '{}',
    notes text,
    "order" integer,
    custom_fields jsonb,
    client_status text,
    current_sector text,
    completed_at timestamptz,
    post_sales_distribution_status text,
    post_sales_assigned_at timestamptz,
    previous_post_sales_ids text[],
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "leads_all_authenticated" ON public.leads
    FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- ─── 12. LEAD ACTIVITIES ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.lead_activities (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    user_id uuid REFERENCES public.users(id),
    type text NOT NULL,
    description text NOT NULL,
    metadata jsonb,
    created_at timestamptz DEFAULT now()
);
ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lead_activities_all_authenticated" ON public.lead_activities
    FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- ─── 13. CONVERSATIONS ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.conversations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    phone text NOT NULL,
    name text,
    email text,
    company text,
    profile_pic_url text,
    channel text,
    status text DEFAULT 'open',
    context text,
    assigned_to uuid REFERENCES public.users(id),
    lead_id uuid REFERENCES public.leads(id),
    post_sales_id text,
    tags text[],
    notes text,
    is_blocked boolean DEFAULT false,
    is_favorite boolean DEFAULT false,
    is_pinned boolean DEFAULT false,
    unread_count integer DEFAULT 0,
    last_message_at timestamptz,
    last_message_preview text,
    deal_status text DEFAULT 'open',
    loss_reason text,
    updated_by text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "conversations_all_authenticated" ON public.conversations
    FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- ─── 14. MESSAGES ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    content text,
    type text DEFAULT 'text',
    sender_type text NOT NULL,
    sender_id uuid REFERENCES public.users(id),
    sender_name text,
    status text DEFAULT 'sent',
    media_url text,
    media_mime_type text,
    reply_to_message_id uuid REFERENCES public.messages(id),
    whatsapp_message_id text,
    metadata jsonb,
    created_at timestamptz DEFAULT now()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "messages_all_authenticated" ON public.messages
    FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- ─── 15. PROJECTS ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.projects (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    lead_id uuid NOT NULL REFERENCES public.leads(id),
    producer_id uuid REFERENCES public.users(id),
    product_id uuid REFERENCES public.products(id),
    product_type text,
    status text NOT NULL DEFAULT 'novo',
    priority text,
    source text,
    notes text,
    drive_link text,
    due_date timestamptz,
    delivered_at timestamptz,
    delivered_to_client_at timestamptz,
    delivered_to_client_by uuid REFERENCES public.users(id),
    assigned_at timestamptz,
    assigned_by_leader_id uuid REFERENCES public.users(id),
    suggested_producer_id uuid REFERENCES public.users(id),
    suggested_producer_name text,
    suggestion_notes text,
    distribution_status text,
    base_points integer,
    extra_points integer,
    total_points integer,
    duration_category text,
    internal_revision_count integer DEFAULT 0,
    client_revision_count integer DEFAULT 0,
    client_approval_status text,
    client_approved_at timestamptz,
    client_feedback text,
    payment_status text,
    payment_received_at timestamptz,
    payment_received_by text,
    post_sales_id text,
    post_sales_name text,
    post_sales_assigned_at timestamptz,
    status_page_token text,
    status_page_url text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "projects_all_authenticated" ON public.projects
    FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- ─── 16. PROJECT CHECKLIST ITEMS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.project_checklist_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    text text NOT NULL,
    completed boolean DEFAULT false,
    "order" integer
);
ALTER TABLE public.project_checklist_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "checklist_all_authenticated" ON public.project_checklist_items
    FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- ─── 17. REVISION HISTORY ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.revision_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    type text NOT NULL,
    reason text,
    requested_by uuid REFERENCES public.users(id),
    requested_by_name text,
    created_at timestamptz DEFAULT now()
);
ALTER TABLE public.revision_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "revision_history_all_authenticated" ON public.revision_history
    FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- ─── 18. GOALS ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.goals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.users(id),
    date text NOT NULL,
    daily_target integer,
    points_delivered integer,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "goals_all_authenticated" ON public.goals
    FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- ─── 19. INTEGRATION SETTINGS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.integration_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    provider text NOT NULL DEFAULT 'z-api',
    base_url text NOT NULL DEFAULT '',
    enabled boolean NOT NULL DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.integration_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "integration_settings_all_authenticated" ON public.integration_settings
    FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- ─── 20. SOCIAL MEDIA CLIENTS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.social_media_clients (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_name text NOT NULL,
    contact text NOT NULL DEFAULT '',
    company_name text NOT NULL DEFAULT '',
    instagram_username text,
    instagram_url text,
    payment_date timestamptz,
    plan_duration integer NOT NULL DEFAULT 1,
    plan_type text NOT NULL DEFAULT 'presenca',
    post_start_date timestamptz NOT NULL DEFAULT now(),
    contract_end_date timestamptz,
    value numeric,
    status text NOT NULL DEFAULT 'active',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.social_media_clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "social_media_clients_all_authenticated" ON public.social_media_clients
    FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- ─── 21. SOCIAL MEDIA POSTS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.social_media_posts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id uuid NOT NULL REFERENCES public.social_media_clients(id) ON DELETE CASCADE,
    scheduled_date timestamptz NOT NULL,
    status text NOT NULL DEFAULT 'pending',
    notes text,
    created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.social_media_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "social_media_posts_all_authenticated" ON public.social_media_posts
    FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- ─── 22. STRATEGIC PROJECTS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.strategic_projects (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    description text,
    is_shared boolean NOT NULL DEFAULT false,
    owner_id text NOT NULL,
    member_ids text[] DEFAULT '{}',
    status text NOT NULL DEFAULT 'active',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.strategic_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "strategic_projects_all_authenticated" ON public.strategic_projects
    FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- ─── 23. STRATEGIC TASKS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.strategic_tasks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid NOT NULL REFERENCES public.strategic_projects(id) ON DELETE CASCADE,
    parent_task_id uuid REFERENCES public.strategic_tasks(id) ON DELETE CASCADE,
    title text NOT NULL,
    completed boolean NOT NULL DEFAULT false,
    "order" integer NOT NULL DEFAULT 0,
    priority text NOT NULL DEFAULT 'medium',
    assignee_id text,
    assignee_ids text[] DEFAULT '{}',
    tags text[] DEFAULT '{}',
    due_date timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    completed_at timestamptz
);
ALTER TABLE public.strategic_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "strategic_tasks_all_authenticated" ON public.strategic_tasks
    FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- ─── 24. TASK COMMENTS ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.task_comments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid NOT NULL REFERENCES public.strategic_projects(id) ON DELETE CASCADE,
    task_id uuid NOT NULL REFERENCES public.strategic_tasks(id) ON DELETE CASCADE,
    author_id text NOT NULL,
    author_name text NOT NULL,
    content text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "task_comments_all_authenticated" ON public.task_comments
    FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- ─── 25. NOTES ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL DEFAULT 'Untitled',
    content text NOT NULL DEFAULT '',
    created_by text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notes_all_authenticated" ON public.notes
    FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- ─── 26. USER PRESENCE ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_presence (
    user_id text PRIMARY KEY,
    state text NOT NULL DEFAULT 'offline',
    last_changed timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_presence_all_authenticated" ON public.user_presence
    FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- ─── 27. TEAM CHAT CHANNELS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.team_chat_channels (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    type text DEFAULT 'private',
    member_ids text[] NOT NULL DEFAULT '{}',
    admin_ids text[],
    photo_url text,
    created_by uuid REFERENCES public.users(id),
    last_message_at timestamptz,
    last_message_content text,
    last_message_sender_id text,
    last_message_type text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.team_chat_channels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team_chat_channels_all_authenticated" ON public.team_chat_channels
    FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- ─── 28. TEAM CHAT MESSAGES ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.team_chat_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id uuid NOT NULL REFERENCES public.team_chat_channels(id) ON DELETE CASCADE,
    sender_id uuid NOT NULL REFERENCES public.users(id),
    sender_name text NOT NULL DEFAULT '',
    content text,
    type text DEFAULT 'text',
    media_url text,
    created_at timestamptz DEFAULT now()
);
ALTER TABLE public.team_chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team_chat_messages_all_authenticated" ON public.team_chat_messages
    FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- ═══════════════════════════════════════════════════════════════════════════════
-- ENABLE REALTIME
-- ═══════════════════════════════════════════════════════════════════════════════
ALTER PUBLICATION supabase_realtime ADD TABLE public.roles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sectors;
ALTER PUBLICATION supabase_realtime ADD TABLE public.permissions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;
ALTER PUBLICATION supabase_realtime ADD TABLE public.social_media_clients;
ALTER PUBLICATION supabase_realtime ADD TABLE public.social_media_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.strategic_projects;
ALTER PUBLICATION supabase_realtime ADD TABLE public.strategic_tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_presence;
ALTER PUBLICATION supabase_realtime ADD TABLE public.team_chat_channels;
ALTER PUBLICATION supabase_realtime ADD TABLE public.team_chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.goals;


-- ═══════════════════════════════════════════════════════════════════════════════
-- HELPER FUNCTIONS
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.user_role() RETURNS text AS $$
BEGIN
    RETURN COALESCE(current_setting('request.jwt.claims', true)::json->>'role', 'anon');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_admin_or_leader() RETURNS boolean AS $$
BEGIN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;


-- ═══════════════════════════════════════════════════════════════════════════════
-- SYSTEM MESSAGES TRIGGER (for conversations)
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION fn_conversation_system_message()
RETURNS TRIGGER AS $$
DECLARE
    system_content text;
    actor_name text;
BEGIN
    actor_name := COALESCE(NEW.updated_by, 'Sistema');

    -- Assigned to changed
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

    system_content := NULL;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_conversation_system_message ON public.conversations;
CREATE TRIGGER trg_conversation_system_message
    AFTER UPDATE ON public.conversations
    FOR EACH ROW
    EXECUTE FUNCTION fn_conversation_system_message();
