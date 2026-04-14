import { Suspense } from 'react';
import { getMyTickets } from '@/server/actions/activiteit-actions';
import TicketListIsland from '@/components/islands/activities/TicketListIsland';

export const metadata = {
    title: 'Mijn Tickets | Salve Mundi',
    description: 'Bekijk al je actieve tickets voor aankomende activiteiten.',
};

export default async function TicketsPage() {
    return (
        <div className="pt-8">
            <h1 className="sr-only">Mijn Tickets</h1>
            
            <div className="container mx-auto px-4 py-12 max-w-7xl">
                <Suspense fallback={
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-48 bg-[var(--bg-card)] rounded-[2.5rem] border border-[var(--border-color)] skeleton-active" />
                        ))}
                    </div>
                }>
                    <TicketsDataLoader />
                </Suspense>
            </div>
        </div>
    );
}

async function TicketsDataLoader() {
    const tickets = await getMyTickets();
    return <TicketListIsland tickets={tickets} />;
}
