import { Suspense } from 'react';
import PageHeader from '@/components/ui/layout/PageHeader';
import { getTrips } from '@/server/actions/admin-reis.actions';
import ReisInstellingenIsland from '@/components/islands/admin/ReisInstellingenIsland';
import { Loader2 } from 'lucide-react';

export default async function ReisInstellingenPage() {
    return (
        <main className="min-h-screen bg-[var(--bg-main)]">
            <PageHeader 
                title="Reis Instellingen" 
                backLink="/beheer/reis"
            />
            
            <Suspense fallback={<SettingsPageLoader />}>
                <SettingsDataWrapper />
            </Suspense>
        </main>
    );
}

async function SettingsDataWrapper() {
    const trips = await getTrips();

    return (
        <ReisInstellingenIsland 
            initialTrips={trips}
        />
    );
}

function SettingsPageLoader() {
    return (
        <div className="container mx-auto px-4 py-12 flex flex-col items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-[var(--theme-purple)] mb-4" />
            <p className="text-[var(--text-muted)] font-bold uppercase tracking-widest text-xs">Instellingen laden...</p>
        </div>
    );
}
