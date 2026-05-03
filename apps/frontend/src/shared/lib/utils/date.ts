import { format, parseISO } from 'date-fns';
import { nl } from 'date-fns/locale';

/**
 * Formats a date string, object or timestamp into a readable format.
 * Defaults to 'dd-MM-yyyy' in Dutch.
 * Supports legacy 'includeTime' boolean for backward compatibility.
 */
export function formatDate(
    date: string | Date | number | undefined | null,
    formatOrIncludeTime: string | boolean = 'dd-MM-yyyy'
): string {
    if (!date) return 'Datum volgt';

    try {
        const d = typeof date === 'string' ? parseISO(date) : new Date(date);
        if (isNaN(d.getTime())) return 'Datum volgt';

        // Legacy support: if boolean true, use a format with time
        if (typeof formatOrIncludeTime === 'boolean') {
            const formatStr = formatOrIncludeTime ? 'dd-MM-yyyy HH:mm' : 'dd-MM-yyyy';
            return format(d, formatStr, { locale: nl });
        }

        return format(d, formatOrIncludeTime, { locale: nl });
    } catch {
        return 'Datum volgt';
    }
}

/**
 * Modern Salve Mundi Event Formatter: "vrijdag 25 april"
 */
export function formatEventDate(date: string | Date | number | undefined | null): string {
    return formatDate(date, 'EEEE d MMMM');
}

/**
 * Standard Salve Mundi Event Date Range: "25 april t/m 27 april"
 */
export function formatEventDateRange(startDate?: string, endDate?: string): string {
    if (!startDate) return 'Datum volgt';
    const start = formatEventDate(startDate);
    if (!endDate || startDate === endDate) return start;
    
    return `${start} t/m ${formatEventDate(endDate)}`;
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

/**
 * Formats a time string (HH:mm:ss) to HH:mm.
 */
export function formatTime(time?: string | null): string | null {
    if (!time) return null;
    const parts = time.split(':');
    if (parts.length >= 2) return `${parts[0]}:${parts[1]}`;
    return time;
}
