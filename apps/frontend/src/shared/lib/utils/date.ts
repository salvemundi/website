/**
 * Formats a date to the standard Salve Mundi format: dd-mm-yyyy.
 * @param date - The date to format (string, Date, or timestamp).
 * @param includeTime - Whether to include the time (HH:mm).
 * @returns A formatted date string or 'Datum volgt' if invalid.
 */
export function formatDate(date: string | Date | number | undefined | null, includeTime: boolean = false): string {
    if (!date) return 'Datum volgt';

    try {
        const d = new Date(date);
        if (isNaN(d.getTime())) return 'Datum volgt';

        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();

        let result = `${day}-${month}-${year}`;

        if (includeTime) {
            const hours = String(d.getHours()).padStart(2, '0');
            const minutes = String(d.getMinutes()).padStart(2, '0');
            result += ` ${hours}:${minutes}`;
        }

        return result;
    } catch {
        return 'Datum volgt';
    }
}

/**
 * Utility to check if an event date is in the past.
 */
export function isEventPast(dateStr?: string): boolean {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    return date < new Date();
}
