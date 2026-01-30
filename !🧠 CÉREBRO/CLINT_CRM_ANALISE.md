# 📋 Análise do CRM Clint - Referência de UI/UX

> **Data:** 30/01/2026  
> **Fonte:** Screenshots da pasta `PRINTS CLINT` (29 imagens)  
> **Objetivo:** Extrair padrões de estrutura e UI para servir de referência no Nobre Hub  
> ⚠️ **Nota:** Ignorar cores/identidade visual - já temos nosso Design System definido

---

## 1. 🏗️ Estrutura Geral / Layout

### Layout 3 Painéis (Inbox)

```
┌─────────┬──────────────────────────────┬─────────────┐
│ Sidebar │     Lista Conversas          │  Painel de  │
│  Fixa   │     (scrollável)             │  Detalhes   │
│  (~60px)│     (~300px)                 │   (~350px)  │
├─────────┤                              │             │
│ Avatar  │  ┌─────────────┐             │  ┌───────┐  │
│ do User │  │ Conversa 1  │             │  │Avatar │  │
│         │  │ Conversa 2  │  Chat View  │  │ Nome  │  │
│ Pipelines│  │ Conversa 3  │  (centro)   │  │ Tags  │  │
│         │  └─────────────┘             │  └───────┘  │
│ Suporte │                              │  Contato    │
│ Fila    │                              │  Negócio    │
│ Perdidos│                              │  Notas      │
│ etc...  │                              │  Histórico  │
└─────────┴──────────────────────────────┴─────────────┘
```

### Características Principais:
- **Sidebar Esquerda Vertical**: Avatar do usuário no topo, navegação por pipelines/filas abaixo
- **Lista de Conversas**: Cards com avatar + nome + última mensagem + timestamp
- **Chat Central**: Área principal de conversa com input inferior
- **Painel Direito Colapsável**: Detalhes completos do lead/negócio

---

## 2. 👤 Perfil do Contato (Painel Direito)

### Estrutura em Seções Colapsáveis (Accordion)

```
┌─────────────────────────────────────┐
│ 📸 Avatar Grande                    │
│ 👤 Nome do Contato                  │
│ [Tag 1] [Tag 2] [Tag 3]  (coloridas)│
├─────────────────────────────────────┤
│ 📞 Ícones de Ação Rápida:           │
│ [📞] [📧] [📋] [💬] [🔔] [🔀]        │
├─────────────────────────────────────┤
│ ▼ NEGÓCIO SELECIONADO               │
│   ├─ Pipeline > Etapa Atual 🟢      │
│   ├─ [Ganho] [Perdido] [Aberto]     │
│   └─ Dropdown "Alterar etapa"       │
├─────────────────────────────────────┤
│ ▼ Contato                      [▸]  │
│   ├─ Nome                           │
│   ├─ Email                          │
│   ├─ Telefone (com 🇧🇷 flag)         │
│   └─ Instagram                      │
│   └─ Tags                           │
├─────────────────────────────────────┤
│ ▼ Negócio                      [▸]  │
│   ├─ Origem                         │
│   ├─ Etapa                          │
│   ├─ Dono do negócio                │
│   ├─ Valor do negócio (R$)          │
│   └─ Status                         │
├─────────────────────────────────────┤
│ ▼ Notas                        [▸]  │
├─────────────────────────────────────┤
│ ▼ Histórico                    [▸]  │
│   └─ Timeline de mudanças           │
├─────────────────────────────────────┤
│ ▼ Conversas                 [26][▸] │
│   └─ Contador de conversas          │
└─────────────────────────────────────┘
```

### Padrão de Tags:
- Tags coloridas em pills/badges
- Exibidas logo abaixo do nome
- Cada tag tem cor única
- Botão "X" para remover
- Campo "Clique aqui para adicionar"

---

## 3. 📋 Lista de Contatos (Tabela)

### Estrutura:

