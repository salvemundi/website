import { getMyTickets } from '@/server/actions/activiteit-actions';
import TicketListIsland from '@/components/islands/activities/TicketListIsland';

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
                <TicketListIsland tickets={tickets} />
            </div>
        </div>
    );
}

