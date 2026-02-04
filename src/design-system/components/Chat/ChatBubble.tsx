import { FileText, Check, Clock, Eye } from 'lucide-react';
import styles from './ChatBubble.module.css';
import { AudioPlayer } from './AudioPlayer';
import { Avatar } from '@/design-system';
import { useState } from 'react';

export interface ChatBubbleProps {
    content: string; // URL for media/file
    type: 'text' | 'image' | 'video' | 'file' | 'audio' | 'system';
    isMine: boolean;
    senderName?: string;
    showSender?: boolean;
    senderAvatar?: string | null; // New prop
    time: string;
    status?: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';

    // File/Media Metadata
    fileName?: string;
    fileSize?: string;
    viewOnce?: boolean; // View once indicator

    // Handlers
    onImageClick?: (url: string) => void;
    onFileClick?: (url: string) => void;
}

export const ChatBubble = ({
    content,
    type,
    isMine,
    senderName,
    showSender = false,
    senderAvatar,
    time,
    status,
    fileName = "Documento",
    fileSize,
    viewOnce,
    onImageClick,
    onFileClick
}: ChatBubbleProps) => {
    const [imageLoaded, setImageLoaded] = useState(false);

    const handleFileOpen = () => {
        if (onFileClick) {
            onFileClick(content);
        } else {
            window.open(content, '_blank');
        }
    };

    return (
        <div className={`${styles.bubbleRow} ${isMine ? styles.bubbleRowOut : styles.bubbleRowIn}`}>

            {/* Sender Avatar (Only for incoming messages in groups) */}
            {!isMine && showSender && (
                <div className={styles.avatarWrapper}>
                    <Avatar
                        src={senderAvatar}
                        alt={senderName}
                        size="sm"
                        fallback={senderName?.substring(0, 2).toUpperCase()}
                    />
                </div>
            )}

            <div className={`${styles.bubble} ${isMine ? styles.bubbleOut : styles.bubbleIn}`}>
                {!isMine && showSender && senderName && (
                    <span className={styles.messageSender}>{senderName}</span>
                )}

                {/* Content Rendering based on Type */}
                {type === 'image' ? (
                    <div className={styles.mediaWrapper}>
                        {!imageLoaded && (
                            <div className={styles.imagePlaceholder}>
                                <div className={styles.imageLoader} />
                            </div>
                        )}
                        <img
                            src={content}
                            alt="Imagem"
                            className={`${styles.mediaImage} ${imageLoaded ? styles.imageLoaded : styles.imageLoading}`}
                            loading="lazy"
                            onLoad={() => setImageLoaded(true)}
                            onClick={() => onImageClick && onImageClick(content)}
                        />
                        {viewOnce && (
                            <div className={styles.viewOnceBadge}>
                                <Eye size={12} />
                                <span>1</span>
                            </div>
                        )}
                    </div>
                ) : type === 'video' ? (
                    <div className={styles.mediaWrapper}>
                        <video
                            src={content}
                            controls
                            className={styles.mediaImage}
                            style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '12px' }}
                            preload="metadata"
                        />
                        {viewOnce && (
                            <div className={styles.viewOnceBadge}>
                                <Eye size={12} />
                                <span>1</span>
                            </div>
                        )}
                    </div>
                ) : type === 'audio' ? (
                    <div className={styles.mediaAudio}>
                        <AudioPlayer src={content} isMine={isMine} />
                    </div>
                ) : type === 'file' ? (
                    <div className={styles.fileCard}>
                        <div className={styles.fileHeader}>
                            <div className={styles.fileIconWrapper}>
                                <FileText size={24} />
                            </div>
                            <div className={styles.fileDetails}>
                                <span className={styles.fileName}>{fileName}</span>
                                <span className={styles.fileMeta}>
                                    {content.split('.').pop()?.toUpperCase() || 'FILE'}
                                    {fileSize && ` • ${fileSize}`}
                                </span>
                            </div>
                        </div>
                        <div className={styles.fileDivider} />
                        <div className={styles.fileActions}>
                            <button className={styles.fileActionBtn} onClick={handleFileOpen}>
                                Abrir
                            </button>
                            <a
                                href={content}
                                download={fileName}
                                className={styles.fileActionBtn}
                                target="_blank"
                                rel="noreferrer"
                            >
                                Salvar como...
                            </a>
                        </div>
                    </div>
                ) : (
                    <div style={{ whiteSpace: 'pre-wrap' }}>{content}</div>
                )}

                <div className={styles.bubbleMeta}>
                    <span>{time}</span>
                    {isMine && status && (
                        <span className={styles.statusIcon}>
                            {status === 'pending' && <Clock size={14} className={styles.statusPending} />}
                            {status === 'sent' && <Check size={14} className={styles.statusSent} />}
                            {status === 'delivered' && (
                                <span className={styles.doubleCheck}>
                                    <Check size={14} />
                                    <Check size={14} style={{ marginLeft: '-8px' }} />
                                </span>
                            )}
                            {status === 'read' && (
                                <span className={`${styles.doubleCheck} ${styles.statusRead}`}>
                                    <Check size={14} />
                                    <Check size={14} style={{ marginLeft: '-8px' }} />
                                </span>
                            )}
                            {status === 'failed' && <span className={styles.statusFailed}>!</span>}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};
