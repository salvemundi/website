/**
 * Utility functions for activities.
 */

/**
 * Builds a committee email address based on the committee name.
 */
export const buildCommitteeEmail = (name?: string | null): string | undefined => {
    if (!name) return undefined;
    const normalized = name.toLowerCase();
    
    // Explicit mappings for known committees
    if (normalized.includes('feest')) return 'feest@salvemundi.nl';
    if (normalized.includes('activiteit')) return 'activiteiten@salvemundi.nl';
    if (normalized.includes('studie')) return 'studie@salvemundi.nl';
    if (normalized.includes('intro')) return 'intro@salvemundi.nl';
    if (normalized.includes('media')) return 'media@salvemundi.nl';
    if (normalized.includes('kroegentocht')) return 'kroegentocht@salvemundi.nl';
    if (normalized.includes('reis')) return 'reis@salvemundi.nl';
    if (normalized.includes('kas')) return 'kas@salvemundi.nl';

    // Fallback: derive from name
    const slug = name
        .normalize('NFD') // Split characters from their accents
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .toLowerCase()
        .replace(/commissie|committee/g, '') // Remove these common words
        .replace(/[^a-z0-9]+/g, '') // Remove non-alphanumeric
        .trim();
        
    if (!slug) return undefined;
    return `${slug}@salvemundi.nl`;
};

/**
 * Formats an ISO date string to a human-readable Dutch format.
 */
export const formatDutchDate = (dateStr?: string | null): string | null => {
    if (!dateStr) return null;
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        
        return new Intl.DateTimeFormat('nl-NL', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }).format(date);
    } catch {
        return dateStr;
    }
};

/**
 * Formats a time string (HH:MM:SS) to HH:MM.
 */
export const formatTime = (timeStr?: string | null): string | null => {
    if (!timeStr) return null;
    const parts = timeStr.split(':');
    if (parts.length >= 2) return `${parts[0]}:${parts[1]}`;
    return timeStr;
};
