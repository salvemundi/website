
/**
 * Returns a local ISO-like string (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss) in Europe/Amsterdam timezone.
 */
export function toLocalISOString(date: Date | string | null | undefined, includeTime = false): string | null {
    if (!date) return null;
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;

    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Europe/Amsterdam',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });

    const parts = formatter.formatToParts(d);
    const getPart = (type: string) => parts.find(p => p.type === type)?.value || '';

    const year = getPart('year');
    const month = getPart('month');
    const day = getPart('day');
    
    if (!includeTime) return `${year}-${month}-${day}`;

    let hours = getPart('hour');
    if (hours === '24') hours = '00';
    const minutes = getPart('minute');
    const seconds = getPart('second');
    
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

/**
 * Converts a local ISO date-time string (YYYY-MM-DDTHH:mm) in Europe/Amsterdam timezone
 * to a UTC ISO-8601 string (e.g. YYYY-MM-DDTHH:mm:ss.sssZ).
 */
export function amsterdamToUTC(dateStr: string | null | undefined): string | null {
    if (!dateStr) return null;
    
    // Check if it's already a full ISO string with timezone
    if (dateStr.includes('Z') || dateStr.includes('+') || (dateStr.includes('-') && dateStr.lastIndexOf('-') > 7)) {
        return new Date(dateStr).toISOString();
    }

    const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
    if (!match) {
        const parsed = new Date(dateStr);
        return isNaN(parsed.getTime()) ? null : parsed.toISOString();
    }
    
    const [_, year, month, day, hours, minutes] = match;
    
    // Create a date object treating the local values as UTC
    const utcDate = new Date(`${year}-${month}-${day}T${hours}:${minutes}:00Z`);
    
    // Format this UTC date in the target timezone (Europe/Amsterdam)
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Europe/Amsterdam',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
    
    const parts = formatter.formatToParts(utcDate);
    const getPart = (type: string) => parts.find(p => p.type === type)?.value || '';
    
    const formattedYear = getPart('year');
    const formattedMonth = getPart('month');
    const formattedDay = getPart('day');
    let formattedHours = getPart('hour');
    if (formattedHours === '24') formattedHours = '00';
    const formattedMinutes = getPart('minute');
    const formattedSeconds = getPart('second');
    
    // Parse the formatted string as if it was UTC
    const localParsed = new Date(`${formattedYear}-${formattedMonth}-${formattedDay}T${formattedHours}:${formattedMinutes}:${formattedSeconds}Z`);
    
    // The difference gives us the timezone offset
    const diffMs = utcDate.getTime() - localParsed.getTime();
    
    // Adjust the date to get the real UTC timestamp
    const targetDate = new Date(utcDate.getTime() + diffMs);
    return targetDate.toISOString();
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

/**
 * Extracts a timezone-safe ISO date string (YYYY-MM-DD) from a string or Date object.
 */
export function toISODate(dateInput: Date | string | null | undefined): string {
    if (!dateInput) return '';
    
    if (typeof dateInput === 'string') {
        const match = dateInput.match(/^\d{4}-\d{2}-\d{2}$/);
        if (match) return match[0];
    }
    
    const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
    if (isNaN(d.getTime())) return '';
    
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Formats a date to a short Dutch format (e.g. 15 okt. 24).
 */
export function formatShortDate(date: Date | string | null | undefined): string {
    if (!date) return '-';
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return '-';

    return new Intl.DateTimeFormat('nl-NL', {
        day: 'numeric',
        month: 'short',
        year: '2-digit'
    }).format(d);
}
