# 🔄 Plano de Migração: Firebase → Supabase

> Criado em 10/02/2026
> Contexto: Hub processa ~1000 leads/dia, Firebase Firestore causa bugs de sync em dados relacionais (Lead ↔ Projeto)

---

## 📐 Arquitetura Final

```
┌─────────────────────────────────────────────────┐
│                 SUPABASE                        │
├─────────────────────────────────────────────────┤
│  PostgreSQL                                     │
│  ├── leads                                      │
│  ├── projects (FK → leads)                      │
│  ├── pipeline_stages                            │
│  ├── products (tipos + pontos)                  │
│  ├── goals (metas de produção)                  │
│  ├── users (colaboradores + roles)              │
│  ├── lead_activities (histórico)                │
│  └── revision_history (log de revisões)         │
│                                                 │
│  Auth                                           │
│  └── Login, roles, permissões, RLS              │
│                                                 │
│  Real-time                                      │
│  └── Subscriptions: leads, projects, produção   │
│                                                 │
│  Edge Functions                                 │
│  └── Webhook WhatsApp (cria lead + conversa)    │
├─────────────────────────────────────────────────┤
│                 FIREBASE (mantém)               │
├─────────────────────────────────────────────────┤
│  RTDB                                           │
│  ├── conversations (mensagens WhatsApp)         │
│  ├── messages (conteúdo das msgs)               │
│  ├── presence (online/idle/offline)             │
│  └── typing (indicador de digitação)            │
│                                                 │
│  Storage                                        │
│  └── Arquivos, mídias, áudios                   │
├─────────────────────────────────────────────────┤
│                 VERCEL (mantém)                  │
├─────────────────────────────────────────────────┤
│  └── Frontend Vite + React                      │
└─────────────────────────────────────────────────┘
```

**Princípio:** Dados relacionais (negócio) → Supabase. Dados efêmeros/real-time (mensagens, presença) → Firebase.

---

## 🔗 Bridge Firebase ↔ Supabase

O Lead no Supabase terá `firebase_conversation_id` que aponta pro RTDB:

```ts
// 1. Busca lead + projetos em UMA query (Supabase)
const { data: lead } = await supabase
    .from('leads')
    .select('*, projects(*)')
    .eq('id', leadId)
    .single();

// 2. Conversa vem do Firebase (já funciona)
const conversationRef = ref(rtdb, `conversations/${lead.firebase_conversation_id}`);
```

---

## 📊 Cruzamento: Auditoria × Migração

### ✅ Resolvidos AUTOMATICAMENTE pelo PostgreSQL (14 issues)

| Issue | Problema | Como o Postgres resolve |
|---|---|---|
| **C1** | Transição Lead→Projeto não atômica | `BEGIN; INSERT project; UPDATE lead; COMMIT;` — transação atômica |
| **C3** | bulkDelete sem verificar vínculos | `FOREIGN KEY ON DELETE RESTRICT` — banco impede |
| **C5** | Date vs Timestamp inconsistente | `TIMESTAMPTZ` nativo — impossível confundir |
| **C6** | `undefined` crasha Firestore | Colunas tipadas, `NULL` explícito |
| **C8** | `arrayUnion` em `setDoc` quebra | Tabela de relação normal |
| **H1** | syncConversation carrega TUDO | `SELECT * FROM conversations WHERE lead_id = $1` indexado |
| **H4** | completeClient dois caminhos | Uma transaction unificada |
| **H5** | requestRevision double write | Uma transaction: update project + view deriva status |
| **H6** | Query ineficiente por ID | `SELECT * FROM projects WHERE id = $1` direto |
| **H7** | Bulk ops sem batch atômico | `BEGIN; UPDATE...; UPDATE...; COMMIT;` |
| **M1** | searchAllProjects client-side | `WHERE name ILIKE '%termo%'` server-side |
| **M2** | getLeads sem paginação | `LIMIT 50 OFFSET 0` nativo |
| **M3** | Conversation duplica campos Lead | `JOIN leads ON conversations.lead_id = leads.id` |
| **M5** | DealStatus em dois arquivos | Um `ENUM`, um type gerado |

### 🔧 Precisam de fix INDEPENDENTE (6 issues)

