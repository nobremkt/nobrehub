# Resumo do Fluxo - Mapa Mental

## 🎯 CICLO COMPLETO DO CLIENTE

```
LEAD CHEGA (webhook WhatsApp)
     ↓
CONVERSA + LEAD criados simultaneamente
     ↓
     ├── INBOX VENDAS (vendedora negocia via WhatsApp)
     └── BASE DE CONTATOS (lead aparece no CRM/Kanban)
     ↓
     ├── NÃO FECHOU → Lead Perdido
     │
     └── FECHOU VENDA → CRIA PROJETO
                             ↓
             ┌───────────────┴───────────────┐
             ↓                               ↓
     LISTA PRODUÇÃO              LISTA PÓS-VENDAS
     (Líder distribui)           (Líder distribui)
             ↓                               ↓
     PRODUTOR RECEBE             PÓS-VENDA RECEBE
             ↓                               ↓
     EM PRODUÇÃO                 AGUARDANDO PROJETO
             ↓                         (acompanha status)
     FINALIZADO (produtor)              ↓
             ↓                   VÊ "REVISADO" →
     QUALIDADE (líder revisa)    ENTREGA AO CLIENTE
             ↓                               ↓
     REVISADO                    CLIENTE APROVOU?
                                 ├── NÃO → ALTERAÇÃO (volta pro MESMO produtor)
                                 │
                                 └── SIM → AGUARDANDO PAGAMENTO
                                                 ↓
                                         PAGAMENTO RECEBIDO
                                                 ↓
                                         100% CONCLUÍDO
                                                 ↓
                                     SAI DO INBOX PÓS-VENDA
                                                 ↓
                                     VOLTA PRA BASE DE CONTATOS
                                                 ↓
                                  (Se mandar mensagem, reinicia ciclo)
```

---

## 🏭 DISTRIBUIÇÃO DE PRODUÇÃO

```
PROJETO CRIADO
      ↓
LISTA DE DISTRIBUIÇÃO (só líder vê)
      │
      ├── INFO: Projeto + Cliente + Pontos
      ├── INFO: Produtor sugerido (destacado)
      └── INFO: Observações da vendedora
      │
      └── LÍDER DECIDE:
            ├── AUTOMÁTICO: Balanceamento por pontos/projetos ativos
            ├── MANUAL: Escolhe produtor
            └── SUGESTÃO: Vendedora sugeriu → líder confirma ou ignora
```

**PONTUAÇÃO:**
- Base = pontos do produto (GoalsPage)
- Extra = vendedora pode aumentar manualmente
- Vídeos = pontos por duração (30s/60s/60+)

**FLUXO DO PROJETO NA PRODUÇÃO:**
```
Aguardando → Em Produção → Finalizado → Qualidade (líder) → Revisado → Entregue
                                                                          ↓
                                                                  Alteração? → volta pro MESMO produtor
                                                                              (NUNCA volta pra lista)
```

**ALTERAÇÕES:**
- SEMPRE voltam pro MESMO produtor
- NUNCA voltam pra lista de distribuição

---

## 📞 DISTRIBUIÇÃO PÓS-VENDAS

```
PROJETO CRIADO
      ↓
CLIENTE SAI DO INBOX VENDAS
      ↓
LISTA DE DISTRIBUIÇÃO PÓS-VENDAS
      │
      ├── INFO: Cliente + Projeto
      ├── INFO: Produtor que fez
      ├── INFO: Quem já atendeu esse cliente (histórico)
      └── INFO: Carga de cada pós-venda
      │
      └── LÍDER DECIDE:
            ├── AUTOMÁTICO: Menos clientes ativos
            └── MANUAL: Escolhe pós-venda
```

**SE TODAS INDISPONÍVEIS:**
- Cliente fica na lista aguardando

---

## 📥 INBOX PÓS-VENDA (FILTROS)

```
┌─────────────────────────────────────┐
│           ABAS/FILTROS              │
├─────────────────────────────────────┤
│ • TODOS                            │
│ • AGUARDANDO PROJETO               │
│ • ENTREGUE                         │
│ • AGUARDANDO ALTERAÇÃO             │
│ • AGUARDANDO PAGAMENTO             │
│ • CONCLUÍDOS                       │
└─────────────────────────────────────┘
```

**AÇÕES:**
- Ver status do projeto (tempo real da produção)
- Marcar entregue (quando projeto está revisado)
- Solicitar alteração → volta pro MESMO produtor
- Cliente aprovou → Aguardando Pagamento
- Pagamento recebido → CONCLUÍDO

---

## 👥 MÚLTIPLOS PROJETOS

```
1 CLIENTE pode ter N PROJETOS simultâneos

PRODUÇÃO: Cada projeto = 1 card separado
INBOX: 1 conversa com lista de projetos
FILTRO: Cliente aparece se TEM PELO MENOS 1 projeto no status
CONCLUSÃO: Só sai quando TODOS os projetos concluídos
```

---

## 🔗 RASTRO COMPLETO DO LEAD

```
Cada lead carrega o histórico de quem participou:

VENDEDOR:    assignedTo (quem vendeu)
PRODUTOR:    producerId (quem produziu, por projeto)
PÓS-VENDA:  postSalesId (quem atende)
             previousPostSalesIds[] (histórico de atendentes)
```

---

## ✅ PROJETO 100% CONCLUÍDO

```
1. Cliente APROVOU ✓
2. Pagamento RECEBIDO ✓
           ↓
   Sai do Inbox Pós-Venda
           ↓
   Volta pra Base de Contatos
           ↓
   (Se entrar em contato novamente,
    reinicia o ciclo de vendas)
```

---

## 🏆 SISTEMA DE METAS (PRODUÇÃO)

```
PONTOS = basePoints + extraPoints

META DIÁRIA (individual) × PRODUTORES ATIVOS = META EQUIPE

DASHBOARD:
- Pontos entregues vs Meta
- Ranking de produtores
```
