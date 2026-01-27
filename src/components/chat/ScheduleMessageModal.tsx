import React, { useState } from 'react';
import { Calendar, Clock, X, Send, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabaseCreateScheduledMessage } from '../../services/supabaseApi';

interface ScheduleMessageModalProps {
    isOpen: boolean;
    onClose: () => void;
    conversationId: string;
    leadName: string;
}

const ScheduleMessageModal: React.FC<ScheduleMessageModalProps> = ({
    isOpen,
    onClose,
    conversationId,
    leadName
}) => {
    const [content, setContent] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Get min date (today) for date picker
    const today = new Date().toISOString().split('T')[0];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!content.trim() || !date || !time) {
            toast.error('Preencha todos os campos');
            return;
        }

        // Combine date and time
        const scheduledFor = new Date(`${date}T${time}`);

        if (scheduledFor <= new Date()) {
            toast.error('A data/hora deve ser no futuro');
            return;
        }

        setIsSubmitting(true);

        try {
            await supabaseCreateScheduledMessage({
                conversationId,
                content: content.trim(),
                scheduledFor: scheduledFor.toISOString()
            });
            toast.success('Mensagem agendada!');
            setContent('');
            setDate('');
            setTime('');
            onClose();
        } catch (error) {
            toast.error('Erro ao agendar mensagem');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-lg text-slate-900">Agendar Mensagem</h3>
                        <p className="text-sm text-slate-500">Para: {leadName}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    {/* Message Content */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Mensagem
                        </label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Digite a mensagem que será enviada..."
                            rows={4}
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                        />
                        <p className="text-xs text-slate-400 mt-1">
                            {content.length}/1000 caracteres
                        </p>
                    </div>

                    {/* Date & Time */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                <Calendar size={14} className="inline mr-1" />
                                Data
                            </label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                min={today}
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                <Clock size={14} className="inline mr-1" />
                                Horário
                            </label>
                            <input
                                type="time"
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                            />
                        </div>
                    </div>

                    {/* Warning */}
                    <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-xl">
                        <AlertCircle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-700">
                            A mensagem será enviada automaticamente no horário agendado.
                            Certifique-se de que a janela de 24h do WhatsApp estará ativa.
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 px-4 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || !content.trim() || !date || !time}
                            className="flex-1 py-3 px-4 bg-violet-600 text-white rounded-xl font-medium hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            <Send size={16} />
                            {isSubmitting ? 'Agendando...' : 'Agendar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ScheduleMessageModal;
