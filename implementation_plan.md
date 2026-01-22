# 🚀 Plano de Redesign: Nobre Hub → Nível Clint CRM

> **Data:** 2026-01-21 (Atualizado)
> **Objetivo:** Transformar o Nobre Hub em uma plataforma de CRM completa, seguindo o padrão de qualidade da Clint CRM
> **Abordagem:** Redesign completo, sem restrições de manter código atual
> **Imagens Analisadas:** 47 screenshots (18 iniciais + 29 PRINTS CLINT)

---

## 📊 Análise Completa do Clint CRM

### 🎯 Módulos Identificados

| Módulo | Status | Descrição |
|--------|--------|-----------|
| **Kanban de Negócios** | 🔴 Crítico | Pipeline visual com sidebar de origens |
| **Atendimento (Inbox)** | 🔴 Crítico | Split-view com Lead360 integrado |
| **Lead 360** | 🔴 Crítico | 6 abas: Atividades, Contato, Empresa, Negócio, Conversas, Histórico |
| **Lista de Contatos** | 🟡 Alta | Tabela com filtros avançados e bulk actions |
| **Configuração de Canais** | 🟡 Alta | Multi-WhatsApp + Instagram |
| **Dashboard BI** | 🟢 Média | Métricas e gráficos |
| **Playbook/Atividades** | 🟢 Média | Cadências e templates |

---

## 🆕 Descobertas das 29 Novas Imagens

### 1. Sistema de Filtros Avançados (Atendimento)

```
┌─────────────────────────────────────┐
│ Filtros                         ✕   │
├─────────────────────────────────────┤
│ 📋 Conversas                    ▸   │
│   ○ Atribuídas a mim       [ON]     │
│   ○ Não atribuídas              │
│   ○ Sem resposta do atendente   │
│   ○ Aguardando resposta contato │
│   ○ Em transferência            │
│   ○ Lidas / Não lidas           │
│   ○ Dentro/Fora da janela 24h   │
│   📅 Data de criação            │
│   Status da conversa ▼          │
│   Atendentes ▼                  │
│   Setores ▼                     │
├─────────────────────────────────────┤
│ 🏷️ Negócios                    ▸   │
│   Data ▼                        │
│   Com/sem negócio ▼             │
│   Negócio com status ▼          │
│   Dono do negócio ▼             │
│   Negócio nos grupos ▼          │
│   Negócio nas origens ▼         │
│   Negócio nas etapas ▼          │
├─────────────────────────────────────┤
│ 👤 Contatos                     ▸   │
│ 📱 Canais                       ▸   │
└─────────────────────────────────────┘
```

### 2. Lista de Contatos com Filtros

```
┌───────────────────────────────────────────────────────────────────────────┐
│ 🔍 | Campos ▼ | Tags ▼ | Motivo de Perda ▼ | Mais filtros ▼ | Novo contato│
├───────────────────────────────────────────────────────────────────────────┤
│ ☐ │ Avatar │ Nome                │ Telefone      │ Email            │ Neg │
│ ☐ │ 🖼️    │ Muriel S. Thiago    │ (51) 99326... │ ledoux@gmail.com │ 5   │
│ ☐ │ 🖼️    │ Igor romer12323     │               │ akdopaks@gmail   │ 4   │
│ ☐ │ 🖼️    │ Juliana             │ (51) 9841...  │                  │ 3   │
│ ☐ │ 🖼️    │ Adriana [Lcto Nov]  │ (51) 9836...  │                  │ 2   │
│ ☐ │ 🖼️    │ Camila [Maio/24]    │ (47) 9194...  │ [engajado][FRIO] │ 2   │
└───────────────────────────────────────────────────────────────────────────┘
```

**Filtros Identificados:**
- **Campos:** Buscar por Contato, Empresa (campos custom)
- **Tags:** Dropdown com checkboxes coloridos (Lcto Nov, Maio/24, engajado, FRIO, Sem tag)
- **Motivo de Perda:** Não informar, Sem dinheiro, Comprou produto concorrente, Blacklist, Sem visto
- **Mais Filtros:** Data de criação, Negócio em etapas, Negócio em origem, Status, Com/Sem telefone, Campanhas SMS/Voz

