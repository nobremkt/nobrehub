# Inbox WhatsApp — Plano de Implementação (v2)

Plano consolidado com análises de ambos os agentes. Prioridade corrigida: **fundação primeiro, features depois**.

---

## P0 — Integridade de Dados (Imediato)

Bugs silenciosos que podem causar dados corrompidos ou perda de mensagens.

---

### P0.1: Fix Status Contract Mismatch

**Problema:** `whatsappHelper.ts` L79 escreve `status: 'error'`, mas o type `Message.status` declara `'failed'`. `scheduleMessage` escreve `'scheduled'` que nem existe no union type.

#### [MODIFY] `src/features/inbox/types.ts`
- Adicionar `'scheduled'` ao union de `Message.status` e padronizar `'error'` → `'failed'`

#### [MODIFY] `src/features/inbox/services/whatsappHelper.ts` (L79)
- Trocar `status: 'error'` → `status: 'failed'`

#### [MODIFY] `src/features/inbox/services/inboxMessageService.ts` (L138)
- `scheduleMessage`: confirmar que usa `'scheduled'` (precisa existir no type)

---

### P0.2: Fix Sender UUID Integrity

**Problema:** `ChatView.tsx` L207 passa literal `'agent'` como `senderId` onde o schema espera UUID.

#### [MODIFY] `src/features/inbox/components/ChatView/ChatView.tsx` (L207)
- Remover literal `'agent'`, deixar `senderId` undefined para que `inboxMessageService` resolva via `getCurrentUserId()`

---

### P0.3: Webhook Idempotency

**Problema:** Se WhatsApp reenvia webhook (retry), `processIncomingMessage()` pode duplicar mensagens. Sem unique constraint em `whatsapp_message_id`.

#### [MODIFY] `api/webhook.js`
- Adicionar check: `SELECT id FROM messages WHERE whatsapp_message_id = ?` antes de insert
- Se já existe, skip insert

#### Supabase Migration
- `ALTER TABLE messages ADD CONSTRAINT messages_whatsapp_message_id_unique UNIQUE (whatsapp_message_id)` (partial unique index se coluna permite null)

---

### P0.4: Alinhar Policy Documentation

**Problema:** `WHATSAPP_POLICY.md` pode divergir da implementação real em `ChatView.tsx` L99-100 (mudança de 13/02).

#### [MODIFY] `docs/WHATSAPP_POLICY.md`
- Atualizar para refletir que `needsTemplateFirst` NÃO bloqueia input quando janela está aberta (correção 13/02)

---

## P1 — Features de Valor Alto (Curto Prazo)

Features que impactam diretamente a operação do time.

---

### P1.1: Template Parameters Avançados 🔴

**Gap:** Nosso `SendTemplateModal` já tem split-view + live preview (melhor UX que referência), mas só suporta BODY positional `{{1}}`. Faltam HEADER params, BUTTON params, named params, e category badges.

#### [MODIFY] `src/features/inbox/components/SendTemplateModal/SendTemplateModal.tsx`
- Refatorar parser para multi-componente (HEADER/BODY/BUTTON sections)
- Suporte a named params `{{nome}}` além de `{{1}}`
- Category badges coloridos: MARKETING=azul, UTILITY=verde, AUTHENTICATION=roxo
- Preview multi-seção: header separado do body

#### [MODIFY] `src/features/inbox/components/SendTemplateModal/SendTemplateModal.module.css`
- Estilos para seções de variáveis por componente + badges

#### [MODIFY] `src/features/inbox/types.ts`
- Expandir `MessageTemplate` com `components[]`, `language`, `category`

> **⚠️ IMPORTANTE:** Depende do endpoint `api/get-templates.js` — preciso verificar se retorna `components[]` da 360Dialog. Se não, ajustar API primeiro.

---

### P1.2: Mensagens Interativas com Botões 🔴

**Gap:** Feature completamente nova. Permite enviar mensagens com 1-3 botões clicáveis.

