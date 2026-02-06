/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - FEATURE: STRATEGIC - NOTES PAGE
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Página de Anotações com layout de sidebar + editor.
 * Estilo Obsidian com edição de markdown em tempo real.
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { NotesSidebar } from '../components/NotesSidebar';
import { NoteEditor } from '../components/NoteEditor';
import styles from './NotesPage.module.css';

export const NotesPage = () => {
    return (
        <div className={styles.pageContainer}>
            <NotesSidebar />
            <NoteEditor />
        </div>
    );
};
