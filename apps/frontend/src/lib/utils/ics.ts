import { amsterdamToUTC } from './date-utils';

export interface IcsEvent {
    uid: string;
    title: string;
    description?: string | null;
    location?: string | null;
    /** Local (Europe/Amsterdam) date, e.g. 2026-08-24 */
    date: string;
    /** Local (Europe/Amsterdam) start time, e.g. 14:30 or 14:30:00 */
    timeStart: string;
    /** Local (Europe/Amsterdam) end time, optional */
    timeEnd?: string | null;
}

function toUtcStamp(date: string, time: string): string | null {
    const hhmm = time.slice(0, 5);
    const utc = amsterdamToUTC(`${date}T${hhmm}`);
    if (!utc) return null;
    return utc.replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

function escapeIcsText(value: string): string {
    return value
        .replace(/\\/g, '\\\\')
        .replace(/;/g, '\\;')
        .replace(/,/g, '\\,')
        .replace(/\n/g, '\\n');
}

function foldLine(line: string): string {
    if (line.length <= 75) return line;
    const chunks: string[] = [];
    let rest = line;
    while (rest.length > 75) {
        chunks.push(rest.slice(0, 75));
        rest = ' ' + rest.slice(75);
    }
    chunks.push(rest);
    return chunks.join('\r\n');
}

export function buildIcsCalendar(events: IcsEvent[], calendarName: string): string {
    const now = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');

    const lines: string[] = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Salve Mundi//Intro Planning//NL',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        `X-WR-CALNAME:${escapeIcsText(calendarName)}`,
        'X-WR-TIMEZONE:Europe/Amsterdam',
        'REFRESH-INTERVAL;VALUE=DURATION:PT1H',
        'X-PUBLISHED-TTL:PT1H'
    ];

    for (const event of events) {
        const dtStart = toUtcStamp(event.date, event.timeStart);
        if (!dtStart) continue;
        const dtEnd = event.timeEnd ? toUtcStamp(event.date, event.timeEnd) : null;

        lines.push('BEGIN:VEVENT');
        lines.push(`UID:${event.uid}@salvemundi.nl`);
        lines.push(`DTSTAMP:${now}`);
        lines.push(`DTSTART:${dtStart}`);
        if (dtEnd) lines.push(`DTEND:${dtEnd}`);
        lines.push(foldLine(`SUMMARY:${escapeIcsText(event.title)}`));
        if (event.description) lines.push(foldLine(`DESCRIPTION:${escapeIcsText(event.description)}`));
        if (event.location) lines.push(foldLine(`LOCATION:${escapeIcsText(event.location)}`));
        lines.push('END:VEVENT');
    }

    lines.push('END:VCALENDAR');
    return lines.join('\r\n') + '\r\n';
}
