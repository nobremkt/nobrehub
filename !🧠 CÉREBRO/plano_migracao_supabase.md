# 🔄 Plano: Full Supabase + Firebase Storage (v4 — FINAL)

> Atualizado em 11/02/2026
> Hub ainda em dev, sem dados de produção → schema do zero, UUID nativo, zero migração.

---

## 📐 Arquitetura

```
┌──────────────────────────────────────────────────┐
│                  SUPABASE                        │
├──────────────────────────────────────────────────┤
│  PostgreSQL                                      │
│  ├── users                                       │
│  ├── pipeline_stages                             │
│  ├── products, goals                             │
│  ├── leads (FK → stages, users)                  │
│  ├── projects (FK → leads, users, products)      │
│  ├── project_checklist_items                     │
│  ├── conversations, messages                     │
│  ├── team_chat_channels, team_chat_messages      │
│  ├── revision_history, lead_activities           │
│  └── loss_reasons                                │
│                                                  │
│  Auth (único sistema)                            │
│  Realtime (kanban, inbox, chat, presença)        │
│  Edge Functions (webhook WhatsApp)               │
├──────────────────────────────────────────────────┤
│            FIREBASE (só storage)                 │
├──────────────────────────────────────────────────┤
│  Storage → imagens, vídeos, áudios               │
├──────────────────────────────────────────────────┤
│               VERCEL                             │
├──────────────────────────────────────────────────┤
│  Frontend Vite + React / API routes              │
└──────────────────────────────────────────────────┘
```

---

## 📊 Auditoria: 16 de 22 Issues Resolvidas pelo Schema

| Issue | Problema | Como Postgres resolve |
|---|---|---|
| **C1** | Lead→Projeto não atômico | Transaction nativa |
| **C3** | bulkDelete sem check | FK ON DELETE RESTRICT |
| **C5** | Date vs Timestamp | TIMESTAMPTZ nativo |
| **C6** | undefined crasha | Colunas tipadas + NULL |
| **C8** | arrayUnion quebra | Tabela relacional |
| **H1-H3** | Queries carregam tudo | WHERE indexado |
| **H4-H5** | Double write, caminhos divergentes | Transaction + trigger |
| **H6** | Query ineficiente | SELECT WHERE id = $1 |
| **H7** | Bulk sem atomicidade | Transaction nativa |
| **M1-M2** | Client-side filter/pagination | ILIKE + LIMIT/OFFSET |
| **M3** | Campos duplicados | JOIN |
| **M5** | Enum duplicado | Um ENUM, um type gerado |

**6 restantes** (C2, C4, C7, M4, M6, M7) = fixes de lógica independentes do banco.

---

## 🗄️ Schema PostgreSQL

### Users & Auth

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'leader', 'sales', 'producer', 'post_sales')),
    department TEXT,
    avatar_url TEXT,
    phone TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Pipeline & Config

```sql
CREATE TABLE pipeline_stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    color TEXT NOT NULL,
    "order" INT NOT NULL,
    pipeline TEXT NOT NULL CHECK (pipeline IN ('high-ticket', 'low-ticket')),
    is_system_stage BOOLEAN DEFAULT false,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE loss_reasons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true
);

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    base_points INT DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    date DATE NOT NULL,
    daily_target INT DEFAULT 0,
    points_delivered INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, date)
);
```

### Leads

