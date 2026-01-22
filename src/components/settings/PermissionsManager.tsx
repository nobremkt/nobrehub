import React, { useEffect, useState } from 'react';
import { getPermissions, updatePermissions, RoleAccess } from '../../services/api';
import { Shield, Check, Loader2, Save, Undo } from 'lucide-react';
import { toast } from 'sonner';

const FEATURES = [
    { id: 'view_kanban', label: 'Ver Kanban', description: 'Acesso ao funil de vendas' },
    { id: 'view_workspace', label: 'Meu Workspace', description: 'Acesso à área de trabalho pessoal' },
    { id: 'view_leads', label: 'Ver Leads', description: 'Listagem completa de leads' },
    { id: 'view_chat', label: 'Atendimento', description: 'Acesso ao chat multi-atendente' },
    { id: 'manage_flows', label: 'Automações', description: 'Criar e editar fluxos' },
    { id: 'view_team', label: 'Ver Equipe', description: 'Visualizar membros da equipe' },
    { id: 'view_analytics', label: 'Relatórios', description: 'Acesso aos dashboards' },
    { id: 'manage_settings', label: 'Configurações', description: 'Acesso total às configurações' }
];

const ROLES = [
    { id: 'admin', label: 'Admin' },
    { id: 'manager_sales', label: 'Ger. Vendas' },
    { id: 'manager_production', label: 'Ger. Prod.' },
    { id: 'strategic', label: 'Estratégico' },
    { id: 'sdr', label: 'SDR' },
    { id: 'closer_ht', label: 'Closer HT' },
    { id: 'closer_lt', label: 'Closer LT' },
    { id: 'production', label: 'Produção' },
    { id: 'post_sales', label: 'Pós-Venda' }
];

const PermissionsManager: React.FC = () => {
    const [permissions, setPermissions] = useState<RoleAccess[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        loadPermissions();
    }, []);

    const loadPermissions = async () => {
        setLoading(true);
        try {
            const data = await getPermissions();
            setPermissions(data);
        } catch (error) {
            toast.error('Erro ao carregar permissões');
        } finally {
            setLoading(false);
        }
    };

    const togglePermission = (role: string, feature: string) => {
        setPermissions(prev => prev.map(p => {
            if (p.role === role) {
                const current = p.permissions || [];
                const newPerms = current.includes(feature)
                    ? current.filter(f => f !== feature)
                    : [...current, feature];
                return { ...p, permissions: newPerms };
            }
            return p;
        }));
        setHasChanges(true);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Save all roles that changed (naive approach: save all)
            await Promise.all(permissions.map(p => updatePermissions(p.role, p.permissions)));
            toast.success('Permissões atualizadas com sucesso!');
            setHasChanges(false);
        } catch (error) {
            toast.error('Erro ao salvar permissões');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="animate-spin text-rose-600" size={32} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Gerenciamento de Acessos</h2>
                    <p className="text-sm text-slate-400 font-medium">Defina o que cada cargo pode acessar no sistema</p>
                </div>
                {hasChanges && (
                    <div className="flex gap-2">
                        <button
                            onClick={loadPermissions}
                            className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-xl font-bold text-xs uppercase tracking-widest transition-all"
                        >
                            <Undo size={14} className="inline mr-2" />
                            Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="px-6 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-rose-600/20 disabled:opacity-50"
                        >
                            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                            Salvar Alterações
                        </button>
                    </div>
                )}
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="p-4 text-left font-black text-slate-400 text-[10px] uppercase tracking-widest min-w-[200px] sticky left-0 bg-slate-50 z-10">
                                    Funcionalidade
                                </th>
                                {ROLES.map(role => (
                                    <th key={role.id} className="p-4 text-center font-black text-slate-600 text-[10px] uppercase tracking-widest min-w-[100px]">
                                        {role.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {FEATURES.map(feature => (
                                <tr key={feature.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="p-4 sticky left-0 bg-white hover:bg-slate-50/50 transition-colors z-10 border-r border-slate-100/50">
                                        <div className="font-bold text-slate-700 text-sm">{feature.label}</div>
                                        <div className="text-xs text-slate-400 mt-0.5">{feature.description}</div>
                                    </td>
                                    {ROLES.map(role => {
                                        const rolePerms = permissions.find(p => p.role === role.id)?.permissions || [];
                                        const isEnabled = rolePerms.includes(feature.id);
                                        const isAdmin = role.id === 'admin'; // Admin always has access visually (though we allow editing for safety if needed, let's keep it editable but maybe warn)

                                        return (
                                            <td key={role.id} className="p-4 text-center">
                                                <button
                                                    onClick={() => togglePermission(role.id, feature.id)}
                                                    className={`
                                                        w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 mx-auto
                                                        ${isEnabled
                                                            ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200'
                                                            : 'bg-slate-50 text-slate-300 hover:bg-slate-100 border border-slate-200'
                                                        }
                                                    `}
                                                >
                                                    {isEnabled && <Check size={16} strokeWidth={4} />}
                                                </button>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-start gap-3">
                <Shield className="text-slate-400 shrink-0 mt-0.5" size={18} />
                <p className="text-xs text-slate-500 leading-relaxed">
                    <strong>Nota de Segurança:</strong> As alterações de permissões podem levar alguns minutos para se propagar para todos os usuários logados.
                    Administradores geralmente mantêm acesso total para evitar bloqueios acidentais.
                </p>
            </div>
        </div>
    );
};

export default PermissionsManager;
