import { useState, useEffect } from 'react';
import { Modal, Input, Button, Checkbox, Dropdown } from '@/design-system';
import { Collaborator } from '../types';
import { useCollaboratorStore } from '../stores/useCollaboratorStore';
import { useRoleStore } from '../stores/useRoleStore';
import { useSectorStore } from '../stores/useSectorStore';

interface CollaboratorModalProps {
    isOpen: boolean;
    onClose: () => void;
    collaboratorToEdit?: Collaborator | null;
}

export const CollaboratorModal = ({ isOpen, onClose, collaboratorToEdit }: CollaboratorModalProps) => {
    const { addCollaborator, updateCollaborator, isLoading } = useCollaboratorStore();
    const { roles, fetchRoles } = useRoleStore();
    const { sectors, fetchSectors } = useSectorStore();

    // Form States
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phone, setPhone] = useState('');
    const [roleId, setRoleId] = useState('');
    const [sectorId, setSectorId] = useState('');
    const [active, setActive] = useState(true);
    const [photoUrl, setPhotoUrl] = useState('');
    const [submitError, setSubmitError] = useState('');

    // Validation State
    const [errors, setErrors] = useState({ name: '', email: '', password: '' });

    useEffect(() => {
        if (isOpen) {
            fetchRoles();
            fetchSectors();
        }
    }, [isOpen, fetchRoles, fetchSectors]);

    useEffect(() => {
        setErrors({ name: '', email: '', password: '' }); // Clear errors on open/edit
        setSubmitError('');
        if (collaboratorToEdit) {
            setName(collaboratorToEdit.name);
            setEmail(collaboratorToEdit.email);
            setPhone(collaboratorToEdit.phone || '');
            setRoleId(collaboratorToEdit.roleId || '');
            setSectorId(collaboratorToEdit.sectorId || '');
            setActive(collaboratorToEdit.active);
            setPhotoUrl(collaboratorToEdit.photoUrl || '');
            setPhotoUrl(collaboratorToEdit.photoUrl || '');
            setPassword(''); // Reset password field
        } else {
            // Reset for create mode
            setName('');
            setEmail('');
            setPhone('');
            setRoleId('');
            setSectorId('');
            setActive(true);
            setPhotoUrl('');
            setPassword('');
        }
    }, [collaboratorToEdit, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitError('');

        const newErrors = { name: '', email: '', password: '' };
        let hasError = false;

        if (!name.trim()) {
            newErrors.name = 'Nome é obrigatório';
            hasError = true;
        }
        if (!email.trim()) {
            newErrors.email = 'E-mail é obrigatório';
            hasError = true;
        }

        if (!collaboratorToEdit && !password.trim()) {
            newErrors.password = 'Senha é obrigatória';
            hasError = true;
        } else if (password.trim() && password.length < 6) {
            newErrors.password = 'A senha deve ter pelo menos 6 caracteres';
            hasError = true;
        }

        if (hasError) {
            setErrors(newErrors);
            return;
        }

        try {
            if (collaboratorToEdit) {
                await updateCollaborator(collaboratorToEdit.id, {
                    name,
                    email,
                    phone,
                    roleId,
                    sectorId,
                    active,
                    photoUrl,
                    password: password.trim() || undefined
                });
            } else {
                await addCollaborator({
                    name,
                    email,
                    phone,
                    roleId,
                    sectorId,
                    active,
                    photoUrl,
                    password
                });
            }
            onClose();
        } catch (error: any) {
            console.error(error);
            setSubmitError(error.message || 'Erro ao salvar colaborador');
        }
    };

    const roleOptions = roles.map(role => ({
        value: role.id,
        label: role.name
    }));

    const sectorOptions = sectors.map(sector => ({
        value: sector.id,
        label: sector.name
    }));

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={collaboratorToEdit ? 'Editar Colaborador' : 'Novo Colaborador'}
            size="md"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    label="Nome Completo"
                    placeholder="Ex: João da Silva"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    fullWidth
                    autoFocus
                    error={errors.name}
                />

                <Input
                    label="E-mail"
                    placeholder="email@empresa.com"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    fullWidth
                    error={errors.email}
                />

                <Input
                    label={collaboratorToEdit ? "Nova Senha (Opcional)" : "Senha"}
                    placeholder={collaboratorToEdit ? "Deixe em branco para manter a atual" : "Mínimo 6 caracteres"}
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    fullWidth
                    error={errors.password}
                />

                <Input
                    label="Telefone / WhatsApp"
                    placeholder="(00) 00000-0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    fullWidth
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Dropdown
                        label="Cargo"
                        options={roleOptions}
                        value={roleId}
                        onChange={(val) => setRoleId(String(val))}
                        placeholder="Selecione um cargo"
                    />

                    <Dropdown
                        label="Setor"
                        options={sectorOptions}
                        value={sectorId}
                        onChange={(val) => setSectorId(String(val))}
                        placeholder="Selecione um setor"
                    />
                </div>

                <Input
                    label="URL da Foto"
                    placeholder="https://..."
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    fullWidth
                    helperText="Cole o link de uma imagem pública."
                />

                <div className="pt-2">
                    <Checkbox
                        id="active-collaborator"
                        label="Colaborador Ativo"
                        checked={active}
                        onChange={(e) => setActive(e.target.checked)}
                    />
                </div>

                <div className="flex flex-col gap-2 pt-4">
                    {submitError && (
                        <span className="text-red-500 text-sm text-center">{submitError}</span>
                    )}
                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" type="button" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button type="submit" isLoading={isLoading}>
                            {collaboratorToEdit ? 'Salvar' : 'Criar'}
                        </Button>
                    </div>
                </div>
            </form>
        </Modal>
    );
};
