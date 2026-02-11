# 🤖 Roo Code Task — Migração Firebase → Supabase (Batches 5, 6 e 7)

## Contexto

O Nobre Hub está migrando de Firebase para Supabase. Outro agente (Antigravity) está trabalhando nos Batches 1-4 **em outros arquivos**. Você é responsável pelos **Batches 5, 6 e 7**.

### Setup Supabase existente:
- **Client:** `src/config/supabase.ts` (já configurado)
- **Types:** `src/types/supabase.ts` (gerado)
- **Tabelas existentes:** conversations, leads, messages, pipeline_stages, pipelines, products, projects, settings, team_messages, users, user_goals
- **Novas tabelas** serão criadas pelo Antigravity (Batch 1) — **espere confirmação antes de começar o Batch 6**

---

## Padrão de Migração

### 1. Imports
```ts
// ❌ ANTES (Firebase):
import { getFirestoreDb } from '@/config/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

// ✅ DEPOIS (Supabase):
import { supabase } from '@/config/supabase';
```

### 2. Queries
```ts
// ❌ ANTES:
const q = query(collection(db, 'tabela'), orderBy('createdAt', 'desc'));
const snapshot = await getDocs(q);
return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

// ✅ DEPOIS:
const { data, error } = await supabase
  .from('tabela')
  .select('*')
  .order('created_at', { ascending: false });
if (error) throw error;
return (data || []).map(row => ({ id: row.id, name: row.name, ... }));
```

### 3. Realtime (onSnapshot → Supabase Realtime)
```ts
// ❌ ANTES:
const unsubscribe = onSnapshot(q, (snapshot) => { ... });

// ✅ DEPOIS:
// Fetch inicial
const { data } = await supabase.from('tabela').select('*');
callback(data || []);

// Subscription
const channel = supabase.channel('nome-canal')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'tabela' }, (payload) => {
    // Re-fetch or update local state
  })
  .subscribe();

// Unsubscribe:
return () => { supabase.removeChannel(channel); };
```

### 4. Regras gerais
- Timestamps: `Timestamp.now()` → `new Date().toISOString()`
- Colunas: camelCase → snake_case
- Remover `console.log` de debug
- Manter mesma interface pública (nomes de funções, tipos de retorno)

---

## Batch 5: Presence & Typing (3 arquivos)

### `src/features/presence/services/TypingService.ts` (112 linhas)
Firebase RTDB → **Supabase Realtime Broadcast**

- `startTyping(chatId, userId, name)` → criar/usar canal `supabase.channel('typing:${chatId}')`, enviar `channel.send({ type: 'broadcast', event: 'typing', payload: { userId, name, timestamp: Date.now() } })`
- `stopTyping(chatId, userId)` → `channel.send({ type: 'broadcast', event: 'stop_typing', payload: { userId } })`
- `subscribeToTyping(chatId, currentUserId, callback)` → `channel.on('broadcast', { event: 'typing' }, ({payload}) => { ... })`. Manter filtro de stale threshold (5s) e filtro do currentUser
- `onDisconnect` → não necessário (broadcast é efêmero, typing para quando para de enviar)

### `src/features/presence/hooks/usePresence.ts` (72 linhas)
Firebase RTDB → **Supabase Realtime Presence**

```ts
// Canal global de presença
const channel = supabase.channel('presence', {
  config: { presence: { key: userId } }
});

// Online:
channel.track({ state: 'online', last_changed: Date.now() });

// visibilitychange → idle/online:
channel.track({ state: 'idle', last_changed: Date.now() });
channel.track({ state: 'online', last_changed: Date.now() });

// Cleanup ao desconectar: automático no Supabase Presence
```

- **NÃO** usar Firebase Auth direto. Pegar user de `useAuthStore`:
  ```ts
  import { useAuthStore } from '@/stores/useAuthStore';
  const user = useAuthStore.getState().user;
  ```

### `src/features/presence/hooks/useTeamStatus.ts` (32 linhas)
Firebase RTDB `/status` → **Supabase Realtime Presence sync**

- Subscribe ao canal 'presence'
- `channel.on('presence', { event: 'sync' }, () => { const state = channel.presenceState(); ... })`
- Converter presenceState para `Record<string, UserStatus>`

---

