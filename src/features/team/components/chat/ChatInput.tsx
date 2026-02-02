import { useState, useRef, useEffect } from 'react';
import { ChatInput as DSChatInput, AttachmentOption } from '@/design-system/components/Chat';
import { Image as ImageIcon, FileText } from 'lucide-react';

interface ChatInputProps {
    onSend: (message: string | Blob | File, type?: 'text' | 'image' | 'file' | 'audio') => void;
    disabled?: boolean;
    placeholder?: string;
}

export const ChatInput = ({ onSend, disabled = false, placeholder = "Digite sua mensagem..." }: ChatInputProps) => {
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
        onSend(message, 'text');
        setMessage('');
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'file') => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            onSend(file, type);
            e.target.value = ''; // Reset input
        }
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
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={(e) => handleFileChange(e, 'file')}
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
                placeholder={placeholder}
                attachmentOptions={attachmentOptions}
            />
        </>
    );
};
