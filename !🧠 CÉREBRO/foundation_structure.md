# Nobre Hub V2 - Foundation Structure

> Documentação completa da arquitetura modular do Nobre Hub V2.  
> Este documento serve como guia para entender e expandir o sistema.

---

## 📁 Estrutura de Pastas

```
nobre-hub-v2/
├── 📄 package.json              # Dependências e scripts
├── 📄 vite.config.ts            # Config do Vite com path aliases
├── 📄 tsconfig.json             # Config TypeScript
├── 📄 tailwind.config.js        # Tailwind com CSS variables
├── 📄 index.html                # HTML entry point
├── 📄 .env.example              # Template de variáveis de ambiente
│
└── src/
    ├── main.tsx                 # Entry point React
    │
    ├── 📂 app/                  # App principal
    │   └── App.tsx              # Componente raiz
    │
    ├── 📂 config/               # Configurações centralizadas
    │   ├── constants.ts         # Constantes globais
    │   ├── routes.ts            # Definição de rotas
    │   ├── permissions.ts       # RBAC e permissões
    │   ├── firebase.ts          # Config Firebase
    │   └── index.ts             # Barrel export
    │
    ├── 📂 design-system/        # 🎨 DESIGN SYSTEM
    │   ├── tokens/              # CSS Variables
    │   │   ├── colors.css       # Cores + dark mode
    │   │   ├── typography.css   # Fontes e tamanhos
    │   │   ├── spacing.css      # Espaçamentos
    │   │   ├── shadows.css      # Sombras
    │   │   ├── animations.css   # Animações
    │   │   └── index.css        # Import central
    │   │
    │   ├── components/          # Componentes UI
    │   │   ├── Button/
    │   │   ├── Input/
    │   │   ├── Card/
    │   │   ├── Modal/
    │   │   ├── Tag/
    │   │   ├── Badge/
    │   │   ├── Spinner/
    │   │   └── index.ts
    │   │
    │   └── index.ts             # Export geral
    │
    ├── 📂 types/                # TypeScript types
    │   ├── user.types.ts
    │   ├── lead.types.ts
    │   ├── project.types.ts
    │   ├── common.types.ts
    │   └── index.ts
    │
    ├── 📂 stores/               # Zustand stores
    │   ├── useUIStore.ts        # UI state (tema, sidebar, toasts)
    │   ├── useAuthStore.ts      # Auth state
    │   └── index.ts
    │
    ├── 📂 hooks/                # Hooks reutilizáveis
    │   ├── useDebounce.ts
    │   ├── useLocalStorage.ts
    │   ├── useMediaQuery.ts
    │   ├── useClickOutside.ts
    │   └── index.ts
    │
    ├── 📂 utils/                # Funções utilitárias
    │   ├── formatters.ts        # Formatação (datas, moeda, etc)
    │   ├── helpers.ts           # Helpers gerais
    │   └── index.ts
    │
    └── 📂 styles/               # Estilos globais
        ├── globals.css
        └── index.css
```

---

## 🎨 Design System

### Uso de Componentes

```tsx
// Import direto do design system
import { Button, Input, Card, Modal, Tag, Badge, Spinner } from '@/design-system';

// Exemplo de uso
<Button variant="primary" size="md" isLoading={false}>
  Salvar
</Button>

<Input 
  label="Email" 
  placeholder="email@exemplo.com"
  error={errors.email}
/>

<Card variant="elevated" padding="md">
  <CardHeader title="Título" subtitle="Descrição" />
  <CardBody>Conteúdo</CardBody>
  <CardFooter>Ações</CardFooter>
</Card>
```

### Sistema de Temas

Os tokens CSS suportam light/dark mode automaticamente:

```css
/* Qualquer cor semântica muda automaticamente com o tema */
background-color: var(--color-bg-primary);
color: var(--color-text-primary);
border-color: var(--color-border);
```

