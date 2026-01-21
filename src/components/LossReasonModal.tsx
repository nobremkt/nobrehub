import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, MessageSquare } from 'lucide-react';
import { cn } from '../lib/utils';
import { getLossReasons, LossReason } from '../services/api';

interface LossReasonModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (lossReasonId: string, notes?: string) => void;
    leadName: string;
}

export const LossReasonModal: React.FC<LossReasonModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    leadName,
}) => {
    const [lossReasons, setLossReasons] = useState<LossReason[]>([]);
    const [selectedReason, setSelectedReason] = useState<string>('');
    const [notes, setNotes] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            loadReasons();
        }
    }, [isOpen]);

    const loadReasons = async () => {
        setIsLoading(true);
        try {
            const reasons = await getLossReasons();
            setLossReasons(reasons);
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirm = () => {
        if (!selectedReason) return;
        onConfirm(selectedReason, notes || undefined);
        // Reset state
        setSelectedReason('');
        setNotes('');
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <header className="p-6 border-b border-slate-100 bg-gradient-to-r from-red-50 to-slate-50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                                <AlertTriangle size={20} className="text-red-600" />
                            </div>
                            <div>
                                <h2 className="font-bold text-slate-900">Marcar como Perdido</h2>
                                <p className="text-xs text-slate-500 mt-0.5">{leadName}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                        >
                            <X size={18} className="text-slate-400" />
                        </button>
                    </div>
                </header>

                {/* Content */}
                <div className="p-6 space-y-4">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full" />
                        </div>
                    ) : (
                        <>
                            <div>
                                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-2">
                                    Por que este lead foi perdido?
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {lossReasons.map((reason) => (
                                        <button
                                            key={reason.id}
                                            onClick={() => setSelectedReason(reason.id)}
                                            className={cn(
                                                'p-3 text-left rounded-xl border-2 transition-all text-sm font-medium',
                                                selectedReason === reason.id
                                                    ? 'border-red-500 bg-red-50 text-red-700'
                                                    : 'border-slate-200 hover:border-slate-300 text-slate-600'
                                            )}
                                        >
                                            {reason.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-2">
                                    <MessageSquare size={12} className="inline mr-1" />
                                    Observações (opcional)
                                </label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Adicione detalhes sobre a perda..."
                                    rows={3}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm resize-none focus:border-red-300 focus:ring-2 focus:ring-red-100 outline-none transition-all"
                                />
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 flex gap-3 justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!selectedReason}
                        className={cn(
                            'px-6 py-2.5 text-sm font-bold rounded-xl transition-all',
                            selectedReason
                                ? 'bg-red-600 text-white hover:bg-red-700'
                                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        )}
                    >
                        Confirmar Perda
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LossReasonModal;
