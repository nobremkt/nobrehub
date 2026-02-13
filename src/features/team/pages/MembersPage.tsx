import { useEffect, useState } from 'react';
import { Spinner, Input, PersonCard } from '@/design-system';
import { useCollaboratorStore } from '@/features/settings/stores/useCollaboratorStore';
import { useRoleStore } from '@/features/settings/stores/useRoleStore';
import { useSectorStore } from '@/features/settings/stores/useSectorStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { Search, User, Crown } from 'lucide-react';
import { Collaborator } from '@/features/settings/types';
import { useTeamStatus } from '@/features/presence/hooks/useTeamStatus';
import { CollaboratorProfileModal } from '../components/CollaboratorProfileModal';




export const MembersPage = () => {
    const { collaborators, fetchCollaborators, isLoading } = useCollaboratorStore();
    const { roles, fetchRoles } = useRoleStore();
    const { sectors, fetchSectors } = useSectorStore();
    const { user } = useAuthStore();
    const teamStatus = useTeamStatus(); // Realtime status

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCollaborator, setSelectedCollaborator] = useState<Collaborator | null>(null);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

    useEffect(() => {
        fetchCollaborators();
        fetchRoles();
        fetchSectors();
    }, [fetchCollaborators, fetchRoles, fetchSectors]);

    const getRoleName = (id?: string) => roles.find(r => r.id === id)?.name || 'Sem cargo';
    const getSectorName = (id?: string) => sectors.find(s => s.id === id)?.name;

    const handleViewProfile = (collaborator: Collaborator) => {
        setSelectedCollaborator(collaborator);
        setIsProfileModalOpen(true);
    };

    const handleCloseProfileModal = () => {
        setIsProfileModalOpen(false);
        setSelectedCollaborator(null);
    };

    // Sort logic: active collaborators, sorted by name
    const activeCollaborators = collaborators
        .filter(c => {
            // Filter active only
            if (!c.active) return false;

            // Hide debug user unless logged in as debug
            if (c.email === 'debug@debug.com' && user?.email !== 'debug@debug.com') {
                return false;
            }

            // Search filter
            return c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.email.toLowerCase().includes(searchTerm.toLowerCase());
        })
        .sort((a, b) => a.name.localeCompare(b.name));

    // Group by sector
    const groupedCollaborators = activeCollaborators.reduce((acc, curr) => {
        const sectorId = curr.sectorId || 'uncategorized';
        if (!acc[sectorId]) acc[sectorId] = [];
        acc[sectorId].push(curr);
        return acc;
    }, {} as Record<string, Collaborator[]>);

    // Get list of sectors to iterate in order (by display_order from store)
    const sectorGroups = sectors.map(s => {
        const members = groupedCollaborators[s.id] || [];

        // Sort leader first, then alphabetical
        const sorted = [...members].sort((a, b) => {
            const aIsLeader = s.manager && a.name === s.manager;
            const bIsLeader = s.manager && b.name === s.manager;
            if (aIsLeader && !bIsLeader) return -1;
            if (!aIsLeader && bIsLeader) return 1;
            return a.name.localeCompare(b.name);
        });

        return {
            id: s.id,
            name: s.name,
            manager: s.manager,
            collaborators: sorted,
        };
    });

    // Add uncategorized if any
    if (groupedCollaborators['uncategorized'] && groupedCollaborators['uncategorized'].length > 0) {
        sectorGroups.push({
            id: 'uncategorized',
            name: 'Outros',
            manager: null,
            collaborators: groupedCollaborators['uncategorized']
        });
    }

    // Filter out empty groups
    const nonEmptyGroups = sectorGroups.filter(g => g.collaborators.length > 0);

    return (
        <div className="w-full px-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary mb-1">Membros</h1>
                    <p className="text-text-muted">Conheça a nossa equipe.</p>
                </div>
            </div>




            <div className="w-full md:w-96">
                <Input
                    placeholder="Buscar membros..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    leftIcon={<Search size={18} />}
                    fullWidth
                />
            </div>

            {isLoading && collaborators.length === 0 ? (
                <div className="flex justify-center p-12">
                    <Spinner size="lg" />
                </div>
            ) : (
                <div className="space-y-8 pb-10">
                    {nonEmptyGroups.map(group => (
                        <div key={group.id} className="space-y-4">
                            <div className="flex items-center gap-4">
                                <h2 className="text-xl font-semibold text-primary-500 whitespace-nowrap px-2 border-l-4 border-primary-500">{group.name}</h2>
                                <span className="text-sm text-text-muted whitespace-nowrap">({group.collaborators.length} membros)</span>
                                <div className="h-px bg-border w-full opacity-50"></div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2">
                                {group.collaborators.map((collaborator) => {
                                    const userStatus = collaborator.authUid
                                        ? teamStatus[collaborator.authUid]?.state
                                        : 'offline';

                                    const isOnline = userStatus === 'online';
                                    const isLeader = !!(group.manager && collaborator.name === group.manager);

                                    return (
                                        <div key={collaborator.id} className="flex flex-col">
                                            <PersonCard
                                                name={collaborator.name}
                                                role={getRoleName(collaborator.roleId)}
                                                imageUrl={collaborator.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(collaborator.name)}&background=random&size=512`}
                                                isOnline={isOnline}
                                                onViewProfile={() => handleViewProfile(collaborator)}
                                            />
                                            {isLeader && (
                                                <div className="text-center mt-2 space-y-1">
                                                    <span className="text-primary-500 font-semibold text-sm flex items-center justify-center gap-1">
                                                        <Crown size={14} />
                                                        Líder
                                                    </span>
                                                    <p className="text-xs text-text-muted leading-tight">
                                                        Responsável pela liderança e gestão da equipe.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}

                    {nonEmptyGroups.length === 0 && (
                        <div className="flex flex-col items-center justify-center p-12 text-text-muted border-2 border-dashed border-border rounded-lg bg-surface-secondary/50">
                            <User size={48} className="mb-4 opacity-20" />
                            <p>Nenhum membro encontrado.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Profile Modal */}
            <CollaboratorProfileModal
                collaborator={selectedCollaborator}
                isOpen={isProfileModalOpen}
                onClose={handleCloseProfileModal}
                sectorName={selectedCollaborator ? getSectorName(selectedCollaborator.sectorId) : undefined}
                roleName={selectedCollaborator ? getRoleName(selectedCollaborator.roleId) : undefined}
            />
        </div>
    );
};
