# 🤖 Codex Task: Rewrite Batch 5 — Post-Sales Services (Firebase → Supabase)

## 📋 Contexto do Projeto

Estamos migrando o **Nobre Hub** (CRM para agência de marketing) de **Firebase Firestore** para **Supabase PostgreSQL**.

### Progresso atual
- ✅ **Batch 1**: Settings (5 services) — reescritos  
- ✅ **Batch 2**: Auth (authService) — reescrito  
- ✅ **Batch 3**: CRM (LeadService, 464L) — reescrito  
- ✅ **Batch 4**: Production (3 services) — reescritos  
- ⏳ **Batch 5**: Post-Sales (2 services) — **SUA TAREFA**  
- ⏳ **Batch 6**: Inbox/Chat — será feito em paralelo por outro agente

### Plano de migração completo
📄 `!🧠 CÉREBRO/plano_migracao_supabase.md` — contém o plano v4 FINAL com todas as decisões arquiteturais, schema, e batches

### Arquivos de referência (já reescritos — USE COMO EXEMPLO):
- `src/features/production/services/ProductionDistributionService.ts` — **melhor exemplo** (padrão de distribution + workload + Realtime, similar ao que você vai reescrever)
- `src/features/production/services/ProductionService.ts` — exemplo com 16 funções, helpers de mapeamento
- `src/features/crm/services/LeadService.ts` — exemplo de bulk operations, mapeamento Lead ↔ Supabase
- `src/config/supabase.ts` — client Supabase tipado (importar daqui)
- `src/types/supabase.ts` — tipos auto-gerados do schema PostgreSQL

---

## 🎯 Sua Tarefa

Reescrever **2 arquivos**, removendo TODO código Firebase e substituindo por Supabase:

### Arquivo 1: `src/features/pos-vendas/services/PostSalesDistributionService.ts`
- **505 linhas, 16 funções + 3 helpers**
- Gerencia a distribuição de clientes para o setor Pós-Vendas

### Arquivo 2: `src/features/pos-vendas/services/PostSalesInboxService.ts`
- **122 linhas, 4 funções**
- Busca conversas do contexto pós-venda

---

## 🏗️ Padrão Obrigatório (Architecture Pattern)

### 1. Import único
```ts
import { supabase } from '@/config/supabase';
```
**ZERO imports do Firebase.** Remova completamente: `firebase/firestore`, `@/config/firebase`, `COLLECTIONS`, etc.

### 2. Helper de mapeamento (row → tipo frontend)
Cada service precisa de funções helper para converter os campos do Supabase (snake_case) para os tipos do frontend (camelCase):

```ts
const rowToLead = (row: any): Lead => ({
    id: row.id,
    name: row.name || '',
    phone: row.phone || '',
    email: row.email || '',
    company: row.company || '',
    // ... mapear cada campo snake_case → camelCase
    createdAt: row.created_at ? new Date(row.created_at) : new Date(),
    updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
});
```

### 3. Helper de mapeamento inverso (tipo frontend → DB updates)
```ts
const leadToDbUpdates = (updates: Partial<Lead>): Record<string, unknown> => {
    const dbUpdates: Record<string, unknown> = {};
    if (updates.clientStatus !== undefined) dbUpdates.client_status = updates.clientStatus;
    if (updates.postSalesId !== undefined) dbUpdates.post_sales_id = updates.postSalesId;
    // ...
    dbUpdates.updated_at = new Date().toISOString();
    return dbUpdates;
};
```

### 4. Padrão de Subscribe (Supabase Realtime)
```ts
subscribeToXxx: (callback: (items: Type[]) => void) => {
    // 1. Fetch inicial
    PostSalesDistributionService.getXxx().then(callback);

    // 2. Canal Realtime
    const channel = supabase
        .channel('unique-channel-name')
        .on('postgres_changes',
            { event: '*', schema: 'public', table: 'leads', filter: 'optional_eq_filter' },
            () => {
                // Refetch completo no change
                PostSalesDistributionService.getXxx().then(callback);
            }
        )
        .subscribe();

    // 3. Retorna cleanup function
    return () => { supabase.removeChannel(channel); };
}
```

### 5. Erro handling
```ts
const { data, error } = await supabase.from('leads').select('*');
if (error) throw error;
return (data || []).map(rowToLead);
```

### 6. Datas
- **Leitura**: `row.created_at ? new Date(row.created_at) : new Date()`
- **Escrita**: `new Date().toISOString()`

---

## 📊 Schema das Tabelas Supabase

