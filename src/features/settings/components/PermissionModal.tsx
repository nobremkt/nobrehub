import { useState, useEffect } from 'react';
import { Modal, Input, Button, Checkbox } from '@/design-system';
import { Permission } from '../types';
import { usePermissionStore } from '../stores/usePermissionStore';

interface PermissionModalProps {
    isOpen: boolean;
    onClose: () => void;
    permissionToEdit?: Permission | null;
}

export const PermissionModal = ({ isOpen, onClose, permissionToEdit }: PermissionModalProps) => {
    const { addPermission, updatePermission, isLoading } = usePermissionStore();

    // Form States
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [active, setActive] = useState(true);

    useEffect(() => {
        if (permissionToEdit) {
            setName(permissionToEdit.name);
            setDescription(permissionToEdit.description || '');
            setActive(permissionToEdit.active);
        } else {
            // Reset for create mode
            setName('');
            setDescription('');
            setActive(true);
        }
    }, [permissionToEdit, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            return; // Validação básica
        }

        try {
            if (permissionToEdit) {
                await updatePermission(permissionToEdit.id, {
                    name,
                    description,
                    active
                });
            } else {
                await addPermission({
                    name,
                    description,
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
            title={permissionToEdit ? 'Editar Permissão' : 'Nova Permissão'}
            size="sm"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    label="Nome da Permissão"
                    placeholder="Ex: product:create, user:read..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    fullWidth
                    autoFocus
                />

                <Input
                    label="Descrição"
                    placeholder="Descrição do que esta permissão permite..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    multiline
                    rows={3}
                    fullWidth
                />

                <div className="pt-2">
                    <Checkbox
                        id="active-permission"
                        label="Permissão Ativa"
                        checked={active}
                        onChange={(e) => setActive(e.target.checked)}
                    />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                    <Button variant="ghost" type="button" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button type="submit" isLoading={isLoading}>
                        {permissionToEdit ? 'Salvar' : 'Criar'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};
