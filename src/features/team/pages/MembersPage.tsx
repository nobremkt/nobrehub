import { useEffect, useState } from 'react';
import { Spinner, Input, PersonCard } from '@/design-system';
import { useCollaboratorStore } from '@/features/settings/stores/useCollaboratorStore';
import { useRoleStore } from '@/features/settings/stores/useRoleStore';
import { useSectorStore } from '@/features/settings/stores/useSectorStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { Search, User } from 'lucide-react';
import { Collaborator } from '@/features/settings/types';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/config';
import { useTeamStatus } from '@/features/presence/hooks/useTeamStatus';




export const MembersPage = () => {
    const { collaborators, fetchCollaborators, isLoading } = useCollaboratorStore();
    const { roles, fetchRoles } = useRoleStore();
    const { sectors, fetchSectors } = useSectorStore();
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const teamStatus = useTeamStatus(); // Realtime status

    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchCollaborators();
        fetchRoles();
        fetchSectors();
    }, [fetchCollaborators, fetchRoles, fetchSectors]);

    const getRoleName = (id?: string) => roles.find(r => r.id === id)?.name || 'Sem cargo';

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

    // Get list of sectors to iterate in order (by name usually, or defined order)
    // We'll use the sectors from store which might be sorted.
    const sectorGroups = sectors.map(s => ({
        id: s.id,
        name: s.name,
        collaborators: groupedCollaborators[s.id] || []
    }));

    // Add uncategorized if any
    if (groupedCollaborators['uncategorized'] && groupedCollaborators['uncategorized'].length > 0) {
        sectorGroups.push({
            id: 'uncategorized',
            name: 'Outros',
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
                                <div className="h-px bg-border w-full opacity-50"></div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2">
                                {group.collaborators.map((collaborator) => {
                                    // Pega o status do Firebase Realtime, fallback para 'offline'
                                    const userStatus = collaborator.authUid
                                        ? teamStatus[collaborator.authUid]?.state
                                        : 'offline';

                                    const isOnline = userStatus === 'online';

                                    return (
                                        <PersonCard
                                            key={collaborator.id}
                                            name={collaborator.name}
                                            role={getRoleName(collaborator.roleId)}
                                            imageUrl={collaborator.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(collaborator.name)}&background=random&size=512`}
                                            isOnline={isOnline}
                                            onViewProfile={() => navigate(ROUTES.team.member(collaborator.id))}
                                        />
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
        </div>
    );
};
