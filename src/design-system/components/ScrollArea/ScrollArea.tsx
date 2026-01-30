import { ReactNode, HTMLAttributes } from 'react';
import clsx from 'clsx';
import styles from './ScrollArea.module.css';

export interface ScrollAreaProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
    /** Maximum height of the scroll area */
    maxHeight?: string | number;
    /** Enable horizontal scrolling */
    horizontal?: boolean;
    /** Scrollbar size variant */
    size?: 'thin' | 'default' | 'thick';
    /** Auto-hide scrollbar when not hovering */
    autoHide?: boolean;
}

export const ScrollArea = ({
    children,
    maxHeight,
    className,
    horizontal = false,
    size = 'default',
    autoHide = false,
    style,
    ...props
}: ScrollAreaProps) => {
    return (
        <div
            className={clsx(
                styles.scrollArea,
                {
                    [styles.horizontal]: horizontal,
                    [styles.thin]: size === 'thin',
                    [styles.thick]: size === 'thick',
                    [styles.autoHide]: autoHide,
                },
                className
            )}
            {...props}
            style={{ maxHeight, ...style }}
        >
            <div className={styles.content}>
                {children}
            </div>
        </div>
    );
};

ScrollArea.displayName = 'ScrollArea';
