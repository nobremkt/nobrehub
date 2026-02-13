import { useState, useRef, useEffect } from 'react';
import { toast } from 'react-toastify';
import { ChatInput as DSChatInput, AttachmentOption } from '@/design-system/components/Chat';
import { Image as ImageIcon, FileText } from 'lucide-react';

interface ChatInputProps {
    onSend: (message: string | Blob | File, type?: 'text' | 'image' | 'file' | 'audio') => void;
    disabled?: boolean;
    placeholder?: string;
    onTyping?: () => void;
    onStopTyping?: () => void;
}

export const ChatInput = ({ onSend, disabled = false, placeholder = "Digite sua mensagem...", onTyping, onStopTyping }: ChatInputProps) => {
    const [message, setMessage] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [recordingDuration, setRecordingDuration] = useState(0);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const shouldSendRef = useRef(false);

    // File refs
    const fileInputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);

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

    const [pendingFile, setPendingFile] = useState<File | null>(null);
    const [pendingFileType, setPendingFileType] = useState<'image' | 'file' | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    // Clean up preview URL
    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

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
                    // Create file with a consistent name pattern, store will rename if needed
                    const audioFile = new File([audioBlob], "audio_message.webm", { type: 'audio/webm' });
                    onSend(audioFile, 'audio');
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
            toast.error('Não foi possível acessar o microfone. Verifique as permissões.');
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

    const handleSendText = async () => {
        if ((!message.trim() && !pendingFile) || disabled) return;

        // Send file if exists
        if (pendingFile && pendingFileType) {
            onSend(pendingFile, pendingFileType);
            setPendingFile(null);
            setPendingFileType(null);
            setPreviewUrl(null);
        }

        // Send text if exists
        if (message.trim()) {
            onSend(message, 'text');
            setMessage('');
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'file') => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setPendingFile(file);
            setPendingFileType(type);

            // Create preview for images
            if (type === 'image') {
                const url = URL.createObjectURL(file);
                setPreviewUrl(url);
            } else {
                setPreviewUrl(null);
            }

            e.target.value = ''; // Reset input so same file can be selected again if needed
        }
    };

    const clearAttachment = () => {
        setPendingFile(null);
        setPendingFileType(null);
        setPreviewUrl(null);
    };

    const attachmentOptions: AttachmentOption[] = [
        {
            id: 'image',
            label: 'Imagem',
            icon: <ImageIcon size={18} />,
            onClick: () => imageInputRef.current?.click()
        },
        {
            id: 'file',
            label: 'Documento',
            icon: <FileText size={18} />,
            onClick: () => fileInputRef.current?.click()
        }
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
            {/* Attachment Preview */}
            {pendingFile && (
                <div style={{
                    padding: '12px 16px',
                    borderTop: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-bg-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    animation: 'slideUp 0.2s ease-out'
                }}>
                    <div style={{ position: 'relative' }}>
                        {pendingFileType === 'image' && previewUrl ? (
                            <img
                                src={previewUrl}
                                alt="Preview"
                                style={{
                                    width: '60px',
                                    height: '60px',
                                    objectFit: 'cover',
                                    borderRadius: '8px',
                                    border: '1px solid var(--color-border)'
                                }}
                            />
                        ) : (
                            <div style={{
                                width: '60px',
                                height: '60px',
                                borderRadius: '8px',
                                backgroundColor: 'var(--color-surface)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '1px solid var(--color-border)'
                            }}>
                                <FileText size={24} color="var(--color-text-secondary)" />
                            </div>
                        )}
                        <button
                            onClick={clearAttachment}
                            style={{
                                position: 'absolute',
                                top: '-6px',
                                right: '-6px',
                                width: '20px',
                                height: '20px',
                                borderRadius: '50%',
                                backgroundColor: 'var(--color-danger-500)',
                                color: 'white',
                                border: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '12px',
                                cursor: 'pointer',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                            }}
                        >
                            ✕
                        </button>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                            fontSize: '14px',
                            fontWeight: 500,
                            color: 'var(--color-text-primary)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                        }}>
                            {pendingFile.name}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                            {(pendingFile.size / 1024).toFixed(1)} KB • {pendingFileType === 'image' ? 'Imagem' : 'Documento'}
                        </div>
                    </div>
                </div>
            )}

            <input
                type="file"
                ref={imageInputRef}
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => handleFileChange(e, 'image')}
            />
            <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={(e) => handleFileChange(e, 'file')}
            />
            <DSChatInput
                value={message}
                onChange={(val: string) => {
                    setMessage(val);
                    if (val.length > 0) onTyping?.();
                }}
                onSend={() => {
                    handleSendText();
                    onStopTyping?.();
                }}
                isRecording={isRecording}
                recordingTimeFormatted={formatTime(recordingDuration)}
                onStartRecording={startRecording}
                onStopRecording={() => stopRecording(true)}
                onCancelRecording={() => stopRecording(false)}
                disabled={disabled}
                placeholder={pendingFile ? "Adicione uma legenda..." : placeholder}
                attachmentOptions={attachmentOptions}
            />
        </div>
    );
};
