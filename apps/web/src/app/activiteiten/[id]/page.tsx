import { getEventAction } from '@/shared/api/event-actions';
import EventDetailClient from './EventDetailClient';
import PageHeader from '@/widgets/page-header/ui/PageHeader';

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const event = await getEventAction(id);

    // Handle 404 / Error State on server side
    if (!event) {
        return (
            <div className="relative min-h-screen">
                <PageHeader
                    title="Activiteit niet gevonden"
                    backgroundImage="/img/backgrounds/Kroto2025.jpg"
                />
                <main className="mx-auto max-w-app px-4 py-8 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <p className="text-lg font-bold mb-4">De gevraagde activiteit kon niet worden gevonden.</p>
                        <a
                            href="/activiteiten"
                            className="inline-flex items-center gap-2 bg-theme-purple text-white font-bold py-2 px-4 rounded-xl"
                        >
                            Terug naar activiteiten
                        </a>
                    </div>
                </main>
            </div>
        );
    }

    return <EventDetailClient initialEvent={event} />;
}
