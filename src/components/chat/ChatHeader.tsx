import React, { useState, useEffect } from 'react';
import {
    User, Phone, Clock, Pause, Play, X,
    ArrowRightLeft, MoreVertical, UserPlus
} from 'lucide-react';

interface ChatHeaderProps {
    leadName: string;
    leadPhone: string;
    channel?: string;
    lastMessageAt: string | null;
    conversationStatus: 'queued' | 'active' | 'on_hold' | 'closed';
    assignedAgent?: { id: string; name: string } | null;
    isConnected: boolean;
    onHold: () => void;
    onResume: () => void;
    onClose: () => void;
    onTransfer: () => void;
    onBack?: () => void;
    embedded?: boolean;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
    leadName,
    leadPhone,
    channel = 'WhatsApp',
    lastMessageAt,
    conversationStatus,
    assignedAgent,
    isConnected,
    onHold,
    onResume,
    onClose,
    onTransfer,
    onBack,
    embedded = false
}) => {
    const [timeRemaining, setTimeRemaining] = useState<string>('');
    const [isWithinWindow, setIsWithinWindow] = useState(true);

    // Calculate 24h window remaining time
    useEffect(() => {
        if (!lastMessageAt) {
            setTimeRemaining('');
            setIsWithinWindow(false);
            return;
        }

        const calculateRemaining = () => {
            const lastMsg = new Date(lastMessageAt).getTime();
            const now = Date.now();
            const windowEnd = lastMsg + (24 * 60 * 60 * 1000); // 24 hours
            const remaining = windowEnd - now;

            if (remaining <= 0) {
                setTimeRemaining('Expirado');
                setIsWithinWindow(false);
                return;
            }

            setIsWithinWindow(true);
            const hours = Math.floor(remaining / (1000 * 60 * 60));
            const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
            setTimeRemaining(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`);
        };

        calculateRemaining();
        const interval = setInterval(calculateRemaining, 60000); // Update every minute

        return () => clearInterval(interval);
    }, [lastMessageAt]);

    const isOnHold = conversationStatus === 'on_hold';

    return (
        <header className="bg-white border-b border-slate-100 px-6 py-4">
            <div className="flex items-center gap-4">
                {/* Back button if not embedded */}
                {!embedded && onBack && (
                    <button
                        onClick={onBack}
                        className="p-2.5 hover:bg-slate-100 rounded-xl transition-colors"
                    >
                        <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                )}

                {/* Avatar */}
                <div className="relative">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-100 to-violet-200 flex items-center justify-center">
                        <User size={20} className="text-violet-600" />
                    </div>
                    {/* Connection Status */}
                    <div
                        className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${isConnected ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'
                            }`}
                        title={isConnected ? 'Conectado' : 'Desconectado'}
                    />
                </div>

                {/* Lead Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h2 className="font-bold text-slate-900 truncate">{leadName}</h2>
                        {isOnHold && (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                                Em espera
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                        <div className="flex items-center gap-1">
                            <Phone size={10} />
                            <span>{leadPhone}</span>
                        </div>
                        <span>•</span>
                        <span>{channel}</span>
                        {assignedAgent && (
                            <>
                                <span>•</span>
                                <div className="flex items-center gap-1">
                                    <UserPlus size={10} />
                                    <span>{assignedAgent.name}</span>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* 24h Window Timer */}
                {timeRemaining && (
                    <div
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium ${isWithinWindow
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-rose-50 text-rose-700'
                            }`}
                        title="Tempo restante para enviar mensagens livres (janela 24h WhatsApp)"
                    >
                        <Clock size={16} />
                        <span>{timeRemaining}</span>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                    {/* Hold/Resume Button */}
                    {isOnHold ? (
                        <button
                            onClick={onResume}
                            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-100 hover:bg-emerald-200 rounded-xl text-sm font-medium text-emerald-700 transition-colors"
                            title="Retomar atendimento"
                        >
                            <Play size={16} />
                            <span className="hidden sm:inline">Retomar</span>
                        </button>
                    ) : (
                        <button
                            onClick={onHold}
                            className="flex items-center gap-2 px-4 py-2.5 bg-amber-100 hover:bg-amber-200 rounded-xl text-sm font-medium text-amber-700 transition-colors"
                            title="Colocar em espera"
                        >
                            <Pause size={16} />
                            <span className="hidden sm:inline">Espera</span>
                        </button>
                    )}

                    {/* Transfer Button */}
                    <button
                        onClick={onTransfer}
                        className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-medium text-slate-700 transition-colors"
                        title="Transferir conversa"
                    >
                        <ArrowRightLeft size={16} />
                        <span className="hidden sm:inline">Transferir</span>
                    </button>

                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="flex items-center gap-2 px-4 py-2.5 bg-rose-100 hover:bg-rose-200 rounded-xl text-sm font-medium text-rose-700 transition-colors"
                        title="Encerrar atendimento"
                    >
                        <X size={16} />
                        <span className="hidden sm:inline">Encerrar</span>
                    </button>
                </div>
            </div>
        </header>
    );
};

export default ChatHeader;
