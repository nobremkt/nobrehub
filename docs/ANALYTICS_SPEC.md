# 📊 Especificação: Dashboard/Analytics

> Documento de contexto para desenvolvimento das páginas de Analytics do Nobre Hub.

---

## 🎯 Visão Geral

O sistema de Analytics será dividido em **4 seções**:

| Seção | Descrição | Quem pode ver |
|-------|-----------|---------------|
| **Geral** | Visão macro da empresa (dados não sensíveis) | Todos os setores |
| **Vendas** | Métricas do setor comercial | Setor Vendas + Admin |
| **Pós-Vendas** | Métricas de atendimento | Setor Pós-Vendas + Admin |
| **Produção** | Métricas de produção de vídeos | Setor Produção + Admin |

---

## 🧭 Navegação

**Decisão: Híbrido**

- Uma página `/analytics` com sub-navegação interna
- Tabs: `[Geral] [Vendas] [Pós-Vendas] [Produção]`
- Seletor de período: `[Dia] [Semana] [Mês]`
- Navegação temporal: `[← Anterior] [Próximo →]`

---

## 📅 Períodos

- **Visualizações obrigatórias**: Diária, Semanal e Mensal
- **Histórico**: Deve ser possível navegar para períodos anteriores e dias anteriores individualmente (ex: ver semana passada, mês passado, dia 10/02/2026, etc.)
- **Fonte dos dados**: Os dados já existem no Firebase com timestamps (`createdAt`, etc.) - basta consultar por período

---

## 🔧 Metas Editáveis

O admin poderá configurar em **Configurações**:
- Metas diárias/semanais/mensais por setor
- Metas individuais por funcionário
- Pesos das métricas (se aplicável)

---

## 📦 Estrutura de Dados por Seção

### 💰 Seção: VENDAS

**Entidade:** `Lead` (já existe no Firebase)

```typescript
interface Lead {
  id: string;
  name: string;
  email?: string;
  phone: string;
  company?: string;
  
  pipeline: 'venda' | 'pos-venda';
  status: string;                    // Estágio atual
  order: number;
  
  estimatedValue?: number;           // Valor estimado
  actualValue?: number;              // ⭐ NOVO: Valor real fechado
  
  responsibleId: string;             // Vendedor responsável
  
  source?: string;                   // ⭐ NOVO: 'whatsapp' | 'landing' | 'indicacao'
  channel?: string;                  // ⭐ NOVO: Canal específico
  
  tags: string[];
  customFields?: Record<string, unknown>;
  
  lostReason?: string;
  lostAt?: Date;
  notes?: string;
  
  // Timestamps para Analytics
  createdAt: Date;                   // ✅ Existe
  updatedAt: Date;                   // ✅ Existe
  closedAt?: Date;                   // ⭐ NOVO: Data do fechamento
  firstContactAt?: Date;             // ⭐ NOVO: Primeira interação
}
```

**Métricas possíveis:**
- Leads criados no período
- Leads fechados (ganhos)
- Taxa de conversão
- Valor total vendido
- Ticket médio
- Tempo médio de fechamento
- Performance por vendedor
- Leads perdidos + motivos
- Leads por origem/canal

---

### 🤝 Seção: PÓS-VENDAS

**Entidade:** `Conversation` e `Message` (já existem no Firebase RTDB)

```typescript
interface Conversation {
  id: string;
  leadId: string;
  leadName: string;
  leadPhone: string;
  leadEmail?: string;
  leadCompany?: string;
  leadAvatar?: string;
  
  status: 'open' | 'closed';
  unreadCount: number;
  
  assignedTo?: string;               // Atendente responsável
  channel: 'whatsapp' | 'internal';
  
  tags?: string[];
  notes?: string;
  lastMessage?: Message;
  
  // Timestamps para Analytics
  createdAt: Date;                   // ✅ Existe
  updatedAt: Date;                   // ✅ Existe
  closedAt?: Date;                   // ⭐ NOVO: Quando foi resolvida
  firstResponseAt?: Date;            // ⭐ NOVO: Primeira resposta
}

interface Message {
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
  createdAt: Date;                   // ✅ Existe
}
```