```sql
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT NOT NULL,
    company TEXT,
    pipeline TEXT NOT NULL CHECK (pipeline IN ('high-ticket', 'low-ticket')),
    stage_id UUID REFERENCES pipeline_stages(id),
    "order" INT DEFAULT 0,
    estimated_value NUMERIC,
    tags TEXT[] DEFAULT '{}',
    responsible_id UUID REFERENCES users(id),
    notes TEXT,
    temperature TEXT CHECK (temperature IN ('cold', 'warm', 'hot')),
    source TEXT,
    custom_fields JSONB DEFAULT '{}',

    -- Deal
    deal_status TEXT DEFAULT 'open' CHECK (deal_status IN ('open', 'won', 'lost')),
    deal_value NUMERIC,
    deal_closed_at TIMESTAMPTZ,
    deal_product_id UUID REFERENCES products(id),
    deal_notes TEXT,
    lost_reason_id UUID REFERENCES loss_reasons(id),
    lost_at TIMESTAMPTZ,

    -- Pós-vendas
    post_sales_id UUID REFERENCES users(id),
    post_sales_assigned_at TIMESTAMPTZ,
    post_sales_distribution_status TEXT CHECK (post_sales_distribution_status IN ('pending', 'assigned')),
    current_sector TEXT DEFAULT 'vendas' CHECK (current_sector IN ('vendas', 'pos_vendas', 'distribution')),
    previous_post_sales_ids UUID[] DEFAULT '{}',

    -- Status derivado (via TRIGGER — nunca escrever direto)
    client_status TEXT DEFAULT 'aguardando_projeto',

    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Projects

```sql
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE RESTRICT,
    drive_link TEXT,
    due_date TIMESTAMPTZ,
    producer_id UUID REFERENCES users(id),
    status TEXT NOT NULL DEFAULT 'aguardando'
        CHECK (status IN (
            'aguardando', 'em-producao', 'a-revisar', 'revisado',
            'alteracao_interna', 'alteracao_cliente',
            'entregue', 'concluido'
        )),
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('normal', 'high')),
    notes TEXT,
    source TEXT DEFAULT 'manual',

    -- Pontuação
    product_id UUID REFERENCES products(id),
    product_type TEXT,
    duration_category TEXT CHECK (duration_category IN ('30s', '60s', '60plus')),
    base_points INT DEFAULT 0,
    extra_points INT DEFAULT 0,
    total_points INT GENERATED ALWAYS AS (base_points + extra_points) STORED,

    -- Distribuição
    distribution_status TEXT DEFAULT 'pending'
        CHECK (distribution_status IN ('pending', 'assigned', 'suggested')),
    suggested_producer_id UUID REFERENCES users(id),
    suggested_producer_name TEXT,
    suggestion_notes TEXT,
    assigned_by_leader_id UUID REFERENCES users(id),
    assigned_at TIMESTAMPTZ,

    -- Pós-vendas
    post_sales_id UUID REFERENCES users(id),
    post_sales_name TEXT,
    post_sales_assigned_at TIMESTAMPTZ,

    -- Entrega & Aprovação
    delivered_at TIMESTAMPTZ,
    delivered_to_client_at TIMESTAMPTZ,
    delivered_to_client_by UUID REFERENCES users(id),
    client_approval_status TEXT DEFAULT 'pending'
        CHECK (client_approval_status IN ('pending', 'approved', 'changes_requested')),
    client_approved_at TIMESTAMPTZ,
    client_feedback TEXT,
    payment_status TEXT DEFAULT 'pending'
        CHECK (payment_status IN ('pending', 'partial', 'paid')),
    payment_received_at TIMESTAMPTZ,
    payment_received_by TEXT,

    -- Revisões
    internal_revision_count INT DEFAULT 0,
    client_revision_count INT DEFAULT 0,

    -- Status page
    status_page_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
    status_page_url TEXT,

    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE project_checklist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    completed BOOLEAN DEFAULT false,
    "order" INT DEFAULT 0
);

CREATE TABLE revision_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('internal', 'client')),
    reason TEXT,
    requested_by UUID REFERENCES users(id),
    requested_by_name TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
```

### Conversations & Messages

```sql
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES leads(id),
    phone TEXT NOT NULL,
    name TEXT,
    profile_pic_url TEXT,
    assigned_to UUID REFERENCES users(id),
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed')),
    channel TEXT DEFAULT 'whatsapp' CHECK (channel IN ('whatsapp', 'instagram', 'manual')),
    last_message_at TIMESTAMPTZ,
    last_message_preview TEXT,
    unread_count INT DEFAULT 0,
    tags TEXT[] DEFAULT '{}',
    notes TEXT,
    is_blocked BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    content TEXT,
    type TEXT DEFAULT 'text'
        CHECK (type IN ('text', 'image', 'video', 'audio', 'document', 'sticker', 'location')),
    media_url TEXT,
    media_mime_type TEXT,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('customer', 'agent', 'system')),
    sender_id UUID REFERENCES users(id),
    sender_name TEXT,
    status TEXT DEFAULT 'sent'
        CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
    whatsapp_message_id TEXT,
    reply_to_message_id UUID REFERENCES messages(id),
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);
```

### Team Chat

```sql
CREATE TABLE team_chat_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT DEFAULT 'group' CHECK (type IN ('group', 'direct')),
    member_ids UUID[] NOT NULL DEFAULT '{}',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE team_chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID NOT NULL REFERENCES team_chat_channels(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id),
    sender_name TEXT NOT NULL,
    content TEXT,
    type TEXT DEFAULT 'text' CHECK (type IN ('text', 'image', 'audio', 'file')),
    media_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
