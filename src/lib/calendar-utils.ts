import { addHours, parseISO } from 'date-fns';

interface CalendarEvent {
    id: number | string;
    name: string;
    description?: string;
    event_date: string; // ISO string
    location?: string;
}

const formatDateForICS = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
};

const formatDateForGoogle = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
};

export const generateICS = (events: CalendarEvent[]): string => {
    let icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Salve Mundi//Website//NL',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
    ];

    events.forEach((event) => {
        const startDate = parseISO(event.event_date);
        const endDate = addHours(startDate, 3); // Default to 3 hours
        const now = new Date();

        icsContent = [
            ...icsContent,
            'BEGIN:VEVENT',
            `UID:${event.id}@salvemundi.nl`,
            `DTSTAMP:${formatDateForICS(now)}`,
            `DTSTART:${formatDateForICS(startDate)}`,
            `DTEND:${formatDateForICS(endDate)}`,
            `SUMMARY:${event.name}`,
            `DESCRIPTION:${(event.description || '').replace(/\n/g, '\\n')}`,
            `LOCATION:${event.location || 'Salve Mundi'}`,
            'END:VEVENT',
        ];
    });

    icsContent.push('END:VCALENDAR');
    return icsContent.join('\r\n');
};

export const downloadICS = (events: CalendarEvent[], filename: string = 'salve-mundi-events.ics') => {
    const content = generateICS(events);
    const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export const getGoogleCalendarUrl = (event: CalendarEvent): string => {
    const startDate = parseISO(event.event_date);
    const endDate = addHours(startDate, 3);

    const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: event.name,
        dates: `${formatDateForGoogle(startDate)}/${formatDateForGoogle(endDate)}`,
        details: event.description || '',
        location: event.location || 'Salve Mundi',
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

export const getOutlookCalendarUrl = (event: CalendarEvent): string => {
    const startDate = parseISO(event.event_date);
    const endDate = addHours(startDate, 3);

    const params = new URLSearchParams({
        path: '/calendar/action/compose',
        rru: 'addevent',
        startdt: startDate.toISOString(),
        enddt: endDate.toISOString(),
        subject: event.name,
        body: event.description || '',
        location: event.location || 'Salve Mundi',
    });

    return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
};
