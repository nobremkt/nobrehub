import { useState, useEffect } from 'react';
import { Modal, Input, Button } from '@/design-system';
import { PipelineStage } from '../types';
import { usePipelineSettingsStore } from '../stores/usePipelineSettingsStore';

interface PipelineStageModalProps {
    isOpen: boolean;
    onClose: () => void;
    stageToEdit?: PipelineStage | null;
    pipeline: 'high-ticket' | 'low-ticket';
    nextOrder: number; // Ordem para novos stages
}

const COLOR_PRESETS = [
    { label: 'Indigo', value: '#6366F1' },
    { label: 'Azul', value: '#3B82F6' },
    { label: 'Cyan', value: '#06B6D4' },
    { label: 'Esmeralda', value: '#10B981' },
    { label: 'Verde', value: '#22C55E' },
    { label: 'Amarelo', value: '#F59E0B' },
    { label: 'Laranja', value: '#F97316' },
    { label: 'Rosa', value: '#EC4899' },
    { label: 'Roxo', value: '#8B5CF6' },
    { label: 'Vermelho', value: '#EF4444' },
    { label: 'Cinza', value: '#6B7280' },
    { label: 'Teal', value: '#14B8A6' },
];

export const PipelineStageModal = ({ isOpen, onClose, stageToEdit, pipeline, nextOrder }: PipelineStageModalProps) => {
    const { addStage, updateStage, isLoading } = usePipelineSettingsStore();

    const [name, setName] = useState('');
    const [color, setColor] = useState(COLOR_PRESETS[0].value);

    useEffect(() => {
        if (stageToEdit) {
            setName(stageToEdit.name);
            setColor(stageToEdit.color);
        } else {
            setName('');
            setColor(COLOR_PRESETS[0].value);
        }
    }, [stageToEdit, isOpen]);

    // Gera um ID baseado no pipeline e nome
    const generateId = (stageName: string): string => {
        const prefix = pipeline === 'high-ticket' ? 'ht' : 'lt';
        const slug = stageName
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
        return `${prefix}-${slug}`;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) return;

        try {
            if (stageToEdit) {
                await updateStage(stageToEdit.id, { name, color });
            } else {
                const id = generateId(name);
                await addStage({
                    id,
                    name,
                    color,
                    order: nextOrder,
                    pipeline,
                    active: true,
                });
            }
            onClose();
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={stageToEdit ? 'Editar Etapa' : 'Nova Etapa'}
            size="sm"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    label="Nome da Etapa"
                    placeholder="Ex: Qualificação, Proposta..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    fullWidth
                    autoFocus
                />

                {/* ID Preview (apenas ao criar) */}
                {!stageToEdit && name.trim() && (
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                        ID: <code style={{
                            padding: '2px 6px',
                            borderRadius: 'var(--radius-sm)',
                            background: 'var(--color-surface)',
                            fontFamily: 'monospace'
                        }}>{generateId(name)}</code>
                    </div>
                )}

                {/* Color Picker */}
                <div>
                    <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: 500,
                        color: 'var(--color-text-primary)',
                        marginBottom: '8px'
                    }}>
                        Cor da Etapa
                    </label>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(6, 1fr)',
                        gap: '8px'
                    }}>
                        {COLOR_PRESETS.map(preset => (
                            <button
                                key={preset.value}
                                type="button"
                                onClick={() => setColor(preset.value)}
                                title={preset.label}
                                style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: 'var(--radius-md)',
                                    backgroundColor: preset.value,
                                    border: color === preset.value
                                        ? '3px solid var(--color-text-primary)'
                                        : '2px solid transparent',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                    outline: 'none',
                                    boxShadow: color === preset.value
                                        ? `0 0 0 2px var(--color-bg-primary), 0 0 0 4px ${preset.value}`
                                        : 'none',
                                }}
                            />
                        ))}
                    </div>

                    {/* Preview */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginTop: '12px',
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--color-surface)',
                    }}>
                        <div style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: 'var(--radius-full)',
                            backgroundColor: color,
                        }} />
                        <span style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>
                            {name || 'Nome da etapa'}
                        </span>
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                    <Button variant="ghost" type="button" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button type="submit" isLoading={isLoading}>
                        {stageToEdit ? 'Salvar' : 'Criar'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};
