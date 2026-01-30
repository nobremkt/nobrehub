import { useState, useEffect } from 'react';
import { Modal, Input, Button, Checkbox } from '@/design-system';
import { Role } from '../types';
import { useRoleStore } from '../stores/useRoleStore';

interface RoleModalProps {
    isOpen: boolean;
    onClose: () => void;
    roleToEdit?: Role | null;
}

export const RoleModal = ({ isOpen, onClose, roleToEdit }: RoleModalProps) => {
    const { addRole, updateRole, isLoading } = useRoleStore();

    // Form States
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [active, setActive] = useState(true);

    useEffect(() => {
        if (roleToEdit) {
            setName(roleToEdit.name);
            setDescription(roleToEdit.description || '');
            setActive(roleToEdit.active);
        } else {
            // Reset for create mode
            setName('');
            setDescription('');
            setActive(true);
        }
    }, [roleToEdit, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            return; // Validação básica
        }

        try {
            if (roleToEdit) {
                await updateRole(roleToEdit.id, {
                    name,
                    description,
                    active
                });
            } else {
                await addRole({
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
            title={roleToEdit ? 'Editar Cargo' : 'Novo Cargo'}
            size="sm"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    label="Nome do Cargo"
                    placeholder="Ex: Vendedor, Gerente, Analista..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    fullWidth
                    autoFocus
                />

                <Input
                    label="Descrição"
                    placeholder="Descrição breve das responsabilidades..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    multiline
                    rows={3}
                    fullWidth
                />

                <div className="pt-2">
                    <Checkbox
                        id="active-role"
                        label="Cargo Ativo"
                        checked={active}
                        onChange={(e) => setActive(e.target.checked)}
                    />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                    <Button variant="ghost" type="button" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button type="submit" isLoading={isLoading}>
                        {roleToEdit ? 'Salvar' : 'Criar'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};
