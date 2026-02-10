export function isEventPast(dateString?: string | null): boolean {
    if (!dateString) return false;
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return false;
    const endOfDay = new Date(d);
    endOfDay.setHours(23, 59, 59, 999);
    return Date.now() > endOfDay.getTime();
}

export function isEventUpcoming(dateString?: string | null): boolean {
    if (!dateString) return false;
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return false;
    const endOfDay = new Date(d);
    endOfDay.setHours(23, 59, 59, 999);
    return Date.now() <= endOfDay.getTime();
}

/**
 * Safely formats a date string or Date object to YYYY-MM-DD without timezone shifts.
 * Use this for 'pure' dates like birthdays where time and timezone don't matter.
 */
export function formatDateToLocalISO(date: string | Date | null | undefined): string {
    if (!date) return '';
    
    if (typeof date === 'string') {
        // If it's already a date string (YYYY-MM-DD), return the date part
        return date.split('T')[0];
    }
    
    // For Date objects, use local time components to build the string
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Parses a YYYY-MM-DD string into a Date object at midnight local time.
 */
export function parseLocalISOToDate(dateString: string | null | undefined): Date | null {
    if (!dateString) return null;
    const [year, month, day] = dateString.split('T')[0].split('-').map(Number);
    if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
    return new Date(year, month - 1, day);
}
