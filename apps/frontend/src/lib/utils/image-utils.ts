
import { BRAND_CONFIG } from '../config/brand';

export function getImageUrl(
    idOrObject?: string | { id: string } | null, 
    options?: { width?: number; height?: number; fit?: string; quality?: number }
): string {
    const DEFAULT_FALLBACK = BRAND_CONFIG.logoFallbackLight;

    if (!idOrObject) return DEFAULT_FALLBACK;
    
    const id = typeof idOrObject === 'string' ? idOrObject : idOrObject.id;
    if (!id) return DEFAULT_FALLBACK;

    if (id.startsWith('/api/assets/') || id.startsWith('http') || id.startsWith('data:') || id.startsWith('blob:') || (id.startsWith('/') && !id.startsWith('/api/'))) {
        return id;
    }

    const params = new URLSearchParams();
    if (options?.width) params.append('width', options.width.toString());
    if (options?.height) params.append('height', options.height.toString());
    if (options?.fit) params.append('fit', options.fit);
    if (options?.quality) params.append('quality', options.quality.toString());
    
    const query = params.toString();
    return `/api/assets/${id}${query ? `?${query}` : ''}`;
}

