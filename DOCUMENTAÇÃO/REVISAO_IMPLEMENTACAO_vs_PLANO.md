# 🔍 REVISÃO COMPLETA: Implementação vs Plano Original

> **Data:** 2026-01-21
> **Referência:** `implementation_plan.md.resolved`
> **Objetivo:** Identificar TODOS os gaps entre o que foi planejado (baseado no Clint CRM) e o que foi implementado

---

## ⚠️ RESUMO EXECUTIVO

| Categoria | Status |
|-----------|--------|
| FASE 0: Backend | ✅ OK |
| FASE 1: Atendimento MVP | ⚠️ Parcial |
| FASE 1.5: Pós-MVP | ⚠️ Parcial |
| FASE 2: Modal Lead 360° | ❌ Incompleto |
| FASE 3: Lista de Contatos | ⚠️ Parcial |
| FASE 4: Kanban Melhorado | ❌ Incompleto |

---

## 🔴 GAPS CRÍTICOS

### 1. FASE 2: Modal Lead 360° - Aba "Atividades"

**Plano dizia:**
- "Playbook genérico (tarefas por etapa)"

**O que foi implementado:**
- Apenas cards estatísticos (Valor Estimado, Negócios Ativos, Conversas)
- Resumo do Lead (Pipeline, Origem, Data)
- Lista de Atividade Recente

**O que está FALTANDO:**
- ❌ **Playbook de tarefas** - Sistema de tarefas/checklist por etapa do funil
- ❌ **Orientação de ações** - O que fazer em cada etapa (ex: "Ligar para o lead", "Enviar proposta")

---

### 2. FASE 2: Modal Lead 360° - Aba "Conversas"

**Plano dizia:**
- "Chat WhatsApp embutido"

**O que foi implementado:**
- Lista de conversas com status (cards)
- Nenhuma ação ao clicar

**O que está FALTANDO:**
- ❌ **Chat embutido** - Deveria poder ver/responder mensagens dentro do modal
- ❌ **Visualização de mensagens** - Não mostra histórico de mensagens
- ❌ **Ação de clique** - Clicar na conversa não faz nada

---

### 3. FASE 2: Modal Lead 360° - Aba "Empresa"

**Plano dizia:**
- "Campos PJ editáveis"

**O que foi implementado:**
- Campos placeholder fixos (CNPJ, Segmento, Funcionários)
- Não são editáveis
- Dados são estáticos

**O que está FALTANDO:**
- ❌ **Campos reais editáveis** - CNPJ, Razão Social, Nome Fantasia, Segmento, etc.
- ❌ **Integração com dados da empresa** - Buscar dados do lead.company

---

### 4. FASE 4: Kanban Melhorado

**Plano dizia:**
- "Sidebar para alternar pipelines (HT/LT/Prod/Pós)"
- "Cards com info do Deal"
- "Filtros no header"

**O que foi implementado:**
- Tabs no TOPO (não sidebar)
- Cards com info do LEAD (não Deal)
- Filtros básicos (Origem, Valor, Tags)

**O que está FALTANDO:**
- ❌ **Sidebar de pipelines** - Não tem sidebar, só tabs
- ❌ **Cards com Deal info** - Cards mostram Lead, não o Deal específico associado
- ⚠️ Filtros existem mas são diferentes do planejado

---

### 5. Filtros na Lista de Conversas (1.3)

**Plano dizia:**
- Atribuídas a mim (toggle)
- Não atribuídas
- Não lidas
- Em espera
- Filtro por setor
- Filtro por data

**O que foi implementado:**
- Status (Todos, Ativos, Em espera, Na fila)
- Pipeline (Todos, High Ticket, Low Ticket)
- Janela 24h (Todas, Dentro, Fora)
- Resposta (Todos, Respondidos, Aguardando)

**O que está FALTANDO:**
- ❌ **Atribuídas a mim** - Toggle específico
- ❌ **Não lidas** - Filtro por mensagens não lidas
- ❌ **Filtro por setor** - Não implementado
- ❌ **Filtro por data** - Não implementado

---

## 🟡 BUGS E PROBLEMAS DE UX

### 1. Dropdown de Etapa não persiste seleção ❌

**Arquivo:** `CRMSidebar.tsx` (linha 418)
**Problema:** O dropdown mostra "Selecione" em vez da etapa atual quando `currentStatus` não bate com nenhum stage.

**Código atual:**
```tsx
{stages.find(s => s.value === currentStatus)?.label || 'Selecione'}
```

**Causa raiz:** `currentStatus` pode estar undefined ou com valor diferente do esperado.

