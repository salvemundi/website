/** Choose the next event, or the most recent event when none are upcoming. */
export function selectPubCrawlEvent<T extends { date?: string | null }>(events: T[], now = new Date()): T | null {
    const dated = events.filter(event => event.date && Number.isFinite(new Date(event.date).getTime()));
    const upcoming = dated.filter(event => new Date(event.date!).getTime() >= now.getTime())
        .sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime());
    return upcoming[0] ?? [...dated].sort((a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime())[0] ?? events[0] ?? null;
}
