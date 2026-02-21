'use client';

import { useRouter } from 'next/navigation';
import EventList from '@/entities/activity/ui/EventList';
import FeaturedEvent from '@/entities/activity/ui/FeaturedEvent';

export function EventListIsland({ events, variant }: { events: any[], variant?: 'list' | 'grid' }) {
    const router = useRouter();
    return <EventList events={events} onEventClick={(e) => router.push(`/activiteiten/${e.id}`)} variant={variant} />;
}

export function FeaturedEventIsland({ event }: { event: any }) {
    const router = useRouter();
    return <FeaturedEvent event={event} onEventClick={(e) => router.push(`/activiteiten/${e.id}`)} />;
}
