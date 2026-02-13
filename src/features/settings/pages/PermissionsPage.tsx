import { useEffect, useState, useMemo } from 'react';

import { Card, Checkbox, Spinner } from '@/design-system';
import { useRoleStore } from '../stores/useRoleStore';
import { useSectorStore } from '../stores/useSectorStore';
import { useCollaboratorStore } from '../stores/useCollaboratorStore';
import { Shield, Crown } from 'lucide-react';
import { PERMISSION_LABELS, PERMISSION_DESCRIPTIONS, PERMISSION_ORDER } from '@/config/permissions';
import { toast } from 'react-toastify';

const PERMISSION_COLUMNS = PERMISSION_ORDER.map(id => ({
    id,
    label: PERMISSION_LABELS[id],
    description: PERMISSION_DESCRIPTIONS[id]
}));

export const PermissionsPage = () => {
    const { roles, fetchRoles, updateRole, isLoading } = useRoleStore();
    const { sectors, fetchSectors, updateSector } = useSectorStore();
    const { collaborators, fetchCollaborators } = useCollaboratorStore();
    const [updatingMap, setUpdatingMap] = useState<Record<string, boolean>>({});

    useEffect(() => {
        fetchRoles();
        fetchSectors();
        fetchCollaborators();
    }, [fetchRoles, fetchSectors, fetchCollaborators]);

    // Mapa: nome do manager → permissões do cargo base
    const managerBasePermissions = useMemo(() => {
        const map: Record<string, string[]> = {};
        for (const sector of sectors) {
            if (!sector.manager) continue;
            const collab = collaborators.find(c => c.name === sector.manager);
            if (!collab?.roleId) continue;
            const role = roles.find(r => r.id === collab.roleId);
            map[sector.manager] = role?.permissions || [];
        }
        return map;
    }, [sectors, collaborators, roles]);

    const handleTogglePermission = async (roleId: string, permissionId: string, currentPermissions: string[] = []) => {
        const updateKey = `${roleId}-${permissionId}`;
        if (updatingMap[updateKey]) return;

        setUpdatingMap(prev => ({ ...prev, [updateKey]: true }));

        const hasPermission = currentPermissions.includes(permissionId);
        let newPermissions: string[];

        if (hasPermission) {
            newPermissions = currentPermissions.filter(p => p !== permissionId);
        } else {
            newPermissions = [...currentPermissions, permissionId];
        }

        try {
            await updateRole(roleId, { permissions: newPermissions });
        } catch (error) {
            console.error(error);
            toast.error("Erro ao atualizar permissão");
        } finally {
            setUpdatingMap(prev => {
                const newState = { ...prev };
                delete newState[updateKey];
                return newState;
            });
        }
    };

    const handleToggleLeaderPermission = async (sectorId: string, permissionId: string, currentPermissions: string[] = []) => {
        const updateKey = `leader-${sectorId}-${permissionId}`;
        if (updatingMap[updateKey]) return;

        setUpdatingMap(prev => ({ ...prev, [updateKey]: true }));

        const hasPermission = currentPermissions.includes(permissionId);
        let newPermissions: string[];

        if (hasPermission) {
            newPermissions = currentPermissions.filter(p => p !== permissionId);
        } else {
            newPermissions = [...currentPermissions, permissionId];
        }

        try {
            await updateSector(sectorId, { leaderPermissions: newPermissions });
        } catch (error) {
            console.error(error);
            toast.error("Erro ao atualizar permissão de líder");
        } finally {
            setUpdatingMap(prev => {
                const newState = { ...prev };
                delete newState[updateKey];
                return newState;
            });
        }
    };

    const activeSectors = sectors.filter(s => s.active && s.manager);

    return (
        <div className="w-full px-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-text-primary mb-1">Matriz de Permissões</h1>
                <p className="text-text-muted">Gerencie o acesso de cada cargo e líder de setor aos módulos do sistema.</p>
            </div>

            {isLoading && roles.length === 0 ? (
                <div className="flex justify-center p-12">
                    <Spinner size="lg" />
                </div>
            ) : (
                <>
                    {/* ── Cargos ── */}
                    <Card variant="elevated" className="overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-surface-tertiary border-b border-border">
                                        <th className="p-4 text-sm font-semibold text-text-secondary min-w-[200px]">
                                            Cargo
                                        </th>
                                        {PERMISSION_COLUMNS.map(col => (
                                            <th key={col.id} className="p-4 text-sm font-semibold text-text-secondary text-center min-w-[150px] cursor-help" title={col.description} style={{ whiteSpace: 'pre-line' }}>
                                                {col.label}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border bg-surface-primary">
                                    {roles.length > 0 ? roles.map(role => (
                                        <tr key={role.id} className="hover:bg-surface-secondary/50 transition-colors">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 rounded-lg bg-surface-secondary text-primary-500">
                                                        <Shield size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-text-primary">{role.name}</p>
                                                        {role.description && (
                                                            <p className="text-xs text-text-muted line-clamp-1">{role.description}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            {PERMISSION_COLUMNS.map(col => {
                                                const isChecked = role.permissions?.includes(col.id) || false;
                                                const isUpdating = updatingMap[`${role.id}-${col.id}`];

                                                return (
                                                    <td key={col.id} className="p-4">
                                                        <div className="flex justify-center">
                                                            {isUpdating ? (
                                                                <Spinner size="sm" />
                                                            ) : (
                                                                <Checkbox
                                                                    checked={isChecked}
                                                                    onChange={() => handleTogglePermission(role.id, col.id, role.permissions)}
                                                                />
                                                            )}
                                                        </div>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={PERMISSION_COLUMNS.length + 1} className="p-8 text-center text-text-muted">
                                                Nenhum cargo encontrado. Crie cargos primeiro para configurar permissões.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>

                    {/* ── Líderes de Setor ── */}
                    {activeSectors.length > 0 && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Crown size={20} className="text-primary-500" />
                                <h2 className="text-lg font-semibold text-text-primary">Permissões de Líder</h2>
                                <span className="text-sm text-text-muted">— Permissões extras para o responsável do setor</span>
                            </div>

                            <Card variant="elevated" className="overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-surface-tertiary border-b border-border">
                                                <th className="p-4 text-sm font-semibold text-text-secondary min-w-[200px]">
                                                    Setor
                                                </th>
                                                {PERMISSION_COLUMNS.map(col => (
                                                    <th key={col.id} className="p-4 text-sm font-semibold text-text-secondary text-center min-w-[150px] cursor-help" title={col.description} style={{ whiteSpace: 'pre-line' }}>
                                                        {col.label}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border bg-surface-primary">
                                            {activeSectors.map(sector => (
                                                <tr key={sector.id} className="hover:bg-surface-secondary/50 transition-colors">
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 rounded-lg bg-primary-500/10 text-primary-500">
                                                                <Crown size={18} />
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-text-primary">{sector.name}</p>
                                                                <p className="text-xs text-text-muted">{sector.manager}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    {PERMISSION_COLUMNS.map(col => {
                                                        const basePerms = managerBasePermissions[sector.manager || ''] || [];
                                                        const isFromRole = basePerms.includes(col.id);
                                                        const isLeaderExtra = sector.leaderPermissions?.includes(col.id) || false;
                                                        const isUpdating = updatingMap[`leader-${sector.id}-${col.id}`];

                                                        return (
                                                            <td key={col.id} className="p-4">
                                                                <div className="flex justify-center" title={isFromRole ? 'Já incluída no cargo base' : undefined}>
                                                                    {isUpdating ? (
                                                                        <Spinner size="sm" />
                                                                    ) : isFromRole ? (
                                                                        <div style={{ opacity: 0.35 }}>
                                                                            <Checkbox
                                                                                checked
                                                                                disabled
                                                                                onChange={() => { }}
                                                                            />
                                                                        </div>
                                                                    ) : (
                                                                        <Checkbox
                                                                            checked={isLeaderExtra}
                                                                            onChange={() => handleToggleLeaderPermission(sector.id, col.id, sector.leaderPermissions)}
                                                                        />
                                                                    )}
                                                                </div>
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};
