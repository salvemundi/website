import React from 'react';
import ActivityDetailIsland from '@/components/islands/activities/ActivityDetailIsland';
import EventSignupIsland from '@/components/islands/activities/EventSignupIsland';

/**
 * Proxy voor de Activity Detail pagina in loading-state.
 * Gebruikt de ingebouwde skeletons van de echte componenten om CLS te voorkomen.
 */
export default function ActivityDetailSkeleton({ isMember = false, isPast = false }: { isMember?: boolean, isPast?: boolean }) {
    return (
        <ActivityDetailIsland isLoading>
            <EventSignupIsland isLoading isMember={isMember} isPast={isPast} />
        </ActivityDetailIsland>
    );
}

