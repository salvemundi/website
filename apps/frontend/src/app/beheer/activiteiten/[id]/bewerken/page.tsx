import { Suspense } from 'react';
import PageHeader from '@/components/ui/layout/PageHeader';
import ActiviteitBewerkenIsland from '@/components/islands/admin/activities/ActiviteitBewerkenIsland';
import ActiviteitBewerkenSkeleton from '@/components/ui/admin/activities/ActiviteitBewerkenSkeleton';
import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { directus } from '@/lib/directus';
import { readItems } from '@directus/sdk';

export default async function BewerkenActiviteitPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
            <PageHeader
                title="Activiteit Bewerken"
                description="Wijzig de gegevens van deze activiteit"
                backLink="/beheer/activiteiten"
                className="mb-0"
                contentPadding="pt-0 pb-2 sm:pt-0 sm:pb-2"
                titleClassName="text-sm sm:text-base md:text-xl"
            />
            <Suspense fallback={<ActiviteitBewerkenSkeleton />}>
                <EditFormLoader id={resolvedParams.id} />
            </Suspense>
        </div>
    );
}

async function EditFormLoader({ id }: { id: string }) {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    if (!session || !session.user) return <UnauthorizedAccess />;

    const user = session.user as any;
    const memberships = user.committees || [];
    
    try {
        // Fetch Event via SDK
        const event = await directus.request(
            readItems('events', {
                fields: ['*'],
                filter: { id: { _eq: id } },
                limit: 1
            })
        );
        
        if (!event || event.length === 0) return notFound();
        const eventData = event[0];

        // Fetch Committees for the dropdown
        const allCommittees = await directus.request(
            readItems('committees', {
                fields: ['id', 'name'],
                filter: { is_visible: { _eq: true } },
                limit: -1
            })
        );

        const cleanedCommittees = allCommittees.map((c: any) => ({
            id: c.id,
            name: c.name.replace(/\|\|.*salvemundi.*$/i, '').replace(/\|+$/g, '').trim()
        }));

        // RBAC
        const isPowerful = memberships.some((c: any) => {
            const name = (c?.name || '').toString().toLowerCase();
            return name.includes('bestuur') || name.includes('ict') || name.includes('kandi');
        });

        let hasAccess = isPowerful;
        if (!hasAccess) {
            hasAccess = eventData.committee_id ? memberships.some((c: any) => String(c.id) === String(eventData.committee_id)) : false;
        }

        if (!hasAccess) return <UnauthorizedAccess specific={true} />;

        // Filter allowed committees for the dropdown (only if not powerful, otherwise show all)
        const allowedCommitteesForDropdown = isPowerful 
            ? cleanedCommittees 
            : cleanedCommittees.filter((c: any) => memberships.some((m: any) => String(m.id) === String(c.id)));

        return <ActiviteitBewerkenIsland event={eventData as any} committees={allowedCommitteesForDropdown as any} />;
    } catch (e) {
        console.error("Error loading edit form:", e);
        return <div className="p-8 text-center text-red-500">Er is een fout opgetreden bij het laden van de gegevens.</div>;
    }
}

function UnauthorizedAccess({ specific = false }: { specific?: boolean }) {
    return (
        <div className="container mx-auto px-4 py-12 max-w-2xl">
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-8 text-center ring-1 ring-slate-200 dark:ring-slate-700">
                <div className="mb-6 flex justify-center">
                    <div className="rounded-full bg-red-100 dark:bg-red-900/30 p-6">
                        <ShieldAlert className="h-16 w-16 text-red-600 dark:text-red-400" />
                    </div>
                </div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Toegang Geweigerd</h1>
                <p className="text-lg text-slate-500 dark:text-slate-400 mb-8">
                    {specific 
                        ? "Je hebt geen rechten om deze specifieke activiteit te bewerken. Dit kan alleen als je lid bent van de organiserende commissie, het bestuur of de ICT-commissie."
                        : "Je hebt geen rechten om activiteiten te bewerken. Dit kan alleen als je lid bent van een commissie, het bestuur of de ICT-commissie."}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link href="/beheer/activiteiten" className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200 px-8 py-3 font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 transition-all cursor-pointer">
                        <ArrowLeft className="h-5 w-5" /> Terug
                    </Link>
                </div>
            </div>
        </div>
    );
}
