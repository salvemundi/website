import { Suspense } from 'react';
import PageHeader from '@/components/ui/layout/PageHeader';
import KroegentochtConfirmationIsland from '@/components/islands/kroegentocht/KroegentochtConfirmationIsland';
import { Loader2 } from 'lucide-react';

export const metadata = {
    title: 'Bevestiging Kroegentocht | SV Salve Mundi',
    description: 'Bedankt voor je inschrijving!',
};

export default function KroegentochtBevestigingPage() {
    return (
        <div>
            <PageHeader
                title="BEVESTIGING"
                backgroundImage="/img/backgrounds/Kroto2025.jpg"
                contentPadding="py-16"
                imageFilter="brightness(0.4)"
                variant="centered"
            />

            <main className="mx-auto max-w-4xl px-4 py-12">
                <div className="bg-[var(--bg-card)] dark:border dark:border-white/10 rounded-3xl shadow-xl p-8 sm:p-12">
                    <Suspense fallback={
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 className="w-12 h-12 text-[var(--color-purple-theme)] animate-spin mb-6" />
                            <h1 className="text-2xl font-black mb-2 animate-pulse">Status controleren...</h1>
                        </div>
                    }>
                        <KroegentochtConfirmationIsland />
                    </Suspense>
                </div>
            </main>
        </div>
    );
}