```

### Lead Activities

```sql
CREATE TABLE lead_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    description TEXT NOT NULL,
    user_id UUID REFERENCES users(id),
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 🔀 Trigger: Lead Status Automático

```sql
CREATE OR REPLACE FUNCTION sync_lead_client_status()
RETURNS TRIGGER AS $$
DECLARE
    v_lead_id UUID;
    v_status TEXT;
    v_all_concluded BOOLEAN;
BEGIN
    v_lead_id := COALESCE(NEW.lead_id, OLD.lead_id);

    SELECT bool_and(status = 'concluido')
    INTO v_all_concluded
    FROM projects WHERE lead_id = v_lead_id;

    IF v_all_concluded IS TRUE THEN
        UPDATE leads SET
            client_status = 'concluido',
            current_sector = 'vendas',
            post_sales_distribution_status = NULL,
            completed_at = COALESCE(completed_at, now()),
            updated_at = now()
        WHERE id = v_lead_id;
        RETURN COALESCE(NEW, OLD);
    END IF;

    SELECT CASE
        WHEN bool_or(status IN ('alteracao_interna', 'alteracao_cliente')
            OR client_approval_status = 'changes_requested')
            THEN 'aguardando_alteracao'
        WHEN bool_or(client_approval_status = 'approved' AND payment_status != 'paid')
            THEN 'aguardando_pagamento'
        WHEN bool_or(status = 'entregue'
            AND COALESCE(client_approval_status, 'pending') != 'approved')
            THEN 'entregue'
        ELSE 'aguardando_projeto'
    END INTO v_status
    FROM projects WHERE lead_id = v_lead_id;

    UPDATE leads SET
        client_status = COALESCE(v_status, 'aguardando_projeto'),
        updated_at = now()
    WHERE id = v_lead_id;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_lead_status
    AFTER INSERT OR UPDATE OR DELETE ON projects
    FOR EACH ROW EXECUTE FUNCTION sync_lead_client_status();
```

---

## 🔐 RLS

```sql
CREATE OR REPLACE FUNCTION user_role()
RETURNS TEXT AS $$
    SELECT COALESCE((auth.jwt() -> 'user_metadata' ->> 'role'), 'sales');
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION is_admin_or_leader()
RETURNS BOOLEAN AS $$
    SELECT user_role() IN ('admin', 'leader');
$$ LANGUAGE sql STABLE;

-- LEADS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY leads_admin ON leads FOR ALL USING (is_admin_or_leader());
CREATE POLICY leads_sales_r ON leads FOR SELECT USING (responsible_id = auth.uid());
CREATE POLICY leads_sales_w ON leads FOR UPDATE USING (responsible_id = auth.uid());
CREATE POLICY leads_ps_r ON leads FOR SELECT USING (post_sales_id = auth.uid());
CREATE POLICY leads_ps_w ON leads FOR UPDATE USING (post_sales_id = auth.uid());

-- PROJECTS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY projects_admin ON projects FOR ALL USING (is_admin_or_leader());
CREATE POLICY projects_prod_r ON projects FOR SELECT USING (producer_id = auth.uid());
CREATE POLICY projects_prod_w ON projects FOR UPDATE USING (producer_id = auth.uid());
CREATE POLICY projects_ps_r ON projects FOR SELECT USING (
    EXISTS (SELECT 1 FROM leads WHERE leads.id = projects.lead_id AND leads.post_sales_id = auth.uid())
);

-- CONVERSATIONS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY conv_admin ON conversations FOR ALL USING (is_admin_or_leader());
CREATE POLICY conv_agent_r ON conversations FOR SELECT USING (assigned_to = auth.uid());
CREATE POLICY conv_agent_w ON conversations FOR UPDATE USING (assigned_to = auth.uid());

-- MESSAGES
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY msg_admin ON messages FOR ALL USING (is_admin_or_leader());
CREATE POLICY msg_by_conv ON messages FOR SELECT USING (
    EXISTS (SELECT 1 FROM conversations c WHERE c.id = messages.conversation_id
        AND (c.assigned_to = auth.uid() OR is_admin_or_leader()))
);
CREATE POLICY msg_insert ON messages FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM conversations c WHERE c.id = messages.conversation_id
        AND (c.assigned_to = auth.uid() OR is_admin_or_leader()))
);

-- TEAM CHAT
ALTER TABLE team_chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY tchat_members ON team_chat_messages FOR ALL USING (
    EXISTS (SELECT 1 FROM team_chat_channels ch
        WHERE ch.id = team_chat_messages.channel_id AND auth.uid() = ANY(ch.member_ids))
);
```

---

## 📋 Índices

