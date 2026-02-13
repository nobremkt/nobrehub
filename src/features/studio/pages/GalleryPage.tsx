/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - PAGE: GALERIA DO ESTÚDIO
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Exibe todas as imagens geradas pelo Estúdio de Criação em uma grid com
 * lazy loading, skeletons e lightbox detalhado.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { useState, useEffect, useCallback } from 'react';
import { Avatar, Skeleton } from '@/design-system';
import { GalleryHorizontalEnd, X, Download, ImageIcon } from 'lucide-react';
import { getGalleryImages, type GalleryImage } from '../services/galleryService';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/config';
import styles from './GalleryPage.module.css';

/* ═══════════════════════════════════════════════════════════════════════════════
 * HELPERS
 * ═══════════════════════════════════════════════════════════════════════════════ */

function formatDate(ts: number): string {
    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(ts));
}

function formatRelative(ts: number): string {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Agora mesmo';
    if (mins < 60) return `${mins}min atrás`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h atrás`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d atrás`;
    return formatDate(ts);
}

const IMAGE_HEIGHT = 480;

function getCardWidth(aspectRatio: string): number {
    const parts = aspectRatio.split(':').map(Number);
    if (parts.length === 2 && parts[0] > 0 && parts[1] > 0) {
        return Math.round(IMAGE_HEIGHT * (parts[0] / parts[1]));
    }
    return IMAGE_HEIGHT; // fallback 1:1
}

/* ═══════════════════════════════════════════════════════════════════════════════
 * COMPONENT
 * ═══════════════════════════════════════════════════════════════════════════════ */

