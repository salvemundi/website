import { Suspense } from 'react';
import PageHeader from '@/components/ui/layout/PageHeader';
import { getTrips } from '@/server/actions/admin-reis.actions';
import ReisActiviteitenIsland from '@/components/islands/admin/ReisActiviteitenIsland';
import { Loader2 } from 'lucide-react';

export default async function ReisActiviteitenPage() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
            <PageHeader 
                title="Trip Activiteiten Beheer" 
                description="Beheer de optionele activiteiten en kosten voor reizen"
                backLink="/beheer/reis"
                className="mb-0"
                contentPadding="pt-0 pb-2 sm:pt-0 sm:pb-2"
            />
            
            <Suspense fallback={
                <div className="flex justify-center py-20">
                    <Loader2 className="animate-spin h-10 w-10 text-purple-600" />
                </div>
            }>
                <ReisActiviteitenLoader />
            </Suspense>
        </div>
    );
}

async function ReisActiviteitenLoader() {
    const trips = await getTrips();
    
    return (
        <ReisActiviteitenIsland initialTrips={trips} />
    );
}
