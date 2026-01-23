import React, { useState, useEffect } from 'react';
import { getChannels, toggleChannel, createChannel, updateChannel, Channel } from '../../services/api';
import { Smartphone, Instagram, Mail, MessageCircle, AlertCircle, Plus, Loader2, X, Check, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const ChannelSettings: React.FC = () => {
    const [channels, setChannels] = useState<Channel[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
    const [saving, setSaving] = useState(false);

    // Form State
    const [formData, setFormData] = useState<{
        name: string;
        type: 'whatsapp_official' | 'whatsapp_api' | 'instagram' | 'email';
        number: string;
        config: any;
    }>({
        name: '',
        type: 'whatsapp_api',
        number: '',
        config: {}
    });

    useEffect(() => {
        loadChannels();
    }, []);

    const loadChannels = async () => {
        setIsLoading(true);
        try {
            const data = await getChannels();
            setChannels(data);
        } catch (error) {
            console.error('Failed to load channels', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggle = async (id: string, currentStatus: boolean) => {
        // Optimistic update
        setChannels(prev => prev.map(c =>
            c.id === id ? { ...c, isEnabled: !currentStatus } : c
        ));

        try {
            await toggleChannel(id, !currentStatus);
            toast.success(!currentStatus ? 'Canal habilitado' : 'Canal desabilitado');
        } catch (error) {
            toast.error('Erro ao atualizar canal');
            loadChannels(); // Revert
        }
    };

    const openCreateModal = () => {
        setEditingChannel(null);
        setFormData({ name: '', type: 'whatsapp_api', number: '', config: {} });
        setIsModalOpen(true);
    };

    const openEditModal = (channel: Channel) => {
        setEditingChannel(channel);
        setFormData({
            name: channel.name,
            type: channel.type,
            number: channel.number || channel.accountName || '',
            config: channel.config || {}
        });
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!formData.name) return toast.error('Nome obrigatório');

        setSaving(true);
        try {
            const payload: any = {
                name: formData.name,
                type: formData.type,
                config: formData.config
            };

            // Map number/accountName based on type
            if (formData.type.includes('whatsapp')) {
                payload.number = formData.number;
            } else {
                payload.accountName = formData.number;
            }

            if (editingChannel) {
                await updateChannel(editingChannel.id, payload);
                toast.success('Canal atualizado!');
            } else {
                payload.isEnabled = true;
                await createChannel(payload);
                toast.success('Canal criado!');
            }

            setIsModalOpen(false);
            loadChannels();
        } catch (error) {
            toast.error('Erro ao salvar canal');
        } finally {
            setSaving(false);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'instagram': return <Instagram className="text-pink-600" size={24} />;
            case 'email': return <Mail className="text-indigo-600" size={24} />;
            case 'whatsapp_official': return <MessageCircle className="text-emerald-600" size={24} />;
            default: return <MessageCircle className="text-emerald-500" size={24} />;
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'whatsapp_official': return 'WhatsApp Business API (Oficial)';
            case 'whatsapp_api': return 'WhatsApp Web (QR Code)';
            case 'instagram': return 'Instagram Direct';
            case 'email': return 'Email';
            default: return type;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Canais de Comunicação</h2>
                    <p className="text-sm text-slate-400 font-medium">Gerencie suas conexões e números</p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-slate-900/20"
                >
                    <Plus size={14} />
                    Novo Canal
                </button>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl p-8 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                                {editingChannel ? 'Editar Canal' : 'Adicionar Novo Canal'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                <X size={20} className="text-slate-400" />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            <div className="col-span-2">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nome do Canal</label>
                                <input
                                    type="text"
                                    placeholder="Ex: WhatsApp Comercial"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 transition-all font-medium"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Tipo de Conexão</label>
                                <select
                                    value={formData.type}
                                    disabled={!!editingChannel} // Disable type change on edit to avoid breaking logic
                                    onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 transition-all font-medium appearance-none disabled:opacity-50"
                                >
                                    <option value="whatsapp_api">WhatsApp (API Não Oficial)</option>
                                    <option value="whatsapp_official">WhatsApp Business API (Oficial)</option>
                                    <option value="instagram">Instagram Direct</option>
                                    <option value="email">Email</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                                    {formData.type.includes('whatsapp') ? 'Número (com DDD)' : 'Identificador / Email'}
                                </label>
                                <input
                                    type="text"
                                    placeholder={formData.type.includes('whatsapp') ? "5511999999999" : "usuario@email.com"}
                                    value={formData.number}
                                    onChange={e => setFormData({ ...formData, number: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 transition-all font-medium"
                                />
                            </div>
                        </div>

                        {/* Config Warning for Official API */}
                        {formData.type === 'whatsapp_official' && (
                            <div className="mb-8 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex gap-3">
                                <div className="p-2 bg-emerald-100 rounded-full h-fit">
                                    <Check size={14} className="text-emerald-700" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-emerald-900">Integração Oficial (360Dialog / Meta)</p>
                                    <p className="text-xs text-emerald-700 mt-1">
                                        As chaves de API desta conexão são gerenciadas via variáveis de ambiente do sistema.
                                        Você está editando apenas os dados de exibição.
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-6 py-3 text-slate-500 hover:bg-slate-100 rounded-xl font-bold text-xs uppercase tracking-widest transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-8 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-rose-600/20 disabled:opacity-50"
                            >
                                {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                                {editingChannel ? 'Salvar Alterações' : 'Criar Canal'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* List */}
            {isLoading ? (
                <div className="flex items-center justify-center h-48">
                    <Loader2 className="animate-spin text-slate-300" size={32} />
                </div>
            ) : channels.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200">
                    <Smartphone className="mx-auto text-slate-300 mb-4" size={48} />
                    <p className="text-slate-900 font-bold text-lg">Nenhum canal configurado</p>
                    <p className="text-slate-500 text-sm mt-1 mb-6">Conecte seu WhatsApp ou Instagram para começar a atender</p>
                    <button
                        onClick={openCreateModal}
                        className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs uppercase tracking-widest inline-flex items-center gap-2 transition-all shadow-lg shadow-slate-900/20"
                    >
                        <Plus size={14} />
                        Adicionar Canal Agora
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {channels.map((channel) => (
                        <div
                            key={channel.id}
                            className={`
                                relative p-6 rounded-3xl border-2 transition-all group hover:shadow-xl hover:shadow-slate-200/50
                                ${channel.isEnabled
                                    ? 'bg-white border-emerald-500/20'
                                    : 'bg-slate-50 border-slate-200 opacity-75 hover:opacity-100'
                                }
                            `}
                        >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                {/* Left: Info */}
                                <div className="flex items-start gap-4">
                                    <div className={`p-4 rounded-2xl shrink-0 ${channel.isEnabled ? 'bg-emerald-50' : 'bg-slate-200'}`}>
                                        {getIcon(channel.type)}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-bold text-slate-900 text-lg">{channel.name}</h3>
                                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-widest ${channel.status === 'connected' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                                {channel.status === 'connected' ? 'Conectado' : 'Desconectado'}
                                            </span>
                                        </div>

                                        <div className="flex flex-col gap-1">
                                            <p className="text-slate-500 text-sm font-medium flex items-center gap-2">
                                                <Smartphone size={14} />
                                                {channel.number || channel.accountName || 'Sem número definido'}
                                            </p>
                                            <p className="text-slate-400 text-xs flex items-center gap-2">
                                                <AlertCircle size={12} />
                                                {getTypeLabel(channel.type)}
                                                {channel.config?.provider && ` • via ${channel.config.provider}`}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Right: Actions */}
                                <div className="flex items-center gap-4 pl-4 md:border-l border-slate-100">
                                    <div className="flex flex-col items-end gap-1 mr-4">
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${channel.isEnabled ? 'text-emerald-600' : 'text-slate-400'}`}>
                                            {channel.isEnabled ? 'ATIVO' : 'PAUSADO'}
                                        </span>
                                        <button
                                            onClick={() => handleToggle(channel.id, channel.isEnabled)}
                                            className={`
                                                w-12 h-6 rounded-full p-1 transition-all duration-300
                                                ${channel.isEnabled ? 'bg-emerald-500' : 'bg-slate-300'}
                                            `}
                                        >
                                            <div className={`
                                                w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300
                                                ${channel.isEnabled ? 'translate-x-6' : 'translate-x-0'}
                                            `} />
                                        </button>
                                    </div>

                                    <button
                                        onClick={() => openEditModal(channel)}
                                        className="p-3 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-xl transition-all border border-transparent hover:border-slate-200"
                                        title="Editar detalhes"
                                    >
                                        <Pencil size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ChannelSettings;
