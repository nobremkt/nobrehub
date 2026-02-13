import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { Calendar, Clock, X, Smile, Paperclip, Mic, Camera, Folder, FileText, Plus } from 'lucide-react';
import { Button } from '@/design-system';
import styles from './ScheduleMessagePopup.module.css';

interface ScheduleMessagePopupProps {
    isOpen: boolean;
    onClose: () => void;
    onSchedule: (scheduledFor: Date) => void;
    messagePreview?: string;
}

export const ScheduleMessagePopup: React.FC<ScheduleMessagePopupProps> = ({
    isOpen,
    onClose,
    onSchedule,
    messagePreview
}) => {
    const [selectedDate, setSelectedDate] = useState<string>(() => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
    });
    const [selectedTime, setSelectedTime] = useState<string>('09:00');

    if (!isOpen) return null;

    const handleSchedule = () => {
        const [year, month, day] = selectedDate.split('-').map(Number);
        const [hours, minutes] = selectedTime.split(':').map(Number);

        const scheduledDate = new Date(year, month - 1, day, hours, minutes);

        if (scheduledDate <= new Date()) {
            toast.warn('Selecione uma data/hora futura');
            return;
        }

        onSchedule(scheduledDate);
        onClose();
    };

    const quickOptions = [
        { label: 'Em 1 hora', getDate: () => { const d = new Date(); d.setHours(d.getHours() + 1); return d; } },
        { label: 'Amanhã 9h', getDate: () => { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(9, 0, 0, 0); return d; } },
        { label: 'Amanhã 14h', getDate: () => { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(14, 0, 0, 0); return d; } },
        {
            label: 'Segunda 9h', getDate: () => {
                const d = new Date();
                const daysUntilMonday = (8 - d.getDay()) % 7 || 7;
                d.setDate(d.getDate() + daysUntilMonday);
                d.setHours(9, 0, 0, 0);
                return d;
            }
        }
    ];

    // Media toolbar icons matching CLINT_CRM_ANALISE.md spec
    const mediaIcons = [
        { icon: <Smile size={16} />, title: 'Emoji' },
        { icon: <Paperclip size={16} />, title: 'Anexar' },
        { icon: <Mic size={16} />, title: 'Áudio' },
        { icon: <Camera size={16} />, title: 'Imagem' },
        { icon: <Folder size={16} />, title: 'Arquivo' },
        { icon: <FileText size={16} />, title: 'Notas' },
    ];

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.popup} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <div className={styles.headerTitle}>
                        <Calendar size={18} />
                        <span>Agendamento de mensagem</span>
                    </div>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                {/* Message Preview */}
                {messagePreview && (
                    <div className={styles.preview}>
                        <div className={styles.previewBox}>
                            <span className={styles.previewText}>{messagePreview}</span>
                            <span className={styles.previewT}>T</span>
                        </div>
                    </div>
                )}

                {/* Media Toolbar - matching CLINT spec */}
                <div className={styles.mediaBar}>
                    {mediaIcons.map((item, idx) => (
                        <button
                            key={idx}
                            className={styles.mediaIcon}
                            title={item.title}
                            type="button"
                        >
                            {item.icon}
                        </button>
                    ))}
                    <button className={styles.addBtn} title="Adicionar" type="button">
                        <Plus size={14} />
                        <span>Add</span>
                    </button>
                </div>

                {/* Quick Options */}
                <div className={styles.quickOptions}>
                    {quickOptions.map((opt, idx) => (
                        <button
                            key={idx}
                            className={styles.quickOption}
                            onClick={() => onSchedule(opt.getDate())}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>

                <div className={styles.divider}>
                    <span>ou escolha manualmente</span>
                </div>

                {/* Date/Time Inputs */}
                <div className={styles.dateTimeRow}>
                    <div className={styles.inputGroup}>
                        <label>
                            <Calendar size={14} />
                            Data
                        </label>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            className={styles.dateInput}
                        />
                    </div>
                    <div className={styles.inputGroup}>
                        <label>
                            <Clock size={14} />
                            Hora
                        </label>
                        <input
                            type="time"
                            value={selectedTime}
                            onChange={(e) => setSelectedTime(e.target.value)}
                            className={styles.timeInput}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className={styles.footer}>
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button variant="primary" size="sm" onClick={handleSchedule}>
                        Criar Agendamento
                    </Button>
                </div>
            </div>
        </div>
    );
};
