/**
 * Helper to get the image URL for a Directus asset ID or object.
 * Routes through the internal /api/assets proxy to avoid permission issues.
 * Supports Directus image transformation parameters.
 * SAFE FOR CLIENT-SIDE USAGE.
 */
export function getImageUrl(
    idOrObject?: string | { id: string } | null, 
    options?: { width?: number; height?: number; fit?: string }
): string | null {
    if (!idOrObject) return null;
    
    const id = typeof idOrObject === 'string' ? idOrObject : idOrObject.id;
    if (!id) return null;

    const params = new URLSearchParams();
    if (options?.width) params.append('width', options.width.toString());
    if (options?.height) params.append('height', options.height.toString());
    if (options?.fit) params.append('fit', options.fit);
    
    const query = params.toString();
    return `/api/assets/${id}${query ? `?${query}` : ''}`;
}
