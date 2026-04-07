import React from 'react';
import KroegentochtTicketsIsland from '@/components/islands/kroegentocht/KroegentochtTicketsIsland';
import KroegentochtFormIsland from '@/components/islands/kroegentocht/KroegentochtFormIsland';
import { KroegentochtInfo } from './KroegentochtInfo';

/**
 * Dimension-perfect skeleton voor de Kroegentocht pagina.
 * Gebruikt de hybride componenten in hun loading-state om CLS te voorkomen.
 */
export function KroegentochtTicketsSkeleton() {
    return <KroegentochtTicketsIsland isLoading />;
}

export function KroegentochtFormSkeleton() {
    return <KroegentochtFormIsland isLoading />;
}

export function KroegentochtInfoSkeleton() {
    return <KroegentochtInfo isLoading />;
}

export default function KroegentochtSkeleton() {
    return (
        <div className="mx-auto max-w-app px-4 py-8 sm:py-10 md:py-12">
            <KroegentochtTicketsSkeleton />
            <div className="mt-8 flex flex-col lg:flex-row gap-8">
                <KroegentochtFormSkeleton />
                <KroegentochtInfoSkeleton />
            </div>
        </div>
    );
}
