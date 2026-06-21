import { safeConsoleError } from '@/server/utils/logger';

export const buildCommitteeEmail = (name?: string | null): string | undefined => {
    if (!name) return undefined;
    const normalized = name.toLowerCase();

    if (normalized.includes('feest')) return 'feest@salvemundi.nl';
    if (normalized.includes('activiteit')) return 'activiteiten@salvemundi.nl';
    if (normalized.includes('studie')) return 'studie@salvemundi.nl';
    if (normalized.includes('intro')) return 'intro@salvemundi.nl';
    if (normalized.includes('media')) return 'media@salvemundi.nl';
    if (normalized.includes('kroegentocht')) return 'kroegentocht@salvemundi.nl';
    if (normalized.includes('reis')) return 'reis@salvemundi.nl';
    if (normalized.includes('kas')) return 'kas@salvemundi.nl';

    const slug = name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/commissie|committee/g, '')
        .replace(/[^a-z0-9]+/g, '')
        .trim();

    if (!slug) return undefined;
    return `${slug}@salvemundi.nl`;
};

export const formatDutchDate = (dateStr?: string | null): string | null => {
    if (!dateStr) return null;
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;

        return new Intl.DateTimeFormat('nl-NL', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }).format(date);
    } catch (error) {
        safeConsoleError('[activity-utils.ts][formatDutchDate] ', error);
        return dateStr;
    }
};

export const formatTime = (timeStr?: string | null): string | null => {
    if (!timeStr) return null;
    const parts = timeStr.split(':');
    if (parts.length >= 2) return `${parts[0]}:${parts[1]}`;
    return timeStr;
};

export function formatActivityDateTime(
    activity: {
        datum_start: string;
        datum_eind?: string | null;
        event_time?: string | null;
        event_time_end?: string | null;
    },
    variant: 'list' | 'grid' | 'detail'
): { displayDate: string; timeRange: string | null } {
    const date = activity.datum_start;
    const endDate = activity.datum_eind;
    const startTime = activity.event_time;
    const endTime = activity.event_time_end;

    const startDateObj = date ? new Date(date) : null;
    const endDateObj = endDate ? new Date(endDate) : null;

    const isMultiDay = startDateObj && endDateObj && !isNaN(startDateObj.getTime()) && !isNaN(endDateObj.getTime()) &&
        (startDateObj.getFullYear() !== endDateObj.getFullYear() ||
         startDateObj.getMonth() !== endDateObj.getMonth() ||
         startDateObj.getDate() !== endDateObj.getDate());

    const start = startTime ? startTime.split(':').slice(0, 2).join(':') : null;
    const end = endTime ? endTime.split(':').slice(0, 2).join(':') : null;

    if (isMultiDay) {
        const startYear = startDateObj.getFullYear();
        const endYear = endDateObj.getFullYear();
        const includeWeekday = variant === 'list' || variant === 'detail';

        const startStr = new Intl.DateTimeFormat('nl-NL', {
            weekday: includeWeekday ? 'long' : undefined,
            day: 'numeric',
            month: 'long',
            year: startYear !== endYear ? 'numeric' : undefined
        }).format(startDateObj);

        const endStr = new Intl.DateTimeFormat('nl-NL', {
            weekday: includeWeekday ? 'long' : undefined,
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }).format(endDateObj);

        const startTimeSuffix = start ? ` ${start}` : '';
        const endTimeSuffix = end ? ` ${end}` : '';

        return {
            displayDate: `${startStr}${startTimeSuffix} t/m ${endStr}${endTimeSuffix}`,
            timeRange: null
        };
    } else {
        let displayDate = '';
        if (date) {
            const d = new Date(date);
            if (!isNaN(d.getTime())) {
                if (variant === 'list') {
                    displayDate = new Intl.DateTimeFormat('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' }).format(d);
                } else if (variant === 'detail') {
                    displayDate = new Intl.DateTimeFormat('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(d);
                } else {
                    displayDate = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' }).format(d);
                }
            }
        }

        const timeRange = start ? (end ? `${start} - ${end}` : start) : null;

        return {
            displayDate,
            timeRange
        };
    }
}