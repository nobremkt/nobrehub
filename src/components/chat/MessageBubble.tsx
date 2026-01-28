import React from 'react';
import { Check, CheckCheck, Clock, AlertCircle, Play, Pause, FileText, Image as ImageIcon } from 'lucide-react';

interface MessageBubbleProps {
    id: string;
    direction: 'in' | 'out';
    text?: string;
    mediaUrl?: string;
    type: 'text' | 'image' | 'audio' | 'document' | 'template' | 'hsm';
    status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
    createdAt: string;
    templateName?: string;
    sentByUser?: { id: string; name: string };
}

// Format time helper
const formatTime = (dateString: string) => {
    try {
        // Ensure UTC interpretation if missing timezone
        const dateStr = !dateString.endsWith('Z') && !dateString.includes('+')
            ? `${dateString}Z`
            : dateString;

        return new Date(dateStr).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch {
        return '';
    }
};

// Message status icon component
const StatusIcon: React.FC<{ status: string; direction: 'in' | 'out' }> = ({ status, direction }) => {
    if (direction === 'in') return null; // Incoming messages don't show status

    const baseClass = "ml-1 inline-flex flex-shrink-0";
    // Use white tones on outgoing (rose) bubbles for contrast
    const isOut = direction === 'out';

    switch (status) {
        case 'pending':
            return <Clock size={12} className={`${baseClass} ${isOut ? 'text-white/70' : 'text-slate-400'}`} />;
        case 'sent':
            return <Check size={14} className={`${baseClass} ${isOut ? 'text-white/80' : 'text-slate-400'}`} />;
        case 'delivered':
            return <CheckCheck size={14} className={`${baseClass} ${isOut ? 'text-white/80' : 'text-slate-400'}`} />;
        case 'read':
            return <CheckCheck size={14} className={`${baseClass} ${isOut ? 'text-cyan-200' : 'text-blue-500'}`} />;
        case 'failed':
            return <AlertCircle size={14} className={`${baseClass} text-red-400`} />;
        default:
            return <Check size={14} className={`${baseClass} ${isOut ? 'text-white/80' : 'text-slate-400'}`} />;
    }
};

// Audio player component with custom styling
const AudioPlayer: React.FC<{ src: string; direction: 'in' | 'out' }> = ({ src, direction }) => {
    const [isPlaying, setIsPlaying] = React.useState(false);
    const [duration, setDuration] = React.useState(0);
    const [currentTime, setCurrentTime] = React.useState(0);
    const audioRef = React.useRef<HTMLAudioElement>(null);

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
        }
    };

    const handleLoadedMetadata = () => {
        if (audioRef.current) {
            setDuration(audioRef.current.duration);
        }
    };

    const handleEnded = () => {
        setIsPlaying(false);
        setCurrentTime(0);
    };

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
    const isOut = direction === 'out';

    return (
        <div className="flex items-center gap-3 min-w-[200px]">
            <audio
                ref={audioRef}
                src={src}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={handleEnded}
                className="hidden"
            />

            {/* Play/Pause Button */}
            <button
                onClick={togglePlay}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors flex-shrink-0 ${isOut
                    ? 'bg-white/20 hover:bg-white/30 text-white'
                    : 'bg-slate-200 hover:bg-slate-300 text-slate-600'
                    }`}
            >
                {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
            </button>

            {/* Waveform / Progress */}
            <div className="flex-1 flex flex-col gap-1">
                <div className={`h-1.5 rounded-full overflow-hidden ${isOut ? 'bg-white/20' : 'bg-slate-200'}`}>
                    <div
                        className={`h-full transition-all ${isOut ? 'bg-white' : 'bg-slate-500'}`}
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <span className={`text-[10px] ${isOut ? 'text-white/70' : 'text-slate-400'}`}>
                    {isPlaying ? formatDuration(currentTime) : formatDuration(duration)}
                </span>
            </div>
        </div>
    );
};

/**
 * MessageBubble - WhatsApp-style message bubble with status indicators
 */
const MessageBubble: React.FC<MessageBubbleProps> = ({
    direction,
    text,
    mediaUrl,
    type,
    status,
    createdAt,
    templateName,
}) => {
    const isOut = direction === 'out';

    // Bubble container classes
    const bubbleClasses = isOut
        ? 'bg-gradient-to-br from-rose-500 to-rose-600 text-white rounded-2xl rounded-br-md shadow-lg shadow-rose-500/20'
        : 'bg-white !text-slate-800 rounded-2xl rounded-bl-md shadow-md border border-slate-100';

    // Template indicator
    const isTemplate = type === 'template' || type === 'hsm';

    return (
        <div className={`flex ${isOut ? 'justify-end' : 'justify-start'} animate-fade-in-up`}>
            <div className={`max-w-[70%] px-4 py-2.5 ${bubbleClasses}`}>
                {/* Template Badge */}
                {isTemplate && templateName && (
                    <div className={`flex items-center gap-1.5 mb-2 pb-2 border-b ${isOut ? 'border-white/20' : 'border-slate-100'}`}>
                        <FileText size={12} className={isOut ? 'text-white/70' : 'text-slate-400'} />
                        <span className={`text-[10px] font-medium ${isOut ? 'text-white/70' : 'text-slate-400'}`}>
                            Template: {templateName}
                        </span>
                    </div>
                )}

                {/* Image */}
                {type === 'image' && mediaUrl && (
                    <div className="mb-2 -mx-1 -mt-1">
                        <img
                            src={mediaUrl}
                            alt="Imagem"
                            className="w-full rounded-xl max-h-64 object-cover cursor-pointer hover:opacity-95 transition-opacity"
                            onClick={() => window.open(mediaUrl, '_blank')}
                        />
                    </div>
                )}

                {/* Audio */}
                {type === 'audio' && mediaUrl && (
                    <AudioPlayer src={mediaUrl} direction={direction} />
                )}

                {/* Document */}
                {type === 'document' && mediaUrl && (
                    <a
                        href={mediaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${isOut ? 'bg-white/10 hover:bg-white/20' : 'bg-slate-50 hover:bg-slate-100'
                            }`}
                    >
                        <FileText size={20} className={isOut ? 'text-white/80' : 'text-slate-500'} />
                        <span className={`text-sm ${isOut ? 'text-white/90' : 'text-slate-600'}`}>
                            Documento anexo
                        </span>
                    </a>
                )}

                {/* Text */}
                {text && (
                    <p className={`text-sm whitespace-pre-wrap leading-relaxed ${isOut ? 'text-white' : '!text-slate-800'}`}>{text}</p>
                )}

                {/* Footer: Time + Status */}
                <div className={`flex items-center justify-end gap-1 mt-1.5 ${isOut ? 'text-white/60' : 'text-slate-400'}`}>
                    <span className="text-[10px]">{formatTime(createdAt)}</span>
                    <StatusIcon status={status} direction={direction} />
                </div>
            </div>
        </div>
    );
};

export default MessageBubble;
