import { Suspense } from 'react';
import PageHeader from '@/components/ui/layout/PageHeader';
import { getTrips } from '@/server/actions/admin-reis.actions';
import ReisMailIsland from '@/components/islands/admin/ReisMailIsland';
import { Loader2 } from 'lucide-react';

export default async function ReisMailPage() {
    return (
        <main className="min-h-screen bg-[var(--bg-main)]">
            <PageHeader 
                title="Reis Email Verzenden" 
                backLink="/beheer/reis"
            />
            
            <Suspense fallback={<MailPageLoader />}>
                <MailDataWrapper />
            </Suspense>
        </main>
    );
}

async function MailDataWrapper() {
    const trips = await getTrips();

    return (
        <ReisMailIsland 
            trips={trips}
        />
    );
}

function MailPageLoader() {
    return (
        <div className="container mx-auto px-4 py-12 flex flex-col items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-[var(--theme-purple)] mb-4" />
            <p className="text-[var(--text-muted)] font-bold uppercase tracking-widest text-xs">Reizen laden...</p>
        </div>
    );
}
