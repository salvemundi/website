import React from 'react';
import { HeroIsland } from '@/components/islands/layout/HeroIsland';
import { EventsSection } from '@/components/ui/activities/EventsSection';
import { JoinSectionIsland } from '@/components/islands/membership/JoinSectionIsland';
import { SponsorsSection } from '@/components/ui/layout/SponsorsSection';

/**
 * Proxy skeletons voor de homepagina secties.
 * Gebruiken de ingebouwde skeletons van de echte componenten om CLS te voorkomen.
 */

export function HeroSkeleton() {
    return <HeroIsland isLoading />;
}

export function EventsSkeleton() {
    return <EventsSection isLoading />;
}

export function JoinSkeleton() {
    return <JoinSectionIsland isLoading />;
}

export function SponsorsSkeleton() {
    return <SponsorsSection isLoading />;
}

export function HomePageSkeleton() {
    return (
        <main>
            <HeroSkeleton />
            <EventsSkeleton />
            <JoinSkeleton />
            <SponsorsSkeleton />
        </main>
    );
}


