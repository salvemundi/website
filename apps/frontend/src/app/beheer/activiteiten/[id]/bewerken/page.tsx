import { Suspense } from 'react';
import type { Metadata } from 'next';
import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';
import { ArrowLeft } from 'lucide-react';
import AdminUnauthorized from '@/components/ui/admin/AdminUnauthorized';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getSystemDirectus } from '@/lib/directus';
import { readItems } from '@directus/sdk';
import ActiviteitBewerkenIsland from '@/components/islands/admin/activities/ActiviteitBewerkenIsland';
import ActiviteitBewerkenSkeleton from '@/components/ui/admin/activities/ActiviteitBewerkenSkeleton';

export const metadata: Metadata = {
    title: 'Activiteit Bewerken | SV Salve Mundi',
};

export default async function BewerkenActiviteitPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    
    // Check initial session to avoid ghost skeletons for guests
    const session = await auth.api.getSession({
        headers: await headers()
    });
    if (!session || !session.user) return <AdminUnauthorized title="Activiteit Bewerken" />;

    return (
        <main className="min-h-screen bg-[var(--bg-main)]">
            <Suspense fallback={<ActiviteitBewerkenSkeleton />}>
                <EditFormLoader id={resolvedParams.id} session={session} />
            </Suspense>
        </main>
    );
}

async function EditFormLoader({ id, session }: { id: string, session: any }) {

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

        if (!hasAccess) {
            return (
                <AdminUnauthorized 
                    title="Activiteit Bewerken"
                    description="Je hebt geen rechten om deze specifieke activiteit te bewerken. Dit kan alleen als je lid bent van de organiserende commissie, het bestuur of de ICT-commissie."
                />
            );
        }

        // Filter allowed committees for the dropdown (only if not powerful, otherwise show all)
        const allowedCommitteesForDropdown = isPowerful 
            ? cleanedCommittees 
            : cleanedCommittees.filter((c: any) => memberships.some((m: any) => String(m.id) === String(c.id)));

        return (
            <div className="pb-20">
                <ActiviteitBewerkenIsland event={eventData as any} committees={allowedCommitteesForDropdown as any} />
            </div>
        );
    } catch (e) {
        console.error("Error loading edit form:", e);
        return <div className="p-8 text-center text-red-500 font-bold">Er is een fout opgetreden bij het laden van de gegevens. Probeer het later opnieuw.</div>;
    }
}


