import EventForm from '@/components/admin/kroegentocht/EventForm';
import { Beer } from 'lucide-react';

export const metadata = {
    title: 'Nieuw Kroegentocht Event | Salve Mundi',
};

export default function NewKroegentochtPage() {
    return (
        <div className="w-full">
            <div className="bg-[var(--bg-card)] border-b border-[var(--border-color)] mb-12">
                <div className="container mx-auto px-4 py-12 max-w-7xl flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-[var(--radius-xl)] bg-[var(--theme-purple)]/10 text-[var(--theme-purple)]">
                            <Beer className="h-6 w-6" />
                        </div>
                        <h1 className="text-3xl font-black text-[var(--text-main)] tracking-widest uppercase">
                            Nieuw <span className="text-[var(--theme-purple)]">Event</span>
                        </h1>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 pb-20">
                <EventForm />
            </div>
        </div>
    );
}