### Tabela `leads`
```
id                              UUID (PK)
name                            TEXT
phone                           TEXT
email                           TEXT
company                         TEXT
pipeline                        TEXT
stage_id                        UUID (FK → pipeline_stages)
responsible_id                  UUID (FK → users)
post_sales_id                   UUID (FK → users)         ← Firebase: postSalesId
post_sales_distribution_status  TEXT                       ← Firebase: postSalesDistributionStatus
post_sales_assigned_at          TIMESTAMPTZ                ← Firebase: postSalesAssignedAt
previous_post_sales_ids         UUID[]                     ← Firebase: previousPostSalesIds (arrayUnion)
client_status                   TEXT                       ← Firebase: clientStatus
current_sector                  TEXT                       ← Firebase: currentSector
deal_status                     TEXT
deal_value                      NUMERIC
deal_closed_at                  TIMESTAMPTZ
lost_reason_id                  UUID
lost_at                         TIMESTAMPTZ
completed_at                    TIMESTAMPTZ
tags                            TEXT[]                     ← Firebase: tags (arrayUnion → array concat)
temperature                     TEXT
source                          TEXT
notes                           TEXT
custom_fields                   JSONB
estimated_value                 NUMERIC
last_revision_requested_at      TIMESTAMPTZ
client_approved_at              TIMESTAMPTZ
created_at                      TIMESTAMPTZ
updated_at                      TIMESTAMPTZ
```

### Tabela `projects`
```
id                              UUID (PK)
name                            TEXT
lead_id                         UUID (FK → leads)          ← Firebase: leadId
lead_name                       TEXT
producer_id                     UUID (FK → users)
producer_name                   TEXT
status                          TEXT
due_date                        TIMESTAMPTZ
drive_link                      TEXT
distribution_status             TEXT
post_sales_id                   UUID                       ← Firebase: postSalesId
post_sales_name                 TEXT
post_sales_assigned_at          TIMESTAMPTZ
delivered_to_client_at          TIMESTAMPTZ                ← Firebase: deliveredToClientAt
delivered_to_client_by          TEXT
client_approval_status          TEXT                       ← Firebase: clientApprovalStatus
client_approved_at              TIMESTAMPTZ
payment_status                  TEXT                       ← Firebase: paymentStatus
payment_received_at             TIMESTAMPTZ
payment_received_by             TEXT
revision_count                  INT                        ← Firebase: revisionCount
client_revision_count           INT                        ← Firebase: clientRevisionCount
internal_revision_count         INT
last_revision_requested_at      TIMESTAMPTZ
status_page_token               TEXT
status_page_url                 TEXT
base_points                     INT
total_points                    INT
created_at                      TIMESTAMPTZ
updated_at                      TIMESTAMPTZ
```

### Tabela `conversations`
```
id                              UUID (PK)
phone                           TEXT
name                            TEXT
email                           TEXT (opt)
lead_id                         UUID (FK → leads)          ← Firebase: leadId
channel                         TEXT
status                          TEXT ('open' | 'closed')
context                         TEXT ('sales' | 'post_sales')
assigned_to                     UUID (FK → users)          ← Firebase: assignedTo
post_sales_id                   UUID
tags                            TEXT[]
is_favorite                     BOOLEAN
is_pinned                       BOOLEAN
unread_count                    INT
last_message_preview            TEXT                       ← Firebase: lastMessage
last_message_at                 TIMESTAMPTZ
notes                           TEXT
is_blocked                      BOOLEAN
profile_pic_url                 TEXT
created_at                      TIMESTAMPTZ
updated_at                      TIMESTAMPTZ
```

### Tabela `revision_history` (para requestRevision)
```
id                              UUID (PK)
project_id                      UUID (FK → projects)
type                            TEXT ('client' | 'internal')
reason                          TEXT
requested_by                    TEXT
requested_by_name               TEXT
requested_at                    TIMESTAMPTZ
created_at                      TIMESTAMPTZ
```

---

## 🔄 Mapeamento Função por Função

### PostSalesDistributionService.ts

