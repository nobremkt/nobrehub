/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - CUSTOM TASK ITEM EXTENSION FOR TIPTAP
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Extension que renderiza TaskItem com o Checkbox do design system.
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import TaskItem from '@tiptap/extension-task-item';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { TaskItemView } from './TaskItemView';

export const CustomTaskItem = TaskItem.extend({
    addNodeView() {
        return ReactNodeViewRenderer(TaskItemView);
    },
});
