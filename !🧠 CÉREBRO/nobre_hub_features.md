# Nobre Hub - Especificação de Features

## Visão Geral

**Nobre Hub** é um hub para agências de marketing com foco em gestão de leads, comunicação via WhatsApp, e acompanhamento de produção de entregas.

---

## 1. Autenticação

- Login com email/senha
- Controle de sessão
- Logout
- Dev Panel (painel debug para logar rapidamente) para trocar de usuário

---

## 2. CRM - Gestão de Leads

### 2.1 Kanban
- Visualização em colunas por status do pipeline
- Pipelines separados: Venda, Pós-Venda
- Drag & drop entre colunas (admin pode criar mais colunas e renomear/deletar/editar existentes)
- Card mostra: nome, empresa, valor estimado, última mensagem, tags
- Filtros: por responsável, busca por nome
- Ações rápidas: abrir chat, editar lead

### 2.2 Lista de Leads (Base de Contatos)
- Visualização em tabela
- Colunas: nome, empresa, telefone, responsável, status, valor, última atividade
- Ordenação e filtros
- Seleção múltipla para ações em lote
- Edição avançada
- Exportação

### 2.3 Lead 360 (Modal Detalhado)
- Dados do lead (nome, empresa, telefone, email)
- Histórico de atividades
- Tags e campos customizados
- Chat integrado
- Linha do tempo
- Produtos/deals associados
- Botão "Enviar para Produção" (acionado do Lead 360)

### 2.4 Perda de Lead
- Modal para registrar motivo da perda
- Seleção de motivos pré-cadastrados
- Campo de observações

### 2.5 Inbox - Central de Mensagens
- Lista de Conversas (Ordenação por última mensagem, Indicador de não lidas, Filtros: todas, não lidas, minhas. Busca por nome/telefone
- Chat View (Histórico de mensagens, Envio de texto, áudio, imagem, documento. Templates de mensagem rápida, Indicador de digitação, Agendamento de mensagens, Sidebar com contexto do lead)
- Atribuição (Atribuir conversa para si, Transferir para outro atendente)

---

## 4. Produção - Gestão de Projetos

### 4.1 Dashboard de Produção
- Lista de projetos: Aguardando, Em Produção, A Revisar, Revisado, Alteração
- Filtros
- Sistema de abas para mostrar projetos especificos (A Fazer, Alterações e Finalizados). Na aba de 'A Fazer' aparecem os 'Aguardando' e 'Em Produção', aba Alterações só mostra 'Alteração', aba de 'Finalizados' só mostra 'A Revisar' e 'Revisado'.
- Sidebar mostrando a lista de produtores para roles especificos poderem ver a lista deles e navegar entre seus Dashboards únicos de cada um para checar.
- Pagina de 'Todos' na sidebar, que pega e mosra TODOS os projetos disponiveis entre todos os produtores.
- Sistema de pesquisa (universal, pesquisando entre todos os boards)
- Cards mostram: nome do projeto, lead associado, prazo, checklist progress

### 4.2 Projeto (Modal quando clicar em um item da lista)
- Nome do projeto
- Lead vinculado
- Link do Drive
- Prazo de entrega
- Responsável (produtor)
- Checklist de tarefas
- Status
- Observações

---

## 5. Pós-Venda - Gestão de Entregas e Alterações
- Lista parecida com a de produção mostrando todos os 'Projetos' marcados como Revisados (pela parte de produção)
- Lista mostra: Nome do projeto, nome do cliente, hora que foi revisado e data de entrega, nome do Produtor atribuido (quem fez).
- Filtros de todos os parametros acima.
- Pós-venda pode marcar determinado vídeo Revisado como entregue (muda de aba) ou como 'Alteração' faz ele sumir da lista e voltar para a lista do produtor específico (aba de 'Alterações').

---

## 5. Equipe - Gestão de Usuários

### 5.1 Lista de Membros
- Tabela com: nome, email, cargo, setor, status
- Filtro por setor
- Busca por nome

### 5.2 Chat da Equipe
- UX bem parecida com WhatsApp para facilitar a intuitividade.
- Lista de pessoas (membros da equipe), quando clicadas abre a conversa (DM) (Lista é referente só as pessoas que você ou elas já te enviaram mensagem... tendo que clicar em um botão + pra "chamar" uma pessoa especifica e adicionar nas DMs, similar ao discord/whatsapp)
- Possibilidade da criação de group chats (somente pelo Admin), as pessoas só podem ver o GC quando adicionadas nele.
- Envio de arquivos, de áudio, 

---

## 6. Analytics - Dashboard

- Total de leads por período
- Leads por status
- Leads por responsável
- Valor total estimado
- Conversões
- Filtros por data e pipeline

---

## 7. Configurações (somente Admin)

### 7.1 Organização
- Nome da empresa
- Logo
- Dados de contato

### 7.2 Pipeline
- Gerenciar estágios de cada pipeline
- Nome, cor, ordem
- Criar/editar/excluir estágios

### 7.3 Produtos
- CRUD de produtos/serviços
- Nome, preço, descrição

### 7.4 Motivos de Perda
- CRUD de motivos
- Nome, ativo/inativo

### 7.5 Campos Customizados
- Criar campos extras para leads
- Tipos: texto, número, data, seleção
- Ordenação

### 7.6 Integrações
- Configurar WhatsApp (Evolution API)
- Webhook URL
- Canais de comunicação

### 7.7 Permissões
- Configurar acesso por cargo
- Quais menus cada role pode ver

### 7.8 Gestão de Setores
- CRUD de setores
- Nome e descrição

### 7.9 Cargos/Roles do Sistema
- Criação e gestão de Roles (cargos) de Sistema

### 8.0 Adicionar/Editar Membro
- Nome, email, senha
- Cargo (role)
- Setor
- Status ativo/inativo

### 8.1 Ações em Lote
- Selecionar múltiplos membros
- Alterar setor
- Alterar cargo
- Desativar

---

## 9. Integrações Externas

- **WhatsApp** 360Dialog API
- **Google Drive** (links de pasta)
- Webhooks para entrada de leads (landing pages, formulários)

---

## 10. Requisitos Técnicos

| Item | Tecnologia |
|------|------------|
| Frontend | React + TypeScript + Vite |
| Estilo | Tailwind CSS |
| Backend/DB | Firestore (Firebase) |
| Auth | Firebase Auth |
| Real-time | Firebase Realtime |
| Deploy | Vercel |