/** Choose the next event, or the most recent event when none are upcoming. */
export function selectPubCrawlEvent<T extends { date?: string | null }>(events: T[], now = new Date()): T | null {
    let first: T | null = null;
    let upcoming: T | null = null;
    let upcomingTime = Infinity;
    let latest: T | null = null;
    let latestTime = -Infinity;

    for (const event of events) {
        first ??= event;
        if (!event.date) continue;

        const time = new Date(event.date).getTime();
        if (!Number.isFinite(time)) continue;

        if (time >= now.getTime() && time < upcomingTime) {
            upcoming = event;
            upcomingTime = time;
        }
        if (time > latestTime) {
            latest = event;
            latestTime = time;
        }
    }

    return upcoming ?? latest ?? first;
}
