# Nobre Hub 🚀

**O Hub Definitivo para Gestão de Agências de Marketing**

O **Nobre Hub** é uma plataforma "all-in-one" desenvolvida para centralizar e otimizar a operação de agências de marketing. Desde a captação do lead até a entrega final e pós-venda, tudo acontece aqui. Com foco em comunicação ágil via WhatsApp, controle visual de produção e ferramentas estratégicas avançadas, o Nobre Hub elimina a necessidade de múltiplas ferramentas desconexas.

---

## ✨ Principais Funcionalidades

O Nobre Hub cobre toda a jornada do cliente dentro da agência, além de fornecer ferramentas estratégicas e criativas para o time.

### 🤝 CRM & Vendas
- **Kanban de Vendas:** Pipeline visual interativo com drag & drop e estágios customizáveis.
- **Lead 360°:** Visão completa de cada contato — histórico de conversas, atividades, negócios, arquivos e playbooks.
- **Inbox Unificado:** Central de mensagens estilo WhatsApp Web com suporte a áudio, imagem, templates e drafts inteligentes.
- **Gestão de Perdas:** Motivos de perda customizáveis para análise e otimização do funil.
- **Base de Contatos:** Gestão completa com tags, filtros avançados, export CSV e ações em massa (atribuição, movimentação de estágio).
- **Playbook & Templates:** Sistema de templates de mensagens com integração ao draft do chat para personalização antes do envio.

### 🏭 Produção & Projetos
- **Dashboard de Produção:** Boards individuais por produtor com visão consolidada para o líder (Produção, Alterações, Finalizados).
- **Sistema de Pontuação:** Cálculo inteligente — `Total = Base (Produto) + Duração (Vídeo) + Extras (Manual)`.
- **Lista de Distribuição:** Fila central com modos Automático (equilíbrio de carga), Manual e Sugestão (vendedora sugere, líder valida).
- **Fluxo de Revisão:** Sistema de aprovações e loop de alterações que retorna automaticamente ao produtor original.
- **Criação Integrada:** Projetos originam do CRM com link automático ao lead, garantindo rastreabilidade completa.

### 📦 Pós-Venda
- **Inbox de Pós-Venda:** Interface split-column com visão diferenciada para líderes (3 colunas) e atendentes.
- **Distribuição Automática:** Fila com inteligência de retorno (identifica quem já atendeu o cliente).
- **Monitoramento em Tempo Real:** Acesso ao status da produção em tempo real pela pós-vendedora via Supabase Realtime.
- **Ciclo de Vida Completo:** `Aguardando Vídeo → Entregue → Aprovação/Alteração → Pagamento → Concluído`.
- **Loop de Alteração:** Revisões retornam automaticamente ao produtor original sem re-briefing.

### 📊 Dashboard & Analytics
Dashboards setorizados com dados em tempo real:

- **📈 Visão Geral:** Métricas macro — projetos, deadlines, eficiência da equipe e velocidade de entrega.
- **💰 Financeiro:** Receita, despesas, ticket médio, contas a receber e breakdown operacional (padrão Sales-Derivative).
- **🎯 Vendas:** Funil de conversão (Recharts), atribuição de origem, tendências diárias, ranking de vendedoras e pipeline overview.
- **🏭 Produção:** Ranking diário com pódio, meta de equipe, pontos totais, distribuição por categoria e cards de destaques/MVPs.
- **🤝 Pós-Venda:** Ranking de atendentes, receita por saldo final, tickets e satisfação.
- **👑 Administrativo:** Presença online em tempo real (RTDB), carga de trabalho e produtividade por colaborador.

### 🧠 Estratégico
Módulo dedicado à gestão de iniciativas de alto nível, independente dos boards operacionais:

- **📝 Anotações (Obsidian-Style):** Editor WYSIWYG com Tiptap/ProseMirror, formatação em tempo real, task lists e **colaboração multiplayer** com presença em tempo real (RTDB), sincronização ghost-free e indicadores de salvamento.
- **📋 Projetos Estratégicos:** Gestão hierárquica com sub-tarefas (2 níveis), prioridades color-coded, tags customizáveis, multi-assignee com filtro de setor, due dates semânticas e barra de progresso dinâmica.
- **📱 Gestão de Redes Sociais:** Dashboard de clientes com status de contrato (Ativo/Alerta/Expirado), link de Instagram integrado, Post Tracker com calendário interativo e tracking de entregas por status cycling.

