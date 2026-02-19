const apiBaseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

/**
 * Build API URLs that work in both local and deployed environments.
 * - If VITE_API_URL is set (e.g. http://localhost:3000), prepend it.
 * - Otherwise keep relative /api paths for same-origin deployments.
 */
export function buildApiUrl(path: string): string {
    if (/^https?:\/\//i.test(path)) return path;
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return apiBaseUrl ? `${apiBaseUrl}${normalizedPath}` : normalizedPath;
}

