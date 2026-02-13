-- ═══════════════════════════════════════════════════════════════════════════════
-- NOBRE HUB - STUDIO & AI SETTINGS MIGRATION
-- ═══════════════════════════════════════════════════════════════════════════════
-- Adds tables for AI API keys, models, image styles, and gallery metadata.
-- Previously these were stored in localStorage (lost on cache clear).
-- ═══════════════════════════════════════════════════════════════════════════════


-- ─── 1. AI API KEYS ─────────────────────────────────────────────────────────
-- Stores API keys per provider (gemini, openai). One row per provider.
CREATE TABLE IF NOT EXISTS public.ai_api_keys (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    provider text NOT NULL CHECK (provider IN ('gemini', 'openai')),
    api_key text NOT NULL DEFAULT '',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(provider)
);
ALTER TABLE public.ai_api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_api_keys_all_authenticated" ON public.ai_api_keys
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Seed default rows (empty keys)
INSERT INTO public.ai_api_keys (provider, api_key)
VALUES ('gemini', ''), ('openai', '')
ON CONFLICT (provider) DO NOTHING;


-- ─── 2. AI MODELS ───────────────────────────────────────────────────────────
-- Available AI models for image generation. Admin can enable/disable.
CREATE TABLE IF NOT EXISTS public.ai_models (
    id text PRIMARY KEY,
    name text NOT NULL,
    provider text NOT NULL CHECK (provider IN ('gemini', 'openai')),
    model_id text NOT NULL,
    enabled boolean NOT NULL DEFAULT false,
    sort_order integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_models ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_models_all_authenticated" ON public.ai_models
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Seed default models
INSERT INTO public.ai_models (id, name, provider, model_id, enabled, sort_order) VALUES
    ('nano-banana-pro', 'Nano Banana Pro', 'gemini', 'gemini-3-pro-image-preview', true, 1),
    ('nano-banana', 'Nano Banana', 'gemini', 'gemini-2.5-flash-image', false, 2),
    ('imagen-4', 'Imagen 4.0', 'gemini', 'imagen-4.0-generate-001', false, 3),
    ('imagen-4-ultra', 'Imagen 4.0 Ultra', 'gemini', 'imagen-4.0-ultra-generate-001', false, 4),
    ('imagen-4-fast', 'Imagen 4.0 Fast', 'gemini', 'imagen-4.0-fast-generate-001', false, 5),
    ('gpt-image', 'GPT Image 1.5', 'openai', 'gpt-image-1.5-2025-12-16', false, 6)
ON CONFLICT (id) DO NOTHING;


-- ─── 3. AI IMAGE STYLES ─────────────────────────────────────────────────────
-- Prompt templates for different image generation styles.
CREATE TABLE IF NOT EXISTS public.ai_image_styles (
    id text PRIMARY KEY,
    name text NOT NULL,
    prompt text NOT NULL,
    is_default boolean NOT NULL DEFAULT false,
    sort_order integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_image_styles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_image_styles_all_authenticated" ON public.ai_image_styles
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Seed default styles
INSERT INTO public.ai_image_styles (id, name, prompt, is_default, sort_order) VALUES
    ('realistic', 'Realista',
     'Generate a photorealistic image with natural lighting, real-world textures, and cinematic composition. The image should look like a professional photograph. Subject: {user_prompt}',
     true, 1),
    ('cartoon-3d', '3D Cartoon',
     'Generate a Pixar/Disney-style 3D cartoon render with vibrant colors, smooth shading, and expressive character design. The scene should be cheerful and polished. Subject: {user_prompt}',
     true, 2),
    ('anime', 'Anime',
     'Generate an anime-style illustration with clean linework, vibrant colors, and dramatic lighting typical of modern anime productions. Subject: {user_prompt}',
     true, 3),
    ('watercolor', 'Aquarela',
     'Generate a watercolor painting with soft blending, translucent washes, visible paper texture, and delicate color transitions. Subject: {user_prompt}',
     true, 4)
ON CONFLICT (id) DO NOTHING;


-- ─── 4. GALLERY IMAGES ──────────────────────────────────────────────────────
-- Metadata for AI-generated images. Files live in Supabase Storage bucket "studio-gallery".
CREATE TABLE IF NOT EXISTS public.gallery_images (
    id text PRIMARY KEY,
    url text NOT NULL,
    prompt text NOT NULL,
    style_name text,
    model text NOT NULL,
    quality text NOT NULL DEFAULT 'standard',
    aspect_ratio text NOT NULL DEFAULT '1:1',
    file_path text,
    user_id uuid REFERENCES public.users(id),
    user_name text,
    user_photo_url text,
    created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.gallery_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gallery_images_all_authenticated" ON public.gallery_images
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
