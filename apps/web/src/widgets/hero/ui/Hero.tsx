import { getEvents, getHeroBanners } from '@/shared/api/salvemundi-server';
import HeroClient from './HeroClient';

export default async function Hero() {
    // Fetch data directly on the server
    const [events, heroBanners] = await Promise.all([
        getEvents(),
        getHeroBanners()
    ]);

    // Calculate next event on the server
    const nextEvent = (() => {
        if (!events?.length) return null;

        const now = new Date();
        const upcoming = [...events]
            .map((event) => ({
                event,
                raw: event.event_date,
                date: event.event_date ? new Date(event.event_date) : null,
            }))
            .filter((candidate) => candidate.date && !Number.isNaN(candidate.date.valueOf()))
            .sort((a, b) => (a.date!.valueOf() - b.date!.valueOf()));

        const found = upcoming.find((candidate) => {
            const { raw, date } = candidate as { raw: string; date: Date };
            if (!date) return false;
            const hasTime = /T|\d:\d{2}/.test(String(raw));
            if (hasTime) return date >= now;
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);
            return endOfDay >= now;
        });

        return found?.event ?? upcoming[0]?.event ?? null;
    })();

    return <HeroClient heroBanners={heroBanners} nextEvent={nextEvent} />;
}