> 💡 **Notas Estratégicas** utilizam Supabase Realtime para colaboração multiplayer com presença em tempo real e sincronização ghost-free.

### 🎨 Studio (AI)
Ferramentas criativas com Inteligência Artificial integrada:

- **Gerador de Imagens:** Criação de imagens com IA via prompts diretamente na plataforma.
- **Estilos de Imagem:** Biblioteca de estilos e presets para geração consistente.
- **Galeria:** Repositório centralizado de todas as imagens geradas, com upload para Storage.

### 👥 Gestão de Equipe
- **Chat Interno:** Comunicação direta entre membros (DMs e Grupos) sem sair da plataforma.
- **Perfil do Colaborador:** Modal avançado com tabs de informações, metas derivadas e métricas por setor.
- **Fotos Diferenciadas:** Sistema dual de fotos — Avatar (1:1) para ícones e Banner (9:16) para headers, com sincronização automática system-wide.
- **Presença em Tempo Real:** Indicadores de online/offline via Supabase Realtime com heartbeat e cleanup automático.

### 🔔 Notificações
- **Toast Notifications:** Feedback visual instantâneo para ações do sistema.
- **Notification Drawer:** Central de notificações com histórico e ações rápidas.

### ⚙️ Configurações
Painel administrativo completo com:

| Página | Descrição |
|--------|-----------|
| **Organização** | Dados da empresa e branding |
| **Colaboradores** | Gestão completa de membros da equipe |
| **Cargos & Setores** | Estrutura organizacional |
| **Permissões (RBAC)** | Controle granular por cargo — o que cada role pode ver e editar |
| **Metas** | Configuração de pontos por produto, scoring de vídeo por duração e metas diárias |
| **Feriados** | Calendário de feriados nacionais (Brasil API) + folgas customizadas da equipe |
| **Produtos** | Catálogo com categorias (Consultoria, Gestão, Assinatura, Vídeo, Arte) e preços opcionais |
| **Pipeline** | Configuração dos estágios do funil de vendas |
| **Motivos de Perda** | Razões customizáveis para leads perdidos |
| **Distribuição de Leads** | Regras de distribuição automática |
| **Integrações** | Configuração de WhatsApp, Google Drive e Webhooks |
| **Aparência** | Tema e personalização visual |

---

## 🛠️ Tecnologias Utilizadas

Construído com uma stack moderna e robusta para performance e escalabilidade:

| Categoria | Tecnologia |
|-----------|------------|
| **Frontend** | React 19 + TypeScript + Vite |
| **Estilização** | CSS Modules + Design System Próprio (25+ componentes) |
| **Estado** | Zustand (Stores modulares por feature) |
| **Backend / DB** | Supabase (PostgreSQL, Auth, Realtime, Edge Functions) |
| **Storage** | Firebase Storage (uploads de imagens e arquivos) |
| **Editor Rich Text** | Tiptap / ProseMirror (Notas Estratégicas) |
| **Gráficos** | Recharts (Dashboard Analytics) |
| **Hospedagem** | Vercel (Node.js Functions) |

---

## 🧩 Arquitetura do Projeto

Arquitetura modular e escalável seguindo padrões de Feature-Based Structure e Repository Pattern:

