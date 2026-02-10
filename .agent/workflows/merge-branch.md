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

### 1. Garantir que a branch está limpa
// turbo
```powershell
git status
```
> Se houver alterações não commitadas, commite e faça push antes de prosseguir.

### 2. Checkout na main e atualizar
// turbo
```powershell
git checkout main
git pull origin main
```

### 3. Merge da branch do agente
```powershell
git merge <NOME_DA_BRANCH>
```
> Se houver conflitos, resolva-os manualmente, depois:
```powershell
git add .
git commit -m "Merge branch '<NOME_DA_BRANCH>' into main"
```

### 4. Push da main para o GitHub
```powershell
git push origin main
```
> O Vercel detecta automaticamente e faz deploy.

### 5. Validar o build
// turbo
```powershell
npx tsc --noEmit
```

### 6. Voltar para a branch do agente (opcional)
// turbo
```powershell
git checkout <NOME_DA_BRANCH>
```

---

## Atualizar Branch do Agente com a Main

Quando outro agente mergeou na main e sua branch está desatualizada:

```powershell
git checkout <NOME_DA_BRANCH>
git pull origin main
```
> Resolve conflitos se necessário, commita e continua trabalhando.

---

## Regras

- **Nunca delete branches de agente** — são permanentes
- **Merge UMA branch por vez** — valide entre cada merge
- **Sempre faça `git pull origin main`** antes de mergear, para evitar conflitos desnecessários
- **Se algo der errado após o merge**, reverta com `git revert HEAD` na main
