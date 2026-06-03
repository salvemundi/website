const toDate = (d: string | Date | number) => new Date(d);

export function formatDate(
    date: string | Date | number | undefined | null,
    formatStr: string = 'dd-MM-yyyy'
): string {
    if (!date) return 'Datum volgt';
    const d = toDate(date);
    if (isNaN(d.getTime())) return 'Datum volgt';

    switch (formatStr) {
        case 'dd-MM-yyyy':
            return new Intl.DateTimeFormat('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d);
        case 'EEEE d MMMM':
            return new Intl.DateTimeFormat('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' }).format(d);
        case 'd MMMM yyyy':
            return new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' }).format(d);
        case 'd MMM yyyy':
            return new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' }).format(d);
        case 'yyyy-MM-dd':
            return d.toISOString().split('T')[0];
        case 'd MMMM yyyy HH:mm':
            return new Intl.DateTimeFormat('nl-NL', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }).format(d);
        default:
            return d.toLocaleDateString('nl-NL');
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