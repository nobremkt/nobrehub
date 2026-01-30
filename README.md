# Nobre Hub 🚀

**O Hub Definitivo para Gestão de Agências de Marketing**

O **Nobre Hub** é uma plataforma "all-in-one" desenvolvida para centralizar e otimizar a operação de agências de marketing. Desde a captação do lead até a entrega final e pós-venda, tudo acontece aqui. Com foco em comunicação ágil via WhatsApp e controle visual de produção, o Nobre Hub elimina a necessidade de múltiplas ferramentas desconexas.

---

## ✨ Principais Funcionalidades

O Nobre Hub foi projetado para cobrir toda a jornada do cliente dentro da agência:

### 🤝 CRM & Vendas
- **Kanban de Vendas:** Visualize seus leads em um pipeline interativo (drag & drop).
- **Lead 360:** Tenha uma visão completa de cada contato, histórico de conversas e arquivos.
- **Inbox Unificado:** Central de mensagens estilo WhatsApp Web para atender leads rapidamente, com suporte a áudio, imagem e templates.
- **Gestão de Perdas:** Motivos de perda customizáveis para análise posterior.

### 🏭 Produção & Projetos
- **Dashboard de Produção:** Acompanhe o status de cada vídeo ou arte em tempo real (Aguardando, Em Produção, Revisão).
- **Checklists Inteligentes:** Cada projeto possui seu próprio checklist para garantir a qualidade da entrega.
- **Fluxo de Revisão:** Sistema claro para aprovações e solicitações de alteração.

### 📦 Pós-Venda
- **Gestão de Entregas:** Organize o que já foi aprovado e o que precisa ser enviado ao cliente.
- **Histórico de Alterações:** Controle versões e solicitações de ajustes de forma organizada.

### 👥 Gestão de Equipe
- **Chat Interno:** Comunicação direta entre membros da equipe (DMs e Grupos) sem sair da plataforma.
- **Permissões Granulares:** Controle total sobre o que cada cargo (Vendas, Produção, Admin) pode ver e editar.

### 📊 Analytics
- **Dados em Tempo Real:** Acompanhe métricas de leads, conversão e produtividade da equipe.

---

## 🛠️ Tecnologias Utilizadas

Construído com uma stack moderna e robusta para garantir performance e escalabilidade:

| Categoria | Tecnologia |
|-----------|------------|
| **Frontend** | React + TypeScript + Vite |
| **Estilização** | Tailwind CSS + Design System Próprio |
| **Backend / DB** | Firebase (Firestore, Auth, Realtime DB) |
| **Hospedagem** | Vercel |

---

## 🧩 Arquitetura do Projeto

O projeto segue uma arquitetura modular e escalável (`src/features`), facilitando a manutenção e adição de novas funcionalidades.

### Estrutura Base
- **`src/app`**: Componentes raiz e setup inicial.
- **`src/config`**: Configurações centralizadas (rotas, constantes, firebase).
- **`src/design-system`**: Biblioteca de componentes UI reutilizáveis (Buttons, Inputs, Cards).
- **`src/features`**: Módulos de negócio independentes (CRM, Inbox, Produção).
- **`src/stores`**: Gerenciamento de estado global com **Zustand**.

---

## 🔌 Integrações

O Nobre Hub se conecta com as ferramentas essenciais do seu dia a dia:

- **WhatsApp (API Oficial/Evolution):** Para envio e recebimento de mensagens diretamente pelo painel.
- **Google Drive:** Integração para organização automática de pastas e arquivos dos projetos.
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
*Desenvolvido pela equipe Nobre Hub*
