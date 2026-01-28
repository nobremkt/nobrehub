import { useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';

interface UseAudioRecordingOptions {
    onAudioReady?: (blob: Blob, mimeType: string) => void;
}

interface UseAudioRecordingReturn {
    isRecording: boolean;
    recordingDuration: number;
    startRecording: () => Promise<void>;
    stopRecording: () => void;
    sendAudio: (phoneNumber: string, leadId: string, supabaseUrl: string) => Promise<void>;
    cancelRecording: () => void;
}

export function useAudioRecording(options?: UseAudioRecordingOptions): UseAudioRecordingReturn {
    const [isRecording, setIsRecording] = useState(false);
    const [recordingDuration, setRecordingDuration] = useState(0);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const audioMimeTypeRef = useRef<string>('audio/webm');
    const streamRef = useRef<MediaStream | null>(null);

    const startRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            // WhatsApp prefers OGG/Opus
            let mimeType = 'audio/webm;codecs=opus';
            if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
                mimeType = 'audio/ogg;codecs=opus';
            } else if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
                mimeType = 'audio/webm;codecs=opus';
            } else if (MediaRecorder.isTypeSupported('audio/webm')) {
                mimeType = 'audio/webm';
            }

            audioMimeTypeRef.current = mimeType;

            const mediaRecorder = new MediaRecorder(stream, { mimeType });
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start(100);
            setIsRecording(true);
            setRecordingDuration(0);

            recordingIntervalRef.current = setInterval(() => {
                setRecordingDuration(prev => prev + 1);
            }, 1000);

            toast.success('Gravando áudio...');
        } catch (error: any) {
            if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
                toast.error('Microfone não encontrado.');
            } else if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                toast.error('Permissão de microfone negada.');
            } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
                toast.error('Microfone em uso por outro app.');
            } else {
                toast.error('Erro ao acessar microfone.');
            }
        }
    }, []);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (recordingIntervalRef.current) {
                clearInterval(recordingIntervalRef.current);
                recordingIntervalRef.current = null;
            }
        }
    }, [isRecording]);

    const cancelRecording = useCallback(() => {
        stopRecording();
        audioChunksRef.current = [];
        setRecordingDuration(0);
    }, [stopRecording]);

    const sendAudio = useCallback(async (phoneNumber: string, leadId: string, supabaseUrl: string) => {
        if (audioChunksRef.current.length === 0) return;

        stopRecording();
        await new Promise(resolve => setTimeout(resolve, 200));

        const mimeType = audioMimeTypeRef.current;
        const ext = mimeType.includes('ogg') ? 'ogg' : 'webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const audioFile = new File([audioBlob], `audio_${Date.now()}.${ext}`, { type: mimeType });

        options?.onAudioReady?.(audioBlob, mimeType);

        const toastId = toast.loading('Enviando áudio...');

        const formData = new FormData();
        formData.append('file', audioFile);
        formData.append('to', phoneNumber);
        formData.append('type', 'audio');
        formData.append('leadId', leadId);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${supabaseUrl}/functions/v1/whatsapp-api/upload`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Falha no envio');
            }

            toast.dismiss(toastId);
            toast.success('Áudio enviado!');
            audioChunksRef.current = [];
            setRecordingDuration(0);
        } catch (error: any) {
            toast.dismiss(toastId);
            toast.error(`Erro: ${error.message}`);
            throw error;
        }
    }, [options, stopRecording]);

    return {
        isRecording,
        recordingDuration,
        startRecording,
        stopRecording,
        sendAudio,
        cancelRecording
    };
}
