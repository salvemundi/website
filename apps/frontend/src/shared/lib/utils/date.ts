const TIMEZONE = 'Europe/Amsterdam';

export const toDate = (d: string | Date | number): Date => {
    if (d instanceof Date) return d;
    if (typeof d === 'number') return new Date(d);
    if (typeof d === 'string') {
        const trimmed = d.trim();
        // Check if string contains date & time without timezone offset (e.g. "2026-10-27 19:00:00" or "2026-10-27T19:00:00")
        if (
            (trimmed.includes(' ') || trimmed.includes('T')) &&
            !trimmed.endsWith('Z') &&
            !trimmed.slice(10).includes('+') &&
            !trimmed.slice(10).includes('-')
        ) {
            return new Date(`${trimmed.replace(' ', 'T')}Z`);
        }
        return new Date(trimmed);
    }
    return new Date(d);
};

export function toLocalInputValue(date: string | Date | number | undefined | null): string {
    if (!date) return '';
    const d = toDate(date);
    if (isNaN(d.getTime())) return '';
    const offset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - offset).toISOString().slice(0, 16);
}

export function formatDate(
    date: string | Date | number | undefined | null,
    formatStr: string = 'dd-MM-yyyy',
    fallback: string = 'Datum volgt'
): string {
    if (!date) return fallback;
    const d = toDate(date);
    if (isNaN(d.getTime())) return fallback;

    switch (formatStr) {
        case 'dd-MM-yyyy':
            return new Intl.DateTimeFormat('nl-NL', { timeZone: TIMEZONE, day: '2-digit', month: '2-digit', year: 'numeric' }).format(d);
        case 'EEEE d MMMM':
            return new Intl.DateTimeFormat('nl-NL', { timeZone: TIMEZONE, weekday: 'long', day: 'numeric', month: 'long' }).format(d);
        case 'EEE d MMM':
            return new Intl.DateTimeFormat('nl-NL', { timeZone: TIMEZONE, weekday: 'short', day: 'numeric', month: 'short' }).format(d);
        case 'EEE':
            return new Intl.DateTimeFormat('nl-NL', { timeZone: TIMEZONE, weekday: 'short' }).format(d);
        case 'd MMM':
            return new Intl.DateTimeFormat('nl-NL', { timeZone: TIMEZONE, day: 'numeric', month: 'short' }).format(d);
        case 'd MMMM yyyy':
            return new Intl.DateTimeFormat('nl-NL', { timeZone: TIMEZONE, day: 'numeric', month: 'long', year: 'numeric' }).format(d);
        case 'd MMM yyyy':
            return new Intl.DateTimeFormat('nl-NL', { timeZone: TIMEZONE, day: 'numeric', month: 'short', year: 'numeric' }).format(d);
        case 'yyyy-MM-dd':
            return new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
        case 'dd-MM-yyyy HH:mm': {
            const formatter = new Intl.DateTimeFormat('nl-NL', {
                timeZone: TIMEZONE,
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
            const parts = formatter.formatToParts(d);
            const partMap = Object.fromEntries(parts.map(p => [p.type, p.value]));
            return `${partMap.day}-${partMap.month}-${partMap.year} ${partMap.hour}:${partMap.minute}`;
        }
        case 'd MMMM yyyy HH:mm':
            return new Intl.DateTimeFormat('nl-NL', {
                timeZone: TIMEZONE,
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }).format(d);
        default:
            return new Intl.DateTimeFormat('nl-NL', { timeZone: TIMEZONE }).format(d);
    }
}

export function startOfDay(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
}

export function endOfDay(date: Date): Date {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
}

export function isBefore(date: Date, compare: Date): boolean {
    return date.getTime() < compare.getTime();
}

export function isSameDay(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate();
}

export function differenceInYears(dateLeft: Date, dateRight: Date): number {
    let age = dateLeft.getFullYear() - dateRight.getFullYear();
    const m = dateLeft.getMonth() - dateRight.getMonth();
    if (m < 0 || (m === 0 && dateLeft.getDate() < dateRight.getDate())) {
        age--;
    }
    return age;
}

export function addMonths(date: Date, months: number): Date {
    const d = new Date(date);
    d.setMonth(d.getMonth() + months);
    return d;
}

export function subMonths(date: Date, months: number): Date {
    const d = new Date(date);
    d.setMonth(d.getMonth() - months);
    return d;
}

export function formatDateRange(start: string | Date | number | undefined | null, end: string | Date | number | undefined | null, formatStr: string = 'dd-MM-yyyy'): string {
    if (!start) return 'Datum volgt';
    const startFormatted = formatDate(start, formatStr);
    if (!end) return startFormatted;
    const endFormatted = formatDate(end, formatStr);
    return startFormatted === endFormatted ? startFormatted : `${startFormatted} t/m ${endFormatted}`;
}

export function isEventPast(dateStr?: string, timeStr?: string | null, isEndTime: boolean = false, now: Date = new Date()): boolean {
    if (!dateStr) return false;
    try {
        const date = new Date(dateStr);
        if (timeStr && dateStr.length <= 10) {
            const [hours, minutes] = timeStr.split(':').map(Number);
            date.setHours(hours, minutes, 0, 0);
            if (!isEndTime) date.setHours(date.getHours() + 2);
            return date < now;
        }
        return endOfDay(date) < now;
    } catch { return false; }
}

export function isDeadlinePassed(deadline?: string | Date | null, now: Date = new Date()): boolean {
    if (!deadline) return false;
    try {
        if (typeof deadline === 'string') {
            const trimmed = deadline.trim();
            if (!trimmed) return false;

            if (trimmed.length <= 10 && !trimmed.includes('T') && !trimmed.includes(' ')) {
                const parts = trimmed.split('-').map(Number);
                if (parts.length === 3 && !parts.some(isNaN)) {
                    const [year, month, day] = parts;
                    const d = new Date(year, month - 1, day, 23, 59, 59, 999);
                    return d.getTime() < now.getTime();
                }
                return endOfDay(new Date(trimmed)).getTime() < now.getTime();
            }

            const d = new Date(trimmed);
            if (isNaN(d.getTime())) return false;
            return d.getTime() < now.getTime();
        }

        const d = new Date(deadline);
        if (isNaN(d.getTime())) return false;
        return d.getTime() < now.getTime();
    } catch {
        return false;
    }
}

export function isEventOnDay(
    event: { event_date: string | Date; event_date_end?: string | Date | null },
    day: Date
): boolean {
    const start = toDate(event.event_date);
    if (isNaN(start.getTime())) return false;
    const end = event.event_date_end ? toDate(event.event_date_end) : start;
    const validEnd = isNaN(end.getTime()) ? start : end;

    const d = new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime();
    const s = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
    const e = new Date(validEnd.getFullYear(), validEnd.getMonth(), validEnd.getDate()).getTime();

    return d >= s && d <= e;
}