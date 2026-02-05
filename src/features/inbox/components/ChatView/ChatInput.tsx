import React, { useState, useRef, useEffect } from 'react';
import { ChatInput as DSChatInput, AttachmentOption } from '@/design-system/components/Chat';
import { Image as ImageIcon, Video, FileText, ClipboardList, Calendar } from 'lucide-react';
import { ScheduleMessagePopup } from './ScheduleMessagePopup';
import { MediaPreviewModal } from './MediaPreviewModal';

interface ChatInputProps {
    onSend: (text: string) => void;
    onSendMedia?: (file: File, type: 'image' | 'video' | 'audio' | 'document', caption?: string, viewOnce?: boolean) => void;
    onOpenTemplate?: () => void;
    onScheduleMessage?: (text: string, scheduledFor: Date) => void;
    disabled?: boolean;
    sessionExpired?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, onSendMedia, onOpenTemplate, onScheduleMessage, disabled, sessionExpired }) => {
    const [message, setMessage] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const [showSchedulePopup, setShowSchedulePopup] = useState(false);

    // Media Preview State
    const [showMediaPreview, setShowMediaPreview] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [selectedFileType, setSelectedFileType] = useState<'image' | 'video' | 'document'>('image');

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const shouldSendRef = useRef(false);

    // File Input Refs
    const fileInputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.stop();
                mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
            }
        };
    }, []);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];
            shouldSendRef.current = false;

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const streamTracks = mediaRecorder.stream.getTracks();
                streamTracks.forEach(track => track.stop());

                if (shouldSendRef.current) {
                    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                    const audioFile = new File([audioBlob], "audio_message.webm", { type: 'audio/webm' });

                    if (onSendMedia) {
                        onSendMedia(audioFile, 'audio');
                    }
                }
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingDuration(0);

            if (timerRef.current) clearInterval(timerRef.current);
            timerRef.current = setInterval(() => {
                setRecordingDuration(prev => prev + 1);
            }, 1000);

        } catch (err) {
            console.error("Error accessing microphone:", err);
            alert("Não foi possível acessar o microfone. Verifique as permissões do navegador.");
        }
    };

    const stopRecording = (send: boolean) => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            shouldSendRef.current = send;
            mediaRecorderRef.current.stop();
        }

        setIsRecording(false);
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    };

    const handleSendText = () => {
        if (!message.trim() || disabled) return;
        onSend(message);
        setMessage('');
    };

    const handleSchedule = (scheduledFor: Date) => {
        if (!message.trim() || !onScheduleMessage) return;
        onScheduleMessage(message, scheduledFor);
        setMessage('');
        setShowSchedulePopup(false);
    };

    const handleOpenSchedule = () => {
        if (!message.trim()) {
            alert('Digite uma mensagem antes de agendar');
            return;
        }
        setShowSchedulePopup(true);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video' | 'document') => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Open preview modal instead of sending directly
        setSelectedFile(file);
        setSelectedFileType(type);
        setShowMediaPreview(true);
        e.target.value = '';
    };

    const handleSendMedia = (file: File, caption: string, viewOnce?: boolean) => {
        if (!onSendMedia) return;
        onSendMedia(file, selectedFileType, caption || undefined, viewOnce);
        setSelectedFile(null);
        setShowMediaPreview(false);
    };

    const attachmentOptions: AttachmentOption[] = [
        {
            id: 'template',
            label: 'Template',
            icon: <ClipboardList size={18} />,
            onClick: () => onOpenTemplate?.()
        },
        {
            id: 'schedule',
            label: 'Agendar',
            icon: <Calendar size={18} />,
            onClick: handleOpenSchedule
        },
        {
            id: 'image',
            label: 'Imagem',
            icon: <ImageIcon size={18} />,
            onClick: () => imageInputRef.current?.click()
        },
        {
            id: 'video',
            label: 'Vídeo',
            icon: <Video size={18} />,
            onClick: () => videoInputRef.current?.click()
        },
        {
            id: 'document',
            label: 'Documento',
            icon: <FileText size={18} />,
            onClick: () => fileInputRef.current?.click()
        }
    ];

    return (
        <>
            <input
                type="file"
                ref={imageInputRef}
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => handleFileChange(e, 'image')}
            />
            <input
                type="file"
                ref={videoInputRef}
                accept="video/*"
                style={{ display: 'none' }}
                onChange={(e) => handleFileChange(e, 'video')}
            />
            <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={(e) => handleFileChange(e, 'document')}
            />
            <DSChatInput
                value={message}
                onChange={setMessage}
                onSend={handleSendText}
                isRecording={isRecording}
                recordingTimeFormatted={formatTime(recordingDuration)}
                onStartRecording={startRecording}
                onStopRecording={() => stopRecording(true)}
                onCancelRecording={() => stopRecording(false)}
                disabled={disabled}
                placeholder={sessionExpired ? "Sessão expirada. Envie um template para continuar." : "Digite sua mensagem..."}
                attachmentOptions={attachmentOptions}
            />

            <ScheduleMessagePopup
                isOpen={showSchedulePopup}
                onClose={() => setShowSchedulePopup(false)}
                onSchedule={handleSchedule}
                messagePreview={message}
            />

            <MediaPreviewModal
                isOpen={showMediaPreview}
                onClose={() => {
                    setShowMediaPreview(false);
                    setSelectedFile(null);
                }}
                onSend={handleSendMedia}
                file={selectedFile}
                fileType={selectedFileType}
            />
        </>
    );
};
