import { useState, useMemo } from 'react';
import { Modal, Button, Input, Checkbox } from '@/design-system';
import { useCollaboratorStore } from '@/features/settings/stores/useCollaboratorStore';
import { useTeamChatStore } from '../../stores/useTeamChatStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { Search, User, Users, MessageCircle, UsersRound } from 'lucide-react';

interface NewChatModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const NewChatModal = ({ isOpen, onClose }: NewChatModalProps) => {
    const { collaborators } = useCollaboratorStore();
    const { user } = useAuthStore();
    const { createPrivateChat, createGroupChat } = useTeamChatStore();

    const [searchTerm, setSearchTerm] = useState('');
    const [isGroupMode, setIsGroupMode] = useState(false);
    const [groupName, setGroupName] = useState('');
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Get current user's authUid for filtering
    const currentAuthUid = user?.authUid || user?.id;

    // Filter available users (exclude self)
    const availableUsers = useMemo(() => {
        return collaborators
            .filter(c => c.active && c.authUid && c.authUid !== currentAuthUid) // active, has authUid, not self
            .filter(c =>
                c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.email.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [collaborators, currentAuthUid, searchTerm]);

    const handleUserSelect = (uid: string) => {
        if (!uid) return;

        if (selectedUsers.includes(uid)) {
            setSelectedUsers(prev => prev.filter(id => id !== uid));
        } else {
            setSelectedUsers(prev => [...prev, uid]);
        }
    };

    const handleCleanClose = () => {
        setSearchTerm('');
        setIsGroupMode(false);
        setGroupName('');
        setSelectedUsers([]);
        setIsLoading(false);
        onClose();
    };

    const handleCreate = async () => {
        setIsLoading(true);
        try {
            if (isGroupMode) {
                if (!groupName || selectedUsers.length === 0) return;

                const participants = collaborators
                    .filter(c => selectedUsers.includes(c.authUid!))
                    .map(c => ({
                        id: c.authUid!,
                        name: c.name,
                        email: c.email,
                        photoUrl: c.profilePhotoUrl || c.photoUrl
                    }));

                await createGroupChat(groupName, participants);
            }
            handleCleanClose();
        } catch (error) {
            console.error("Error creating chat:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // For DM, direct click action
    const handleStartDM = async (collaborator: any) => {
        if (!collaborator.authUid) {
            alert("Este usuário não possui conta vinculada.");
            return;
        }

        setIsLoading(true);
        try {
            await createPrivateChat({
                id: collaborator.authUid,
                name: collaborator.name,
                email: collaborator.email,
                photoUrl: collaborator.profilePhotoUrl || collaborator.photoUrl
            });
            handleCleanClose();
        } catch (error) {
            console.error("Error creating DM:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleCleanClose}
            title={isGroupMode ? "Novo Grupo" : "Nova Conversa"}
            size="md"
        >
            <div className="space-y-5">
                {/* Mode Toggle */}
                <div className="flex gap-1 p-1 bg-surface-secondary rounded-xl">
                    <button
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${!isGroupMode
                            ? 'bg-white shadow-sm text-primary-600'
                            : 'text-text-muted hover:text-text-primary'
                            }`}
                        onClick={() => {
                            setIsGroupMode(false);
                            setSelectedUsers([]);
                        }}
                    >
                        <MessageCircle size={16} />
                        Conversa Privada
                    </button>
                    <button
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${isGroupMode
                            ? 'bg-white shadow-sm text-primary-600'
                            : 'text-text-muted hover:text-text-primary'
                            }`}
                        onClick={() => {
                            setIsGroupMode(true);
                            setSelectedUsers([]);
                        }}
                    >
                        <UsersRound size={16} />
                        Grupo
                    </button>
                </div>

                {/* Group Name Field */}
                {isGroupMode && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                        <Input
                            label="Nome do Grupo"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            placeholder="Ex: Equipe de Vendas"
                            fullWidth
                        />
                    </div>
                )}

                {/* Search */}
                <Input
                    leftIcon={<Search size={16} />}
                    placeholder="Buscar pessoas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    fullWidth
                />

                {/* User List */}
                <div className="max-h-72 overflow-y-auto border border-border rounded-xl divide-y divide-border/50">
                    {availableUsers.length === 0 ? (
                        <div className="p-6 text-center">
                            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-surface-secondary flex items-center justify-center">
                                <User size={24} className="text-text-muted" />
                            </div>
                            <p className="text-sm text-text-muted">
                                {searchTerm ? 'Ninguém encontrado' : 'Nenhum colaborador disponível'}
                            </p>
                        </div>
                    ) : (
                        availableUsers.map(collab => {
                            const isSelected = selectedUsers.includes(collab.authUid!);

                            return (
                                <div
                                    key={collab.id}
                                    className={`
                                        flex items-center gap-3 p-3.5 transition-all duration-200 cursor-pointer
                                        ${!isSelected ? 'hover:bg-surface-hover' : ''}
                                    `}
                                    style={{
                                        backgroundColor: isSelected ? 'rgba(239, 17, 54, 0.15)' : undefined
                                    }}
                                    onClick={() => {
                                        if (isGroupMode) {
                                            handleUserSelect(collab.authUid!);
                                        } else {
                                            handleStartDM(collab);
                                        }
                                    }}
                                >
                                    {isGroupMode && (
                                        <div className="pointer-events-none">
                                            <Checkbox checked={isSelected} readOnly />
                                        </div>
                                    )}

                                    <div className="w-10 h-10 rounded-full bg-surface-tertiary overflow-hidden border-2 border-surface-primary shadow-sm">
                                        {(collab.profilePhotoUrl || collab.photoUrl) ? (
                                            <img src={collab.profilePhotoUrl || collab.photoUrl} alt={collab.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-text-muted">
                                                <User size={18} />
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-text-primary truncate">{collab.name}</div>
                                        <div className="text-xs text-text-muted truncate">{collab.email}</div>
                                    </div>

                                    {!isGroupMode && (
                                        <div className="text-primary-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <MessageCircle size={18} />
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Group Actions */}
                {isGroupMode && (
                    <div className="flex items-center justify-between pt-2 border-t border-border">
                        <div className="flex items-center gap-2 text-sm text-text-muted">
                            <Users size={16} />
                            <span>{selectedUsers.length} selecionado(s)</span>
                        </div>
                        <Button
                            onClick={handleCreate}
                            isLoading={isLoading}
                            disabled={!groupName.trim() || selectedUsers.length === 0}
                        >
                            Criar Grupo
                        </Button>
                    </div>
                )}
            </div>
        </Modal>
    );
};