Para alternar tema:
```tsx
import { useUIStore } from '@/stores';

const { setTheme } = useUIStore();
setTheme('dark');  // ou 'light' ou 'system'
```

---

## ⚙️ Configurações (src/config/)

### constants.ts
Constantes globais da aplicação:
- `APP_CONFIG`: Configurações gerais (timeout, paginação, storage keys)
- `PIPELINE_COLORS`: Cores dos estágios de pipeline
- `STATUS_LABELS`: Labels traduzidos para status

### routes.ts
Definição centralizada de todas as rotas:
```tsx
import { ROUTES } from '@/config';

navigate(ROUTES.crm.kanban);
navigate(ROUTES.settings.organization);
```

### permissions.ts
Sistema RBAC completo:
```tsx
import { hasPermission, PERMISSIONS, ROLES } from '@/config';

if (hasPermission(user.role, PERMISSIONS.CRM_EDIT)) {
  // Pode editar leads
}
```

---

## 📦 Stores (Zustand)

### useUIStore
Gerencia estado da interface:
- `sidebarCollapsed`: Estado da sidebar
- `theme`: Tema atual (light/dark/system)
- `toasts`: Notificações toast
- `activeModal`: Modal ativo
- `isLoading`: Loading global

```tsx
const { addToast, setTheme, toggleSidebar } = useUIStore();

addToast({ type: 'success', message: 'Lead salvo!' });
```

### useAuthStore
Gerencia autenticação:
- `user`: Usuário logado
- `status`: Estado da autenticação
- `login()` / `logout()`: Ações

---

## 🪝 Hooks Disponíveis

| Hook | Uso |
|------|-----|
| `useDebounce` | Debounce de valores (busca, inputs) |
| `useLocalStorage` | Persistir estado no localStorage |
| `useMediaQuery` | Detectar breakpoints |
| `useClickOutside` | Detectar cliques fora de elemento |
| `useIsMobile` / `useIsDesktop` | Shortcuts de breakpoints |

---

## 🔧 Utils Disponíveis

### Formatters
- `formatDate()`, `formatDateTime()`, `formatRelativeTime()`
- `formatCurrency()`, `formatNumber()`
- `formatPhone()`, `formatCPF()`, `formatCNPJ()`
- `abbreviateName()`, `getInitials()`

### Helpers
- `generateId()`, `sleep()`, `clamp()`
- `debounce()`, `throttle()`, `deepClone()`
- `isEmpty()`, `groupBy()`, `sortBy()`, `uniqueBy()`
- `pick()`, `omit()`, `capitalize()`, `slugify()`

---

## 📋 Como Adicionar uma Nova Feature

1. **Criar pasta em `src/features/[nome-feature]/`**
   ```
   features/crm/
   ├── components/
   ├── hooks/
   ├── services/
   ├── types.ts
   └── index.ts
   ```

2. **Adicionar rota em `config/routes.ts`**

3. **Criar store se necessário em `stores/`**

4. **Adicionar página em `pages/`**

5. **Registrar rota no Router**

---

## 🎯 Princípios de Arquitetura

1. **Modularidade**: Cada feature é auto-contida
2. **Centralização**: Configurações em um só lugar (`config/`)
3. **Reutilização**: Design System para UI consistente
4. **Type Safety**: TypeScript strict em todo o projeto
5. **Facilidade de Tema**: CSS Variables permitem theming fácil

---

## 🚀 Próximos Passos (Features a Implementar)

- [ ] Auth (Login/Logout com Firebase)
- [ ] Layout (Sidebar, TopNav)
- [ ] CRM (Kanban, Lista de Leads, Lead 360)
- [ ] Inbox (Chat via WhatsApp)
- [ ] Produção (Dashboard, Projetos)
- [ ] Pós-Venda
- [ ] Equipe (Lista, Chat interno)
- [ ] Analytics
- [ ] Settings

Cada feature será adicionada seguindo a estrutura modular definida.