#### [NEW] `src/features/inbox/components/InteractiveMessageModal/InteractiveMessageModal.tsx`
- Dialog: header (opcional) + body (obrigatório) + 1-3 botões
- Cada botão: ID + título (máx 20 chars com contador visual)
- Botão "Adicionar botão" com limite max 3
- Validação + loading state

#### [NEW] `src/features/inbox/components/InteractiveMessageModal/InteractiveMessageModal.module.css`

#### [NEW] `api/send-interactive.js`
- Payload: `{ type: "button", header, body, action: { buttons } }`

#### [MODIFY] `src/features/inbox/types.ts` — `'interactive'` no union type

#### [MODIFY] `src/features/inbox/services/inboxMessageService.ts` — novo `sendInteractiveMessage()`

#### [MODIFY] `src/features/inbox/services/whatsappHelper.ts` — `'/api/send-interactive'` no union

#### [MODIFY] `src/features/inbox/components/ChatView/ChatView.tsx` — estado + handler + render

#### [MODIFY] `src/features/inbox/components/ChatView/ChatInput.tsx` — nova prop `onOpenInteractive` + item no attachment menu

---

### P1.3: Failed Message Indicator Melhorado 🟡

**Gap:** Nosso `ChatBubble` mostra só `!` pra mensagens falhas. Referência mostra `❌ "Not delivered"`.

#### [MODIFY] `src/design-system/components/Chat/ChatBubble.tsx` (L184)
- Trocar `<span>!</span>` por `<AlertCircle size={14} />` com tooltip "Não entregue"
- Adicionar estilo vermelho claro no ícone

---

## P2 — Polish e Hardening (Próximo)

Melhorias de UX e segurança para escala.

---

### P2.1: RLS Scoped

**Gap:** Migrations `20260213_allow_all_authenticated_read.sql` são permissivas demais.

- Scoped policies: `SELECT` em `conversations` limitado a `assigned_to = auth.uid()` ou `assigned_to IS NULL`
- `SELECT` em `messages` limitado a conversations que o user tem acesso

---

### P2.2: Tab Visibility Pause

#### [NEW] `src/features/inbox/hooks/useVisibilityPause.ts`
- Hook que detecta `document.hidden` e dispara callbacks de pause/resume
- Integrar com subscriptions do Supabase Realtime pra economizar bandwidth

---

### P2.3: Reactions Rendering

#### [MODIFY] `src/features/inbox/components/ChatView/ChatView.tsx` — `reactionsMap` de mensagens `type === 'reaction'` → prop pra `MessageBubble`

#### [MODIFY] `src/features/inbox/components/ChatView/MessageBubble.tsx` — emoji badge flutuante

#### [MODIFY] `src/features/inbox/types.ts` — `'reaction'` no union type

---

### P2.4: Observability (Correlation IDs)

- Adicionar `requestId` a cada chamada de API (`send-message.js`, `send-template.js`, `webhook.js`)
- Logar `conversationId + messageId + whatsappMessageId` em todas as operações

---

## ✅ Descartado (nosso já é melhor)

| Feature | Motivo |
|---------|--------|
| Smart Auto-Scroll | Nosso tem `isNearBottom` + `isInitialScrollRef` + media load listener + double rAF |
| Media Preview | Nosso tem view-once toggle + caption counter + document info |
| Conversation List | Nosso tem 4 filtros + fixados + contadores + atribuição |
| Date Separators | Equivalente — só difere idioma (pt-BR vs en) |
| Auto-Polling | Nosso usa Supabase Realtime (superior a polling) |

---

## Verification Plan

### Após cada P-level
```bash
npm run build  # Zero TS errors
```

### P0: Verificação de integridade
- Enviar mensagem com WhatsApp desligado → status deve ser `failed` (não `error`)
- Enviar mídia → `senderId` deve ser UUID (verificar no Supabase)
- Enviar mesmo webhook 2x → deve criar apenas 1 mensagem

