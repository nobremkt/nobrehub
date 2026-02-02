/*
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - DESIGN SYSTEM
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Export geral do Design System.
 * Importa tokens CSS e exporta todos os componentes.
 * 
 * Use na raiz do app: import '@/design-system';
 * Ou componentes específicos: import { Button } from '@/design-system';
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 */

// Re-export all components
export * from './components';

// Explicit Chat exports to ensure visibility if not in main index
export * from './components/Chat';

// Re-export layouts
export * from './layouts';

// Tokens são importados via CSS no index.css