**Métricas possíveis:**
- Conversas abertas/fechadas
- Tempo médio de resposta
- Tempo médio de resolução
- Mensagens enviadas/recebidas
- Performance por atendente
- Taxa de resolução

---

### 🎬 Seção: PRODUÇÃO

**Entidade:** `Project` (estrutura existe, página em desenvolvimento na branch `dev-guardachuva`)

```typescript
type ProjectStatus = 'aguardando' | 'em-producao' | 'a-revisar' | 'revisado' | 'alteracao';

interface Project {
  id: string;
  name: string;
  leadId: string;
  leadName: string;
  
  producerId: string;                // Produtor responsável
  producerName: string;
  status: ProjectStatus;
  priority?: 'normal' | 'high';
  
  category?: string;                 // ⭐ NOVO: 'explainer' | '3d-premium' | 'whiteboard' | etc.
  
  driveLink?: string;
  notes?: string;
  checklist: ProjectChecklistItem[];
  
  source: 'manual' | 'automation' | string;
  externalId?: string;
  metadata?: Record<string, any>;
  tags?: string[];
  
  // Timestamps para Analytics
  createdAt: Date;                   // ✅ Existe
  updatedAt: Date;                   // ✅ Existe
  dueDate: Date;                     // ✅ Existe (prazo)
  deliveredAt?: Date;                // ✅ Existe (entrega)
  startedAt?: Date;                  // ⭐ NOVO: Início da produção
  firstDeliveryAt?: Date;            // ⭐ NOVO: Primeira versão
  approvedAt?: Date;                 // ⭐ NOVO: Aprovação final
  
  // Contadores para Analytics
  revisionCount?: number;            // ⭐ NOVO: Número de alterações
  points?: number;                   // ⭐ NOVO: Pontuação (gamificação)
}
```

**Métricas possíveis:**
- Projetos criados/entregues
- Tempo médio de produção
- Entregas no prazo vs atrasadas
- Performance por produtor
- Projetos por categoria
- Taxa de alterações/revisões
- Ranking de produtores

---

### 📈 Seção: GERAL

Dados não sensíveis, visíveis para todos:
- Total de clientes ativos
- Projetos entregues no período
- Tendências de crescimento
- Calendário de entregas/deadlines
- KPIs gerais da empresa

*(Detalhamento a definir posteriormente)*

---

## 🗄️ Estrutura do Firebase (Realtime Database)

```
nobrehub-rtdb/
│
├── chats/                  ← Team Chat (conversa interna)
├── messages/               ← Mensagens (Team Chat + Inbox compartilham)
├── conversations/          ← Inbox (conversas WhatsApp com clientes)
├── user_chats/             ← Lista de chats por usuário
├── status/                 ← Presença online/offline
│
├── notifications/          ← ❌ NÃO ESTÁ SENDO USADO (pode deletar)
└── presence/               ← ❌ NÃO ESTÁ SENDO USADO (pode deletar)
```

---

## 🎨 Design

- **USAR o Design System do Nobre Hub** (`src/design-system/`)
- **NÃO usar** as imagens do dashboard antigo como referência visual
- Seguir os tokens CSS definidos em `src/design-system/tokens/index.css`
- Componentes disponíveis: Button, Input, Dropdown, Modal, Card, etc.

---

## 🎮 Gamificação

- Para **futuro**: sistema de badges/conquistas similar ao dashboard de produção atual
- Será pensado depois que as métricas básicas estiverem funcionando

---

## ✅ Resumo de Campos NOVOS a Adicionar

| Entidade | Campos Novos |
|----------|--------------|
| **Lead** | `closedAt`, `source`, `channel`, `actualValue`, `firstContactAt` |
| **Conversation** | `closedAt`, `firstResponseAt` |
| **Project** | `category`, `startedAt`, `firstDeliveryAt`, `approvedAt`, `revisionCount`, `points` |

---

## 📝 Notas Adicionais

1. **Dados são "live"**: Consultados diretamente do Firebase por período, não precisa de snapshots
2. **Página de Produção**: Em desenvolvimento na branch `dev-guardachuva`
3. **Permissões**: Implementar verificação de setor do usuário para mostrar/esconder seções
