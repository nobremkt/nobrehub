import { useState, useEffect } from 'react';
import { getFirebaseStorage } from '@/config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Modal, Input, Button, Checkbox, Dropdown, PhoneInput } from '@/design-system';
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
    const [profilePhotoUrl, setProfilePhotoUrl] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [isUploadingProfile, setIsUploadingProfile] = useState(false);
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
            setProfilePhotoUrl(collaboratorToEdit.profilePhotoUrl || '');
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
            setProfilePhotoUrl('');
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
                    profilePhotoUrl,
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
                    profilePhotoUrl,
                    password
                });
            }
            onClose();
        } catch (error: unknown) {
            console.error(error);
            setSubmitError(error instanceof Error ? error.message : 'Erro ao salvar colaborador');
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

                <PhoneInput
                    label="Telefone / WhatsApp"
                    placeholder="(00) 00000-0000"
                    value={phone}
                    onChange={(val) => setPhone(val)}
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

                {/* Foto 9:16 */}
                <Input
                    label="Foto 9:16 (Banner/Cover)"
                    placeholder="https://..."
                    value={photoUrl}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhotoUrl(e.target.value)}
                    fullWidth
                    helperText="Foto vertical para banners e capas."
                />
                <div className="flex justify-end -mt-3">
                    <input
                        type="file"
                        id="photo-upload"
                        className="hidden"
                        accept="image/*"
                        onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;

                            setIsUploading(true);
                            try {
                                const storage = getFirebaseStorage();
                                const timestamp = Date.now();
                                const filename = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
                                const storageRef = ref(storage, `collaborators/photos/${filename}`);

                                const snapshot = await uploadBytes(storageRef, file);
                                const downloadURL = await getDownloadURL(snapshot.ref);

                                setPhotoUrl(downloadURL);
                            } catch (error) {
                                console.error("Upload failed:", error);
                            } finally {
                                setIsUploading(false);
                            }
                        }}
                    />
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        isLoading={isUploading}
                        onClick={() => document.getElementById('photo-upload')?.click()}
                    >
                        Upload do Computador
                    </Button>
                </div>

                {/* Foto de Perfil 1:1 */}
                <Input
                    label="Foto de Perfil 1:1 (Avatar)"
                    placeholder="https://..."
                    value={profilePhotoUrl}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfilePhotoUrl(e.target.value)}
                    fullWidth
                    helperText="Foto quadrada para avatares e perfis."
                />
                <div className="flex justify-end -mt-3">
                    <input
                        type="file"
                        id="profile-photo-upload"
                        className="hidden"
                        accept="image/*"
                        onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;

                            setIsUploadingProfile(true);
                            try {
                                const storage = getFirebaseStorage();
                                const timestamp = Date.now();
                                const filename = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
                                const storageRef = ref(storage, `collaborators/profile-photos/${filename}`);

                                const snapshot = await uploadBytes(storageRef, file);
                                const downloadURL = await getDownloadURL(snapshot.ref);

                                setProfilePhotoUrl(downloadURL);
                            } catch (error) {
                                console.error("Profile photo upload failed:", error);
                            } finally {
                                setIsUploadingProfile(false);
                            }
                        }}
                    />
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        isLoading={isUploadingProfile}
                        onClick={() => document.getElementById('profile-photo-upload')?.click()}
                    >
                        Upload do Computador
                    </Button>
                </div>

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