### 3. Lead 360 - 6 Abas Completas

````carousel
**Aba Atividades (Playbook)**
```
┌─────────────────────────────────────────────────────┐
│ Próximas atividades ▼                               │
│ 📋 Dias │ Tarefa                                    │
│    1    │ ☐ Tentativa de contato 1                  │
│    1    │ ☐ Abordagem inicial                       │
│    3    │ ☐ Tentativa de contato 2                  │
│    5    │ ☐ WhatsApp (clique)                       │
│    8    │ ☐ Tentativa de contato 4                  │
│    9    │ ☐ WhatsApp encerramento                   │
│   10    │ ☐ E-mail encerramento                     │
└─────────────────────────────────────────────────────┘
│ [▶️ Ligar para Giovanna] no template selecionado    │
```
<!-- slide -->
**Aba Contato (Custom Fields)**
```
┌─────────────────────────────────────────────────────┐
│ Campos de contato     [Ocultar campos vazios] [⚙️]  │
├─────────────────────────────────────────────────────┤
│ ▼ Informações Gerais                                │
│   Nome:           Giovanna                          │
│   Aniversário:    [clique para adicionar]           │
│   Email:          giovanna@email.com                │
│   Telefone:       🇧🇷 +55 (48) 49337 435            │
│   Instagram:      [clique para adicionar]           │
│   Cargo:          Training director                 │
│   Notas do contato: [clique para adicionar]         │
│   Data de nascimento:                               │
│   Nome do Produto:                                  │
│   UTM:                                              │
│   UTM Source:                                       │
└─────────────────────────────────────────────────────┘
```
<!-- slide -->
**Aba Empresa (Custom Fields)**
```
┌─────────────────────────────────────────────────────┐
│ Campos de empresa     [Ocultar campos vazios] [⚙️]  │
├─────────────────────────────────────────────────────┤
│ ▼ Informações Gerais                                │
│   Nome da empresa: [clique para adicionar]          │
│   URL:             [clique para adicionar]          │
│   Cidade:          [clique para adicionar]          │
│   Estado:          [clique para adicionar]          │
│   Categoria:       [clique para adicionar]          │
│   Segmento:        [clique para adicionar]          │
│   Número de funcionários:                           │
│   CNPJ:            [clique para adicionar]          │
└─────────────────────────────────────────────────────┘
```
<!-- slide -->
**Aba Negócio (Custom Fields)**
```
┌─────────────────────────────────────────────────────┐
│ Campos de negócio     [Ocultar campos vazios] [⚙️]  │
├─────────────────────────────────────────────────────┤
│ ▼ Informações Gerais                                │
│   Valor:           R$ 0,00                          │
│   Produto Adquirido: [clique para adicionar]        │
│   Notas:           [clique para adicionar]          │
│   Temperatura:     [clique para adicionar]          │
│   Link de gravação:                                 │
│   Nome do Produto:                                  │
│   Produto 2:       [clique para adicionar]          │
│   contato_phone:                                    │
│   contato_email:                                    │
│   contato_name:                                     │
│   CATEGORIA SUPORTE:                                │
│   Modelo de iPhone:                                 │
└─────────────────────────────────────────────────────┘
```
<!-- slide -->
**Aba Histórico (Timeline)**
```
┌─────────────────────────────────────────────────────┐
│ 📜 Todos ▼                                          │
├─────────────────────────────────────────────────────┤
│ ● Mudou de posição na etapa                         │
│   Dados: Comercial 2026 > Levantada de Mão          │
│   Este negócio atualizou sua posição na etapa      │
│   ⏰ há um minuto por Suporte Bruno                 │
│                                                     │
│ ● Mudou de posição na etapa                         │
│   ⏰ há 2 meses por Victor Bernardinelli            │
│                                                     │
│ ● Mudou de etapa                                    │
│   Esta oportunidade passou da etapa Base para      │
│   a etapa Prospecção                                │
│   ⏰ há 2 meses                                     │
│                                                     │
│ ● Mudou de etapa                                    │
│   Esta oportunidade passou da etapa No-show        │
│   para a etapa Base                                 │
└─────────────────────────────────────────────────────┘
```
````

