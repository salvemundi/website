import { getMyTickets } from '@/server/actions/activiteit-actions';
import TicketListIsland from '@/components/islands/activities/TicketListIsland';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export const metadata = {
    title: 'Mijn Tickets | Salve Mundi',
    description: 'Bekijk al je actieve tickets voor aankomende activiteiten.',
};

export default async function TicketsPage() {
    // NUCLEAR SSR: Fetch tickets at the top level
    const tickets = await getMyTickets();

    return (
        <div className="pt-8">
            <h1 className="sr-only">Mijn Tickets</h1>
            
            <div className="container mx-auto px-4 py-12 max-w-7xl">
                <div className="mb-8 flex items-center justify-between">
                    <Link 
                        href="/profiel" 
                        className="inline-flex items-center gap-2 p-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--theme-purple)] transition-all active:scale-95 shadow-sm"
                        title="Terug naar profiel"
                    >
                        <ChevronLeft className="h-5 w-5" />
                        <span className="text-sm font-bold pr-1">Terug</span>
                    </Link>
                </div>
                <TicketListIsland tickets={tickets} />
            </div>
        </div>
    );
}

