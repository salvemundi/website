import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitizes HTML string to prevent XSS attacks.
 * Uses isomorphic-dompurify which works on both client and server.
 */
export function sanitizeHtml(html: string | undefined | null): string {
    if (!html) return '';
    return DOMPurify.sanitize(html);
}
