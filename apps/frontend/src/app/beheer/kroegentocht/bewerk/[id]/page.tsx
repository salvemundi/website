import EventForm from '@/components/admin/kroegentocht/EventForm';
import { Beer, Settings } from 'lucide-react';
import { getPubCrawlEvent } from '@/server/actions/admin-kroegentocht.actions';
import { notFound } from 'next/navigation';

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
        <div className="w-full">
            <div className="bg-[var(--bg-card)] border-b border-[var(--border-color)] mb-12">
                <div className="container mx-auto px-4 py-12 max-w-7xl flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-[var(--radius-xl)] bg-[var(--theme-purple)]/10 text-[var(--theme-purple)]">
                            <Settings className="h-6 w-6" />
                        </div>
                        <h1 className="text-3xl font-black text-[var(--text-main)] tracking-widest uppercase">
                            Event <span className="text-[var(--theme-purple)]">Bewerken</span>
                        </h1>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 pb-20">
                <EventForm event={event} />
            </div>
        </div>
    );
}