### 4. Sidebar do Atendimento (CRM Panel)

```
┌─────────────────────────────────────────────────────┐
│ PRÓXIMO NEGÓCIO ⚙️                            ◀ ▶   │
├─────────────────────────────────────────────────────┤
│ 🖼️ Rafaella Curtiel                                │
│ [MKT-LP] [V1 AUT] [Tentativa IA]                    │
│ 📞 📧 🕐 📋 🔖                                       │
├─────────────────────────────────────────────────────┤
│ NEGÓCIO SELECIONADO                            📋1  │
│ 🏢 Comercial CRM > Levantada de Mão 🇧🇷             │
│    R$ 0,00                                          │
│ [Ganho ✓] [Perdido] [Aberto ○]                      │
│                                                     │
│ Prospecção SDR ▼                              +     │
│ ┌─────────────────────────────────────────────┐     │
│ │ Base IA                               ▸     │     │
│ │ Prospecção IA                         ▸     │     │
│ │ Conexão IA                            ▸     │     │
│ │ Base SDR                              ▸     │     │
│ │ Prospecção SDR 🔵                     ▸     │     │
│ │ Conexão SDR                           ▸     │     │
│ │ No-show                               ▸     │     │
│ │ Pré-agendamento                       ▸     │     │
│ │ Reunião                          1    ▸     │     │
│ └─────────────────────────────────────────────┘     │
├─────────────────────────────────────────────────────┤
│ ▼ Negócio                                           │
│   Origem: Levantada de Mão 🇧🇷              ▼       │
│   Etapa: Prospecção SDR                   ▼       │
│   Dono do negócio: Tasside Lepeck         ▼       │
│   Valor do negócio: R$ 0,00                        │
│   Status: Aberto                          ▼       │
│   [Ir para negócio ↗️]                              │
├─────────────────────────────────────────────────────┤
│ ▸ Contato                                           │
│ ▸ Histórico                                         │
│ ▸ Conversas                                    26   │
│ ▸ Notas                                             │
└─────────────────────────────────────────────────────┘
```

### 5. Configuração de Canais

```
┌─────────────────────────────────────────────────────┐
│ Configurações > Configuração de canais              │
│                                                     │
│ Configuração de canais                              │
│ Selecione o canal que você deseja enviar mensagens  │
│                                                     │
│ ┌───────────────┐ ┌───────────────┐ ┌─────────────┐ │
│ │ 📱 WhatsApp   │ │ 📱 WhatsApp   │ │ 📷 Instagram│ │
│ │ API oficial   │ │               │ │             │ │
│ │ 🟢 Habilitado │ │ 🟢 Habilitado │ │ 🟢Habilitado│ │
│ └───────────────┘ └───────────────┘ └─────────────┘ │
└─────────────────────────────────────────────────────┘
```

### 6. Toolbar de Mensagens

```
┌─────────────────────────────────────────────────────────────────┐
│ [Mensagem...                                         ] [Enviar 📤]│
│ 😊 📎 🎤 📅 🔖 📋 📄                                              │
│ [Enviar imagens]                                                 │
└─────────────────────────────────────────────────────────────────┘
```
**Ações:** Emoji, Anexar, Gravar áudio, Agendar, Tags, Templates, Documentos

---

## 🏗️ ARQUITETURA PROPOSTA

### Fase 1: Core Infrastructure (2 dias)

#### Backend - Novos Models

