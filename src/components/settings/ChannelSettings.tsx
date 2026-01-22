import React, { useState, useEffect } from 'react';
import { getChannels, toggleChannel, createChannel, Channel } from '../../services/api';
import { Smartphone, Instagram, Mail, MessageCircle, AlertCircle, Plus, Loader2, X, Check } from 'lucide-react';
import { toast } from 'sonner';

const ChannelSettings: React.FC = () => {
    const [channels, setChannels] = useState<Channel[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [saving, setSaving] = useState(false);

    // New Channel Form
    const [newChannel, setNewChannel] = useState<{
        name: string;
        type: 'whatsapp_official' | 'whatsapp_api' | 'instagram' | 'email';
        number: string;
    }>({
        name: '',
        type: 'whatsapp_api',
        number: ''
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
        const originalChannels = [...channels];
        setChannels(prev => prev.map(c =>
            c.id === id ? { ...c, isEnabled: !currentStatus } : c
        ));

        try {
            await toggleChannel(id, !currentStatus);
            toast.success(!currentStatus ? 'Canal habilitado' : 'Canal desabilitado');
        } catch (error) {
            toast.error('Erro ao atualizar canal');
            setChannels(originalChannels);
        }
    };

    const handleCreate = async () => {
        if (!newChannel.name) return toast.error('Nome obrigatório');

        setSaving(true);
        try {
            const payload: any = {
                name: newChannel.name,
                type: newChannel.type,
                isEnabled: true
            };

            if (newChannel.type === 'whatsapp_api' || newChannel.type === 'whatsapp_official') {
                payload.number = newChannel.number;
            } else {
                payload.accountName = newChannel.number; // Reuse field for account name
            }

            await createChannel(payload);
            toast.success('Canal criado com sucesso!');
            setIsCreating(false);
            setNewChannel({ name: '', type: 'whatsapp_api', number: '' });
            loadChannels();
        } catch (error) {
            toast.error('Erro ao criar canal');
        } finally {
            setSaving(false);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'instagram': return <Instagram className="text-pink-600" size={24} />;
            case 'email': return <Mail className="text-indigo-600" size={24} />;
            default: return <MessageCircle className="text-emerald-500" size={24} />;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Canais de Comunicação</h2>
                    <p className="text-sm text-slate-400 font-medium">Gerencie suas conexões (WhatsApp, Instagram, Email)</p>
                </div>
                <button
                    onClick={() => setIsCreating(true)}
                    className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-slate-900/20"
                >
                    <Plus size={14} />
                    Novo Canal
                </button>
            </div>

            {isCreating && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 animate-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-slate-700">Adicionar Novo Canal</h3>
                        <button onClick={() => setIsCreating(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                            <X size={16} className="text-slate-400" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Nome do Canal</label>
                            <input
                                type="text"
                                placeholder="Ex: WhatsApp Vendas"
                                value={newChannel.name}
                                onChange={e => setNewChannel({ ...newChannel, name: e.target.value })}
                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tipo</label>
                            <select
                                value={newChannel.type}
                                onChange={e => setNewChannel({ ...newChannel, type: e.target.value as any })}
                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
                            >
                                <option value="whatsapp_api">WhatsApp (API Não Oficial)</option>
                                <option value="whatsapp_official">WhatsApp Business API</option>
                                <option value="instagram">Instagram Direct</option>
                                <option value="email">Email</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                {newChannel.type.includes('whatsapp') ? 'Número (com DDD)' : 'Identificador/Email'}
                            </label>
                            <input
                                type="text"
                                placeholder={newChannel.type.includes('whatsapp') ? "5511999999999" : "user@email.com"}
                                value={newChannel.number}
                                onChange={e => setNewChannel({ ...newChannel, number: e.target.value })}
                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2">
                        <button
                            onClick={() => setIsCreating(false)}
                            className="px-4 py-2 text-slate-500 hover:bg-slate-200 rounded-xl font-bold text-xs uppercase tracking-widest transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleCreate}
                            disabled={saving}
                            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                        >
                            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                            Confirmar
                        </button>
                    </div>
                </div>
            )}

            {isLoading ? (
                <div className="flex items-center justify-center h-48">
                    <Loader2 className="animate-spin text-slate-300" size={32} />
                </div>
            ) : channels.length === 0 && !isCreating ? (
                <div className="text-center py-16 bg-slate-50 rounded-3xl border border-slate-200 border-dashed">
                    <Smartphone className="mx-auto text-slate-300 mb-4" size={48} />
                    <p className="text-slate-900 font-bold text-lg">Nenhum canal configurado</p>
                    <p className="text-slate-500 text-sm mt-1 mb-6">Conecte seu WhatsApp ou Instagram para começar a atender</p>
                    <button
                        onClick={() => setIsCreating(true)}
                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs uppercase tracking-widest inline-flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/20"
                    >
                        <Plus size={14} />
                        Adicionar Canal Agora
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {channels.map((channel) => (
                        <div
                            key={channel.id}
                            className={`
                                relative p-6 rounded-3xl border-2 transition-all group overflow-hidden
                                ${channel.isEnabled
                                    ? 'bg-white border-emerald-500/30 shadow-xl shadow-emerald-500/5'
                                    : 'bg-slate-50 border-slate-200 opacity-60 hover:opacity-100'
                                }
                            `}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className={`p-3 rounded-2xl ${channel.isEnabled ? 'bg-emerald-50' : 'bg-slate-200'}`}>
                                    {getIcon(channel.type)}
                                </div>
                                <div className={`
                                    w-2 h-2 rounded-full shadow-sm
                                    ${channel.status === 'connected' ? 'bg-emerald-500 shadow-emerald-500/50' :
                                        channel.status === 'error' ? 'bg-red-500 shadow-red-500/50' : 'bg-slate-400'}
                                `} />
                            </div>

                            <h3 className="font-bold text-slate-900 text-lg mb-1">{channel.name}</h3>
                            <p className="text-slate-500 text-xs font-mono mb-6">
                                {channel.number || channel.accountName || 'Sem identificador'}
                            </p>

                            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                <span className={`text-[10px] font-black uppercase tracking-widest ${channel.isEnabled ? 'text-emerald-600' : 'text-slate-400'}`}>
                                    {channel.isEnabled ? 'ATIVO' : 'PAUSADO'}
                                </span>

                                <button
                                    onClick={() => handleToggle(channel.id, channel.isEnabled)}
                                    className={`
                                        w-12 h-6 rounded-full p-1 transition-all duration-300 relative
                                        ${channel.isEnabled ? 'bg-emerald-500' : 'bg-slate-300'}
                                    `}
                                >
                                    <div className={`
                                        w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300
                                        ${channel.isEnabled ? 'translate-x-6' : 'translate-x-0'}
                                    `} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ChannelSettings;
