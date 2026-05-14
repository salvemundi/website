import { format, parseISO, endOfDay } from 'date-fns';
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
    } catch (_error) {
        return 'Datum volgt';
    }
}

/**
 * Formats a date range into a readable format (e.g. 'dd-MM-yyyy t/m dd-MM-yyyy').
 */
export function formatDateRange(
    start: string | Date | number | undefined | null,
    end: string | Date | number | undefined | null,
    formatStr: string = 'dd-MM-yyyy'
): string {
    if (!start) return 'Datum volgt';
    const startFormatted = formatDate(start, formatStr);

    if (!end) return startFormatted;

    const endFormatted = formatDate(end, formatStr);

    // If same day, just show one date
    if (startFormatted === endFormatted) return startFormatted;

    return `${startFormatted} t/m ${endFormatted}`;
}

/**
 * Utility to check if an event date is in the past.
 * @param dateStr The date string (ISO)
 * @param timeStr Optional time string (HH:mm)
 * @param isEndTime Whether the timeStr is an end time. If false and timeStr is present, a 2-hour buffer is added.
 * @param now Optional reference date for comparison (defaults to new Date())
 */
export function isEventPast(
    dateStr?: string, 
    timeStr?: string | null, 
    isEndTime: boolean = false,
    now: Date = new Date()
): boolean {
    if (!dateStr) return false;

    try {
        const date = parseISO(dateStr);
        
        // If we have a time string and the date is just a date (not a full ISO datetime)
        if (timeStr && dateStr.length <= 10) {
            const [hours, minutes] = timeStr.split(':').map(Number);
            date.setHours(hours, minutes, 0, 0);

            // If it's a start time, add 2 hours buffer to keep it 'active' during the event
            if (!isEndTime) {
                date.setHours(date.getHours() + 2);
            }

            return date < now;
        }

        // We use endOfDay so that the activity only becomes 'past' after the day has finished.
        return endOfDay(date) < now;
    } catch (_error) {
        return false;
    }
}


