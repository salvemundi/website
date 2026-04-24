import EventForm from '@/components/admin/kroegentocht/EventForm';
import { getPubCrawlEvent } from '@/server/actions/admin-kroegentocht.actions';
import { notFound } from 'next/navigation';
import AdminPageShell from '@/components/ui/admin/AdminPageShell';

export const metadata = {
    title: 'Kroegentocht Event Bewerken | Salve Mundi',
};

interface EditKroegentochtPageProps {
    params: Promise<{ id: string }>;
}

export default async function EditKroegentochtPage({ params }: EditKroegentochtPageProps) {
    const { id } = await params;
    const event = await getPubCrawlEvent(id).catch(() => null);

    if (!event) notFound();

    return (
        <AdminPageShell
            title="Event Bewerken"
            subtitle={`Beheer de gegevens van ${event.name}`}
            backHref="/beheer/kroegentocht"
        >
            <div className="container mx-auto px-4 pb-20 py-12">
                <EventForm event={event} />
            </div>
        </AdminPageShell>
    );
}
