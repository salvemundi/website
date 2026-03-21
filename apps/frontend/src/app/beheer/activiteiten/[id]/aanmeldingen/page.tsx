import { Suspense } from 'react';
import PageHeader from '@/components/ui/layout/PageHeader';
import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ActiviteitAanmeldingenIsland from '@/components/islands/admin/activities/ActiviteitAanmeldingenIsland';
import AanmeldingenListSkeleton from '@/components/ui/admin/activities/AanmeldingenListSkeleton';
import { directus, directusRequest } from '@/lib/directus';
import { readItem, readItems } from '@directus/sdk';

export default async function AanmeldingenPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
            <Suspense fallback={<AanmeldingenListSkeleton />}>
                <SignupsDataLoader id={resolvedParams.id} />
            </Suspense>
        </div>
    );
}

async function SignupsDataLoader({ id }: { id: string }) {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    if (!session || !session.user) return <UnauthorizedAccess />;

    const user = session.user as any;
    const memberships = user.committees || [];
    const hasPriv = memberships.some((c: any) => {
        const name = (c?.name || '').toString().toLowerCase();
        return name.includes('bestuur') || name.includes('ict') || name.includes('kandi');
    });

    // Fetch Event
    let event;
    try {
        event = await directusRequest<any>(
            readItem<any, any, any>('events', id, {
                fields: ['id', 'name', 'price_members', 'committee_id']
            })
        );
    } catch (e) {
        return notFound();
    }

    if (!event) return notFound();

    // RBAC
    let hasAccess = hasPriv;
    if (!hasAccess && event.committee_id) {
        const isMember = memberships.some((c: any) => String(c.id) === String(event.committee_id));
        if (isMember) hasAccess = true;
    }

    if (!hasAccess) return <UnauthorizedAccess specific={true} />;

    // Fetch Signups
    let signups: any[] = [];
    try {
        signups = await directusRequest<any[]>(
            readItems<any, any, any>('event_signups', {
                filter: {
                    event_id: { _eq: id }
                },
                fields: [
                    'id', 
                    'participant_name', 
                    'participant_email', 
                    'participant_phone', 
                    'payment_status', 
                    'date_created', 
                    'checked_in',
                    'checked_in_at',
                    // @ts-ignore
                    'directus_relations.id', 
                    // @ts-ignore
                    'directus_relations.first_name', 
                    // @ts-ignore
                    'directus_relations.last_name', 
                    // @ts-ignore
                    'directus_relations.email', 
                    // @ts-ignore
                    'directus_relations.phone_number'
                ],
                sort: ['-date_created'],
                limit: -1
            })
        );
    } catch (e) {
        console.error("Failed to fetch signups:", e);
    }

    return (
        <>
            <PageHeader
                title={event.name || 'Aanmeldingen'}
                description="Bekijk alle aanmeldingen voor deze activiteit"
                backLink="/beheer/activiteiten"
                className="mb-0"
                contentPadding="pt-0 pb-2 sm:pt-0 sm:pb-2"
                titleClassName="text-sm sm:text-base md:text-xl"
            />
            <ActiviteitAanmeldingenIsland event={event} initialSignups={signups} />
        </>
    );
}

function UnauthorizedAccess({ specific = false }: { specific?: boolean }) {
    return (
        <>
            <PageHeader title="Geen Toegang" description="Onvoldoende rechten" />
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
                            ? "Je hebt geen rechten om deze aanmeldingen te bekijken."
                            : "Je hebt geen rechten om activiteiten te beheren."}
                    </p>
                    <div className="flex justify-center">
                        <Link href="/beheer/activiteiten" className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200 px-8 py-3 font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 transition-all">
                            <ArrowLeft className="h-5 w-5" /> Terug
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}
