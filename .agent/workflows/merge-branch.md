---
description: Merge de uma branch de agente de volta na main com validação
---

# Merge de Branch de Agente na Main

Workflow para integrar o trabalho de uma branch de agente na branch `main`.

## Contexto

- `main` é a branch de produção, deployada automaticamente no Vercel
- Cada agente trabalha em sua própria branch permanente (ex: `antigravity-turquia`, `codex-alemanha`)
- Branches de agente **nunca são deletadas** — são reutilizadas entre sessões
- Merges são feitos localmente via git (sem PR, sem `gh` CLI)

## Pré-requisitos
- O trabalho na branch deve estar finalizado, commitado e pushado
- O repositório: `github.com/nobremkt/nobrehub`

---

## Passos

### 0. 🚨 OBRIGATÓRIO: Sincronizar branch com a main
// turbo
```powershell
git pull origin main
```
> **NUNCA PULE ESTE PASSO.** Outro agente pode ter mergeado na main desde a última sessão. Se não sincronizar, o merge pode quebrar o build com conflitos silenciosos (tipos desatualizados, interfaces incompatíveis). Resolve conflitos se necessário antes de prosseguir.

### 1. Garantir que a branch está limpa
// turbo
```powershell
git status
```
> Se houver alterações não commitadas, commite e faça push antes de prosseguir.

### 2. ⚠️ Validar o build ANTES de mergear
// turbo
```powershell
npx tsc --noEmit
```
> Se houver erros, **corrija-os na branch do agente ANTES** de prosseguir. Nunca merge código com erros de tipo.

### 3. Push da branch do agente
// turbo
```powershell
git push origin <NOME_DA_BRANCH>
```

### 4. Checkout na main e atualizar
// turbo
```powershell
git checkout main
git pull origin main
```

### 5. Merge da branch do agente
```powershell
git merge <NOME_DA_BRANCH>
```
> Se houver conflitos, resolva-os manualmente, depois:
```powershell
git add .
git commit -m "Merge branch '<NOME_DA_BRANCH>' into main"
```

### 6. ⚠️ Validar o build DEPOIS do merge
// turbo
```powershell
npx tsc --noEmit
```
> Se houver erros no build pós-merge, **corrija-os na main ANTES de fazer push**. Isso garante que o Vercel nunca receba código quebrado.

### 7. Push da main para o GitHub
```powershell
git push origin main
```
> O Vercel detecta automaticamente e faz deploy.

### 8. Voltar para a branch do agente e sincronizar
// turbo
```powershell
git checkout <NOME_DA_BRANCH>
git pull origin main
```

---

## Regras

- **Nunca delete branches de agente** — são permanentes
- **Merge UMA branch por vez** — valide entre cada merge
- **SEMPRE sincronize com a main (Step 0)** antes de começar qualquer merge
- **SEMPRE valide o build pós-merge (Step 6)** antes de fazer push na main
- **No início de cada sessão de trabalho**, faça `git pull origin main` na branch do agente
- **Se algo der errado após o merge**, reverta com `git revert HEAD` na main
