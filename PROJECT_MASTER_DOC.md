# 🦅 Nobre Hub - Documentação Mestra do Projeto

**Versão da Documentação:** 1.0 (14/01/2026)
**Repositório Oficial:** `nobremkt/nobrehub`
**Status Atual:** 🟢 Produção (Core CRM Operacional)

---

## 1. 🎯 Objetivo & Visão (Sobre)
O **Nobre Hub** é o sistema operacional central (ERP & CRM) da Nobre Marketing. O objetivo é unificar vendas, produção, pós-venda e financeiro em uma única plataforma, eliminando a dependência de planilhas dispersas e ferramentas desconectadas.

**A Filosofia:** "Cada um no seu quadrado". 
- SDRs focam em qualificação.
- Closers focam em venda.
- Produção foca em entrega.
- Gestores têm visão 360º.

---

## 2. ✅ O Que Foi Feito (Concluído)

### Infraestrutura & Deploy
- [x] **Migração de Repositório:** Projeto migrado para Monorepo `nobremkt/nobrehub`.
- [x] **Deploy Frontend:** Vercel (`nobrehub.vercel.app`) conectado e atualizado.
- [x] **Deploy Backend:** Railway (Fastify Node.js) rodando em produção.
- [x] **Banco de Dados:** Supabase (PostgreSQL) conectado e seedado com usuário Admin.

### Core CRM (Vendas)
- [x] **Autenticação Real:** Login via JWT funcionando (`api.login`).
- [x] **Criação de Leads:** Formulário "Novo Lead" conectado ao banco de dados.
- [x] **Listagem Inteligente:** Componente `LeadList` consumindo API real.
- [x] **Kanban Interativo:** Visualização de Pipeline (High Ticket / Low Ticket).

### Integração WhatsApp (360Dialog)
- [x] **Recebimento de Mensagens:** Webhook (`/whatsapp/webhook`) processando mensagens em tempo real.
- [x] **Criação Automática de Leads:** 
    - Se um número novo manda mensagem -> Cria lead automaticamente.
    - **Inteligência de Nome:** O sistema extrai o nome do perfil do WhatsApp (ex: "João do Zap") ao invés de usar placeholders genéricos.
- [x] **Persistência:** Mensagens salvas na tabela `Message` do banco.

---

## 3. 🚧 O Que Estamos Fazendo (Em Andamento)

### Validação Final (Smoke Test)
- [ ] **Teste de Carga do Kanban:** Verificar persistência do Drag-and-Drop em produção.
- [ ] **Simulação de Landing Page:** Validar se leads vindos do site (`/public/lead`) caem no funil corretamente.

### Refinamento de UX
- [ ] Melhorar feedback visual ao criar leads (Toasts/Notificações).
- [ ] Ajustar filtros de pesquisa para serem case-insensitive (já implementado no backend, verificar front).

---

## 4. 🗺️ O Que Vamos Fazer (Roadmap Futuro)

### Fase 4.1: Módulo Workspace (Gestão de Equipe)
- [ ] **Permissões (RBAC):** SDR só vê leads Novos/Qualificados; Closer vê suas oportunidades.
- [ ] **Team Launchpad:** Tela de gestão de usuários (convidar membros, definir metas).

### Fase 4.2: Módulo Produção (Gamification)
- [ ] **Substituição do Trello:** Pipeline de entrega de vídeos dentro do Hub.
- [ ] **Gamificação:** Sistema de XP/Pontos por entrega e venda.
- [ ] **Upload de Arquivos:** Integração com Storage (AWS S3 ou Supabase Storage) para anexos.

### Fase 4.3: Módulo Financeiro
- [ ] **Gestão de Recebíveis:** Controle de quem pagou/quem deve.
- [ ] **Integração NFS-e:** Emissão automática de notas fiscais.

### Fase 5: Automações (Flow)
- [ ] **Bot de Triagem:** Chatbot inicial para qualificar leads no WhatsApp antes de passar para humano.
- [ ] **Gatilhos:** Venda Fechada -> Cria Card na Produção -> Cria Conta a Receber.

---

## 5. ⚠️ Necessidades & Urgências

### Críticas (Imediatas)
1.  **Backup & Segurança:** Garantir que o banco Supabase tenha backups automáticos diários.
2.  **Monitoramento:** Instalar logs de erro (Sentry ou similar) para pegar falhas silenciosas no backend.
3.  **Estabilidade do WhatsApp:** Monitorar se o token da 360Dialog expira e criar alerta automático.

### Estratégicas
1.  **Mobile First:** Otimizar o Kanban para uso no celular (vendedores na rua).
2.  **Dashboard de Métricas:** O CEO precisa ver o LTV, CAC e Receita em tempo real na Home.

---

## 6. 🛠️ Stack Tecnológico

- **Frontend:** React, Vite, TailwindCSS, TypeScript.
- **Backend:** Node.js, Fastify, Prisma ORM.
- **Banco:** PostgreSQL (Supabase).
- **Integrador WhatsApp:** Hub 360Dialog (API Oficial Meta).
