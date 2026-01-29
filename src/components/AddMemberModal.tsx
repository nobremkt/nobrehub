import React, { useState, useEffect } from 'react';
import { X, User, Mail, Lock, Building2, Shield, Loader2, Eye, EyeOff } from 'lucide-react';
import { supabaseCreateUser, supabaseUpdateUser } from '../services/supabaseApi';

interface Sector {
    id: string;
    name: string;
    color: string;
}

interface EditMember {
    id: string;
    name: string;
    email: string;
    role: string;
    sectorId: string | null;
}

interface AddMemberModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    sectors: Sector[];
    editMember?: EditMember | null;
}

const ROLES = [
    { value: 'admin', label: 'Administrador', description: 'Acesso total ao sistema' },
    { value: 'closer_ht', label: 'Closer High Ticket', description: 'Vendedor de alto valor' },
    { value: 'closer_lt', label: 'Closer Low Ticket', description: 'Vendedor de entrada' },
    { value: 'sdr', label: 'SDR', description: 'Pré-vendedor' },
    { value: 'production', label: 'Produção', description: 'Equipe de entregas' },
    { value: 'post_sales', label: 'Pós-Venda', description: 'Sucesso do cliente' },
    { value: 'manager_sales', label: 'Gerente de Vendas', description: 'Gestão comercial' },
    { value: 'manager_production', label: 'Gerente de Produção', description: 'Gestão de entregas' },
    { value: 'strategic', label: 'Estratégico', description: 'Visão geral do negócio' }
];

const AddMemberModal: React.FC<AddMemberModalProps> = ({ isOpen, onClose, onSuccess, sectors, editMember }) => {
    const isEditMode = !!editMember;
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'closer_lt',
        sectorId: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Reset or populate form when modal opens
    useEffect(() => {
        if (isOpen) {
            if (editMember) {
                // Edit mode: populate with existing data
                setFormData({
                    name: editMember.name || '',
                    email: editMember.email || '',
                    password: '', // Password is optional in edit mode
                    role: editMember.role || 'closer_lt',
                    sectorId: editMember.sectorId || ''
                });
            } else {
                // Create mode: reset form
                setFormData({
                    name: '',
                    email: '',
                    password: '',
                    role: 'closer_lt',
                    sectorId: ''
                });
            }
            setError(null);
        }
    }, [isOpen, editMember]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isEditMode && editMember) {
                // Update existing member
                await supabaseUpdateUser(editMember.id, {
                    name: formData.name,
                    role: formData.role,
                    sectorId: formData.sectorId || null,
                    ...(formData.password ? { password: formData.password } : {})
                });
            } else {
                // Create new member
                await supabaseCreateUser({
                    email: formData.email,
                    name: formData.name,
                    password: formData.password,
                    role: formData.role,
                    sectorId: formData.sectorId || undefined
                });
            }
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message || (isEditMode ? 'Erro ao atualizar membro' : 'Erro ao criar membro'));
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg mx-4 animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100">
                    <div>
                        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                            {isEditMode ? 'Editar Membro' : 'Novo Membro'}
                        </h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                            {isEditMode ? 'Atualizar informações' : 'Adicionar à equipe'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                    >
                        <X size={20} className="text-slate-400" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
                            {error}
                        </div>
                    )}

                    {/* Name */}
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                            Nome Completo
                        </label>
                        <div className="relative">
                            <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Digite o nome"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all"
                            />
                        </div>
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                            Email
                        </label>
                        <div className="relative">
                            <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                            <input
                                type="email"
                                required
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="email@exemplo.com"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all"
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                            Senha
                        </label>
                        <div className="relative">
                            <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                required={!isEditMode}
                                minLength={6}
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                placeholder={isEditMode ? 'Deixe em branco para manter' : 'Mínimo 6 caracteres'}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-12 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {/* Role */}
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                            Cargo
                        </label>
                        <div className="relative">
                            <Shield size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                            <select
                                required
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-4 text-sm text-slate-900 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all appearance-none cursor-pointer"
                            >
                                {ROLES.map((role) => (
                                    <option key={role.value} value={role.value}>
                                        {role.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Sector */}
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                            Setor
                        </label>
                        <div className="relative">
                            <Building2 size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                            <select
                                value={formData.sectorId}
                                onChange={(e) => setFormData({ ...formData, sectorId: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-4 text-sm text-slate-900 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all appearance-none cursor-pointer"
                            >
                                <option value="">Selecione o setor (opcional)</option>
                                {sectors.map((sector) => (
                                    <option key={sector.id} value={sector.id}>
                                        {sector.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3.5 px-6 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-sm transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-3.5 px-6 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-rose-600/20"
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    {isEditMode ? 'Salvando...' : 'Criando...'}
                                </>
                            ) : (
                                isEditMode ? 'Salvar Alterações' : 'Criar Membro'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddMemberModal;
