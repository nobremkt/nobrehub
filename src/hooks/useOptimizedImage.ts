import { useState, useEffect } from 'react';
import { getFirebaseStorage } from '@/config/firebase';
import { ref, getDownloadURL } from 'firebase/storage';

type ImageSize = '180x320' | '360x640' | '720x1280';

/**
 * Hook to get the optimized (resized) image URL from Firebase Storage.
 * Falls back to original URL if optimized version is not found or error occurs.
 * 
 * @param originalUrl The original download URL (or null)
 * @param size The desired size '180x320' | '360x640' | '720x1280'
 */
export const useOptimizedImage = (originalUrl: string | undefined | null, size: ImageSize) => {
    const [src, setSrc] = useState<string | undefined>(originalUrl || undefined);
    const [isOptimized, setIsOptimized] = useState(false);

    useEffect(() => {
        if (!originalUrl) {
            setSrc(undefined);
            return;
        }

        // If it's not a firebase storage URL, just use it as is (e.g. ui-avatars)
        if (!originalUrl.includes('firebasestorage.googleapis.com')) {
            setSrc(originalUrl);
            return;
        }

        let isMounted = true;

        const fetchOptimizedUrl = async () => {
            try {
                // 1. Decode path from URL
                // Format: .../o/path%2Fto%2Fimage.jpg?alt=...
                const urlObj = new URL(originalUrl);
                const pathName = urlObj.pathname; // /v0/b/bucket/o/path%2Fto%2Fimage.jpg

                // Extract encoded path
                const decodedPath = decodeURIComponent(pathName.split('/o/')[1]);

                // Get extension
                const dotIndex = decodedPath.lastIndexOf('.');
                if (dotIndex === -1) {
                    if (isMounted) setSrc(originalUrl);
                    return;
                }

                const basePath = decodedPath.substring(0, dotIndex);
                const extension = decodedPath.substring(dotIndex);

                // Construct thumbnail path based on extension config
                // "Cloud Storage path for resized images": thumbnails
                // Filename format: name_WIDTHxHEIGHT.ext
                const thumbPath = `${basePath}_${size}${extension}`;

                // 2. Fetch Download URL
                const storage = getFirebaseStorage();
                const thumbRef = ref(storage, thumbPath);
                const thumbUrl = await getDownloadURL(thumbRef);

                if (isMounted) {
                    setSrc(thumbUrl);
                    setIsOptimized(true);
                }
            } catch (error) {
                // If fails (not generated yet?), fallback to original
                // console.warn("Failed to load optimized image", error);
                if (isMounted) setSrc(originalUrl);
            }
        };

        // Start with original while fetching (or maybe placeholder behavior in parent?)
        // Generally fine to show nothing or original if cached?
        // Let's keep src as originalUrl initially so if it fails we are already safe
        setSrc(originalUrl);
        fetchOptimizedUrl();

        return () => {
            isMounted = false;
        };
    }, [originalUrl, size]);

    return { src, isOptimized };
};
