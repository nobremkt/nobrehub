# Nobre Hub - Coding Style Guidelines

## 🎨 Design System Compliance (MANDATORY)

### Rule #1: ALWAYS Check Design System First
Before creating ANY UI component or writing CSS, you MUST:

1. Check if a component already exists in `src/design-system/components/`
2. Use CSS variables from `src/design-system/tokens/index.css`
3. Follow patterns from `src/styles/globals.css`

### Rule #2: Never Hardcode Visual Values
```css
/* ❌ FORBIDDEN */
color: #dc2626;
padding: 16px;
border-radius: 8px;

/* ✅ REQUIRED */
color: var(--color-primary-500);
padding: var(--spacing-4);
border-radius: var(--radius-md);
```

### Rule #3: Import Components from Design System
```tsx
// ❌ FORBIDDEN - Creating custom buttons/inputs
<button className="custom">Click</button>
<input className="custom-input" />

// ✅ REQUIRED - Use design system
import { Button, Input, Dropdown, Modal } from '@/design-system';
```

### Rule #4: Focus States Must Use Red Glow
```css
/* Dark mode focus pattern */
:focus, :focus-visible {
    border-color: var(--color-primary-500);
    box-shadow: 0 0 10px var(--color-primary-500);
}
```

### Rule #5: Scrollbars Must Be Styled
```css
scrollbar-width: thin;
scrollbar-color: var(--color-border) transparent;

::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-thumb { 
    background: var(--color-border);
    border-radius: var(--radius-full);
}
```

## 📁 Design System Location
- Components: `src/design-system/components/`
- Tokens: `src/design-system/tokens/index.css`
- Global Styles: `src/styles/globals.css`

## 🚫 Common Violations to Avoid
- Using native `<select>` (use `<Dropdown>`)
- Using browser default focus outlines
- Creating inline styles with literal color values
- Ignoring hover/focus/disabled states
- Not checking existing components before creating new ones