## Batch 6: Goal Tracking + Dashboard (2 arquivos)

> ⚠️ **ESPERE** as novas tabelas serem criadas antes de começar este batch

### `src/features/settings/services/goalTrackingService.ts` (378 linhas)
- Trocar `getFirestore()` / `collection/getDocs/query/where` por Supabase
- Tabelas usadas: `projects`, `leads`, `conversations`, `strategic_projects` (nova), `strategic_tasks` (nova)
- Manter TODA lógica de cálculo (`pct()`, `getWorkdaysInPeriod()`, sector IDs)
- Queries:
  - `_computeProductionProgress()` → `supabase.from('projects').select('*').eq('producer_id', collabId).gte('created_at', start).lte('created_at', end)`
  - `_computeSalesProgress()` → `supabase.from('leads').select('*').eq('seller_id', collabId).gte('created_at', monthStart)`
  - `_computePostSalesProgress()` → `supabase.from('leads').select('*').eq('post_sales_id', collabId)`
  - `_computeStrategicProgress()` → `supabase.from('strategic_tasks').select('*').in('project_id', projectIds)`

### `src/features/dashboard/services/DashboardAnalyticsService.ts` (1233 linhas)
- **O MAIOR arquivo** — trocar TODAS queries Firestore por Supabase
- Manter types (ProductionMetrics, SalesMetrics, etc.) e lógica de cálculo INTACTOS
- Trocar apenas data fetching:
  - `collection(db, PROJECTS_COLLECTION)` → `supabase.from('projects')`
  - `collection(db, 'leads')` → `supabase.from('leads')`
  - `collection(db, 'users')` → `supabase.from('users')`
  - Filtros de data: `.where('createdAt', '>=', start)` → `.gte('created_at', start.toISOString())`
  - `arrayUnion` → não se aplica (usar `supabase.rpc()` ou array operations se necessário)

---

## Batch 7: Component Cleanup (6 arquivos)

### `src/features/production/components/ProjectBoard.tsx`
- Remover `import { arrayUnion } from 'firebase/firestore'` (importado mas não usado)

### `src/features/production/components/CreateProjectModal.tsx`
- Remover `import { arrayUnion } from 'firebase/firestore'` (idem)

### `src/features/production/components/ProducersSidebar.tsx`
- Trocar imports Firebase (`collection, onSnapshot, query, where` + `db`)
- A subscription de projetos por produtor → usar `supabase.from('projects').select('*')` + Supabase Realtime, OU usar o `useProductionStore` que já é Supabase

### `src/features/team/components/CollaboratorProfileModal.tsx`
- Trocar `import { collection, getDocs, query, where } from 'firebase/firestore'`
- Queries Firestore diretas → `supabase.from('tabela').select('*').eq('campo', valor)`

### `src/pages/DataImportPage.tsx`
- `writeBatch` → `supabase.from('tabela').upsert([...array])` (bulk insert)
- Adaptar toda lógica de importação

### `src/pages/DatabasePage.tsx`
- CRUD Firestore → Supabase queries CRUD

---

## ⛔ NÃO TOCAR NESSES ARQUIVOS (Antigravity está editando)

- `src/features/settings/services/RoleService.ts`
- `src/features/settings/services/SectorService.ts`
- `src/features/settings/services/PermissionService.ts`
- `src/features/settings/services/OrganizationService.ts`
- `src/features/settings/services/holidaysService.ts`
- `src/features/strategic/services/SocialMediaService.ts`
- `src/features/strategic/services/StrategicProjectsService.ts`
- `src/features/strategic/services/NotesService.ts`
- `src/features/strategic/services/NotesRealtimeService.ts`
- `src/features/pos-vendas/services/PostSalesInboxService.ts`
- `src/features/pos-vendas/services/PostSalesDistributionService.ts`
- `src/config/firebase.ts`

---

## Regras

1. **NÃO** faça `git commit` — o outro agente fará no final
2. **NÃO** crie arquivos novos fora dos existentes
3. **NÃO** edite arquivos da lista "NÃO TOCAR"
4. Use variáveis CSS do design system (`var(--color-*)`) — nunca hardcode cores
5. Mantenha a mesma interface pública de cada service
6. Se precisar de uma tabela que não existe ainda, **pare e pergunte**