```
┌────────────────────────────────────────────────────────────────┐
│ [🔍] [Campos ▼] [Tags ▼] [Motivo de Perda ▼] [Mais filtros ▼]  │
├────────────────────────────────────────────────────────────────┤
│ ☐ Selecionar todos                           20980 contatos   │
├────────────────────────────────────────────────────────────────┤
│ ☐ 🖼️ Muriel S. Thiago  │ 📞 51...│ 📧 email@... │ 3 negócios │ [Tags] │
│ ☐ 🖼️ Igor romer12323   │ 📞 51...│ 📧 email@... │ 4 negócios │ [Tags] │
│ ☐ 🖼️ Juliana           │ 📞 51...│ 📧 email@... │ 3 negócios │ [Tags] │
└────────────────────────────────────────────────────────────────┘
                                               [Novo contato ➕]
```

### Colunas Visíveis:
1. **Checkbox** de seleção
2. **Avatar** (foto ou iniciais)
3. **Nome**
4. **Telefone** (com ícone)
5. **Email** (com ícone)
6. **Quantidade de negócios** (badge numérico)
7. **Tags** (em formato de pills)

### Sistema de Filtros:

| Filtro | Tipo | Opções |
|--------|------|--------|
| **Busca** | Input texto | Busca por nome, email, telefone |
| **Campos** | Dropdown multi | Contato, Empresa |
| **Tags** | Dropdown multi + Busca | Lista de tags existentes |
| **Motivo de Perda** | Dropdown multi | Não informar, Sem dinheiro, Comprou concorrente, etc. |
| **Mais Filtros** | Modal expandido | Filtros avançados completos |

### Mais Filtros (Expandido):
- Filtrar por data de criação
- Com negócio em origem
- Com negócio em etapa
- Com negócio em status
- Com/Sem dono do negócio
- Com/Sem telefone
- Filtrar por campanhas de SMS
- Filtrar por campanhas de Voz

---

## 4. 📊 Kanban (Pipeline de Negócios)

### Estrutura:

```
┌──────────────────────────────────────────────────────────────────┐
│ Negócios da origem: [Levantada de mão ▼]                         │
│ [🔍] [Data ▼] [Campos ▼] [Tags ▼] [Dono ▼] [Status ▼] [Filtros]  │
├──────────────────────────────────────────────────────────────────┤
│ {225 oportunidades de Negócio}                    [+ Negócio]    │
├──────────┬───────────┬────────────┬───────────┬─────────┬────────┤
│  Base    │Prospecção │ Conexão IA │  No-show  │ Reunião │Proposta│
│   951    │    897    │    (N)     │   855/50  │   851   │   (N)  │
├──────────┼───────────┼────────────┼───────────┼─────────┼────────┤
│ ┌──────┐ │ ┌──────┐  │ ┌──────┐   │ ┌──────┐  │         │        │
│ │🖼 Davi│ │ │🖼 Pat │  │ │🖼 Vic│   │ │🖼 Ser │  │         │        │
│ │R$ XX │ │ │ CLINT │  │ │      │   │ │      │  │         │        │
│ │📞 📱 │ │ │📞 📱  │  │ │📞 📱 │   │ │📞 📱 │  │         │        │
│ └──────┘ │ └──────┘  │ └──────┘   │ └──────┘  │         │        │
└──────────┴───────────┴────────────┴───────────┴─────────┴────────┘
```

### Card de Negócio (Deal):
```
┌─────────────────────────────┐
│ 🖼️ Avatar  Nome do Cliente  │
│ [Tag] [Tag2]                │
│ R$ 0,00                     │
│ [📞] [📧] [📱] [⋯]    22:15│
└─────────────────────────────┘
```

### Informações do Card:
- Avatar/foto do contato
- Nome 
- Tags coloridas
- Valor do negócio
- Ícones de comunicação (telefone, email, WhatsApp)
- Timestamp

### Etapas do Pipeline (customizáveis):
- Base IA / Prospecção IA / Conexão IA
- Base SDR / Prospecção SDR / Conexão SDR
- No-show
- Pré-agendamento
- Reunião
- Proposta
- Fechamento

---

## 5. 💬 Chat View (Área de Conversa)

### Estrutura:

