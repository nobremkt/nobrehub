import { useState, useEffect } from 'react';
import { Modal, Input, Button, Switch, Dropdown } from '@/design-system';
import { Sector } from '../types';
import { useSectorStore } from '../stores/useSectorStore';
import { useCollaboratorStore } from '../stores/useCollaboratorStore';

interface SectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    sectorToEdit?: Sector | null;
}

export const SectorModal = ({ isOpen, onClose, sectorToEdit }: SectorModalProps) => {
    const { addSector, updateSector, isLoading } = useSectorStore();
    const { collaborators, fetchCollaborators } = useCollaboratorStore();

    // Form States
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [manager, setManager] = useState('');
    const [active, setActive] = useState(true);
    const [nameError, setNameError] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchCollaborators();
        }
    }, [isOpen, fetchCollaborators]);

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
        setNameError('');
    }, [sectorToEdit, isOpen]);

    const managerOptions = [
        { label: 'Nenhum', value: '' },
        ...collaborators
            .filter(c => c.active)
            .sort((a, b) => a.name.localeCompare(b.name))
            .map(c => ({
                label: c.name,
                value: c.name,
            })),
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            setNameError('O nome do setor é obrigatório.');
            return;
        }

        setNameError('');

        try {
            if (sectorToEdit) {
                await updateSector(sectorToEdit.id, {
                    name: name.trim(),
                    description: description.trim() || null,
                    manager: manager || null,
                    active
                });
            } else {
                await addSector({
                    name: name.trim(),
                    description: description.trim() || null,
                    manager: manager || null,
                    active,
                    leaderPermissions: []
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
                    onChange={(e) => {
                        setName(e.target.value);
                        if (nameError) setNameError('');
                    }}
                    fullWidth
                    autoFocus
                    required
                    error={nameError}
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

                <Dropdown
                    label="Responsável / Gerente"
                    placeholder="Selecione um responsável..."
                    options={managerOptions}
                    value={manager}
                    onChange={(val) => setManager(String(val))}
                />

                <div className="pt-2 flex items-center justify-between">
                    <Switch
                        id="active-sector"
                        label="Setor Ativo"
                        checked={active}
                        onChange={setActive}
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
