import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import styles from './LazyImage.module.css';

export interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    /**
     * Optional className for the container div
     */
    containerClassName?: string;
    /**
     * Optional aspect ratio styling if needed, though usually handled by parent
     */
}

/**
 * LazyImage Component
 * 
 * Provides a smooth loading experience with a skeleton placeholder and fade-in effect.
 * Uses native lazy loading.
 */
export const LazyImage: React.FC<LazyImageProps> = ({
    className,
    containerClassName,
    alt,
    src,
    onLoad,
    ...props
}) => {
    const [isLoaded, setIsLoaded] = useState(false);

    // Reset loaded state if src changes
    useEffect(() => {
        setIsLoaded(false);
    }, [src]);

    const handleLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
        setIsLoaded(true);
        if (onLoad) onLoad(e);
    };

    return (
        <div className={clsx(
            styles.container,
            { [styles.loadedContainer]: isLoaded },
            containerClassName
        )}>
            <img
                {...props}
                src={src}
                alt={alt}
                className={clsx(
                    styles.image,
                    { [styles.loaded]: isLoaded },
                    className
                )}
                onLoad={handleLoad}
                loading="lazy"
            />
        </div>
    );
};
