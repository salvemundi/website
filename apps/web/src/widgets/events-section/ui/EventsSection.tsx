import { getEvents } from '@/shared/api/salvemundi-server';
import EventsSectionClient from './EventsSectionClient';

export default async function EventsSection() {
    // Fetch events directly on the server
    const events = await getEvents();

    return <EventsSectionClient events={events} />;
}
