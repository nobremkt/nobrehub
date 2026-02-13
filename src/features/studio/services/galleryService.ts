/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - SERVICE: GALLERY (Supabase Storage + Supabase DB Metadata)
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Upload: files go to Supabase Storage bucket "studio-gallery"
 * Metadata: stored in `gallery_images` Supabase table
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { supabase } from '@/config/supabase';

/* ═════════════════════════════════════════════════════════════════════════════
 * TYPES
 * ═════════════════════════════════════════════════════════════════════════════ */

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

const SUPABASE_BUCKET = 'studio-gallery';

/* ═════════════════════════════════════════════════════════════════════════════
 * HELPERS
 * ═════════════════════════════════════════════════════════════════════════════ */

function base64ToBlob(base64: string, mimeType: string): Blob {
    const byteCharacters = atob(base64);
    const byteNumbers = new Uint8Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    return new Blob([byteNumbers], { type: mimeType });
}

/* ═════════════════════════════════════════════════════════════════════════════
 * UPLOAD
 * ═════════════════════════════════════════════════════════════════════════════ */

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
    const now = Date.now();

    // Save metadata to Supabase DB
    const { error: insertError } = await supabase
        .from('gallery_images')
        .insert({
            id,
            url,
            prompt: params.prompt,
            style_name: params.styleName,
            model: params.model,
            quality: params.quality,
            aspect_ratio: params.aspectRatio,
            user_id: params.user.id,
            user_name: params.user.name,
            user_photo_url: params.user.profilePhotoUrl || null,
            created_at: new Date(now).toISOString(),
        });

    if (insertError) {
        console.error('[GalleryService] Failed to save metadata:', insertError);
        // Image was uploaded but metadata failed — still return the image
    }

    return {
        id,
        url,
        prompt: params.prompt,
        styleName: params.styleName,
        model: params.model,
        quality: params.quality,
        aspectRatio: params.aspectRatio,
        createdAt: now,
        createdBy: {
            id: params.user.id,
            name: params.user.name,
            profilePhotoUrl: params.user.profilePhotoUrl,
        },
    };
}

/* ═════════════════════════════════════════════════════════════════════════════
 * READ
 * ═════════════════════════════════════════════════════════════════════════════ */

export async function getGalleryImages(): Promise<GalleryImage[]> {
    try {
        const { data, error } = await supabase
            .from('gallery_images')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[GalleryService] Failed to load gallery:', error);
            return [];
        }

        return (data || []).map((row) => ({
            id: row.id,
            url: row.url,
            prompt: row.prompt || '',
            styleName: row.style_name,
            model: row.model || '',
            quality: row.quality || '',
            aspectRatio: row.aspect_ratio || '',
            createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
            createdBy: {
                id: row.user_id || '',
                name: row.user_name || 'Desconhecido',
                profilePhotoUrl: row.user_photo_url || undefined,
            },
        }));
    } catch {
        return [];
    }
}

/* ═════════════════════════════════════════════════════════════════════════════
 * DELETE
 * ═════════════════════════════════════════════════════════════════════════════ */

export async function removeGalleryImage(id: string): Promise<void> {
    try {
        // Get the image URL to extract storage path
        const { data } = await supabase
            .from('gallery_images')
            .select('url, user_id')
            .eq('id', id)
            .single();

        // Delete metadata from DB
        await supabase
            .from('gallery_images')
            .delete()
            .eq('id', id);

        // Also delete file from Storage if we have the path
        if (data?.url && data?.user_id) {
            const extension = data.url.includes('.png') ? 'png' : 'jpg';
            const storagePath = `${data.user_id}/${id}.${extension}`;
            await supabase.storage
                .from(SUPABASE_BUCKET)
                .remove([storagePath]);
        }
    } catch (err) {
        console.error('[GalleryService] Failed to remove image:', err);
    }
}
