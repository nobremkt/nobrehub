/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - CUSTOM TASK ITEM COMPONENT FOR TIPTAP
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Renderiza TaskItem com o Checkbox do design system.
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { NodeViewWrapper, NodeViewContent, NodeViewProps } from '@tiptap/react';
import { Checkbox } from '@/design-system';
import styles from './TaskItemView.module.css';

export function TaskItemView({ node, updateAttributes }: NodeViewProps) {
    const checked = node.attrs.checked as boolean;

    const handleChange = () => {
        updateAttributes({ checked: !checked });
    };

    return (
        <NodeViewWrapper className={styles.taskItem}>
            <div className={styles.checkboxWrapper}>
                <Checkbox
                    checked={checked}
                    onChange={handleChange}
                    noSound={false}
                />
            </div>
            <NodeViewContent
                className={`${styles.content} ${checked ? styles.checked : ''}`}
            />
        </NodeViewWrapper>
    );
}
