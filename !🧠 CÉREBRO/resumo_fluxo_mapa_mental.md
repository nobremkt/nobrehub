# Resumo do Fluxo - Mapa Mental

## 🎯 CICLO COMPLETO DO CLIENTE

```
LEAD CHEGA
    ↓
BASE DE CONTATOS
    ↓
INBOX VENDAS (vendedora negocia)
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
            ↓                               ↓
    REVISADO ←──────────────────── VÊ STATUS
            ↓
    ENTREGA LINK → PÓS-VENDA ENVIA AO CLIENTE
                            ↓
                    CLIENTE APROVOU?
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
      ├── INFO: Quem já atendeu esse cliente
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

**ALTERAÇÕES:**
- SEMPRE voltam pro MESMO produtor
- NUNCA voltam pra lista

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
      ├── INFO: Quem já atendeu esse cliente
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
│ • AGUARDANDO PROJETO                │
│ • AGUARDANDO ALTERAÇÃO              │
│ • ENTREGUE                          │
│ • AGUARDANDO PAGAMENTO              │
│ • TODOS                             │
│ • OUTROS                            │
└─────────────────────────────────────┘
```

**AÇÕES:**
- Ver status do projeto (tempo real da produção)
- Solicitar alteração → volta pro MESMO produtor
- Marcar entregue
- Cliente aprovou
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

## ✅ PROJETO 100% CONCLUÍDO

```
1. Cliente APROVOU ✓
2. Pagamento RECEBIDO ✓
           ↓
   Sai do Inbox Pós-Venda
           ↓
   Volta pra Base de Contatos
           ↓
   (Pode iniciar novo ciclo)
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
