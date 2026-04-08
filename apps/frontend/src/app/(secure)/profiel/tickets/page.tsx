import { Suspense } from 'react';
import { getMyTickets } from '@/server/actions/activiteit-actions';
import TicketListIsland from '@/components/islands/activities/TicketListIsland';
import PageHeader from '@/components/ui/layout/PageHeader';
import { TicketListSkeleton } from '@/components/ui/activities/TicketListSkeleton';

export const metadata = {
    title: 'Mijn Tickets | Salve Mundi',
    description: 'Bekijk al je actieve tickets voor aankomende activiteiten.',
};

export default async function TicketsPage() {
    return (
        <main className="min-h-screen bg-[var(--bg-main)]">
            <PageHeader 
                title="MIJN TICKETS"
                backgroundImage="/img/backgrounds/Kroto2025.jpg"
                variant="centered"
                contentPadding="py-16"
            />
            
            <div className="container mx-auto px-4 py-12 max-w-7xl">
                <Suspense fallback={<TicketListSkeleton />}>
                    <TicketsDataLoader />
                </Suspense>
            </div>
        </main>
    );
}

async function TicketsDataLoader() {
    const tickets = await getMyTickets();
    return <TicketListIsland tickets={tickets} />;
}
