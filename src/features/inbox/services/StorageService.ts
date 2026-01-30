/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - INBOX: STORAGE SERVICE
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Service for uploading media files to Firebase Storage.
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { getFirebaseStorage } from '@/config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export interface UploadProgress {
    progress: number;
    state: 'running' | 'paused' | 'success' | 'error';
}

export const StorageService = {
    /**
     * Upload a file to Firebase Storage and return the download URL.
     * Files are organized by conversation ID.
     */
    uploadMedia: async (
        conversationId: string,
        file: File
    ): Promise<string> => {
        const storage = getFirebaseStorage();

        // Create a unique filename with timestamp
        const timestamp = Date.now();
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const filename = `${timestamp}_${sanitizedName}`;

        // Path: inbox/{conversationId}/{timestamp}_{filename}
        const path = `inbox/${conversationId}/${filename}`;
        const storageRef = ref(storage, path);

        try {
            // Upload the file
            const snapshot = await uploadBytes(storageRef, file, {
                contentType: file.type,
            });

            // Get the download URL
            const downloadURL = await getDownloadURL(snapshot.ref);

            return downloadURL;
        } catch (error) {
            console.error('Upload failed:', error);
            throw error;
        }
    },

    /**
     * Get the media type based on file MIME type.
     */
    getMediaType: (file: File): 'image' | 'video' | 'audio' | 'document' => {
        if (file.type.startsWith('image/')) return 'image';
        if (file.type.startsWith('video/')) return 'video';
        if (file.type.startsWith('audio/')) return 'audio';
        return 'document';
    },

    /**
     * Validate file size (max 16MB for WhatsApp).
     */
    validateFileSize: (file: File): boolean => {
        const MAX_SIZE = 16 * 1024 * 1024; // 16MB
        return file.size <= MAX_SIZE;
    },

    /**
     * Get human-readable file size.
     */
    formatFileSize: (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }
};