```sql
CREATE INDEX idx_leads_responsible ON leads(responsible_id);
CREATE INDEX idx_leads_sector ON leads(current_sector);
CREATE INDEX idx_leads_phone ON leads(phone);
CREATE INDEX idx_leads_stage ON leads(stage_id);
CREATE INDEX idx_leads_pipeline ON leads(pipeline);
CREATE INDEX idx_leads_deal_status ON leads(deal_status);
CREATE INDEX idx_leads_client_status ON leads(client_status);
CREATE INDEX idx_leads_post_sales ON leads(post_sales_id);

CREATE INDEX idx_projects_lead ON projects(lead_id);
CREATE INDEX idx_projects_producer ON projects(producer_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_distribution ON projects(distribution_status);

CREATE INDEX idx_conversations_lead ON conversations(lead_id);
CREATE INDEX idx_conversations_assigned ON conversations(assigned_to);
CREATE INDEX idx_conversations_phone ON conversations(phone);
CREATE INDEX idx_conversations_last_msg ON conversations(last_message_at DESC);
CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at);
CREATE INDEX idx_messages_whatsapp_id ON messages(whatsapp_message_id);

CREATE INDEX idx_team_chat_channel ON team_chat_messages(channel_id, created_at);
CREATE INDEX idx_activities_lead ON lead_activities(lead_id);
CREATE INDEX idx_revision_project ON revision_history(project_id);
CREATE INDEX idx_checklist_project ON project_checklist_items(project_id);
CREATE INDEX idx_goals_user_date ON goals(user_id, date);
```

---

## 🔄 Fases

### Fase 1: Setup Supabase
- [ ] Instalar Docker Desktop
- [ ] Criar projeto no Supabase Cloud (sa-east-1)
- [ ] `supabase init` + `supabase link`
- [ ] Criar migrations com o schema acima
- [ ] `supabase db push` (aplica no cloud)
- [ ] Configurar env vars no Vercel
- [ ] Seed data: pipeline_stages, products, users iniciais

### Fase 2: Reescrever Services
- [ ] `lib/supabase.ts` — client
- [ ] `services/supabase/AuthService.ts`
- [ ] `services/supabase/LeadService.ts`
- [ ] `services/supabase/ProjectService.ts`
- [ ] `services/supabase/ProductionService.ts`
- [ ] `services/supabase/PostSalesService.ts`
- [ ] `services/supabase/ConversationService.ts`
- [ ] `services/supabase/MessageService.ts`
- [ ] `services/supabase/TeamChatService.ts`
- [ ] `services/supabase/PresenceService.ts`
- [ ] Gerar types: `supabase gen types typescript`

### Fase 3: Adaptar Frontend
- [ ] Stores Zustand → trocar Firebase imports por Supabase
- [ ] Realtime subscriptions (Kanban, Inbox, Chat, Presença)
- [ ] Auth flow (login/logout via Supabase)
- [ ] Webhook WhatsApp (API route → Supabase)

### Fase 4: Limpeza
- [ ] Remover todo código Firebase (exceto Storage)
- [ ] Remover `syncLeadStatusFromProjects`, `updateClientStatus`
- [ ] Simplificar `firebase.ts` (só Storage exports)
- [ ] Corrigir issues independentes (C2, C4, M4, M6, M7)

### Fase 5: Deploy & Otimização
- [ ] Deploy no Vercel
- [ ] Testes (C7)
- [ ] Dashboard analytics via SQL

---

## ⏱️ Estimativa

| Fase | Sessões | Risco |
|---|---|---|
| Fase 1 (Setup) | 1 | Baixo |
| Fase 2 (Services) | 3-4 | Médio |
| Fase 3 (Frontend) | 2-3 | Médio |
| Fase 4 (Limpeza) | 1 | Baixo |
| Fase 5 (Deploy) | 1 | Baixo |

**Total: ~8-10 sessões**

---

## 💰 Custo

| Serviço | Custo |
|---|---|
| Supabase Pro | $25/mês |
| Firebase (só Storage) | $0 (free tier) |
| Vercel | $0-20/mês |
| **Total** | **$25-45/mês** |

---

## 🔙 Rollback

Se algo falhar: revert Vercel deploy (1 click) → código Firebase antigo volta. Zero risco de perda de dados porque não há dados de produção.

---

## ⚠️ Pré-requisitos pra Fase 1

1. ✅ Conta Supabase Pro
2. ✅ Região: sa-east-1 (São Paulo)
3. ⬜ Docker Desktop instalado
4. ⬜ `npm install -g supabase`
