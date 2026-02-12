---
description: Início de sessão — sincronizar branch e validar estado do projeto
---

# Início de Sessão

Workflow obrigatório para ser executado no início de cada sessão de trabalho com qualquer agente.

## Objetivo

Garantir que a branch do agente está sincronizada com a `main` e que o projeto compila sem erros antes de iniciar qualquer trabalho.

---

## Passos

### 1. Identificar a branch atual
// turbo
```powershell
git branch --show-current
```

### 2. Sincronizar com a main
// turbo
```powershell
git pull origin main
```
> Se houver conflitos, resolva-os antes de prosseguir. Commite a resolução.

### 3. Validar o build
// turbo
```powershell
npx tsc --noEmit
```
> Se houver erros, **corrija-os ANTES de iniciar qualquer trabalho novo**. Não comece features sobre código quebrado.

### 4. Confirmar estado limpo
// turbo
```powershell
git status
```
> Se houver alterações pendentes de sessões anteriores, commite e faça push antes de começar trabalho novo.

---

## Regras

- **SEMPRE execute este workflow** antes de iniciar qualquer tarefa
- Se o build falhar no Step 3, a prioridade é corrigir — não avance com trabalho novo
- Se houver conflitos no Step 2, resolva com cuidado — verifique o que mudou na main
