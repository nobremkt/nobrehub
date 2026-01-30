import { useState, useEffect } from 'react';
import { Modal, Input, Button, Checkbox } from '@/design-system';
import { LossReason } from '../types';
import { useLossReasonStore } from '../stores/useLossReasonStore';

interface LossReasonModalProps {
    isOpen: boolean;
    onClose: () => void;
    reasonToEdit?: LossReason | null;
}

export const LossReasonModal = ({ isOpen, onClose, reasonToEdit }: LossReasonModalProps) => {
    const { addLossReason, updateLossReason, isLoading } = useLossReasonStore();

    // Form States
    const [name, setName] = useState('');
    const [active, setActive] = useState(true);

    useEffect(() => {
        if (reasonToEdit) {
            setName(reasonToEdit.name);
            setActive(reasonToEdit.active);
        } else {
            // Reset for create mode
            setName('');
            setActive(true);
        }
    }, [reasonToEdit, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            return; // Validação básica
        }

        try {
            if (reasonToEdit) {
                await updateLossReason(reasonToEdit.id, {
                    name,
                    active
                });
            } else {
                await addLossReason({
                    name,
                    active
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
            title={reasonToEdit ? 'Editar Motivo' : 'Novo Motivo'}
            size="sm"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    label="Motivo"
                    placeholder="Ex: Preço alto, Concorrência..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    fullWidth
                    autoFocus
                />

                <div className="pt-2">
                    <Checkbox
                        id="active-reason"
                        label="Ativo"
                        checked={active}
                        onChange={(e) => setActive(e.target.checked)}
                    />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                    <Button variant="ghost" type="button" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button type="submit" isLoading={isLoading}>
                        {reasonToEdit ? 'Salvar' : 'Criar'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};
