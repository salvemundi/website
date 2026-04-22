/**
 * Normalizes a date string from DD-MM-YYYY to YYYY-MM-DD if needed.
 * This is primarily used for custom DateInput components that submit text values.
 */
export function normalizeDate(dateStr: string | null | undefined): string | null {
    if (!dateStr) return null;
    
    // Check for DD-MM-YYYY format
    if (dateStr.includes('-')) {
        const parts = dateStr.split('-');
        // If it looks like DD-MM-YYYY (2-2-4 digits)
        if (parts.length === 3 && parts[0].length === 2 && parts[2].length === 4) {
            return `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
    }
    
    return dateStr;
}
