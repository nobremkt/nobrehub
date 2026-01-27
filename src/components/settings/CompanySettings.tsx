import React, { useEffect, useState } from 'react';
import { Building2, Save, X, Globe, Phone, Mail, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { supabaseGetOrganization, supabaseUpdateOrganization } from '../../services/supabaseApi';

interface Organization {
    id: string;
    name: string;
    cnpj: string;
    email: string;
    phone: string;
    address: string;
    website: string;
    logoUrl: string;
}

const CompanySettings: React.FC = () => {
    const [org, setOrg] = useState<Organization | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState({
        name: '',
        cnpj: '',
        email: '',
        phone: '',
        address: '',
        website: '',
        logoUrl: '',
    });

    useEffect(() => {
        fetchOrganization();
    }, []);

    const fetchOrganization = async () => {
        try {
            const data = await supabaseGetOrganization();
            if (data) {
                setOrg(data as Organization);
                setForm({
                    name: data.name || '',
                    cnpj: data.cnpj || '',
                    email: data.email || '',
                    phone: data.phone || '',
                    address: data.address || '',
                    website: data.website || '',
                    logoUrl: data.logoUrl || data.logo_url || '',
                });
            }
        } catch (error) {
            console.error('Error fetching organization:', error);
            toast.error('Erro ao carregar dados da empresa');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await supabaseUpdateOrganization(form);
            toast.success('Dados atualizados com sucesso!');
            fetchOrganization();
        } catch (error) {
            console.error('Error updating organization:', error);
            toast.error('Erro ao salvar dados');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Carregando...</div>;

    return (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm animate-in fade-in duration-300">
            <header className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-xl font-bold text-slate-900">Dados da Empresa</h2>
                    <p className="text-slate-500 text-sm mt-1">Gerencie as informações principais do seu negócio</p>
                </div>
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100">
                    <Building2 className="text-slate-400" size={24} />
                </div>
            </header>

            <form onSubmit={handleSave} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nome da Empresa</label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={e => setForm({ ...form, name: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                            placeholder="Ex: Minha Empresa LTDA"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">CNPJ</label>
                        <input
                            type="text"
                            value={form.cnpj}
                            onChange={e => setForm({ ...form, cnpj: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all block"
                            placeholder="00.000.000/0000-00"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <Mail size={12} /> Email de Contato
                        </label>
                        <input
                            type="email"
                            value={form.email}
                            onChange={e => setForm({ ...form, email: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                            placeholder="contato@empresa.com"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <Phone size={12} /> Telefone / WhatsApp
                        </label>
                        <input
                            type="text"
                            value={form.phone}
                            onChange={e => setForm({ ...form, phone: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                            placeholder="(00) 00000-0000"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <Globe size={12} /> Website
                        </label>
                        <input
                            type="text"
                            value={form.website}
                            onChange={e => setForm({ ...form, website: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                            placeholder="https://www.empresa.com.br"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <MapPin size={12} /> Endereço
                        </label>
                        <input
                            type="text"
                            value={form.address}
                            onChange={e => setForm({ ...form, address: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                            placeholder="Rua Exemplo, 123 - Cidade/UF"
                        />
                    </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 shadow-lg shadow-rose-200"
                    >
                        {saving ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Save size={18} />
                        )}
                        Salvar Alterações
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CompanySettings;
