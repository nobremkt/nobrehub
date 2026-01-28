/**
 * ProjectChecklist
 * 
 * Interactive checklist component for production projects.
 * Supports adding, removing, toggling items with auto-save.
 */

import React, { useState, useCallback } from 'react';
import { Check, Plus, Trash2, GripVertical } from 'lucide-react';
import { ChecklistItem } from '../types/project';

interface ProjectChecklistProps {
    items: ChecklistItem[];
    onChange: (items: ChecklistItem[]) => void;
    readOnly?: boolean;
}

const ProjectChecklist: React.FC<ProjectChecklistProps> = ({
    items,
    onChange,
    readOnly = false
}) => {
    const [newItemText, setNewItemText] = useState('');

    // Calculate progress
    const completedCount = items.filter(i => i.completed).length;
    const totalCount = items.length;
    const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    // Toggle item completion
    const handleToggle = useCallback((id: string) => {
        const updated = items.map(item =>
            item.id === id
                ? {
                    ...item,
                    completed: !item.completed,
                    completedAt: !item.completed ? new Date().toISOString() : undefined
                }
                : item
        );
        onChange(updated);
    }, [items, onChange]);

    // Add new item
    const handleAdd = useCallback(() => {
        if (!newItemText.trim()) return;

        const newItem: ChecklistItem = {
            id: crypto.randomUUID(),
            text: newItemText.trim(),
            completed: false
        };

        onChange([...items, newItem]);
        setNewItemText('');
    }, [items, newItemText, onChange]);

    // Handle Enter key
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAdd();
        }
    };

    // Remove item
    const handleRemove = useCallback((id: string) => {
        onChange(items.filter(item => item.id !== id));
    }, [items, onChange]);

    return (
        <div className="space-y-3">
            {/* Progress Bar */}
            {totalCount > 0 && (
                <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>Progresso</span>
                        <span>{completedCount}/{totalCount} ({progressPercent}%)</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-300 rounded-full"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Checklist Items */}
            <ul className="space-y-2">
                {items.map(item => (
                    <li
                        key={item.id}
                        className="group flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg transition-colors"
                    >
                        {/* Drag Handle (visual only for now) */}
                        {!readOnly && (
                            <GripVertical size={14} className="text-slate-300 opacity-0 group-hover:opacity-100 cursor-grab" />
                        )}

                        {/* Checkbox */}
                        <button
                            onClick={() => !readOnly && handleToggle(item.id)}
                            disabled={readOnly}
                            className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${item.completed
                                    ? 'bg-emerald-500 border-emerald-500'
                                    : 'border-slate-300 hover:border-emerald-400'
                                } ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}
                        >
                            {item.completed && <Check size={12} className="text-white" />}
                        </button>

                        {/* Text */}
                        <span className={`flex-1 text-sm ${item.completed
                                ? 'text-slate-400 line-through'
                                : 'text-slate-700'
                            }`}>
                            {item.text}
                        </span>

                        {/* Delete Button */}
                        {!readOnly && (
                            <button
                                onClick={() => handleRemove(item.id)}
                                className="p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                            >
                                <Trash2 size={14} />
                            </button>
                        )}
                    </li>
                ))}
            </ul>

            {/* Add Item Input */}
            {!readOnly && (
                <div className="flex items-center gap-2 pt-2">
                    <input
                        type="text"
                        value={newItemText}
                        onChange={e => setNewItemText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Adicionar item..."
                        className="flex-1 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all"
                    />
                    <button
                        onClick={handleAdd}
                        disabled={!newItemText.trim()}
                        className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Plus size={16} />
                    </button>
                </div>
            )}

            {/* Empty State */}
            {items.length === 0 && !readOnly && (
                <p className="text-sm text-slate-400 text-center py-4">
                    Nenhum item no checklist. Adicione o primeiro!
                </p>
            )}
        </div>
    );
};

export default ProjectChecklist;
