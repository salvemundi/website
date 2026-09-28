import KroegentochtEventForm from '@/components/islands/beheer/kroegentocht/KroegentochtEventForm';
import { getPubCrawlEvent } from '@/server/actions/beheer/kroegentocht/beheer-kroegentocht-core.actions';
import { notFound } from 'next/navigation';
import BeheerPageShell from '@/components/ui/beheer/BeheerPageShell';

export const metadata = {
    title: 'Kroegentocht Event Bewerken | Salve Mundi'
};

interface EditKroegentochtPageProps {
    params: Promise<{ id: string }>;
}

export default async function EditKroegentochtPage({ params }: EditKroegentochtPageProps) {
    const { id } = await params;
    const event = await getPubCrawlEvent(id).catch(() => null);

    if (!event) notFound();

    return (
        <BeheerPageShell
            title="Event Bewerken"
            subtitle={`Beheer de gegevens van ${event.name}`}
            backHref="/beheer/kroegentocht"
        >
            <KroegentochtEventForm event={event} />
        </BeheerPageShell>
    );
}