```prisma
model CustomField {
  id        String   @id @default(uuid())
  name      String
  type      String   // text, number, date, select, multiselect
  entity    String   // contact, company, deal
  options   Json?    // para selects
  order     Int      @default(0)
  isVisible Boolean  @default(true)
  tenantId  String
}

model Activity {
  id           String   @id @default(uuid())
  type         String   // call, whatsapp, email, meeting
  title        String
  description  String?
  dueDate      DateTime
  completed    Boolean  @default(false)
  daysFromLead Int      @default(1)
  leadId       String
  userId       String?
  playbookId   String?
}

model Playbook {
  id         String     @id @default(uuid())
  name       String
  activities Activity[]
  stageId    String?
  tenantId   String
}

model LossReason {
  id        String  @id @default(uuid())
  name      String
  isActive  Boolean @default(true)
  tenantId  String
}
```

### Fase 2: Lead 360 Redesign (3 dias)

#### [MODIFY] [Lead360Modal.tsx](file:///c:/Users/Editor/Desktop/PROJETOS CAIO/WEBDEV/nobre-crm/src/components/Lead360Modal.tsx)

**Mudanças:**
1. Adicionar sistema de campos customizáveis com "Ocultar campos vazios"
2. Implementar tab Atividades com Playbook integrado
3. Adicionar "Gerenciar campos" para admin
4. Timeline do Histórico mais detalhada

#### [NEW] [CustomFieldsEditor.tsx](file:///c:/Users/Editor/Desktop/PROJETOS CAIO/WEBDEV/nobre-crm/src/components/lead360/)

### Fase 3: Filtros Avançados (2 dias)

#### [NEW] [AdvancedFilters.tsx](file:///c:/Users/Editor/Desktop/PROJETOS CAIO/WEBDEV/nobre-crm/src/components/filters/)

**Grupos de Filtros:**
- Conversas (atribuição, status, janela 24h)
- Negócios (dono, origem, etapa, status)
- Contatos (campos, tags)
- Canais

### Fase 4: Contatos View (2 dias)

#### [NEW] [ContactsView.tsx](file:///c:/Users/Editor/Desktop/PROJETOS CAIO/WEBDEV/nobre-crm/src/pages/)

**Features:**
- Tabela com bulk select
- Filtro por campos, tags, motivo de perda
- Tags coloridas inline
- Contagem de negócios por contato
- "Novo contato" button

### Fase 5: Configuração de Canais (1 dia)

#### [NEW] [ChannelConfig.tsx](file:///c:/Users/Editor/Desktop/PROJETOS CAIO/WEBDEV/nobre-crm/src/pages/settings/)

---

## ⚡ PRIORIZAÇÃO ATUALIZADA

| Prioridade | Módulo | Impacto | Esforço |
|------------|--------|---------|---------|
| 🔴 P0 | Lead360 com Custom Fields | Alto | Alto |
| 🔴 P0 | Filtros Avançados Atendimento | Alto | Médio |
| 🔴 P0 | Sidebar CRM completa | Alto | Médio |
| 🟡 P1 | Contatos View | Médio | Médio |
| 🟡 P1 | Sistema de Playbook/Atividades | Médio | Alto |
| 🟡 P1 | Motivo de Perda | Médio | Baixo |
| 🟢 P2 | Config multi-canal | Baixo | Médio |
| 🟢 P2 | Dashboard BI | Médio | Alto |

---

## ❓ PERGUNTAS PENDENTES

1. **Custom Fields:** O backend já suporta campos personalizados ou precisa ser implementado do zero?

2. **Playbook/Cadências:** Qual é a prioridade? Isso requer estrutura backend significativa.

3. **Canais:** Já existe WhatsApp Business API oficial ou apenas a integração Evolution/Baileys?

4. **Por onde começar:**
   - Opção A: Lead360 + Custom Fields (mais impacto visual)
   - Opção B: Filtros Avançados (mais impacto funcional)
   - Opção C: Contatos View (feature nova completa)

---

> [!IMPORTANT]
> Análise completa de 47 screenshots finalizada. Aguardando sua decisão sobre prioridades e respostas às perguntas acima para iniciar a implementação.
