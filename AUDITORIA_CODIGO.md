# 🔍 Nobre Hub CRM - Auditoria Completa de Código

> **Data:** 27 de Janeiro de 2026  
> **Objetivo:** Identificar otimizações, código obsoleto, e melhorias a serem implementadas

---

## 📊 Visão Geral do Projeto

| Métrica | Valor |
|---------|-------|
| **Total de Arquivos TS/TSX** | 91 |
| **Maior Componente** | `supabaseApi.ts` (1359 linhas) |
| **Componentes > 700 linhas** | 4 (ChatView, Kanban, Lead360Modal, supabaseApi) |
| **Hooks Customizados** | 9 |
| **Arquivos com console.log** | 16 |
| **Arquivos com referência a Socket** | 17 |

---

## 🚨 Prioridade CRÍTICA

### 1. Código Obsoleto - Socket.IO

**Problema:** O projeto migrou para 100% serverless (Supabase + Firebase), mas ainda possui referências a Socket.IO que não são mais utilizadas.

**Arquivos afetados:**
- `src/hooks/useSocket.ts` - **DELETAR**
- `src/hooks/useTypingIndicator.ts` - **DELETAR ou migrar para Firebase**
- `src/hooks/useRealtimeMessages.ts` - Verificar se usa Socket
- `src/hooks/useRealtimeKanban.ts` - Verificar se usa Socket
- `src/hooks/usePresence.ts` - Verificar se usa Socket
- `src/hooks/useRealtimeNotifications.ts` - Verificar se usa Socket

**Impacto:** Bundle size inflado, código morto, potenciais erros silenciosos.

---

### 2. Console.log em Produção

**Problema:** 16 arquivos contêm `console.log` que:
- Expõem informações sensíveis (tokens, dados de usuários)
- Poluem o console do usuário

**Arquivos afetados:**
- `supabaseAuth.ts` - Logs de autenticação
- `supabaseApi.ts` - Logs de API
- `firebase.ts` / `FirebaseContext.tsx` - Logs de conexão
- Múltiplos hooks de realtime
- `Kanban.tsx`, `ChatView.tsx`, `Inbox.tsx`, `Analytics.tsx`

---

## ⚠️ Prioridade ALTA

### 3. Componentes Gigantes - Violação Single Responsibility

| Componente | Linhas | Recomendação |
|------------|--------|--------------|
| `supabaseApi.ts` | 1359 | Dividir por domínio (leads, users, conversations) |
| `ChatView.tsx` | 869 | Extrair: MessageInput, ChatHeader, QuickActions |
| `Kanban.tsx` | 797 | Extrair: KanbanFilters, stage management |
| `Lead360Modal.tsx` | 710 | Já usa tabs, mas pode extrair mais |

---

### 4. Falta de Error Boundaries

**Problema:** Nenhum Error Boundary implementado. Um erro em qualquer componente pode crashar toda a aplicação.

---

### 5. Falta de Loading States Consistentes

**Problema:** Cada componente implementa seu próprio loading state de forma diferente.

---

## 🔶 Prioridade MÉDIA

### 6. Database - Falta de Indexes

**Verificar indexes para:**
- `leads.assigned_to` (FK lookup)
- `leads.pipeline` (filtro frequente)
- `leads.created_at` (ordenação)
- `conversations.status` (filtro frequente)
- `messages.conversation_id` (FK lookup)

---

### 7. RLS (Row Level Security) Desabilitado

**Problema:** A tabela `users` está com RLS desabilitado, expondo todos os dados.

---

### 8. Tipagem Inconsistente

**Problema:** Alguns componentes definem interfaces locais que duplicam `src/types/models.ts`.

**Exemplos:**
- `ChatView.tsx` define `Message` e `Conversation` localmente
- `Lead360Modal.tsx` define `Deal`, `Lead`, `Conversation` localmente

---

## 🟢 Prioridade BAIXA

### 9. Bundle Size

**Otimizações possíveis:**
- `@dnd-kit/core` - Carregado mesmo sem drag (usar dynamic import)
- `recharts` - Carregado mesmo sem dashboard (usar dynamic import)
- `framer-motion` - Verificar se todas animações são necessárias

---

### 10. Acessibilidade (a11y)

**Verificar:**
- Todos os botões têm `aria-label`
- Modals têm `role="dialog"` e `aria-modal`
- Inputs têm `labels` associados

---

### 11. Testing

**Problema:** Não há testes implementados.

---

## 📋 Checklist de Ações

### Imediato (esta semana)
- [ ] Remover `useSocket.ts` e `useTypingIndicator.ts`
- [ ] Substituir console.log por logger condicional
- [ ] Habilitar RLS na tabela `users`
- [ ] Adicionar Error Boundary no App.tsx

### Curto Prazo (próximas 2 semanas)
- [ ] Dividir `supabaseApi.ts` em módulos menores
- [ ] Extrair sub-componentes de ChatView e Kanban
- [ ] Criar indexes no banco de dados
- [ ] Unificar tipagem usando `types/models.ts`

### Médio Prazo (próximo mês)
- [ ] Implementar lazy loading para Analytics e FlowBuilder
- [ ] Criar design system de loading states
- [ ] Adicionar testes básicos para componentes críticos

---

## 🎯 Skills Aplicáveis

| Skill | Uso |
|-------|-----|
| `vercel-react-best-practices` | Otimização de re-renders, bundle size, async patterns |
| `supabase-postgres-best-practices` | Indexes, RLS, query optimization |
| `frontend-design` | Consistência visual, loading states |
| `git-workflow` | Commits semânticos durante refactoring |

---

*Documento gerado como parte da auditoria de código do Nobre Hub CRM*
