/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - SERVICE: GALLERY (Supabase Storage + Local Metadata)
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Gerencia upload de imagens geradas para Supabase Storage
 * e armazena metadata no localStorage para a galeria.
 *
 * Requer bucket "studio-gallery" criado no Supabase Dashboard com
 * policy de INSERT para authenticated users.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { supabase } from '@/config/supabase';

/* ═══════════════════════════════════════════════════════════════════════════════
 * TYPES
 * ═══════════════════════════════════════════════════════════════════════════════ */

export interface GalleryImage {
    id: string;
    url: string;
    prompt: string;
    styleName: string | null;
    model: string;
    quality: string;
    aspectRatio: string;
    createdAt: number;
    createdBy: {
        id: string;
        name: string;
        profilePhotoUrl?: string;
    };
}

const GALLERY_STORAGE_KEY = 'nobre-hub:gallery-images';
const SUPABASE_BUCKET = 'studio-gallery';

/* ═══════════════════════════════════════════════════════════════════════════════
 * HELPERS
 * ═══════════════════════════════════════════════════════════════════════════════ */

function base64ToBlob(base64: string, mimeType: string): Blob {
    const byteCharacters = atob(base64);
    const byteNumbers = new Uint8Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    return new Blob([byteNumbers], { type: mimeType });
}

/* ═══════════════════════════════════════════════════════════════════════════════
 * UPLOAD
 * ═══════════════════════════════════════════════════════════════════════════════ */

export async function uploadGeneratedImage(params: {
    base64: string;
    mimeType: string;
    prompt: string;
    styleName: string | null;
    model: string;
    quality: string;
    aspectRatio: string;
    user: { id: string; name: string; profilePhotoUrl?: string };
}): Promise<GalleryImage> {
    const id = `img_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const extension = params.mimeType.includes('png') ? 'png' : 'jpg';
    const filePath = `${params.user.id}/${id}.${extension}`;

    // Convert base64 to Blob
    const blob = base64ToBlob(params.base64, params.mimeType);

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
        .from(SUPABASE_BUCKET)
        .upload(filePath, blob, {
            contentType: params.mimeType,
            upsert: false,
        });

    if (uploadError) {
        throw new Error(`Erro ao fazer upload: ${uploadError.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
        .from(SUPABASE_BUCKET)
        .getPublicUrl(filePath);

    const url = urlData.publicUrl;

    // Build metadata
    const image: GalleryImage = {
        id,
        url,
        prompt: params.prompt,
        styleName: params.styleName,
        model: params.model,
        quality: params.quality,
        aspectRatio: params.aspectRatio,
        createdAt: Date.now(),
        createdBy: {
            id: params.user.id,
            name: params.user.name,
            profilePhotoUrl: params.user.profilePhotoUrl,
        },
    };

    // Save metadata to localStorage
    const existing = getGalleryImages();
    existing.unshift(image);
    localStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(existing));

    return image;
}

/* ═══════════════════════════════════════════════════════════════════════════════
 * READ
 * ═══════════════════════════════════════════════════════════════════════════════ */

export function getGalleryImages(): GalleryImage[] {
    try {
        const raw = localStorage.getItem(GALLERY_STORAGE_KEY);
        if (!raw) return [];
        return JSON.parse(raw) as GalleryImage[];
    } catch {
        return [];
    }
}

/* ═══════════════════════════════════════════════════════════════════════════════
 * DELETE
 * ═══════════════════════════════════════════════════════════════════════════════ */

export function removeGalleryImage(id: string): void {
    const images = getGalleryImages().filter((img) => img.id !== id);
    localStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(images));
}
