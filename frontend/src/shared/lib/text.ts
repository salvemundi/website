// Small text utilities
export const stripHtml = (input?: string | null): string => {
    if (!input) return '';
    // Decode basic HTML entities (handle cases where tags are escaped like &lt;p&gt;)
    let decoded = input.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
    // Remove any HTML tags and trim whitespace
    return decoded.replace(/<[^>]*>/g, '').trim();
};

export default { stripHtml };
