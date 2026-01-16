# 🦅 NOBRE HUB - DOCUMENTAÇÃO TÉCNICA COMPLETA

**Versão:** 2.0 (16/01/2026)  
**Repositório:** `nobremkt/nobrehub`  
**Status:** 🟡 Em Desenvolvimento Ativo

---

## 📋 ÍNDICE

1. [Visão Geral do Projeto](#1-visão-geral-do-projeto)
2. [Arquitetura Técnica](#2-arquitetura-técnica)
3. [Stack Tecnológico](#3-stack-tecnológico)
4. [Estrutura do Projeto](#4-estrutura-do-projeto)
5. [Banco de Dados (Schema)](#5-banco-de-dados-schema)
6. [Backend (API)](#6-backend-api)
7. [Frontend (UI)](#7-frontend-ui)
8. [Integrações Externas](#8-integrações-externas)
9. [Sistema de Real-time (Socket.io)](#9-sistema-de-real-time-socketio)
10. [Status de Funcionalidades](#10-status-de-funcionalidades)
11. [Problemas Conhecidos e Bugs](#11-problemas-conhecidos-e-bugs)
12. [Custos e Infraestrutura](#12-custos-e-infraestrutura)
13. [Próximos Passos (Roadmap)](#13-próximos-passos-roadmap)
14. [Guia de Deploy](#14-guia-de-deploy)

---

## 1. VISÃO GERAL DO PROJETO

### O que é o Nobre Hub?
O **Nobre Hub** é o sistema operacional central (ERP & CRM) da **Nobre Marketing**, uma agência de marketing digital. O objetivo é unificar vendas, produção, pós-venda e financeiro em uma única plataforma, eliminando planilhas e ferramentas desconectadas.

### Filosofia: "Cada um no seu quadrado"
- **SDRs** focam em qualificação de leads
- **Closers** focam em fechamento de vendas
- **Produção** foca em entrega de vídeos/conteúdo
- **Gestores** têm visão 360º de todos os setores

### Público-alvo
- Equipe interna da Nobre Marketing (~10-15 usuários)
- Roles: Admin, SDR, Closer HT, Closer LT, Production, Post-Sales, Managers

---

## 2. ARQUITETURA TÉCNICA

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│  React + Vite + TailwindCSS + TypeScript                        │
│  Deploy: Vercel (nobrehub.vercel.app)                           │
└─────────────────────┬───────────────────────────────────────────┘
                      │ HTTPS REST + WebSocket
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                         BACKEND                                  │
│  Node.js + Fastify + Prisma ORM + Socket.io                     │
│  Deploy: Railway                                                 │
└─────────────────────┬───────────────────────────────────────────┘
                      │
          ┌───────────┴───────────┐
          ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│   PostgreSQL    │     │   360Dialog     │
│   (Supabase)    │     │   WhatsApp API  │
└─────────────────┘     └─────────────────┘
```

### Fluxo de Dados
1. **Leads entram via:** Landing Page, WhatsApp, ou criação manual
2. **Pipeline:** Lead → Qualificação → Negociação → Fechado/Perdido
3. **Real-time:** Socket.io broadcast para atualizar todos os clientes
4. **Fallback:** Polling a cada 5 segundos caso socket falhe

---

## 3. STACK TECNOLÓGICO

### Frontend
| Tecnologia | Versão | Uso |
|------------|--------|-----|
| React | 18.x | Framework UI |
| Vite | 5.x | Build tool |
| TypeScript | 5.x | Type safety |
| TailwindCSS | 3.x | Styling |
| Socket.io Client | 4.x | Real-time |
| @dnd-kit | - | Drag & Drop Kanban |
| Lucide React | - | Ícones |
| Sonner | - | Toast notifications |

### Backend
| Tecnologia | Versão | Uso |
|------------|--------|-----|
| Node.js | 20.x | Runtime |
| Fastify | 4.x | HTTP Framework |
| Prisma | 5.x | ORM |
| Socket.io | 4.x | WebSocket |
| JWT | - | Autenticação |
| bcrypt | - | Hash de senhas |

### Infraestrutura
| Serviço | Uso | Plano | Custo Estimado |
|---------|-----|-------|----------------|
| Vercel | Frontend hosting | Pro | ~$20/mês |
| Railway | Backend hosting | Starter | ~$5-15/mês |
| Supabase | PostgreSQL | Pro | ~$25/mês |
| 360Dialog | WhatsApp API | Cloud | ~€50-100/mês |

---

## 4. ESTRUTURA DO PROJETO

```
nobre-crm/
├── src/                          # Frontend React
│   ├── components/               # 16 componentes
│   │   ├── Analytics.tsx         # Dashboard de métricas
│   │   ├── Chat.tsx              # Chat individual (deprecated)
│   │   ├── ChatView.tsx          # View de conversa (PRINCIPAL)
│   │   ├── CustomDropdown.tsx    # Dropdown customizado
│   │   ├── FlowBuilder.tsx       # Builder de automações (WIP)
│   │   ├── Inbox.tsx             # Listagem de conversas WhatsApp
│   │   ├── Kanban.tsx            # Pipeline visual (PRINCIPAL)
│   │   ├── LeadDetailModal.tsx   # Modal de detalhes do lead
│   │   ├── LeadList.tsx          # Listagem tabular de leads
│   │   ├── LeadModal.tsx         # Modal de criação de lead
│   │   ├── Login.tsx             # Tela de login
│   │   ├── PersonalWorkspace.tsx # Workspace individual
│   │   ├── Settings.tsx          # Configurações
│   │   ├── Sidebar.tsx           # Menu lateral
│   │   ├── TagSelector.tsx       # Seletor de tags
│   │   └── TeamManagement.tsx    # Gestão de equipe
│   ├── contexts/
│   │   └── SocketContext.tsx     # Contexto global de Socket.io
│   ├── hooks/
│   │   └── useSocket.ts          # Hook de socket (re-export)
│   ├── services/                 # Serviços de API
│   ├── types/                    # TypeScript types
│   ├── App.tsx                   # Componente raiz
│   └── index.tsx                 # Entry point
│
├── backend/
│   ├── src/
│   │   ├── routes/               # 8 arquivos de rotas
│   │   │   ├── auth.ts           # Login/Register/Me
│   │   │   ├── conversations.ts  # CRUD conversas
│   │   │   ├── leads.ts          # CRUD leads
│   │   │   ├── public.ts         # API pública (landing page)
│   │   │   ├── roundRobin.ts     # Distribuição de leads
│   │   │   ├── stats.ts          # Estatísticas
│   │   │   ├── users.ts          # CRUD usuários
│   │   │   └── whatsapp.ts       # Webhook 360Dialog (PRINCIPAL)
│   │   ├── services/             # 4 serviços
│   │   │   ├── dialog360.ts      # API 360Dialog
│   │   │   ├── queueManager.ts   # Fila de atendimento
│   │   │   ├── roundRobin.ts     # Round-robin assignment
│   │   │   └── socketService.ts  # Socket.io server
│   │   ├── lib/
│   │   │   └── prisma.js         # Singleton Prisma client
│   │   └── server.ts             # Entry point
│   └── prisma/
│       └── schema.prisma         # Schema do banco
│
├── package.json
├── vercel.json                   # Config Vercel
└── PROJECT_DOC_COMPLETE.md       # Esta documentação
```

---

## 5. BANCO DE DADOS (SCHEMA)

### Models Principais

#### User (Usuários)
```prisma
model User {
  id           String       @id @default(uuid())
  email        String       @unique
  passwordHash String
  name         String
  role         UserRole     # admin, sdr, closer_ht, closer_lt, etc.
  pipelineType PipelineType?
  isActive     Boolean      @default(true)
  maxConcurrentChats Int    @default(5)
  currentChatCount   Int    @default(0)
  isOnline           Boolean @default(false)
}
```

#### Lead (Leads/Clientes)
```prisma
model Lead {
  id           String       @id @default(uuid())
  name         String
  email        String?
  phone        String
  company      String?
  source       LeadSource   # website, instagram, whatsapp, etc.
  pipeline     PipelineType # high_ticket, low_ticket, production, etc.
  statusHT     HighTicketStatus?  # novo, qualificado, call_agendada...
  statusLT     LowTicketStatus?   # novo, atribuido, em_negociacao...
  assignedTo   String?
  estimatedValue Decimal    @default(0)
  tags         String[]
  notes        String?
  contactReason String?
}
```

#### Message (Mensagens WhatsApp)
```prisma
model Message {
  id            String           @id @default(uuid())
  waMessageId   String?          @unique  # ID do WhatsApp
  leadId        String?
  conversationId String?
  phone         String
  direction     MessageDirection  # in, out
  type          MessageType       # text, image, audio, etc.
  text          String?
  status        MessageStatus     # pending, sent, delivered, read, failed
  sentByUserId  String?          # Agente que enviou
}
```

#### Conversation (Conversas)
```prisma
model Conversation {
  id              String              @id @default(uuid())
  leadId          String
  assignedAgentId String?
  channel         ConversationChannel # whatsapp, instagram, email
  status          ConversationStatus  # queued, active, closed
  closedReason    ClosedReason?
  pipeline        PipelineType
  lastMessageAt   DateTime?
}
```

### Enums
```prisma
enum UserRole { admin, sdr, closer_ht, closer_lt, production, post_sales, manager_sales, manager_production, strategic }
enum PipelineType { high_ticket, low_ticket, sales, production, post_sales }
enum MessageDirection { in, out }
enum MessageStatus { pending, sent, delivered, read, failed }
enum ConversationStatus { queued, active, closed }
```

---

## 6. BACKEND (API)

### Endpoints Principais

#### Auth (`/auth`)
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/auth/login` | Login com email/senha → JWT |
| POST | `/auth/register` | Registrar novo usuário |
| GET | `/auth/me` | Dados do usuário logado |

#### Leads (`/leads`)
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/leads` | Listar leads (com filtros) |
| POST | `/leads` | Criar lead |
| GET | `/leads/:id` | Detalhes do lead |
| PATCH | `/leads/:id` | Atualizar lead |
| DELETE | `/leads/:id` | Deletar lead |

#### Conversations (`/conversations`)
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/conversations` | Listar conversas |
| GET | `/conversations/:id` | Detalhes + mensagens |
| PATCH | `/conversations/:id` | Atualizar (status, assign) |

#### WhatsApp (`/whatsapp`)
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/whatsapp/webhook` | Recebe webhooks 360Dialog |
| POST | `/whatsapp/send` | Envia mensagem via API |
| GET | `/whatsapp/verify` | Verificação do webhook |

### Autenticação
- **Tipo:** JWT (JSON Web Token)
- **Header:** `Authorization: Bearer <token>`
- **Expiração:** 7 dias

---

## 7. FRONTEND (UI)

### Telas Principais

#### Login (`Login.tsx`)
- Autenticação via email/senha
- Design premium com gradientes e animações
- Redirecionamento baseado em role após login

#### Kanban (`Kanban.tsx`)
- Pipeline visual drag-and-drop
- Colunas: Novo → Qualificado → Negociação → Fechado/Perdido
- Filtros por pipeline (High Ticket / Low Ticket)
- Real-time updates via Socket.io

#### Atendimento/Inbox (`Inbox.tsx` + `ChatView.tsx`)
- Lista de conversas WhatsApp
- Chat em tempo real
- Tabs: "Meus" (atribuídos) e "Fila" (não atribuídos)
- Polling fallback de 5 segundos

#### Leads (`LeadList.tsx`)
- Listagem tabular com pesquisa
- Filtros por status, pipeline, fonte
- Ações: Editar, Deletar, Ver detalhes

#### Team Management (`TeamManagement.tsx`)
- Visualização da equipe
- Status online/offline
- Botão "Monitorar" para supervisores

### Design System
- **Cores:** Branco/Slate-50 backgrounds, Slate-900 texto
- **Accent:** Nobre Red `#E60012`
- **Sombras:** Soft shadows (0 1px 3px rgba)
- **Tema:** Light mode, premium institutional

---

## 8. INTEGRAÇÕES EXTERNAS

### 360Dialog (WhatsApp Business API)

#### Configuração
```env
DIALOG360_API_KEY=your_api_key
DIALOG360_WEBHOOK_SECRET=your_secret
DIALOG360_PHONE_NUMBER_ID=your_phone_id
```

#### Fluxo de Mensagens Recebidas
1. Cliente envia mensagem no WhatsApp
2. 360Dialog envia webhook para `/whatsapp/webhook`
3. Backend processa payload, extrai texto e dados do contato
4. Se lead não existe → Cria automaticamente (com nome do perfil WhatsApp)
5. Se conversa não existe → Cria e adiciona à fila
6. Salva mensagem no banco
7. Emite evento Socket.io para frontend

#### Fluxo de Mensagens Enviadas
1. Agente digita mensagem no ChatView
2. Frontend chama `POST /whatsapp/send`
3. Backend salva no banco (status: pending)
4. Backend envia via API 360Dialog
5. Atualiza status para sent/delivered
6. Emite evento Socket.io

### Supabase (Banco de Dados)
- **Tipo:** PostgreSQL
- **URL:** Definida em `DATABASE_URL`
- **Acesso:** Via Prisma ORM
- **Backup:** Automático (plano gratuito: 1 backup/dia)

---

## 9. SISTEMA DE REAL-TIME (SOCKET.IO)

### Arquitetura Atual

#### Backend (`socketService.ts`)
```typescript
// Eventos emitidos pelo servidor:
io.emit('lead:new', lead)                    // Novo lead criado
io.emit('lead:updated', lead)                // Lead atualizado
io.emit('conversation:new', conversation)    // Nova conversa
io.emit('conversation:updated', conversation) // Conversa atualizada
io.emit(`conversation:${id}:message`, msg)   // Nova mensagem (por conversa)
io.emit('agent:status', { userId, isOnline }) // Status do agente
```

#### Frontend (`SocketContext.tsx`)
- **Padrão:** Context Provider global
- **Conexão:** Única instância de socket para toda a aplicação
- **Reconexão:** Automática com re-registro de listeners
- **Fallback:** Polling a cada 5 segundos no ChatView

### Problemas Conhecidos com Socket

#### Status Atual: 🔴 Não funcional para mensagens incoming
O socket real-time para mensagens **RECEBIDAS** (do cliente WhatsApp) não está funcionando corretamente. As mensagens só aparecem via polling.

**Sintomas:**
- Mensagens enviadas pelo agente funcionam via socket ✅
- Mensagens recebidas do WhatsApp NÃO aparecem via socket ❌
- Apenas o polling (5s) atualiza a UI

**Investigação em andamento:**
- Backend está chamando `emitNewMessage()` (verificar logs)
- Frontend recebe evento mas UI não atualiza
- Possível issue com closure ou referência stale

---

## 10. STATUS DE FUNCIONALIDADES

### ✅ Funcionando em Produção

| Feature | Descrição | Notas |
|---------|-----------|-------|
| Login/Auth | Autenticação JWT | Funcionando |
| Criação de Leads | Manual + WhatsApp + Landing | Funcionando |
| Kanban DnD | Arrastar cards entre colunas | Funcionando |
| Lista de Leads | Tabela com filtros | Funcionando |
| WhatsApp Receber | Mensagens chegam e criam leads | Funcionando |
| WhatsApp Enviar | Agente envia mensagens | Funcionando |
| Team Management | Ver equipe online | Funcionando |
| Polling Fallback | Atualiza chat a cada 5s | Funcionando |

### 🟡 Parcialmente Funcionando

| Feature | Descrição | Problema |
|---------|-----------|----------|
| Real-time Socket | Atualizações instantâneas | Só funciona para outgoing, não incoming |
| Atribuição de Leads | Round-robin | Precisa ajustes |
| FlowBuilder | Automações | WIP - não implementado |

### ❌ Não Funcionando / Não Implementado

| Feature | Status |
|---------|--------|
| Módulo Produção | Não iniciado |
| Módulo Financeiro | Não iniciado |
| Gamificação (XP) | Não iniciado |
| Bot de Triagem | Não iniciado |
| Dashboard Métricas | Básico, precisa expansão |
| Mobile Responsivo | Parcial |

---

## 11. PROBLEMAS CONHECIDOS E BUGS

### 🔴 Críticos

#### 1. Socket.io Incoming Messages
**Descrição:** Mensagens recebidas do WhatsApp não aparecem em tempo real, apenas via polling.  
**Impacto:** Delay de até 5 segundos para ver mensagens novas.  
**Status:** Em investigação.  
**Workaround:** Polling de 5 segundos implementado.

### 🟡 Médios

#### 2. Flapping de Conexão Socket
**Descrição:** Socket desconecta/reconecta frequentemente.  
**Impacto:** Pode causar perda de eventos.  
**Status:** Mitigado com SocketContext.

#### 3. FK Violation em sentByUserId
**Descrição:** Mensagens enviadas falhavam se userId não existisse.  
**Impacto:** 500 error ao enviar.  
**Status:** ✅ Corrigido (verificação de existência adicionada).

### 🟢 Menores

#### 4. Logs de Debug no Console
**Descrição:** Muitos console.log de debug ativos.  
**Status:** Remover antes de produção final.

---

## 12. CUSTOS E INFRAESTRUTURA

### Planos Atuais (Janeiro 2026)

| Serviço | Plano | Custo/mês | Notas |
|---------|-------|-----------|-------|
| **Vercel** | Pro | ~$20/mês (~R$100) | Deploy automático, analytics, preview deploys |
| **Supabase** | Pro | ~$25/mês (~R$125) | 8GB storage, backups diários, logs |
| **Railway** | Starter/Hobby | ~$5-15/mês (~R$25-75) | Backend Node.js |
| **360Dialog** | Cloud API | ~€50-100/mês (~R$275-550) | Preço por conversa + templates |
| **Domínio** (se houver) | .com.br | ~R$50/ano | |

**Total Estimado:** R$ 525 - 900/mês

### Limites dos Planos Pro
- **Supabase Pro:** 8GB de banco, backups automáticos diários, logs detalhados
- **Vercel Pro:** Preview deploys ilimitados, analytics, team members
- **360Dialog:** Conversas iniciadas por cliente grátis (24h window), templates pagos

---

## 12.1 FUNÇÕES E MÓDULOS DA PLATAFORMA

### MÓDULO VENDAS (CRM) ✅ Implementado
Gerenciamento completo do ciclo de vendas.

| Função | Status | Descrição |
|--------|--------|-----------|
| Captura de Leads | ✅ | Via WhatsApp, Landing Page, Manual |
| Kanban Pipeline | ✅ | Drag-and-drop visual |
| High Ticket Pipeline | ✅ | Novo → Qualificado → Call → Proposta → Negociação → Fechado |
| Low Ticket Pipeline | ✅ | Novo → Atribuído → Negociação → Fechado |
| Atribuição Automática | ✅ | Round-robin entre agentes |
| Histórico de Interações | ✅ | Notas, calls, emails registrados |
| Tags e Filtros | ✅ | Categorização e busca |

### MÓDULO ATENDIMENTO (Omnichannel) ✅ Parcial
Central de comunicação unificada.

| Função | Status | Descrição |
|--------|--------|-----------|
| Chat WhatsApp | ✅ | Envio e recebimento de mensagens |
| Inbox Unificado | ✅ | Lista de todas as conversas |
| Fila de Espera | ✅ | Leads não atribuídos |
| Transfer de Conversa | ✅ | Passar para outro agente |
| Real-time Mensagens | 🔴 | Socket.io não funciona para incoming |
| Mensagens de Áudio | ❌ | Não implementado |
| Mensagens de Imagem | ❌ | Não implementado |
| Templates WhatsApp | ❌ | Não implementado |

### MÓDULO EQUIPE (Workspace) ✅ Implementado
Gestão de equipe e permissões.

| Função | Status | Descrição |
|--------|--------|-----------|
| Login por Role | ✅ | SDR, Closer, Admin, Manager |
| Workspace Pessoal | ✅ | Cada um vê só seus leads |
| Monitoramento | ✅ | Supervisor vê workspace do vendedor |
| Status Online | ✅ | Indicador de quem está ativo |
| Limite de Chats | ✅ | Max concurrent chats por agente |

### MÓDULO PRODUÇÃO 📅 Planejado
Substituição do Trello para gestão de entregas.

| Função | Status | Descrição |
|--------|--------|-----------|
| Pipeline de Vídeos | ❌ | Backlog → Fazendo → Revisão → Concluído |
| Cards de Entrega | ❌ | Vinculados ao lead/cliente |
| Checklist de Etapas | ❌ | Roteiro, Gravação, Edição, Aprovação |
| Upload de Arquivos | ❌ | Anexar vídeos, imagens, docs |
| Deadlines | ❌ | Prazo de entrega por card |
| Notificações | ❌ | Alertas de prazo |

### MÓDULO FINANCEIRO 📅 Planejado
Controle de receitas e cobranças.

| Função | Status | Descrição |
|--------|--------|-----------|
| Contas a Receber | ❌ | Tracking de pagamentos |
| Sinalização no CRM | 🔴 | Botão "Sinal" parcial |
| Integração Stripe/PagSeguro | ❌ | Checkout automático |
| Emissão NFS-e | ❌ | Nota fiscal automática |
| Dashboard Financeiro | ❌ | LTV, CAC, MRR |

### MÓDULO AUTOMAÇÕES (Flow) 📅 Planejado
Gatilhos e workflows automatizados.

| Função | Status | Descrição |
|--------|--------|-----------|
| Bot de Triagem | ❌ | Chatbot inicial para qualificar |
| Gatilho Venda→Produção | ❌ | Automatizar criação de card |
| Gatilho Produção→Pós-Venda | ❌ | Iniciar onboarding |
| Templates de Mensagem | ❌ | Respostas rápidas |
| Agendamento de Follow-up | ❌ | Lembretes automáticos |

### MÓDULO GAMIFICAÇÃO 📅 Planejado
Sistema de pontos e rankings.

| Função | Status | Descrição |
|--------|--------|-----------|
| Sistema de XP | ❌ | Pontos por ação (venda, entrega) |
| Rankings | ❌ | Leaderboard da equipe |
| Conquistas | ❌ | Badges por metas |
| Metas Diárias | ❌ | Objetivos configuráveis |

### MÓDULO RELATÓRIOS 📅 Parcial
Analytics e métricas.

| Função | Status | Descrição |
|--------|--------|-----------|
| Dashboard Básico | ✅ | Totais de leads por status |
| Funil de Conversão | ❌ | Taxa por etapa |
| Relatório por Vendedor | ❌ | Performance individual |
| Exportação | ❌ | CSV, PDF |
| Filtro por Período | ❌ | Data range customizado |

---

## 13. PRÓXIMOS PASSOS (ROADMAP)

### Imediato (Esta Semana)
- [ ] **FIX:** Resolver socket real-time para incoming messages
- [ ] **CLEANUP:** Remover console.logs de debug
- [ ] **TEST:** Validar fluxo completo de atendimento

### Curto Prazo (Próximas 2-4 Semanas)
- [ ] **FEATURE:** Dashboard de métricas (LTV, CAC, conversão)
- [ ] **FEATURE:** Notificações de nova mensagem
- [ ] **UX:** Responsividade mobile
- [ ] **INFRA:** Configurar Sentry para error tracking

### Médio Prazo (1-2 Meses)
- [ ] **FEATURE:** Módulo Produção (pipeline de vídeos)
- [ ] **FEATURE:** Sistema de tarefas/checklist
- [ ] **FEATURE:** Relatórios exportáveis

### Longo Prazo (3+ Meses)
- [ ] **FEATURE:** Módulo Financeiro
- [ ] **FEATURE:** Gamificação (XP, rankings)
- [ ] **FEATURE:** Bot de triagem com IA
- [ ] **FEATURE:** Integração com Stark Bank

---

## 14. GUIA DE DEPLOY

### Frontend (Vercel)
```bash
# 1. Push para main
git push origin main

# 2. Vercel auto-deploya
# URL: https://nobrehub.vercel.app

# Variáveis de ambiente no Vercel:
VITE_API_URL=https://your-railway-url.railway.app
```

### Backend (Railway)
```bash
# 1. Push para main
git push origin main

# 2. Railway auto-deploya (conectado ao GitHub)

# Variáveis de ambiente no Railway:
DATABASE_URL=postgresql://...
JWT_SECRET=your_secret
DIALOG360_API_KEY=your_key
DIALOG360_PHONE_NUMBER_ID=your_id
FRONTEND_URL=https://nobrehub.vercel.app
PORT=3000
```

### Desenvolvimento Local
```bash
# Terminal 1 - Frontend
cd nobre-crm
npm install
npm run dev  # http://localhost:5173

# Terminal 2 - Backend
cd nobre-crm/backend
npm install
npm run dev  # http://localhost:3000

# Variáveis locais (.env)
DATABASE_URL=postgresql://...
JWT_SECRET=dev_secret
DIALOG360_API_KEY=your_key
```

---

## 15. BENCHMARK: FUNCIONALIDADES CLINT CRM (Referência)

> Este é o CRM que usamos como referência para funcionalidades a replicar.

### 15.1 Pilar 1: Gestão de Vendas (Core CRM)

| Funcionalidade | Descrição Técnica | Status Nobre |
|----------------|-------------------|--------------|
| **Pipeline Visual (Kanban)** | Interface com colunas dinâmicas drag-and-drop para etapas do funil. Etapas configuráveis pelo admin. | ✅ Implementado |
| **Cards de Lead** | Exibir nome, empresa, valor, tempo na etapa. Expandir para visão 360º. | ✅ Parcial |
| **Playbook de Atividades** | Módulo de tarefas e scripts (emails, ligações) para cada etapa. Sequência cronológica para vendedor. | ❌ Não implementado |
| **Histórico de Auditoria** | Log imutável de todas as ações (criação, edição, mudança de etapa) com timestamp e usuário. | ❌ Não implementado |

### 15.2 Pilar 2: Comunicação Omnichannel

| Funcionalidade | Descrição Técnica | Status Nobre |
|----------------|-------------------|--------------|
| **Integração APIs de Mensagens** | Conectores para WhatsApp Business e Instagram Direct. | ✅ WhatsApp / ❌ Instagram |
| **Inbox Unificada** | Interface de chat que agrega conversas de múltiplos canais em ordem cronológica. | ✅ Parcial |
| **Templates de Resposta Rápida** | Sistema de criação e gerenciamento de modelos de mensagens com variáveis personalizadas. | ❌ Não implementado |
| **Agendamento de Mensagens** | Funcionalidade para programar envio de mensagens com recorrência e lembretes. | ❌ Não implementado |
| **Notas Internas** | Campo de texto para notas privadas associadas a cada conversa ou lead, com controle de acesso. | ❌ Não implementado |

### 15.3 Pilar 3: Automação e Inteligência Artificial

| Funcionalidade | Descrição Técnica | Status Nobre |
|----------------|-------------------|--------------|
| **Workflow Builder Visual** | Ferramenta drag-and-drop para definir gatilhos, condições e ações em fluxos de automação. | ❌ WIP (FlowBuilder.tsx) |
| **Disparos em Massa (WhatsApp)** | Módulo para envio de mensagens em grande volume, com gerenciamento de templates e relatórios. | ❌ Não implementado |
| **Transcrição de Áudio com IA** | Integrar com Speech-to-Text (OpenAI Whisper, Google Cloud) para converter áudio em texto. | ❌ Não implementado |
| **Análise de Conversas por IA** | Utilizar LLMs (GPT-4) para resumir transcrições, extrair entidades e próximos passos. | ❌ Não implementado |

### 15.4 Pilar 4: Inteligência de Dados (BI)

| Funcionalidade | Descrição Técnica | Status Nobre |
|----------------|-------------------|--------------|
| **Dashboards Personalizáveis** | Módulo para criação de painéis com widgets configuráveis (gráficos, tabelas, KPIs) em tempo real. | ❌ Básico |
| **Rastreamento de Origem (UTM)** | Captura e associação de parâmetros UTM aos leads para análise de fonte de tráfego. | ❌ Não implementado |
| **Relatórios de Funil e Performance** | Relatórios visuais de progressão dos leads pelo funil e performance por vendedor/equipe. | ❌ Não implementado |
| **Exportação de Dados Avançada** | Funcionalidade para exportar dados em CSV/Excel com opções de filtro por data, campos, tags e status. | ❌ Não implementado |

---

## 16. ARQUITETURA ALVO: INFRAESTRUTURA CRM OMNICHANNEL COM IA

> Este é o blueprint de infraestrutura que precisamos alcançar para escalar.

### 16.1 Componentes de Servidores e Computação

#### 16.1.1 Backend
- **Plataformas recomendadas:** AWS EC2, Google Cloud Run, Kubernetes
- **Requisitos:** Escalabilidade horizontal, alta disponibilidade
- **Responsabilidades:** APIs REST/GraphQL, lógica de negócio, gestão de leads e pipeline
- **Status Nobre:** Railway (básico, funcional)

#### 16.1.2 Servidor de WebSockets
- **Plataformas recomendadas:** AWS AppSync, Pusher, Socket.io dedicado
- **Função:** Comunicação em tempo real (chat, updates Kanban)
- **Status Nobre:** Socket.io integrado (problemas com incoming messages)

#### 16.1.3 Workers Assíncronos e Filas de Mensagens
- **Plataformas recomendadas:** Redis Queue, RabbitMQ, AWS SQS
- **Casos de uso:** Disparos em massa, transcrição de áudio, integrações IA
- **Status Nobre:** ❌ Não implementado

### 16.2 Armazenamento de Dados

#### 16.2.1 Banco de Dados Relacional (SQL)
- **Recomendado:** PostgreSQL
- **Uso:** Leads, negócios, usuários, configurações, histórico
- **Status Nobre:** ✅ Supabase PostgreSQL

#### 16.2.2 Banco de Dados NoSQL / Cache
- **Recomendado:** Redis
- **Uso:** Sessões de chat em tempo real, cache de informações frequentes
- **Status Nobre:** ❌ Não implementado

#### 16.2.3 Armazenamento de Objetos (Object Storage)
- **Plataformas recomendadas:** Amazon S3, Google Cloud Storage, Supabase Storage
- **Uso:** Áudios de reuniões, imagens, documentos anexados
- **Status Nobre:** ❌ Não implementado

### 16.3 APIs e Serviços de Terceiros

#### 16.3.1 APIs de Mensageria
- **WhatsApp Business:** 360Dialog ✅
- **Instagram Direct:** Meta Graph API ❌
- **Email:** SendGrid, Mailgun ❌

#### 16.3.2 Serviços de Inteligência Artificial
- **Transcrição de áudio:** OpenAI Whisper, Google Speech-to-Text ❌
- **Sumarização e análise:** GPT-4, Claude, AWS Comprehend ❌

#### 16.3.3 Ferramentas de BI e Analytics
- **Data Warehouse:** Google BigQuery, AWS Redshift ❌
- **Business Intelligence:** Tableau, Power BI, Google Data Studio ❌
- **Streaming:** Apache Kafka ❌

### 16.4 Considerações de Segurança e Conformidade

#### 16.4.1 Criptografia
- **Em trânsito:** TLS/SSL ✅
- **Em repouso:** Criptografia de banco de dados (Supabase gerencia)
- **Gerenciador de segredos:** AWS Secrets Manager, HashiCorp Vault ❌

#### 16.4.2 Controle de Acesso (RBAC)
- **Requisito:** Cada usuário só acessa o que precisa
- **Status Nobre:** ✅ Implementado (9 roles)

#### 16.4.3 Auditoria e Monitoramento
- **Ferramentas recomendadas:** Prometheus, Grafana, Datadog
- **Logs detalhados:** Sentry para erros
- **Status Nobre:** ❌ Não implementado

### 16.5 Arquitetura Sugerida de Alto Nível

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND                                    │
│              React/Vue/Angular consumindo APIs                           │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │
         ┌──────────────────────┼──────────────────────┐
         ▼                      ▼                      ▼
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│   API Backend   │   │   WebSockets    │   │   Workers/Jobs  │
│  (Node/Python)  │   │   (Real-time)   │   │  (Async Tasks)  │
└────────┬────────┘   └────────┬────────┘   └────────┬────────┘
         │                     │                     │
         └─────────────────────┼─────────────────────┘
                               ▼
    ┌──────────────────────────────────────────────────────────────┐
    │                     ARMAZENAMENTO                             │
    ├─────────────────┬─────────────────┬────────────────────────────┤
    │   PostgreSQL    │     Redis       │     Object Storage        │
    │   (Dados)       │   (Cache)       │     (Arquivos)            │
    └─────────────────┴─────────────────┴────────────────────────────┘
                               │
    ┌──────────────────────────┼──────────────────────────────────┐
    │                  INTEGRAÇÕES EXTERNAS                        │
    ├─────────────┬────────────┬────────────────┬─────────────────┤
    │  WhatsApp   │  Instagram │   OpenAI/IA   │  Monitoramento  │
    │  (360Dialog)│  (Graph)   │   (Whisper)   │  (Prometheus)   │
    └─────────────┴────────────┴────────────────┴─────────────────┘
```

---

## 📞 CONTATOS E REFERÊNCIAS

- **Repositório:** https://github.com/nobremkt/nobrehub
- **Frontend Prod:** https://nobrehub.vercel.app
- **Backend Prod:** Railway (URL privada)
- **360Dialog Dashboard:** https://hub.360dialog.com
- **Supabase Dashboard:** https://app.supabase.com

---

*Documentação gerada em 16/01/2026 por Antigravity AI Assistant*
