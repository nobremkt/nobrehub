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

// Re-export layouts
export * from './layouts';

// Tokens são importados via CSS no index.css