```
┌─────────────────────────────────────────────────────────────────┐
│ 🖼️ Nome do Contato │ WhatsApp Oficial - Time ABC 🟢 │ ⏰ 23:58   │
│                     [📞] [📹] [⋯]                   [🔍] [📌]   │
├─────────────────────────────────────────────────────────────────┤
│ ═══════════════ Popup de Aviso (opcional) ═══════════════════  │
│ │ "A janela de conversa do atendimento encerrou..."            │
│ └───────────────────────────────────────────────────────────────│
├─────────────────────────────────────────────────────────────────┤
│                    ─── Hoje ───                                 │
│                                                                 │
│    ┌────────────────────────────┐                               │
│    │ Olá! Tudo bem?             │ 22:15 ✓✓                      │
│    │ (enviada)                  │                               │
│    └────────────────────────────┘                               │
│                                                                 │
│                            ┌────────────────────────────────┐   │
│                            │ Oii, tudo ótimo!               │   │
│                            │ (recebida)                14:30│   │
│                            └────────────────────────────────┘   │
│                                                                 │
│    ┌────────────────────────────┐                               │
│    │ [Audio Player 🔊 ━━━━━━ ]  │ 22:15 ✓✓                      │
│    └────────────────────────────┘                               │
├─────────────────────────────────────────────────────────────────┤
│ [😊] [📎] [🎙️] [📷] [📁] [📝]   Mensagem...     [Enviar ▶️]     │
└─────────────────────────────────────────────────────────────────┘
```

### Barra de Input (Toolbar):

| Ícone | Função |
|-------|--------|
| 😊 | Emoji picker |
| 📎 | Anexar arquivo |
| 🎙️ | Gravar áudio |
| 📷 | Enviar imagem |
| 📁 | Templates de mensagem |
| 📝 | Notas internas |
| **T** | Variáveis (inserir nome, produto, etc.) |

### Modal: Agendamento de Mensagem
```
┌───────────────────────────────────┐
│ Agendamento de mensagem           │
├───────────────────────────────────┤
│ ┌─────────────────────────────┐   │
│ │ Estou retomando nossa...  T │   │
│ └─────────────────────────────┘   │
│                                   │
│ [😊][📎][🎙️][📷][📁][📝] [Add+]  │
│                                   │
│ Data: [26/08/2025 📅]             │
│ Hora: [15:14 ⏰]                   │
│                                   │
│ [Cancelar]  [Criar Agendamento]   │
└───────────────────────────────────┘
```

---

## 6. 👁️ Detalhes do Contato (Página Dedicada)

### Navegação em Abas:
```
┌─────────────────────────────────────────────────────────────────┐
│ 🖼️ Giovanna │ 📧 📞 📌 ⭐ │ [Ganho▼][Perdido▼] │ [📱][✉️][📌]   │
├─────────────────────────────────────────────────────────────────┤
│ [Atividades] [Contato] [Empresa] [Negócios] [Conversas] [Hist.] │
├─────────────────────────────────────────────────────────────────┤
```

### Aba "Atividades" (Playbook/Cadência):
- Timeline visual com steps numerados
- Cada step tem: tipo, descrição, template de mensagem
- Botão "Ir para Mensagem"

### Aba "Contato" (Campos Personalizados):
| Campo | Tipo |
|-------|------|
| Nome | Texto |
| Aniversário | Data |
| Email | Email |
| Telefone | Tel com bandeira país |
| Instagram | Username |
| Cargo | Texto |
| Notas | Textarea |
| UTM / UTM source | Texto |

### Aba "Empresa":
| Campo | Tipo |
|-------|------|
| Nome da empresa | Texto |
| URL | Link |
| Cidade/Estado | Texto |
| Categoria | Dropdown |
| Segmento | Dropdown |
| Nº de funcionários | Número |
| CRM | Texto |

### Aba "Negócios":
| Campo | Tipo |
|-------|------|
| Valor | Currency (R$) |
| Produto Adquirido | Dropdown |
| Notas | Textarea |
| Temperatura | Dropdown (Frio/Morno/Quente) |
| Link de gravação | URL |
| Nome do Produto | Texto |

### Aba "Histórico":
- Timeline vertical
- Eventos de mudança de etapa
- Data + autor da ação
- Filtro por tipo de evento

---

## 7. ⚙️ Configurações / Canais

### Tela de Configuração de Canais:
```
┌────────────────────────────────────────────────────────────────┐
│ Configuração de canais                                          │
│ Selecione o canal que você deseja enviar mensagens              │
├────────────────────────────────────────────────────────────────┤
│ ┌────────────┐  ┌────────────┐  ┌────────────┐                  │
│ │ 📱         │  │ 📱         │  │ 📷         │                  │
│ │ WhatsApp   │  │ WhatsApp   │  │ Instagram  │                  │
│ │ API Oficial│  │ [instalado]│  │ [instalado]│                  │
│ │ 🟢         │  │ 🟢         │  │ 🟢         │                  │
│ └────────────┘  └────────────┘  └────────────┘                  │
└────────────────────────────────────────────────────────────────┘
```

