import DOMPurify from 'isomorphic-dompurify';

export function stripHtml(html: string): string {
    return html ? DOMPurify.sanitize(html, { ALLOWED_TAGS: [] }) : '';
}
