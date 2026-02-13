import { useState, useRef, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { createPortal } from 'react-dom';
import { Modal, Button, Input } from '@/design-system';
import { useTeamChatStore } from '../../stores/useTeamChatStore';
import { useCollaboratorStore } from '@/features/settings/stores/useCollaboratorStore';

import { Camera, Trash2, Crown, UserPlus, MoreVertical, X, Shield, ShieldOff, LogOut, User, UsersRound } from 'lucide-react';
import { TeamChat } from '../../types/chat';

interface ActionMenuItem {
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
    variant?: 'default' | 'danger';
}

const ActionMenu = ({ trigger, items }: { trigger: React.ReactNode, items: ActionMenuItem[] }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const triggerRef = useRef<HTMLDivElement>(null);

    const updatePosition = useCallback(() => {
        if (triggerRef.current && isOpen) {
            const rect = triggerRef.current.getBoundingClientRect();
            setPosition({
                top: rect.bottom + window.scrollY + 8,
                left: rect.right + window.scrollX - 192, // Align to right (192px is w-48)
            });
        }
    }, [isOpen]);

    useEffect(() => {
        updatePosition();
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition, true);

        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
        };
    }, [updatePosition]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
                // Check if click is inside the portal content menu
                const menuPortal = document.getElementById('action-menu-portal');
                if (menuPortal && !menuPortal.contains(event.target as Node)) {
                    setIsOpen(false);
                }
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    return (
        <div className="relative" ref={triggerRef}>
            <div onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}>{trigger}</div>

            {isOpen && createPortal(
                <div
                    id="action-menu-portal"
                    className="fixed w-48 bg-surface-primary border border-border rounded-lg shadow-lg z-[9999] overflow-hidden animate-in fade-in zoom-in-95 duration-100"
                    style={{
                        top: position.top,
                        left: position.left,
                    }}
                >
                    {items.map((item, idx) => (
                        <button
                            key={idx}
                            onClick={(e) => {
                                e.stopPropagation();
                                item.onClick();
                                setIsOpen(false);
                            }}
                            className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-surface-hover text-left transition-colors ${item.variant === 'danger' ? 'text-danger-500 hover:bg-danger-500/10' : 'text-text-primary'
                                }`}
                        >
                            {item.icon}
                            {item.label}
                        </button>
                    ))}
                </div>,
                document.body
            )}
        </div>
    );
};

interface GroupDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    chat: TeamChat;
}

export const GroupDetailsModal = ({ isOpen, onClose, chat }: GroupDetailsModalProps) => {
    const { collaborators } = useCollaboratorStore();
    const { updateGroupInfo, addParticipants, removeParticipant, toggleAdminStatus, currentUserId } = useTeamChatStore();

    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(chat.name || '');
    // photoFile removed as we auto-save now
    const [previewPhoto, setPreviewPhoto] = useState<string | null>(chat.photoUrl || null);
    const [isLoading, setIsLoading] = useState(false);

    // Add Participant State
    const [isAdding, setIsAdding] = useState(false);
    const [searchUser, setSearchUser] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Derived
    const isAdmin = chat.admins?.includes(currentUserId || '');
    const participantDetails = chat.participants?.map(uid => {
        const collab = collaborators.find(c => c.authUid === uid);
        return {
            uid,
            name: collab?.name || 'Usuário desconhecido',
            photoUrl: collab?.photoUrl,
            profilePhotoUrl: collab?.profilePhotoUrl,
            email: collab?.email,
            isAdmin: chat.admins?.includes(uid)
        };
    }) || [];

    const availableUsersToAdd = collaborators.filter(c =>
        c.authUid &&
        c.active &&
        !chat.participants?.includes(c.authUid) &&
        c.name.toLowerCase().includes(searchUser.toLowerCase())
    );

    // Helper for compression
    const compressImage = (file: File): Promise<File> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    const maxSize = 120;

                    if (width > height) {
                        if (width > maxSize) {
                            height = Math.round((height * maxSize) / width);
                            width = maxSize;
                        }
                    } else {
                        if (height > maxSize) {
                            width = Math.round((width * maxSize) / height);
                            height = maxSize;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);

                    canvas.toBlob((blob) => {
                        if (blob) {
                            const newFile = new File([blob], file.name, {
                                type: 'image/jpeg',
                                lastModified: Date.now(),
                            });
                            resolve(newFile);
                        } else {
                            reject(new Error('Compression failed'));
                        }
                    }, 'image/jpeg', 0.85);
                };
                img.onerror = (err) => reject(err);
            };
            reader.onerror = (err) => reject(err);
        });
    };

    const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];

            // Optimistic preview (before compression/upload)
            setPreviewPhoto(URL.createObjectURL(file));

            try {
                setIsLoading(true);
                // Compress
                const compressedFile = await compressImage(file);

                // Auto-save immediately
                await updateGroupInfo(chat.id, {
                    photo: compressedFile
                });

                // Update preview with compressed result (optional, but good for consistency)
                setPreviewPhoto(URL.createObjectURL(compressedFile));

            } catch (error) {
                console.error("Failed to upload group photo:", error);
                toast.error('Erro ao atualizar foto do grupo.');
                // Revert preview if needed or just leave it
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleSaveInfo = async () => {
        setIsLoading(true);
        try {
            await updateGroupInfo(chat.id, {
                name: name !== chat.name ? name : undefined
            });
            setIsEditing(false);
        } catch (error) {
            console.error("Failed to update group info:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddUser = async (uid: string) => {
        try {
            await addParticipants(chat.id, [uid]);
            setIsAdding(false);
            setSearchUser('');
        } catch (error) {
            console.error("Failed to add user:", error);
        }
    };

    const handleRemoveUser = async (uid: string) => {
        if (!confirm("Tem certeza que deseja remover este usuário do grupo?")) return;
        try {
            await removeParticipant(chat.id, uid);
        } catch (error) {
            console.error("Failed to remove user:", error);
        }
    };

    const handleToggleAdmin = async (uid: string, currentStatus: boolean) => {
        try {
            await toggleAdminStatus(chat.id, uid, !currentStatus);
        } catch (error) {
            console.error("Failed to toggle admin:", error);
        }
    };

    const handleLeaveGroup = async () => {
        // Validation: If user is the ONLY admin and there are other participants, prevent leaving.
        const currentAdmins = chat.admins || [];
        const isSoleAdmin = currentAdmins.length === 1 && currentAdmins.includes(currentUserId || '');
        const hasOtherParticipants = (chat.participants || []).length > 1;

        if (isSoleAdmin && hasOtherParticipants) {
            toast.warn('Você é o único administrador. Promova outro membro a administrador antes de sair.');
            return;
        }

        if (!confirm("Tem certeza que deseja sair do grupo?" + (isSoleAdmin ? " O grupo será excluído pois você é o último membro." : ""))) return;

        try {
            await removeParticipant(chat.id, currentUserId!);
            onClose();
        } catch (error) {
            console.error("Failed to leave group:", error);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Dados do Grupo"
            size="md"
        >
            <div className="flex flex-col gap-6">
                {/* Header / Info Edit */}
                <div className="flex flex-col items-center gap-4">
                    <div className="relative group">
                        <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-border bg-surface-tertiary">
                            {previewPhoto ? (
                                <img src={previewPhoto} alt="Group" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-text-muted">
                                    <UsersRound size={40} />
                                </div>
                            )}
                        </div>

                        {isAdmin && (
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isLoading}
                                className={`absolute bottom-0 right-0 p-2 rounded-full text-white shadow-md transition-colors ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary-500 hover:bg-primary-600'}`}
                            >
                                {isLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Camera size={16} />}
                            </button>
                        )}
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handlePhotoChange}
                        />
                    </div>

                    {isEditing ? (
                        <div className="flex gap-2 w-full">
                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                fullWidth
                                placeholder="Nome do grupo"
                            />
                            <Button onClick={handleSaveInfo} isLoading={isLoading}>Salvar</Button>
                            <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancelar</Button>
                        </div>
                    ) : (
                        <div className="text-center">
                            <h3 className="text-lg font-bold text-text-primary flex items-center justify-center gap-2">
                                {chat.name}
                                {isAdmin && (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="text-xs font-normal text-primary-500 hover:underline"
                                    >
                                        Editar
                                    </button>
                                )}
                            </h3>
                            <p className="text-sm text-text-muted">
                                Grupo • {participantDetails.length} participantes
                            </p>
                        </div>
                    )}
                </div>

                {/* Participants */}
                <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-text-primary">Participantes</h4>
                        {isAdmin && !isAdding && (
                            <button
                                onClick={() => setIsAdding(true)}
                                className="text-sm text-primary-500 flex items-center gap-1 hover:underline"
                            >
                                <UserPlus size={16} /> Adicionar
                            </button>
                        )}
                    </div>

                    {/* Add User Area */}
                    {isAdding && (
                        <div className="p-3 bg-surface-secondary rounded-lg mb-2 animate-in fade-in slide-in-from-top-2">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium">Adicionar participante</span>
                                <button onClick={() => setIsAdding(false)}><X size={16} /></button>
                            </div>
                            <Input
                                value={searchUser}
                                onChange={(e) => setSearchUser(e.target.value)}
                                placeholder="Buscar colaborador..."
                                fullWidth
                                className="mb-2"
                                autoFocus
                            />
                            <div className="max-h-40 overflow-y-auto flex flex-col gap-1">
                                {availableUsersToAdd.map(user => (
                                    <button
                                        key={user.authUid}
                                        onClick={() => handleAddUser(user.authUid!)}
                                        className="flex items-center gap-2 p-2 hover:bg-surface-tertiary rounded-md text-left transition-colors"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-surface-primary overflow-hidden">
                                            {(user.profilePhotoUrl || user.photoUrl) ? (
                                                <img src={user.profilePhotoUrl || user.photoUrl} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-text-muted"><User size={14} /></div>
                                            )}
                                        </div>
                                        <span className="text-sm truncate flex-1">{user.name}</span>
                                        <UserPlus size={14} className="text-text-muted" />
                                    </button>
                                ))}
                                {availableUsersToAdd.length === 0 && (
                                    <p className="text-xs text-text-muted text-center py-2">Ninguém encontrado.</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* List */}
                    <div className="flex flex-col gap-1 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                        {participantDetails.map(p => (
                            <div key={p.uid} className="flex items-center justify-between p-2 hover:bg-surface-secondary rounded-lg transition-colors group">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-surface-tertiary overflow-hidden border border-border">
                                        {(p.profilePhotoUrl || p.photoUrl) ? (
                                            <img src={p.profilePhotoUrl || p.photoUrl} alt={p.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-text-muted">
                                                <User size={18} />
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-text-primary flex items-center gap-1">
                                            {p.name}
                                            {p.uid === currentUserId && <span className="text-xs text-text-muted">(Você)</span>}
                                        </div>
                                        <div className="text-xs text-text-muted flex items-center gap-1">
                                            {p.isAdmin && <span className="text-warning-500 flex items-center gap-0.5"><Crown size={10} /> Admin</span>}
                                            {!p.isAdmin && p.email}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                    {isAdmin && p.uid !== currentUserId && (
                                        <>
                                            <ActionMenu
                                                trigger={
                                                    <button className="p-1.5 hover:bg-surface-tertiary rounded text-text-muted hover:text-text-primary">
                                                        <MoreVertical size={16} />
                                                    </button>
                                                }
                                                items={[
                                                    {
                                                        label: p.isAdmin ? 'Remover Admin' : 'Promover a Admin',
                                                        icon: p.isAdmin ? <ShieldOff size={14} /> : <Shield size={14} />,
                                                        onClick: () => handleToggleAdmin(p.uid, !!p.isAdmin)
                                                    },
                                                    {
                                                        label: 'Remover do Grupo',
                                                        icon: <Trash2 size={14} />,
                                                        variant: 'danger',
                                                        onClick: () => handleRemoveUser(p.uid)
                                                    }
                                                ]}
                                            />
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="pt-4 border-t border-border flex justify-between">
                    <button
                        onClick={handleLeaveGroup}
                        className="text-danger-500 text-sm font-medium hover:underline flex items-center gap-1"
                    >
                        <LogOut size={16} /> Sair do Grupo
                    </button>

                    <Button variant="ghost" onClick={onClose}>Fechar</Button>
                </div>
            </div>
        </Modal>
    );
};