### Estrutura Base
```
src/
├── app/            # Componente raiz, providers e setup
├── config/         # RBAC, rotas, permissões, constantes
├── data/           # Data Layer Unificado (Repository Pattern)
│   ├── providers/      # Supabase driver (+ Firebase Storage legacy)
│   ├── repositories/   # Contratos e implementações
│   ├── services/       # Lógica de negócio
│   └── hooks/          # React hooks reativos
├── design-system/  # Biblioteca UI (25+ componentes)
│   ├── tokens/         # CSS Variables (cores, tipografia, espaçamentos)
│   └── components/     # Button, Input, Modal, Dropdown, Tag, etc.
├── features/       # Módulos de negócio independentes
│   ├── auth/           # Autenticação
│   ├── crm/            # CRM, Kanban, Lead 360°, Contatos
│   ├── dashboard/      # Analytics (5 setores)
│   ├── inbox/          # WhatsApp Inbox unificado
│   ├── notifications/  # Sistema de notificações
│   ├── pos-vendas/     # Pós-venda e entregas
│   ├── presence/       # Presença online (RTDB)
│   ├── production/     # Produção e distribuição
│   ├── settings/       # Painel administrativo (13 páginas)
│   ├── strategic/      # Anotações, Projetos e Redes Sociais
│   ├── studio/         # IA Generativa (Imagens)
│   └── team/           # Chat interno e gestão de equipe
├── hooks/          # Hooks globais (usePermission, usePresence)
├── stores/         # Zustand stores (Auth, Roles, Collaborators)
└── utils/          # Formatadores e helpers
```

### Princípios Arquiteturais
- **Features Autocontidas:** Cada módulo possui componentes, tipos, serviços e stores próprios.
- **Repository Pattern:** Camada de abstração sobre Supabase (PostgreSQL) para isolamento de dependência.
- **RBAC Dinâmico:** Permissões mapeadas por cargo via JOINs (`roles` + `role_permissions`) com verificação via `usePermission`.
- **Supabase Realtime:** Channels e Postgres Changes para presença, colaboração e atualizações em tempo real.
- **Design System First:** Todos os componentes UI seguem tokens e padrões centralizados.

---

## 🔌 Integrações

O Nobre Hub se conecta com as ferramentas essenciais do dia a dia:

- **Supabase:** Auth, Database (PostgreSQL), Realtime Channels e Edge Functions.
- **Firebase Storage:** Upload e gestão de fotos de colaboradores e imagens geradas por IA (legacy, migração planejada para Supabase Storage).
- **WhatsApp (360Dialog / Evolution API):** Envio e recebimento de mensagens diretamente pelo painel, com suporte a templates, mídias e status de entrega.
- **Google Drive:** Organização automática de pastas e arquivos dos projetos.
- **Brasil API:** Importação automática de feriados nacionais para cálculo de metas.
- **Webhooks:** Recebimento automático de leads vindos de Landing Pages e formulários externos.

---

## 🚀 Como Executar

Para rodar o projeto localmente:

1. **Instale as dependências:**
   ```bash
   npm install
   ```

2. **Configure as variáveis de ambiente:**
   Crie um arquivo `.env` na raiz baseado no `.env.example`.

3. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

---

## 📋 Design System

O Nobre Hub possui um Design System proprietário com **25+ componentes** reutilizáveis:

| Componente | Descrição |
|------------|-----------|
| `Button` | Variantes primary, secondary, ghost, danger |
| `Input` | Campos com ícones e validação |
| `Dropdown` | Select customizado (substitui `<select>` nativo) |
| `Modal` | Diálogos e modais com backdrop |
| `ConfirmModal` | Modal de confirmação com ações destrutivas |
| `Tag` | Pills/tags coloridas |
| `Badge` | Contadores e indicadores |
| `Checkbox` | Checkboxes estilizados |
| `Switch` | Toggles on/off |
| `Spinner` | Loading indicators |
| `Card` | Containers com shadow |
| `Avatar` | Avatares com iniciais e foto |
| `Tooltip` | Tooltips informativos |
| `Tabs` | Navegação por abas |
| `ProgressBar` | Barras de progresso animadas |
| `Skeleton` | Loading placeholders |
| `ScrollArea` | Scroll areas customizadas |
| `Textarea` | Áreas de texto expandíveis |
| `NumberInput` | Input numérico com formatação |
| `PhoneInput` | Input de telefone com máscara |
| `EmptyState` | Estado vazio com ilustração |
| `LazyImage` | Imagens com lazy loading |
| `PersonCard` | Cards de pessoa/colaborador |
| `PremiumButton` | Botão premium com gradiente |
| `Chat` | Componentes de chat (9 sub-componentes) |

**Tokens CSS:** Dark mode como padrão, com variáveis para cores, espaçamentos, tipografia, bordas e sombras. Padrão de focus com glow vermelho (`box-shadow: 0 0 10px var(--color-primary-500)`).

---

*Desenvolvido pela equipe Nobre Hub*