### Configuração do Canal (ex: Instagram):
- **Abas:** Contas, Usuários e Permissões, Setores
- **Tabela:** Usuário na conta, Status (Conectado), Setores, Ícones de ação

---

## 8. 🔍 Sistema de Filtros Avançados (Inbox)

### Sidebar de Filtros (Expandida):

```
┌───────────────────────────────┐
│ Filtros                    ✖ │
├───────────────────────────────┤
│ 1 Filtro Aplicado         ✖  │
├───────────────────────────────┤
│ 💬 Conversas            [1>] │
│   ○ Atribuídas a mim         │
│   ○ Não atribuídas           │
│   ○ Sem resposta atendente   │
│   ○ Aguardando resposta      │
│   ○ Em transferência         │
│   ○ Lidas / Não lidas        │
│   ○ Dentro/Fora janela conv. │
├───────────────────────────────┤
│   Data criação atendimento   │
│   Status da conversa         │
│   Atendentes                 │
│   Setores                    │
├───────────────────────────────┤
│ 💼 Negócios              [>] │
│   Data                       │
│   Com/sem negócio            │
│   Negócio com status         │
│   Dono do negócio            │
│   Negócios nas origens       │
│   Negócios nas etapas        │
├───────────────────────────────┤
│ 👤 Contatos              [>] │
├───────────────────────────────┤
│ 📱 Canais                [>] │
└───────────────────────────────┘
```

---

## 9. 📝 Padrões de UI Importantes

### Ações Rápidas:
```
[📞 Ligar] [📧 Email] [📋 Copiar] [💬 Chat] [🔔 Notificar] [🔀 Transferir]
```

### Status de Negócio:
```
[Ganho 🟢]  [Perdido 🔴]  [Aberto ⚪]
```

### Variáveis de Texto (Templates):
```
Olá {{nome}}, como posso ajudar?
```

### Counter Badges:
- `Ver 4 negócios` (link com contador)
- `26` (badge circular para conversas)
- `20980 contatos` (total no header)

### Campos Editáveis Inline:
```
[Clique aqui para adicionar]
```

---

## 10. 📱 Mapeamento de Componentes

| Área | Componentes |
|------|-------------|
| **Sidebar** | Avatar, Pipeline List, Fila/Queues, Badges |
| **Lista Conversas** | ConversationCard, Timestamp, Avatar, LastMessage |
| **Chat** | MessageBubble (in/out), AudioPlayer, Toolbar, EmojiPicker |
| **Contato** | AccordionSection, TagPill, ActionIcon, EditableField |
| **Kanban** | PipelineColumn, DealCard, DragHandle, Counter |
| **Lista Contatos** | Table, Checkbox, FilterDropdown, SearchInput, Pagination |
| **Filtros** | FilterSidebar, ToggleSwitch, Dropdown, DatePicker |
| **Modais** | Modal (Agendamento, Criação, Edição) |

---

## 🎯 Prioridades para Implementação

### Alta Prioridade:
1. ✅ Layout 3 painéis (Inbox) - **já temos**
2. 🔲 Accordion expansível no painel direito
3. 🔲 Sistema de Tags coloridas
4. 🔲 Lista de Contatos com filtros

### Média Prioridade:
5. 🔲 Ícones de ação rápida
6. 🔲 Sistema de filtros sidebar
7. 🔲 Campos editáveis inline
8. 🔲 Histórico/Timeline

### Baixa Prioridade (futuro):
9. 🔲 Agendamento de mensagens
10. 🔲 Playbooks/Cadências
11. 🔲 Multi-canais (Instagram)

---

## 📁 Localização dos Screenshots

```
C:\Users\Editor\Desktop\PROJETOS CAIO\WEBDEV\nobrehubv2\PRINTS CLINT\
```

29 arquivos PNG com capturas de todas as áreas do CRM.

---

> **Próximo passo:** Usar essa análise como referência para implementar a **Lista de Contatos** no Nobre Hub.
