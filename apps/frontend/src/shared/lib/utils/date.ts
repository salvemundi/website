// MISSING SOURCE REQUIREMENT: Stubbed to satisfy compiler
export function isEventPast(dateStr?: string): boolean {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    return date < new Date();
}
