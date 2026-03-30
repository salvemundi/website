import { Suspense } from 'react';
import type { Metadata } from 'next';
import AnimatedBeheerHeader from '@/components/ui/admin/AnimatedBeheerHeader';
import ActiviteitBewerkenIsland from '@/components/islands/admin/activities/ActiviteitBewerkenIsland';
import ActiviteitBewerkenSkeleton from '@/components/ui/admin/activities/ActiviteitBewerkenSkeleton';
import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';
import { ShieldAlert, ArrowLeft, Edit } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getSystemDirectus } from '@/lib/directus';
import { readItems } from '@directus/sdk';

export const metadata: Metadata = {
    title: 'Activiteit Bewerken | SV Salve Mundi',
};

export default async function BewerkenActiviteitPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    
    return (
        <main className="min-h-screen bg-[var(--bg-main)]">
            <Suspense fallback={<ActiviteitBewerkenSkeleton />}>
                <EditFormLoader id={resolvedParams.id} />
            </Suspense>
        </main>
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
        const event = await getSystemDirectus().request(
            readItems<any, any, any>('events', {
                fields: [
                    'id', 'name', 'description', 'location', 'event_date', 'event_date_end', 
                    'max_sign_ups', 'price_members', 'price_non_members', 'only_members', 
                    'registration_deadline', 'contact', 'image', 'committee_id', 'status', 
                    'publish_date', 'event_time', 'event_time_end'
                ],
                filter: { id: { _eq: id } },
                limit: 1
            })
        );
        
        if (!event || event.length === 0) return notFound();
        const eventData = event[0];

        // Fetch Committees for the dropdown
        const allCommittees = await getSystemDirectus().request(
            readItems<any, any, any>('committees', {
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

        return (
            <>
                <AnimatedBeheerHeader
                    title="Bewerk Activiteit"
                    subtitle={`Wijzig de gegevens van "${eventData.name}".`}
                    backLink="/beheer/activiteiten"
                    icon={<Edit className="h-10 w-10" />}
                />
                <div className="pb-20">
                    <ActiviteitBewerkenIsland event={eventData as any} committees={allowedCommitteesForDropdown as any} />
                </div>
            </>
        );
    } catch (e) {
        console.error("Error loading edit form:", e);
        return <div className="p-8 text-center text-red-500 font-bold">Er is een fout opgetreden bij het laden van de gegevens. Probeer het later opnieuw.</div>;
    }
}

function UnauthorizedAccess({ specific = false }: { specific?: boolean }) {
    return (
        <div className="container mx-auto px-4 py-20 max-w-2xl">
            <div className="bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] shadow-xl p-12 text-center border border-[var(--beheer-border)]">
                <div className="mb-8 flex justify-center">
                    <div className="rounded-full bg-red-500/10 p-8 shadow-glow-red">
                        <ShieldAlert className="h-20 w-20 text-red-500" />
                    </div>
                </div>
                <h1 className="text-4xl font-black text-[var(--beheer-text)] uppercase tracking-tighter mb-4">Toegang Geweigerd</h1>
                <p className="text-xl text-[var(--beheer-text-muted)] font-medium mb-10 leading-relaxed">
                    {specific 
                        ? "Je hebt geen rechten om deze specifieke activiteit te bewerken. Dit kan alleen als je lid bent van de organiserende commissie, het bestuur of de ICT-commissie."
                        : "Je hebt geen rechten om activiteiten te bewerken. Dit kan alleen als je lid bent van een commissie, het bestuur of de ICT-commissie."}
                </p>
                <div className="flex justify-center">
                    <Link 
                        href="/beheer/activiteiten" 
                        className="inline-flex items-center justify-center gap-3 bg-[var(--beheer-border)] text-[var(--beheer-text)] px-10 py-4 rounded-full font-black uppercase tracking-widest text-xs hover:bg-[var(--beheer-accent)] hover:text-white transition-all active:scale-95 group"
                    >
                        <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" /> 
                        <span>Ga Terug</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
