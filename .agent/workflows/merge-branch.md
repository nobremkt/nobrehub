---
description: Merge de uma branch de agente (Antigravity, Codex, Claude) de volta na main com validação
---

# Merge de Branch de Agente na Main

Workflow seguro para integrar o trabalho de uma branch de agente na branch `main` via Pull Request no GitHub.

## Pré-requisitos
- Saber o nome da branch a ser mergeada (ex: `feat/antigravity-task`, `feat/codex-dashboard`)
- A branch deve estar com o trabalho finalizado e commitado
- O repositório deve estar conectado ao GitHub

---

## Passos

### 1. Garantir que todo trabalho da branch está commitado e enviado
// turbo
```powershell
git -C <PASTA_DO_AGENTE> status
```
> Se houver arquivos não commitados, commite primeiro:
```powershell
git -C <PASTA_DO_AGENTE> add .
git -C <PASTA_DO_AGENTE> commit -m "feat: <descrição do trabalho>"
```

### 2. Push da branch para o GitHub
```powershell
git -C <PASTA_DO_AGENTE> push origin <NOME_DA_BRANCH>
```

### 3. Criar Pull Request no GitHub
// turbo
```powershell
gh pr create --base main --head <NOME_DA_BRANCH> --title "Merge <NOME_DA_BRANCH>" --body "Trabalho do agente concluído. Áreas alteradas: <listar módulos>"
```
> Se não tiver o GitHub CLI (`gh`), crie o PR manualmente em: https://github.com/<OWNER>/<REPO>/compare/main...<NOME_DA_BRANCH>

### 4. Revisar o diff no GitHub
> Abra o link do PR no browser e revise os arquivos alterados.
> Verifique se não há conflitos indicados pelo GitHub.

### 5. Merge do PR no GitHub
> Opção A (via CLI):
```powershell
gh pr merge <NUMERO_DO_PR> --merge
```
> Opção B: Clique em "Merge pull request" no GitHub.

### 6. Atualizar a main local
// turbo
```powershell
git checkout main
git pull origin main
```

### 7. Validar o build localmente
// turbo
```powershell
npm install
npm run build
```
> Se o build falhar, corrija antes de mergear a próxima branch.

### 8. Testar a aplicação
// turbo
```powershell
npm run dev
```
> Abra o app no browser e teste as áreas afetadas.

---

## Dicas
- **Merge UMA branch por vez.** Teste entre cada merge.
- **Ordem sugerida:** Merge primeiro a branch com MENOS alterações.
- **Se o PR mostrar conflitos:** Resolva na branch do agente antes de mergear:
  ```powershell
  git -C <PASTA_DO_AGENTE> fetch origin main
  git -C <PASTA_DO_AGENTE> merge origin/main
  # resolver conflitos, commitar, e push de novo
  ```
- **Se algo der errado após o merge:** Reverta o PR com 1 clique no GitHub ("Revert").