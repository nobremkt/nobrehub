-- ═══════════════════════════════════════════════════════════════
-- FIX: user_role() now reads from roles table instead of JWT metadata
-- Maps DB role names to RLS role names:
--   Diretor       → admin
--   Gerente       → leader
--   Estrategista  → leader
--   Everything else → sales (Vendedor, Pós-Vendedor, Produtor, etc.)
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT COALESCE(
        (
            SELECT CASE r.name
                WHEN 'Diretor' THEN 'admin'
                WHEN 'Gerente' THEN 'leader'
                WHEN 'Estrategista' THEN 'leader'
                ELSE 'sales'
            END
            FROM public.users u
            JOIN public.roles r ON u.role_id = r.id
            WHERE u.id = auth.uid()
        ),
        -- Fallback: check JWT metadata for backwards compat (e.g. debug user)
        (auth.jwt() -> 'user_metadata' ->> 'role'),
        'sales'
    );
$$;
