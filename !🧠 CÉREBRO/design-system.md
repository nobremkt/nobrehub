---
trigger: always_on
---

# Nobre Hub - Design System Compliance Rules

## 🚨 REGRA OBRIGATÓRIA: SEMPRE USE O DESIGN SYSTEM

**Esta regra é INVIOLÁVEL.** Antes de criar qualquer componente UI, estilização ou interação visual, você DEVE consultar e utilizar o Design System existente.

---

## 📍 Localização do Design System

```
src/design-system/
├── tokens/           # CSS Variables (cores, espaçamentos, tipografia)
│   └── index.css     # Todas as variáveis CSS
├── components/       # Componentes reutilizáveis
│   ├── Button/
│   ├── Input/
│   ├── Dropdown/
│   ├── Modal/
│   ├── Tag/
│   ├── Badge/
│   ├── Checkbox/
│   ├── Switch/
│   ├── Spinner/
│   ├── Card/
│   └── ...
└── index.ts          # Exports centralizados
```

---

## ✅ CHECKLIST OBRIGATÓRIO

Antes de escrever CSS ou criar componentes, SEMPRE verifique:

### 1. Tokens CSS (OBRIGATÓRIO)
```css
/* ❌ NUNCA faça isso */
color: #dc2626;
padding: 16px;
font-size: 14px;
border-radius: 8px;

/* ✅ SEMPRE use variáveis */
color: var(--color-primary-500);
padding: var(--spacing-4);
font-size: var(--font-size-sm);
border-radius: var(--radius-md);
```

### 2. Componentes Existentes (OBRIGATÓRIO)
Antes de criar um botão, input, modal, dropdown, etc:
```tsx
// ❌ NUNCA crie do zero
<button className="meu-botao">Clique</button>

// ✅ SEMPRE importe do design system
import { Button } from '@/design-system';
<Button variant="primary">Clique</Button>
```

### 3. Focus States (OBRIGATÓRIO)
O padrão de focus é um GLOW vermelho:
```css
/* Dark Mode Focus Pattern */
:focus, :focus-within, :focus-visible {
    border-color: var(--color-primary-500);
    box-shadow: 0 0 10px var(--color-primary-500);
}
```

### 4. Scrollbar (OBRIGATÓRIO)
```css
/* Firefox */
scrollbar-width: thin;
scrollbar-color: var(--color-border) transparent;

/* Chrome/Safari */
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { 
    background: var(--color-border);
    border-radius: var(--radius-full);
}
```

### 5. Cores (OBRIGATÓRIO)
```css
/* Cores primárias (vermelho Nobre) */
--color-primary-500: #dc2626;
--color-primary-600: #b91c1c;

/* Backgrounds */
--color-bg-primary: #1a1a1a;
--color-bg-secondary: #0f0f0f;
--color-surface: #262626;

/* Textos */
--color-text-primary: #ffffff;
--color-text-secondary: #a3a3a3;
--color-text-muted: #737373;

/* Bordas */
--color-border: #404040;
--color-border-hover: #525252;
```

---

## 🔍 PROCESSO DE VERIFICAÇÃO

### Quando criar novo componente ou estilo:

1. **PRIMEIRO**: Verificar se existe componente no design system
   ```bash
   # Listar componentes disponíveis
   ls src/design-system/components/
   ```

2. **SEGUNDO**: Verificar tokens CSS disponíveis
   ```bash
   # Ver variáveis CSS
   cat src/design-system/tokens/index.css
   ```

3. **TERCEIRO**: Verificar padrões de estilo global
   ```bash
   # Ver estilos globais (scrollbar, focus, etc)
   cat src/styles/globals.css
   ```

4. **QUARTO**: Verificar como componentes similares são estilizados
   ```bash
   # Exemplo: ver como Input faz focus
   cat src/design-system/components/Input/Input.module.css
   ```

---

## 📦 Componentes Disponíveis

| Componente | Import | Uso |
|------------|--------|-----|
| Button | `import { Button } from '@/design-system'` | Botões primários, secundários, ghost |
| Input | `import { Input } from '@/design-system'` | Campos de texto com ícones |
| Dropdown | `import { Dropdown } from '@/design-system'` | Select customizado |
| Modal | `import { Modal } from '@/design-system'` | Diálogos e modais |
| Tag | `import { Tag } from '@/design-system'` | Pills/tags coloridas |
| Badge | `import { Badge } from '@/design-system'` | Contadores e indicadores |
| Checkbox | `import { Checkbox } from '@/design-system'` | Checkboxes estilizados |
| Switch | `import { Switch } from '@/design-system'` | Toggles on/off |
| Spinner | `import { Spinner } from '@/design-system'` | Loading indicators |
| Card | `import { Card } from '@/design-system'` | Containers com shadow |
| Avatar | `import { Avatar } from '@/design-system'` | Avatares com iniciais |
| Tooltip | `import { Tooltip } from '@/design-system'` | Tooltips informativos |

---

## ⚠️ VIOLAÇÕES COMUNS

### ❌ NÃO FAÇA:
- Usar cores hardcoded (`#ff0000`, `rgb(...)`)
- Criar botões/inputs do zero
- Usar `<select>` nativo (use `<Dropdown>`)
- Usar outline padrão do browser
- Ignorar padrões de focus/hover
- Criar scrollbars customizadas sem seguir o padrão

### ✅ SEMPRE FAÇA:
- Usar variáveis CSS do design system
- Importar componentes de `@/design-system`
- Manter consistência visual
- Testar estados (hover, focus, disabled)
- Verificar dark mode compatibility

---

## 🎯 Resumo

**REGRA DE OURO**: Se você está prestes a escrever CSS ou criar um componente UI, PARE e verifique o Design System primeiro. Se não existir, crie seguindo os padrões estabelecidos.

```
Antes de cada implementação UI:
1. Existe no design system? → USE
2. Não existe? → CRIE seguindo os tokens e padrões
3. Nunca ignore ou reinvente a roda
```