| # | Função | Firebase → Supabase |
|---|--------|---------------------|
| 1 | `getLeadClientStatusFromProjects(projects)` | Helper puro — **NÃO muda**, é lógica de negócio |
| 2 | `getDistributionQueue()` | `supabase.from('leads').select('*').eq('post_sales_distribution_status', 'pending').eq('current_sector', 'distribution').order('deal_closed_at', { ascending: true })` |
| 3 | `subscribeToDistributionQueue(cb)` | Realtime channel `'postsales-distribution-queue'` na tabela `leads` |
| 4 | `calculatePostSalesWorkload(id)` | `supabase.from('leads').select('id', { count: 'exact' }).eq('post_sales_id', id).in('client_status', ACTIVE_CLIENT_STATUSES)` |
| 5 | `getAllPostSalesWorkload(ids)` | `Promise.all(ids.map(...))` — **igual** |
| 6 | `syncConversationAssignment(leadId, psId)` | `supabase.from('conversations').update({ assigned_to, post_sales_id, context: 'post_sales', status: 'open', updated_at }).eq('lead_id', leadId)` |
| 7 | `assignToPostSales(leadId, psId, name)` | Busca lead atual, verifica previousPostSalesIds, `supabase.from('leads').update({...}).eq('id', leadId)` |
| 8 | `autoAssignClient(leadId, psIds)` | Lógica de least-loaded — **mesma**, usa `getAllPostSalesWorkload` |
| 9 | `autoAssignAllPending(psIds)` | Loop — **mesma lógica** |
| 10 | `updateClientStatus(leadId, status)` | `supabase.from('leads').update({ client_status, updated_at }).eq('id', leadId)` |
| 11 | `getProjectsByLeadId(leadId)` | `supabase.from('projects').select('*').eq('lead_id', leadId).order('created_at', { ascending: false })` |
| 12 | `syncLeadStatusFromProjects(leadId)` | Query projects, derive status, update lead. **ATENÇÃO**: substituir `arrayUnion('cliente')` por array concat: buscar tags atual, append 'cliente' se não existe |
| 13 | `markProjectAsDelivered(leadId, projectId, by?)` | Update project + sync lead status |
| 14 | `completeClient(leadId, projectId?, paymentBy?)` | Update project payment + sync lead. **ATENÇÃO**: mesma lógica de tags array |
| 15 | `getClientsByAttendant(psId)` | `supabase.from('leads').select('*').eq('post_sales_id', psId).in('client_status', [...ACTIVE, 'concluido']).order('updated_at', { ascending: false })` |
| 16 | `subscribeToClientsByAttendant(psId, cb)` | Realtime channel `'postsales-clients-${psId}'` |
| 17 | `requestRevision(leadId, projectId, reason?)` | Update lead + update project revision fields + **INSERT em `revision_history`** (substituindo arrayUnion) |
| 18 | `approveClient(leadId, projectId?)` | Update lead + update project approval |

#### ⚠️ Pontos críticos
1. **`arrayUnion`** → No Supabase, não existe arrayUnion. Para `tags`, faça: buscar array atual, verificar se valor existe, append, save. Para `previousPostSalesIds`, mesmo padrão.
2. **`revisionHistory` (arrayUnion)** → No Supabase, INSERT na tabela `revision_history` em vez de array-push no documento.
3. **`ProjectStatusPageService.syncFromProjectId()`** → Esse import continua igual, o service já foi reescrito para Supabase.

### PostSalesInboxService.ts

| # | Função | Firebase → Supabase |
|---|--------|---------------------|
| 1 | `subscribeToConversations(psId, cb)` | Query + Realtime: `supabase.from('conversations').select('*').eq('context', 'post_sales').eq('status', 'open')` + filtro `assigned_to` se psId != null, ou filtro NOT assigned se null |
| 2 | `subscribeToDistributionQueue(cb)` | Chama `subscribeToConversations(null, cb)` — **sem mudança** |
| 3 | `assignConversation(convId, psId)` | `supabase.from('conversations').update({ assigned_to: psId, post_sales_id: psId, updated_at }).eq('id', convId)` |
| 4 | `getConversationCounts(cb)` | Query todas conversations post_sales open + Realtime, agrupa counts por `assigned_to` no frontend |

---

## ✅ Checklist Final

- [ ] ZERO imports de `firebase/firestore` ou `@/config/firebase`
- [ ] Único import: `import { supabase } from '@/config/supabase'`
- [ ] Manter import de tipos: `Lead`, `ClientStatus`, `Project`, `Conversation`
- [ ] Manter import de `ProjectStatusPageService` (já Supabase)
- [ ] Helper `rowToLead()` e `rowToProject()` para converter snake_case → camelCase
- [ ] Todos os subscribes retornam cleanup function: `() => supabase.removeChannel(channel)`
- [ ] `arrayUnion` substituído por array concat (fetch, append, save)
- [ ] `revisionHistory` arrayUnion substituído por INSERT em tabela `revision_history`
- [ ] Datas: `new Date(row.xxx)` ao ler, `.toISOString()` ao escrever
- [ ] Todos os nomes de funções exportadas ficam **exatamente iguais**
- [ ] Todos os tipos de retorno ficam **exatamente iguais**
- [ ] Error handling: `if (error) throw error`
