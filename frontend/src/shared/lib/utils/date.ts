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
