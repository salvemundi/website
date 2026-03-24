import { Suspense } from 'react';
import { getMyTickets } from '@/server/actions/activiteit-actions';
import TicketListIsland from '@/components/islands/activities/TicketListIsland';
import PageHeader from '@/components/ui/layout/PageHeader';
import { Loader2 } from 'lucide-react';

export const metadata = {
    title: 'Mijn Tickets | Salve Mundi',
    description: 'Bekijk al je actieve tickets voor aankomende activiteiten.',
};

export default async function TicketsPage() {
    const tickets = await getMyTickets();

    return (
        <main className="min-h-screen bg-[var(--bg-main)]">
            <PageHeader 
                title="MIJN TICKETS"
                backgroundImage="/img/backgrounds/Kroto2025.jpg"
                variant="centered"
                contentPadding="py-16"
            />
            
            <div className="container mx-auto px-4 py-12 max-w-7xl">
                <Suspense fallback={
                    <div className="flex flex-col items-center justify-center py-40">
                        <Loader2 className="h-10 w-10 animate-spin text-[var(--theme-purple)] mb-4" />
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)] animate-pulse">Tickets ophalen uit de kluis...</p>
                    </div>
                }>
                    <TicketListIsland tickets={tickets} />
                </Suspense>
            </div>
        </main>
    );
}