| Issue | Problema | O que fazer |
|---|---|---|
| **C2** | bulkMarkAsLost não move coluna | Fix: `UPDATE leads SET stage_id = X, deal_status = 'lost'` |
| **C4** | reorderLead não persiste origem | Fix: persistir order da coluna de origem |
| **C7** | Zero testes automatizados | Implementar após migração |
| **M4** | `isActive` vs `active` duplicado | Unificar no schema (um campo) |
| **M6** | seedDatabase em produção | Remover ou proteger |
| **M7** | bulkAssignPosVenda incompleto | Fix: incluir `current_sector`, etc. |

### ⚠️ Parcialmente resolvidos (2 issues)

| Issue | Problema | Solução |
|---|---|---|
| **H2** | PostSalesInbox filtra client-side | `firebase_conversation_id` no Lead resolve busca |
| **H3** | subscribeByLeadId carrega tudo | Idem — query pelo Supabase primeiro, depois abre conversa |

---

## 🗄️ Schema PostgreSQL

```sql
-- ═══════════════════════════════════════════════════════════
-- USERS
-- ═══════════════════════════════════════════════════════════

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'leader', 'sales', 'producer', 'post_sales')),
    department TEXT,
    avatar_url TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════
-- PIPELINE
-- ═══════════════════════════════════════════════════════════

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

-- ═══════════════════════════════════════════════════════════
-- PRODUCTS (tipos de serviço + pontuação)
-- ═══════════════════════════════════════════════════════════

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    base_points INT DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════
-- LEADS
-- ═══════════════════════════════════════════════════════════

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

    -- Deal
    deal_status TEXT DEFAULT 'open' CHECK (deal_status IN ('open', 'won', 'lost')),
    deal_value NUMERIC,
    deal_closed_at TIMESTAMPTZ,
    deal_product_id UUID REFERENCES products(id),
    deal_notes TEXT,
    lost_reason TEXT,
    lost_at TIMESTAMPTZ,

    -- Pós-vendas
    post_sales_id UUID REFERENCES users(id),
    post_sales_assigned_at TIMESTAMPTZ,
    post_sales_distribution_status TEXT CHECK (post_sales_distribution_status IN ('pending', 'assigned')),
    current_sector TEXT DEFAULT 'vendas' CHECK (current_sector IN ('vendas', 'pos_vendas', 'distribution')),
    previous_post_sales_ids UUID[] DEFAULT '{}',

    -- Bridge com Firebase
    firebase_conversation_id TEXT,

    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════
-- PROJECTS (produção)
-- ═══════════════════════════════════════════════════════════

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
    suggestion_notes TEXT,
    assigned_by_leader_id UUID REFERENCES users(id),
    assigned_at TIMESTAMPTZ,

    -- Entrega & Aprovação
    delivered_at TIMESTAMPTZ,
    delivered_to_client_at TIMESTAMPTZ,
    delivered_to_client_by UUID REFERENCES users(id),
    client_approval_status TEXT DEFAULT 'pending'
        CHECK (client_approval_status IN ('pending', 'approved', 'changes_requested')),
    client_approved_at TIMESTAMPTZ,
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

-- ═══════════════════════════════════════════════════════════
-- REVISION HISTORY
-- ═══════════════════════════════════════════════════════════

CREATE TABLE revision_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('internal', 'client')),
    reason TEXT,
    requested_by UUID REFERENCES users(id),
    requested_by_name TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════
-- LEAD ACTIVITIES (histórico)
-- ═══════════════════════════════════════════════════════════

CREATE TABLE lead_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    description TEXT NOT NULL,
    user_id UUID REFERENCES users(id),
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════
-- VIEW: STATUS DERIVADO DO LEAD (substitui syncLeadStatusFromProjects)
-- ═══════════════════════════════════════════════════════════

CREATE VIEW lead_client_status AS
SELECT
    l.id as lead_id,
    CASE
        WHEN COUNT(p.id) = 0 THEN 'aguardando_projeto'
        WHEN bool_or(p.status IN ('alteracao_interna', 'alteracao_cliente')
            OR p.client_approval_status = 'changes_requested')
            THEN 'aguardando_alteracao'
        WHEN bool_or(p.client_approval_status = 'approved'
            AND p.payment_status != 'paid')
            THEN 'aguardando_pagamento'
        WHEN bool_or(p.status = 'entregue'
            AND COALESCE(p.client_approval_status, 'pending') != 'approved')
            THEN 'entregue'
        WHEN bool_and(p.status = 'concluido') THEN 'concluido'
        ELSE 'aguardando_projeto'
    END as client_status,
    COUNT(p.id) as total_projects,
    COUNT(p.id) FILTER (WHERE p.status = 'concluido') as completed_projects,
    COUNT(p.id) FILTER (WHERE p.payment_status = 'paid') as paid_projects
FROM leads l
LEFT JOIN projects p ON p.lead_id = l.id
GROUP BY l.id;

-- ═══════════════════════════════════════════════════════════
-- ÍNDICES
-- ═══════════════════════════════════════════════════════════

CREATE INDEX idx_leads_responsible ON leads(responsible_id);
CREATE INDEX idx_leads_sector ON leads(current_sector);
CREATE INDEX idx_leads_phone ON leads(phone);
CREATE INDEX idx_leads_stage ON leads(stage_id);
CREATE INDEX idx_leads_pipeline ON leads(pipeline);
CREATE INDEX idx_leads_deal_status ON leads(deal_status);

CREATE INDEX idx_projects_lead ON projects(lead_id);
CREATE INDEX idx_projects_producer ON projects(producer_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_distribution ON projects(distribution_status);

CREATE INDEX idx_activities_lead ON lead_activities(lead_id);
CREATE INDEX idx_revision_project ON revision_history(project_id);

-- ═══════════════════════════════════════════════════════════
-- RLS (Row Level Security)
-- ═══════════════════════════════════════════════════════════

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Admins/Leaders vêem tudo
CREATE POLICY admin_full_access ON leads
    FOR ALL USING (
        auth.jwt() ->> 'role' IN ('admin', 'leader')
    );

-- Vendedoras vêem seus leads
CREATE POLICY sales_own_leads ON leads
    FOR SELECT USING (
        responsible_id = auth.uid()
    );

-- Pós-vendas vêem seus clientes
CREATE POLICY post_sales_own_clients ON leads
    FOR SELECT USING (
        post_sales_id = auth.uid()
    );

-- Produtores vêem projetos atribuídos
CREATE POLICY producer_own_projects ON projects
    FOR SELECT USING (
        producer_id = auth.uid()
        OR auth.jwt() ->> 'role' IN ('admin', 'leader')
    );
```