export function GalleryPage() {
    const [images, setImages] = useState<GalleryImage[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);

    useEffect(() => {
        // Simulate a small delay for skeleton effect,
        // then load from localStorage
        const timer = setTimeout(() => {
            setImages(getGalleryImages());
            setIsLoading(false);
        }, 400);
        return () => clearTimeout(timer);
    }, []);

    const handleDownload = useCallback((image: GalleryImage) => {
        const link = document.createElement('a');
        link.href = image.url;
        link.download = `nobre-studio-${image.id}.png`;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.click();
    }, []);

    const closeLightbox = useCallback(() => {
        setSelectedImage(null);
    }, []);

    // Close on Escape
    useEffect(() => {
        if (!selectedImage) return;
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') closeLightbox();
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [selectedImage, closeLightbox]);

    return (
        <div className={styles.page}>
            {/* Header */}
            <header className={styles.header}>
                <div className={styles.headerLeft}>
                    <GalleryHorizontalEnd size={20} className={styles.headerIcon} />
                    <h1>Galeria</h1>
                    {!isLoading && (
                        <span className={styles.imageCount}>
                            {images.length} {images.length === 1 ? 'imagem' : 'imagens'}
                        </span>
                    )}
                </div>
            </header>

            {/* Content */}
            <div className={styles.gridContainer}>
                {/* Loading Skeletons */}
                {isLoading && (
                    <div className={styles.skeletonGrid}>
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className={styles.skeletonCard}>
                                <Skeleton variant="rect" width="100%" height={220} borderRadius={0} />
                                <div style={{ padding: 'var(--spacing-3)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
                                    <Skeleton variant="text" lines={2} />
                                    <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                                        <Skeleton variant="rect" width={50} height={18} borderRadius="var(--radius-full)" />
                                        <Skeleton variant="rect" width={40} height={18} borderRadius="var(--radius-full)" />
                                        <Skeleton variant="rect" width={55} height={18} borderRadius="var(--radius-full)" />
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                                        <Skeleton variant="circle" size={24} />
                                        <Skeleton variant="rect" width={80} height={12} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Empty State */}
                {!isLoading && images.length === 0 && (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>
                            <ImageIcon size={48} />
                        </div>
                        <p>
                            Nenhuma imagem na galeria ainda.
                            <br />
                            <Link to={ROUTES.studio.imageGenerator} style={{ color: 'var(--color-primary-500)' }}>
                                Gere sua primeira imagem
                            </Link>{' '}
                            e ela aparecerá aqui automaticamente.
                        </p>
                    </div>
                )}

                {/* Image Grid */}
                {!isLoading && images.length > 0 && (
                    <div className={styles.grid}>
                        {images.map((image) => (
                            <div
                                key={image.id}
                                className={styles.card}
                                style={{ flexBasis: getCardWidth(image.aspectRatio) }}
                                onClick={() => setSelectedImage(image)}
                            >
                                <div className={styles.imageWrapper}>
                                    <img
                                        src={image.url}
                                        alt={image.prompt}
                                        loading="lazy"
                                    />
                                </div>
                                <div className={styles.cardMeta}>
                                    <p className={styles.promptText}>{image.prompt}</p>
                                    <div className={styles.tags}>
                                        <span className={styles.tag}>{image.model}</span>
                                        <span className={styles.tag}>{image.aspectRatio}</span>
                                        <span className={styles.tag}>{image.quality}</span>
                                        {image.styleName && (
                                            <span className={styles.tag}>{image.styleName}</span>
                                        )}
                                    </div>
                                    <div className={styles.cardFooter}>
                                        <div className={styles.userInfo}>
                                            <Avatar
                                                fallback={image.createdBy.name}
                                                src={image.createdBy.profilePhotoUrl}
                                                size="sm"
                                            />
                                            <span className={styles.userName}>{image.createdBy.name}</span>
                                        </div>
                                        <span className={styles.dateText}>
                                            {formatRelative(image.createdAt)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Lightbox */}
            {selectedImage && (
                <div className={styles.lightboxBackdrop} onClick={closeLightbox}>
                    {/* Close button */}
                    <button className={styles.lightboxClose} onClick={closeLightbox} title="Fechar">
                        <X size={18} />
                    </button>

                    {/* Download button */}
                    <button
                        className={styles.lightboxDownload}
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(selectedImage);
                        }}
                        title="Baixar"
                    >
                        <Download size={16} />
                    </button>

                    {/* Image Area */}
                    <div className={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
                        <img
                            src={selectedImage.url}
                            alt={selectedImage.prompt}
                        />
                    </div>

                    {/* Sidebar Details */}
                    <aside className={styles.lightboxSidebar} onClick={(e) => e.stopPropagation()}>
                        {/* User */}
                        <div className={styles.detailUserRow}>
                            <Avatar
                                fallback={selectedImage.createdBy.name}
                                src={selectedImage.createdBy.profilePhotoUrl}
                                size="md"
                            />
                            <div className={styles.detailUserInfo}>
                                <span className={styles.detailUserName}>{selectedImage.createdBy.name}</span>
                                <span className={styles.detailUserDate}>{formatDate(selectedImage.createdAt)}</span>
                            </div>
                        </div>

                        {/* Prompt */}
                        <div className={styles.detailSection}>
                            <span className={styles.detailLabel}>Prompt</span>
                            <p className={styles.detailValue}>{selectedImage.prompt}</p>
                        </div>

                        {/* Style */}
                        {selectedImage.styleName && (
                            <div className={styles.detailSection}>
                                <span className={styles.detailLabel}>Estilo</span>
                                <p className={styles.detailValue}>{selectedImage.styleName}</p>
                            </div>
                        )}

                        {/* Model + Quality */}
                        <div className={styles.detailRow}>
                            <div className={styles.detailSection}>
                                <span className={styles.detailLabel}>Modelo</span>
                                <p className={styles.detailValue}>{selectedImage.model}</p>
                            </div>
                            <div className={styles.detailSection}>
                                <span className={styles.detailLabel}>Qualidade</span>
                                <p className={styles.detailValue}>{selectedImage.quality}</p>
                            </div>
                        </div>

                        {/* Aspect Ratio */}
                        <div className={styles.detailSection}>
                            <span className={styles.detailLabel}>Proporção</span>
                            <p className={styles.detailValue}>{selectedImage.aspectRatio}</p>
                        </div>
                    </aside>
                </div>
            )}
        </div>
    );
}
