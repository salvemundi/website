
/**
 * Returns a local ISO-like string (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss) without timezone shifts.
 */
export function toLocalISOString(date: Date | string | null | undefined, includeTime = false): string | null {
    if (!date) return null;
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    
    if (!includeTime) return `${year}-${month}-${day}`;

    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

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