---

### 2. Quick Actions do LeadCard não funcionam ❌

**Arquivo:** `LeadCard.tsx` (linhas 162-191)
**Problema:** Os 3 botões (Chat, Calendário, Mais opções) têm `// TODO` e não fazem nada.

```tsx
// TODO: Open chat
// TODO: Schedule task
// TODO: More options
```

---

### 3. Cor de fundo das colunas do Kanban

**Arquivo:** `KanbanColumn.tsx` (linha 77)
**Problema:** Usuário quer remover cor de fundo, manter apenas bolinhas coloridas.

**Código atual:**
```tsx
colorClasses.headerBg  // bg-slate-50, bg-amber-50, etc.
```

---

### 4. Botão "Novo Negócio" no Lead360Modal não funciona ❌

**Arquivo:** `Lead360Modal.tsx` (linha 492-494)
**Problema:** O botão não tem onClick handler.

```tsx
<button className="...">
    <Plus size={14} /> Novo Negócio
</button>  // SEM onClick!
```

---

## 📋 LISTA COMPLETA DE CORREÇÕES NECESSÁRIAS

### 🔴 Prioridade ALTA (Funcionalidade Core)

| # | Componente | Problema | Ação |
|---|------------|----------|------|
| 1 | Lead360Modal | Aba Atividades sem Playbook | Implementar sistema de tarefas por etapa |
| 2 | Lead360Modal | Aba Conversas sem chat embutido | Embutir ChatView ou mostrar mensagens |
| 3 | Lead360Modal | Aba Empresa com placeholders | Fazer editável com dados reais |
| 4 | LeadCard | Quick Actions não funcionam | Implementar Chat, Agendar, Menu |
| 5 | CRMSidebar | Dropdown etapa volta "Selecione" | Corrigir lógica de currentStatus |
| 6 | Lead360Modal | Botão "Novo Negócio" sem ação | Adicionar modal de criação |

### 🟡 Prioridade MÉDIA (UX/UI)

| # | Componente | Problema | Ação |
|---|------------|----------|------|
| 7 | KanbanColumn | Fundo colorido nas colunas | Remover headerBg, manter só dot |
| 8 | Kanban | Não tem sidebar de pipelines | Avaliar se mantém tabs ou muda |
| 9 | ConversationList | Filtros diferentes do plano | Adicionar: Não lidas, Por setor, Por data |

### 🟢 Prioridade BAIXA (Melhorias)

| # | Componente | Problema | Ação |
|---|------------|----------|------|
| 10 | Kanban | Cards mostram Lead, não Deal | Considerar refatorar para Deal-centric |
| 11 | Lead360Modal | Clique em conversa não faz nada | Navegar para chat ou abrir inline |

---

## 📁 ARQUIVOS A MODIFICAR

```
Frontend:
├── src/components/Lead360Modal.tsx
│   ├── Aba Atividades: Adicionar Playbook
│   ├── Aba Conversas: Embutir chat
│   ├── Aba Empresa: Campos editáveis
│   └── Botão Novo Negócio: Adicionar handler
│
├── src/components/kanban/LeadCard.tsx
│   └── Quick Actions: Implementar handlers
│
├── src/components/kanban/KanbanColumn.tsx
│   └── Remover fundo colorido do header
│
├── src/components/chat/CRMSidebar.tsx
│   └── Corrigir dropdown de etapa
│
└── src/components/chat-layout/ConversationList.tsx
    └── Adicionar filtros faltantes
```

---

## ❓ DECISÕES PENDENTES

1. **Kanban: Sidebar vs Tabs?**
   - Plano dizia Sidebar, implementado com Tabs
   - Manter tabs ou mudar para sidebar?

2. **Playbook: Como implementar?**
   - Tarefas dinâmicas por etapa?
   - Checklist fixo por tipo de pipeline?
   - Integração com tarefas externas?

3. **Chat embutido: Completo ou Preview?**
   - Chat completo inline no modal?
   - Apenas preview + botão para abrir tela de atendimento?

---

## ✅ O QUE ESTÁ FUNCIONANDO CORRETAMENTE

- ✅ Backend: Deal, LeadHistory, ScheduledMessage models
- ✅ CRUD de Deals funcionando
- ✅ Histórico de ações sendo registrado
- ✅ Lead360Modal: Abas Contato, Negócio, Histórico
- ✅ CRMSidebar: Seções colapsáveis, edição inline
- ✅ Kanban: Drag & drop, filtros básicos
- ✅ ConversationList: Tabs Meus/Fila, busca
