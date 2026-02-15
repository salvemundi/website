import { API_SERVICE_TOKEN } from '../directus';

export function getImageUrl(imageId: string | undefined | any, options?: { quality?: number; width?: number; height?: number; format?: string }): string {
    if (!imageId) {
        return '/img/placeholder.svg';
    }

    let actualImageId: string;
    if (typeof imageId === 'object' && imageId !== null) {
        actualImageId = imageId.id || imageId.filename_disk || imageId.filename_download;
        if (!actualImageId) {
            // Silently return placeholder for invalid image objects
            return '/img/placeholder.svg';
        }
    } else {
        actualImageId = String(imageId);
    }

    // Validate that actualImageId is a valid UUID or filename
    if (!actualImageId || actualImageId === 'null' || actualImageId === 'undefined') {
        return '/img/placeholder.svg';
    }

    let token: string | null = null;
    try {
        if (typeof window !== 'undefined') {
            token = localStorage.getItem('auth_token');
        }
    } catch (e) {
        console.warn('getImageUrl: Could not access localStorage', e);
    }

    if (!token) {
        token = API_SERVICE_TOKEN || null;
    }

    // Always use /api proxy which handles authentication via headers
    const baseUrl = '/api';

    // Build query parameters for image optimization ONLY
    // DO NOT add access_token here - the proxy will handle authentication via Cookie/Authorization headers
    // Adding access_token causes "double auth" (query + cookie) which Directus rejects with 400
    const params = new URLSearchParams();
    if (options?.quality) {
        params.append('quality', options.quality.toString());
    }
    if (options?.width) {
        params.append('width', options.width.toString());
    }
    if (options?.height) {
        params.append('height', options.height.toString());
    }
    if (options?.format) {
        params.append('format', options.format);
    }

    const queryString = params.toString();
    const imageUrl = queryString
        ? `${baseUrl}/assets/${actualImageId}?${queryString}`
        : `${baseUrl}/assets/${actualImageId}`;

    return imageUrl;
}
