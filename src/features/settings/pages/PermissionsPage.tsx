import { useEffect, useState } from 'react';

import { Card, Checkbox, Spinner } from '@/design-system';
import { useRoleStore } from '../stores/useRoleStore';
import { Shield } from 'lucide-react';
import { PERMISSION_LABELS, PERMISSIONS } from '@/config/permissions';
import { toast } from 'react-toastify';

const PERMISSION_COLUMNS = Object.values(PERMISSIONS).map(id => ({
    id,
    label: PERMISSION_LABELS[id]
}));

export const PermissionsPage = () => {
    const { roles, fetchRoles, updateRole, isLoading } = useRoleStore();
    const [updatingMap, setUpdatingMap] = useState<Record<string, boolean>>({});

    useEffect(() => {
        fetchRoles();
    }, [fetchRoles]);

    const handleTogglePermission = async (roleId: string, permissionId: string, currentPermissions: string[] = []) => {
        // Evita múltiplos cliques rápidos
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

    return (
        <div className="w-full px-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-text-primary mb-1">Matriz de Permissões</h1>
                <p className="text-text-muted">Gerencie o acesso de cada cargo aos módulos do sistema.</p>
            </div>

            {isLoading && roles.length === 0 ? (
                <div className="flex justify-center p-12">
                    <Spinner size="lg" />
                </div>
            ) : (
                <Card variant="elevated" className="overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-surface-tertiary border-b border-border">
                                    <th className="p-4 text-sm font-semibold text-text-secondary min-w-[200px]">
                                        Cargo
                                    </th>
                                    {PERMISSION_COLUMNS.map(col => (
                                        <th key={col.id} className="p-4 text-sm font-semibold text-text-secondary text-center min-w-[150px]">
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
            )}
        </div>
    );
};
