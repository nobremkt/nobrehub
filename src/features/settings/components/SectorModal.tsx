import { useState, useEffect } from 'react';
import { Modal, Input, Button, Checkbox } from '@/design-system';
import { Sector } from '../types';
import { useSectorStore } from '../stores/useSectorStore';

interface SectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    sectorToEdit?: Sector | null;
}

export const SectorModal = ({ isOpen, onClose, sectorToEdit }: SectorModalProps) => {
    const { addSector, updateSector, isLoading } = useSectorStore();

    // Form States
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [manager, setManager] = useState('');
    const [active, setActive] = useState(true);

    useEffect(() => {
        if (sectorToEdit) {
            setName(sectorToEdit.name);
            setDescription(sectorToEdit.description || '');
            setManager(sectorToEdit.manager || '');
            setActive(sectorToEdit.active);
        } else {
            // Reset for create mode
            setName('');
            setDescription('');
            setManager('');
            setActive(true);
        }
    }, [sectorToEdit, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            return; // Validação básica
        }

        try {
            if (sectorToEdit) {
                await updateSector(sectorToEdit.id, {
                    name,
                    description,
                    manager,
                    active
                });
            } else {
                await addSector({
                    name,
                    description,
                    manager,
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
            title={sectorToEdit ? 'Editar Setor' : 'Novo Setor'}
            size="md"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    label="Nome do Setor"
                    placeholder="Ex: Comercial, Financeiro..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    fullWidth
                    autoFocus
                />

                <Input
                    label="Descrição"
                    placeholder="Descrição das responsabilidades..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    multiline
                    rows={3}
                    fullWidth
                />

                <Input
                    label="Responsável / Gerente"
                    placeholder="Nome do responsável"
                    value={manager}
                    onChange={(e) => setManager(e.target.value)}
                    fullWidth
                />

                <div className="pt-2">
                    <Checkbox
                        id="active-sector"
                        label="Setor Ativo"
                        checked={active}
                        onChange={(e) => setActive(e.target.checked)}
                    />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                    <Button variant="ghost" type="button" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button type="submit" isLoading={isLoading}>
                        {sectorToEdit ? 'Salvar' : 'Criar'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};