### P1: Verificação funcional
- Template com HEADER params → seção separada no modal
- Template com BUTTON params → input por botão no modal
- Mensagem interativa → dialog funcional com 1-3 botões

### P2: Verificação de UX
- Reação emoji no celular → badge aparece na bolha correspondente
- Trocar de aba → verificar no DevTools que requests param

---

## 🔁 Adendo Prioritário — Lead360 + Kanban (consistência de status)

Solicitações adicionadas ao plano para evitar divergência entre modal e board:

### A1. Reposicionar abas do Lead360 no header

**Objetivo:** mover as abas do modal para a área superior junto do bloco de identidade/ações, reduzindo quebra visual entre header e navegação.

#### [MODIFY] `src/features/crm/components/Lead360Modal/Lead360Modal.tsx`
- Integrar `tabsNav` no bloco superior do modal (header zone)
- Manter comportamento atual de navegação por tab

#### [MODIFY] `src/features/crm/components/Lead360Modal/Lead360Modal.module.css`
- Ajustar layout para header em duas linhas (identidade/ações + tabs)
- Preservar responsividade e sticky behavior das abas

---

### A2. Adicionar ação de status "Aberto" no Lead360

**Objetivo:** além de `Ganho` e `Perdido`, permitir retorno explícito para `Aberto` via UI do modal.

#### [MODIFY] `src/features/crm/components/Lead360Modal/components/LeadHeader/LeadHeader.tsx`
- Adicionar botão `Aberto` na régua de status
- Disparar `onStatusChange('open')`

#### [MODIFY] `src/features/crm/components/Lead360Modal/components/LeadHeader/LeadHeader.module.css`
- Estilo neutro para botão `Aberto` (estado ativo/inativo)
- Hierarquia visual clara entre `Aberto`, `Ganho`, `Perdido`

#### [MODIFY] `src/features/crm/components/Lead360Modal/Lead360Modal.tsx`
- Corrigir `handleStatusChange()` para tratar `open` explicitamente (sem cair no fluxo de perdido)
- Ao marcar `open`, limpar campos de fechamento/perda (`dealStatus`, `dealClosedAt`, `lostAt`, `lostReason`)
- Mover lead para etapa não-terminal adequada do pipeline (regra a definir: primeira etapa ativa ou última etapa não-terminal)

---

### A3. Corrigir inconsistência Kanban ↔ Lead360 (bug reportado)

**Bug atual:**
- Marcar `Ganho` no modal move corretamente para coluna Ganho.
- Porém, se mover o lead no Kanban para outra coluna, o modal continua com `dealStatus = 'won'`.

**Objetivo:** sempre manter `dealStatus` coerente com a coluna/etapa atual.

#### [MODIFY] `src/features/crm/stores/useKanbanStore.ts`
- Em `moveLead()` e `reorderLead()`, sincronizar `dealStatus` conforme etapa destino:
  - etapa `Ganho` → `dealStatus = 'won'`
  - etapa `Perdido` → `dealStatus = 'lost'`
  - demais etapas → `dealStatus = 'open'`
- Persistir essas mudanças no mesmo ciclo de sync com backend

#### [MODIFY] `src/features/crm/services/LeadService.ts` (se necessário)
- Garantir suporte de update parcial consistente para campos de deal/loss no mesmo patch

---

## ✅ Critérios de Aceite (Adendo A1–A3)

1. Tabs do Lead360 aparecem no header superior sem regressão de navegação.
2. Botão `Aberto` funciona e reflete estado ativo corretamente no modal.
3. Mover lead no Kanban atualiza `dealStatus` de forma consistente (modal e board sempre sincronizados).
4. Fluxo completo validado:
   - Ganho no modal → Kanban em Ganho.
   - Mover para etapa não-terminal no Kanban → modal volta para Aberto.
   - Perdido no modal → Kanban em Perdido + motivo persistido.
