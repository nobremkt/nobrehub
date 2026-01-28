import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    ChevronDown,
    ChevronRight,
    DollarSign,
    Clapperboard,
    HeartHandshake,
    Users,
    User as UserIcon
} from 'lucide-react';
import { getUsersBySector, type SectorUsers, type UserWithLeadCount } from '../../services/api/users';
import { SECTORS, canSeeSector, canSeeAllUsersInSector, getSectorForRole } from '../../config/permissions';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';

interface SidebarBoardListProps {
    currentUser: {
        id: string;
        name: string;
        role: string;
    };
    isCollapsed: boolean;
}

const SECTOR_ICONS: Record<string, React.ReactNode> = {
    vendas: <DollarSign size={18} />,
    producao: <Clapperboard size={18} />,
    pos_venda: <HeartHandshake size={18} />
};

const SidebarBoardList: React.FC<SidebarBoardListProps> = ({ currentUser, isCollapsed }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [sectorData, setSectorData] = useState<SectorUsers[]>([]);
    const [expandedSectors, setExpandedSectors] = useState<Record<string, boolean>>({});
    const [loading, setLoading] = useState(true);

    // Load sector data
    useEffect(() => {
        const loadData = async () => {
            try {
                const data = await getUsersBySector();
                setSectorData(data);
            } catch (err) {
                console.error('Failed to load sector data:', err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    // Determine which sectors the current user can see
    const visibleSectors = useMemo(() => {
        return sectorData.filter(sector => canSeeSector(currentUser.role, sector.sectorId));
    }, [sectorData, currentUser.role]);

    // Check if user can see all users or just themselves
    const canSeeAll = canSeeAllUsersInSector(currentUser.role);

    // Toggle sector expansion
    const toggleSector = (sectorId: string) => {
        setExpandedSectors(prev => ({
            ...prev,
            [sectorId]: !prev[sectorId]
        }));
    };

    // Check if a board is active
    const isActiveBoard = (userId: string) => {
        return location.pathname === `/board/${userId}`;
    };

    const isActiveSector = (sectorId: string) => {
        return location.pathname === `/board/sector/${sectorId}`;
    };

    // Navigate to a board
    const goToBoard = (userId: string) => {
        navigate(`/board/${userId}`);
    };

    const goToSector = (sectorId: string) => {
        navigate(`/board/sector/${sectorId}`);
    };

    if (loading) {
        return (
            <div className="px-2 py-4">
                <div className="animate-pulse space-y-2">
                    <div className="h-8 bg-slate-100 rounded" />
                    <div className="h-8 bg-slate-100 rounded" />
                    <div className="h-8 bg-slate-100 rounded" />
                </div>
            </div>
        );
    }

    // For non-admin users, show only their board
    if (!canSeeAll) {
        const userSector = getSectorForRole(currentUser.role);

        return (
            <div className="px-2 py-2">
                {userSector && (
                    <div className="mb-2">
                        <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            {SECTOR_ICONS[userSector.id]}
                            {!isCollapsed && <span>{userSector.label}</span>}
                        </div>
                        <button
                            onClick={() => goToBoard(currentUser.id)}
                            className={`
                                w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors
                                ${isActiveBoard(currentUser.id)
                                    ? 'bg-blue-50 text-blue-600'
                                    : 'text-slate-600 hover:bg-slate-50'
                                }
                            `}
                            title={isCollapsed ? 'Meu Board' : undefined}
                        >
                            <UserIcon size={18} className={isActiveBoard(currentUser.id) ? 'text-blue-500' : 'text-slate-400'} />
                            {!isCollapsed && (
                                <>
                                    <span className="flex-1 text-left text-sm font-medium">Meu Board</span>
                                    {visibleSectors.map(s =>
                                        s.users.find(u => u.id === currentUser.id)?.leadCount || 0
                                    ).reduce((a, b) => a + b, 0) > 0 && (
                                            <Badge variant="primary" size="sm">
                                                {visibleSectors.map(s =>
                                                    s.users.find(u => u.id === currentUser.id)?.leadCount || 0
                                                ).reduce((a, b) => a + b, 0)}
                                            </Badge>
                                        )}
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        );
    }

    // For admin/manager: show all sectors with users
    return (
        <nav className="px-2 py-2 space-y-1">
            {visibleSectors.map(sector => {
                const isExpanded = expandedSectors[sector.sectorId] ?? false;
                const Icon = SECTOR_ICONS[sector.sectorId] || <Users size={18} />;

                return (
                    <div key={sector.sectorId} className="mb-1">
                        {/* Sector Header */}
                        <button
                            onClick={() => toggleSector(sector.sectorId)}
                            className={`
                                w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors
                                text-slate-700 hover:bg-slate-50
                                ${isActiveSector(sector.sectorId) ? 'bg-blue-50 text-blue-600' : ''}
                            `}
                            title={isCollapsed ? sector.sectorLabel : undefined}
                        >
                            <span className="text-slate-400">
                                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            </span>
                            <span className="text-slate-500">{Icon}</span>
                            {!isCollapsed && (
                                <>
                                    <span className="flex-1 text-left text-sm font-semibold">
                                        {sector.sectorLabel}
                                    </span>
                                    {sector.totalLeads > 0 && (
                                        <Badge variant="default" size="sm">
                                            {sector.totalLeads}
                                        </Badge>
                                    )}
                                </>
                            )}
                        </button>

                        {/* Sector Users */}
                        {isExpanded && !isCollapsed && (
                            <div className="ml-4 mt-1 space-y-1 border-l-2 border-slate-100 pl-2">
                                {/* Ver Setor button */}
                                <button
                                    onClick={() => goToSector(sector.sectorId)}
                                    className={`
                                        w-full flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors text-sm
                                        ${isActiveSector(sector.sectorId)
                                            ? 'bg-blue-50 text-blue-600'
                                            : 'text-slate-500 hover:bg-slate-50'
                                        }
                                    `}
                                >
                                    <Users size={14} />
                                    <span>Ver Setor</span>
                                </button>

                                {/* User list */}
                                {sector.users.map(user => (
                                    <button
                                        key={user.id}
                                        onClick={() => goToBoard(user.id)}
                                        className={`
                                            w-full flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors text-sm
                                            ${isActiveBoard(user.id)
                                                ? 'bg-blue-50 text-blue-600'
                                                : 'text-slate-600 hover:bg-slate-50'
                                            }
                                        `}
                                    >
                                        <Avatar name={user.name} src={user.avatar} size="xs" />
                                        <span className="flex-1 text-left truncate">{user.name}</span>
                                        {user.leadCount > 0 && (
                                            <span className="text-xs text-slate-400">
                                                {user.leadCount}
                                            </span>
                                        )}
                                    </button>
                                ))}

                                {sector.users.length === 0 && (
                                    <div className="px-3 py-2 text-xs text-slate-400 italic">
                                        Nenhum usuário
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </nav>
    );
};

export default SidebarBoardList;
