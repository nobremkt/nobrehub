
import React, { useState, useEffect } from 'react';
import { MessageCircle, Instagram, Check, Smartphone, AlertCircle, Mail, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabaseGetChannels, supabaseToggleChannel, Channel } from '../services/supabaseApi';

const ChannelConfig: React.FC = () => {
    const [channels, setChannels] = useState<Channel[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadChannels();
    }, []);

    const loadChannels = async () => {
        try {
            const data = await supabaseGetChannels();
            setChannels(data);
        } catch (error) {
            console.error('Failed to load channels', error);
            // Fallback empty state is better than crash, or could show retry button
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggle = async (id: string, currentStatus: boolean) => {
        const originalChannels = [...channels];
        // Optimistic update
        setChannels(prev => prev.map(c =>
            c.id === id ? { ...c, isEnabled: !currentStatus } : c
        ));

        try {
            await supabaseToggleChannel(id, !currentStatus);
            toast.success(!currentStatus ? 'Canal habilitado' : 'Canal desabilitado');
        } catch (error) {
            toast.error('Erro ao atualizar canal');
            setChannels(originalChannels); // Revert on error
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'instagram': return <Instagram className="text-pink-600" size={24} />;
            case 'email': return <Mail className="text-indigo-600" size={24} />;
            default: return <MessageCircle className="text-emerald-500" size={24} />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'connected': return 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]';
            case 'error': return 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]';
            default: return 'bg-slate-600';
        }
    };

    return (
        <div className="p-10 max-w-5xl mx-auto animate-in fade-in duration-500">
            <div className="mb-10">
                <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Configuração de Canais</h1>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">
                    Gerencie suas conexões de mensagens
                </p>
            </div>

            <div className="bg-slate-900 rounded-3xl p-8 shadow-2xl shadow-slate-900/20 text-white">
                <div className="flex items-center gap-4 mb-8 border-b border-slate-800 pb-6">
                    <div className="p-3 bg-emerald-500/10 rounded-2xl">
                        <Smartphone className="text-emerald-400" size={24} />
                    </div>
                    <div>
                        <h2 className="font-bold text-lg">Canais de Comunicação</h2>
                        <p className="text-slate-400 text-sm">Selecione o canal que você deseja enviar mensagens</p>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center h-48">
                        <Loader2 className="animate-spin text-emerald-500" size={32} />
                    </div>
                ) : channels.length === 0 ? (
                    <div className="text-center py-12 bg-slate-800/50 rounded-2xl border border-slate-800 border-dashed">
                        <p className="text-slate-400">Nenhum canal configurado.</p>
                        <p className="text-xs text-slate-500 mt-2">Entre em contato com o suporte para adicionar.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {channels.map((channel) => (
                            <div
                                key={channel.id}
                                onClick={() => handleToggle(channel.id, channel.isEnabled)}
                                className={`
                    relative p-6 rounded-2xl border-2 transition-all cursor-pointer group
                    ${channel.isEnabled
                                        ? 'bg-slate-800 border-emerald-500/50 hover:bg-slate-800/80 shadow-lg shadow-emerald-500/10'
                                        : 'bg-slate-800/50 border-slate-700 hover:border-slate-600 hover:bg-slate-800'
                                    }
                  `}
                            >
                                {/* Status Badge */}
                                <div className="absolute top-4 right-4">
                                    <div className={`w-2 h-2 rounded-full ${getStatusColor(channel.status)}`} />
                                </div>

                                <div className="flex flex-col h-full">
                                    <div className="p-3 bg-slate-900 rounded-xl w-fit mb-4">
                                        {getIcon(channel.type)}
                                    </div>

                                    <h3 className="font-bold text-lg mb-1">{channel.name}</h3>

                                    {channel.number && <p className="text-slate-400 text-xs font-mono">{channel.number}</p>}
                                    {channel.accountName && <p className="text-slate-400 text-xs">{channel.accountName}</p>}
                                    {!channel.number && !channel.accountName && <p className="text-slate-500 text-xs italic">Não configurado</p>}

                                    <div className="flex-1" />

                                    <div className="mt-6 flex items-center justify-between">
                                        <span className={`text-xs font-bold uppercase tracking-wider ${channel.isEnabled ? 'text-emerald-400' : 'text-slate-500'}`}>
                                            {channel.isEnabled ? 'Habilitado' : 'Desabilitado'}
                                        </span>

                                        <div className={`
                        w-12 h-6 rounded-full p-1 transition-all duration-300 relative
                        ${channel.isEnabled ? 'bg-emerald-500' : 'bg-slate-700'}
                      `}>
                                            <div className={`
                          w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300
                          ${channel.isEnabled ? 'translate-x-6' : 'translate-x-0'}
                        `} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="mt-8 flex items-center gap-2 text-xs text-slate-500 bg-slate-800/50 p-4 rounded-xl border border-slate-800">
                    <AlertCircle size={14} />
                    <p>Para adicionar novos números ou contas, entre em contato com o suporte técnico.</p>
                </div>
            </div>
        </div>
    );
};

export default ChannelConfig;