---

## 🔄 Fases de Migração

### Fase 1: Setup (sem quebrar nada)

- [ ] Criar projeto no Supabase (free tier pra começar)
- [ ] Rodar migrations (schema acima)
- [ ] Configurar Auth
  - [ ] Importar users do Firebase Auth
  - [ ] Configurar roles via custom claims
- [ ] Configurar RLS
- [ ] Script de migração: Firestore → Postgres
  - [ ] Ler todos leads do Firestore
  - [ ] Ler todos projetos do Firestore
  - [ ] Inserir no Supabase com IDs preservados
  - [ ] Validar contagem + integridade

### Fase 2: Dual-write (transição segura)

- [ ] Criar `SupabaseLeadService.ts` e `SupabaseProjectService.ts`
- [ ] Services escrevem nos DOIS bancos durante transição
- [ ] Frontend começa a ler do Supabase (leitura)
- [ ] Fallback pro Firebase se Supabase falhar
- [ ] Monitorar por 1-2 semanas

### Fase 3: Cutover (cortar Firebase dados de negócio)

- [ ] Frontend lê 100% do Supabase
- [ ] Remover código Firestore de leads/projetos
- [ ] Manter Firebase RTDB pra conversas + mensagens
- [ ] Manter Firebase Storage pra arquivos
- [ ] Corrigir issues independentes (C2, C4, M4, M6, M7)

### Fase 4: Otimização

- [ ] Resolver H2/H3 (indexar RTDB ou mover metadata pro Supabase)
- [ ] Implementar testes com banco de teste real (C7)
- [ ] Dashboard analytics direto no Postgres (queries SQL)
- [ ] Avaliar migrar conversations metadata pro Supabase

---

## ⏱️ Estimativa de Esforço

| Fase | Tempo estimado | Risco |
|---|---|---|
| Fase 1 (Setup) | 1-2 sessões | Baixo — nada quebra |
| Fase 2 (Dual-write) | 2-3 sessões | Médio — dois bancos simultâneos |
| Fase 3 (Cutover) | 1-2 sessões | Alto — ponto de não-retorno |
| Fase 4 (Otimização) | Contínuo | Baixo |

**Total: ~5-7 sessões intensas**

---

## 💰 Custo

| Serviço | Plano | Custo |
|---|---|---|
| **Supabase** | Free → Pro quando necessário | $0 → $25/mês |
| **Firebase** | Spark (free) pra RTDB + Storage | $0 (dentro do free tier) |
| **Vercel** | Hobby/Pro | $0-20/mês |
| **Total** | | **$0 a $45/mês** |
