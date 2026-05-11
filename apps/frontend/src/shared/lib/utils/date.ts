import { format, parseISO } from 'date-fns';
import { nl } from 'date-fns/locale';

/**
 * Formats a date string, object or timestamp into a readable format.
 * Defaults to 'dd-MM-yyyy' in Dutch.
 */
export function formatDate(
    date: string | Date | number | undefined | null,
    formatStr: string = 'dd-MM-yyyy'
): string {
    if (!date) return 'Datum volgt';

    try {
        const d = typeof date === 'string' ? parseISO(date) : new Date(date);
        if (isNaN(d.getTime())) return 'Datum volgt';

        return format(d, formatStr, { locale: nl });
    } catch {
        return 'Datum volgt';
    }
}





/**
 * Utility to check if an event date is in the past.
 */
export function isEventPast(dateStr?: string): boolean {
    if (!dateStr) return false;
    try {
        const date = parseISO(dateStr);
        return date < new Date();
    } catch {
        return false;
    }
}


