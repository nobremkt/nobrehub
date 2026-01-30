# 📬 Plano de Implementação: Inbox Module

> **Data:** 2026-01-30  
> **Status:** Em Planejamento  
> **Prioridade:** Alta

---

## 📋 Objetivo

Implementar o módulo **Inbox** - Central de Mensagens do Nobre Hub, permitindo:
- Visualização de todas as conversas do WhatsApp
- Chat em tempo real com leads
- Envio de mensagens (texto, áudio, imagem, documento)
- Templates de mensagens rápidas
- Atribuição/transferência de conversas

---

## 🎯 Escopo (baseado em `nobre_hub_features.md`)

### Lista de Conversas
- [x] Ordenação por última mensagem
- [x] Indicador de não lidas
- [x] Filtros: todas, não lidas, minhas
- [x] Busca por nome/telefone

### Chat View
- [x] Histórico de mensagens
- [x] Envio de texto, áudio, imagem, documento
- [x] Templates de mensagem rápida
- [x] Indicador de digitação (typing)
- [x] Agendamento de mensagens
- [x] Sidebar com contexto do lead

### Atribuição
- [x] Atribuir conversa para si
- [x] Transferir para outro atendente

---

## 📁 Arquivos a Criar

### Feature Structure
```
src/features/inbox/
├── index.ts                      # Barrel export
├── types.ts                      # Types específicos do Inbox
├── pages/
│   └── InboxPage.tsx             # Página principal
├── components/
│   ├── ConversationList/
│   │   ├── ConversationList.tsx
│   │   ├── ConversationList.module.css
│   │   └── ConversationItem.tsx
│   ├── ChatView/
│   │   ├── ChatView.tsx
│   │   ├── ChatView.module.css
│   │   ├── MessageBubble.tsx
│   │   ├── ChatInput.tsx
│   │   └── ChatHeader.tsx
│   ├── LeadSidebar/
│   │   ├── LeadSidebar.tsx
│   │   └── LeadSidebar.module.css
│   ├── TemplatesPopover/
│   │   └── TemplatesPopover.tsx
│   └── AssignmentModal/
│       └── AssignmentModal.tsx
├── hooks/
│   ├── useConversations.ts       # Hook para listar conversas
│   ├── useMessages.ts            # Hook para mensagens de uma conversa
│   └── useMessageSend.ts         # Hook para envio
├── services/
│   ├── conversationService.ts    # CRUD Firestore
│   └── messageService.ts         # Mensagens Firestore + WhatsApp
└── stores/
    └── useInboxStore.ts          # Estado global do Inbox
```

---

## 📝 Arquivos a Modificar

| Arquivo | Modificação |
|---------|-------------|
| `src/app/App.tsx` | Adicionar rota real `/inbox/*` → `InboxPage` |
| `src/types/index.ts` | Re-exportar types do Inbox |

---

## 🔧 Types a Criar (`types.ts`)

```typescript
export interface Conversation {
    id: string;
    leadId: string;
    leadName: string;
    leadPhone: string;
    leadCompany?: string;
    leadAvatar?: string;
    lastMessage?: Message;
    unreadCount: number;
    assignedTo?: string;
    channel: 'whatsapp' | 'internal';
    status: 'open' | 'closed';
    createdAt: Date;
    updatedAt: Date;
}

export interface Message {
    id: string;
    conversationId: string;
    content: string;
    type: 'text' | 'audio' | 'image' | 'document' | 'video';
    direction: 'in' | 'out';
    status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
    senderId?: string;
    mediaUrl?: string;
    mediaName?: string;
    scheduledFor?: Date;
    createdAt: Date;
}

export interface MessageTemplate {
    id: string;
    name: string;
    content: string;
    category: string;
    isActive: boolean;
}
```

---

## 🎨 Design & UX

### Layout Principal (InboxPage)
```
┌─────────────────────────────────────────────────────────────────┐
│  ConversationList (300px)  │   ChatView (flex)   │ LeadSidebar │
│  ┌──────────────────────┐  │  ┌────────────────┐  │   (320px)   │
│  │ [Search Bar]         │  │  │ [Header]       │  │ ┌─────────┐ │
│  │ [Filters: All|Unread]│  │  │ [Messages...]  │  │ │Lead Info│ │
│  │ ┌──────────────────┐ │  │  │                │  │ │         │ │
│  │ │ Conversation 1   │ │  │  │                │  │ │ Tags    │ │
│  │ │ Conversation 2   │ │  │  │                │  │ │ Notes   │ │
│  │ │ Conversation 3   │ │  │  │ [ChatInput]    │  │ │ Actions │ │
│  │ └──────────────────┘ │  │  └────────────────┘  │ └─────────┘ │
│  └──────────────────────┘  │                      │             │
└─────────────────────────────────────────────────────────────────┘
```

### Responsividade
- **Desktop (>1024px):** 3 colunas (lista + chat + sidebar)
- **Tablet (768-1024px):** 2 colunas (lista + chat), sidebar em modal
- **Mobile (<768px):** 1 coluna, navegação entre views

---

## 🔄 Fluxo de Dados

1. **Firebase Realtime:**
   - `conversations/{orgId}` → Lista de conversas
   - `messages/{conversationId}` → Mensagens de cada conversa

2. **Store (Zustand):**
   - `selectedConversationId`
   - `conversations[]`
   - `messages[]`
   - `filters` (all, unread, my)
   - `searchQuery`

---

## ✅ Verificação

### Testes Manuais Propostos

1. **Verificar renderização do Inbox**
   - Acessar `/inbox` após login
   - Confirmar que a página carrega sem erros no console
   - Verificar que o layout de 3 colunas aparece

2. **Verificar lista de conversas (com mock data inicial)**
   - Conversas mockadas aparecem ordenadas
   - Filtros funcionam (todas, não lidas, minhas)
   - Busca filtra por nome/telefone

3. **Verificar chat view**
   - Clicar em conversa abre o chat
   - Mensagens aparecem com bubbles corretos (in/out)
   - Input de mensagem funciona

4. **Verificar sidebar do lead**
   - Informações do lead aparecem
   - Botões de ação funcionam

### Comando para Rodar o App
```bash
cd c:\Users\Editor\Desktop\PROJETOS CAIO\WEBDEV\nobrehubv2
npm run dev
```

---

## 📌 Observações

- **Fase 1 (atual):** Frontend completo com dados mockados
- **Fase 2 (futura):** Integração com Firebase Realtime
- **Fase 3 (futura):** Integração com WhatsApp API (360Dialog)

---

## 🚀 Ordem de Implementação

1. `types.ts` - Definir interfaces
2. `stores/useInboxStore.ts` - Estado global
3. `pages/InboxPage.tsx` - Layout base
4. `components/ConversationList/` - Lista de conversas
5. `components/ChatView/` - Área de chat
6. `components/LeadSidebar/` - Sidebar contextual
7. `App.tsx` - Conectar rota
8. Testes manuais
