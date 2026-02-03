import React from 'react';
import clsx from 'clsx';
import styles from './Avatar.module.css';
import { LazyImage } from '../LazyImage';
import { useOptimizedImage } from '@/hooks/useOptimizedImage';

export interface AvatarProps {
    src?: string | null;
    alt?: string;
    fallback?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
    containerClassName?: string;
    onClick?: () => void;
}

export const Avatar: React.FC<AvatarProps> = ({
    src,
    alt,
    fallback,
    size = 'md',
    className,
    containerClassName,
    onClick
}) => {
    // Use smallest thumbnail for avatars
    const { src: optimizedSrc } = useOptimizedImage(src, '180x320');

    const containerClasses = clsx(
        styles.container,
        styles[size],
        className,
        containerClassName
    );

    if (!src) {
        return (
            <div className={containerClasses} onClick={onClick}>
                {fallback?.slice(0, 2) || (alt?.slice(0, 2)) || '?'}
            </div>
        );
    }

    return (
        <div className={containerClasses} onClick={onClick}>
            <LazyImage
                src={optimizedSrc || src}
                alt={alt || 'Avatar'}
                className={styles.image}
            />
        </div>
    );
};
