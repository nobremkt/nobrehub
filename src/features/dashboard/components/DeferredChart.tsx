/**
 * DeferredChart — delays rendering until after the browser has painted,
 * preventing recharts ResponsiveContainer from measuring -1 dimensions.
 */
import { useState, useEffect, type ReactNode } from 'react';

interface Props {
    children: ReactNode;
    /** Fallback shown while waiting for paint (default: nothing) */
    fallback?: ReactNode;
}

export function DeferredChart({ children, fallback = null }: Props) {
    const [ready, setReady] = useState(false);

    useEffect(() => {
        // Wait for the next animation frame (browser has painted)
        const raf = requestAnimationFrame(() => setReady(true));
        return () => cancelAnimationFrame(raf);
    }, []);

    if (!ready) return <>{fallback}</>;
    return <>{children}</>;
}
