import he from 'he';

// Small text utilities
export const stripHtml = (input?: string | null): string => {
    if (!input) return '';

    // First decode HTML entities properly using 'he' library
    const decoded = he.decode(input);

    // Remove any HTML tags and trim whitespace
    return decoded.replace(/<[^>]*>/g, '').trim();
};

export default { stripHtml };
