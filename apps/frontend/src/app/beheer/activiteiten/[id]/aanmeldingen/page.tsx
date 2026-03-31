import { Suspense } from 'react';
import type { Metadata } from 'next';
import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';
import { ArrowLeft } from 'lucide-react';
import AdminUnauthorized from '@/components/ui/admin/AdminUnauthorized';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ActiviteitAanmeldingenIsland from '@/components/islands/admin/activities/ActiviteitAanmeldingenIsland';
import AanmeldingenListSkeleton from '@/components/ui/admin/activities/AanmeldingenListSkeleton';
import { getSystemDirectus } from '@/lib/directus';
import { readItem, readItems } from '@directus/sdk';

export const metadata: Metadata = {
    title: 'Activiteit Aanmeldingen | SV Salve Mundi',
};

export default async function AanmeldingenPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    
    return (
        <main className="min-h-screen bg-[var(--bg-main)]">
            <Suspense fallback={<AanmeldingenListSkeleton />}>
                <SignupsDataLoader id={resolvedParams.id} />
            </Suspense>
        </main>
    );
}

async function SignupsDataLoader({ id }: { id: string }) {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    if (!session || !session.user) return <AdminUnauthorized title="Activiteit Aanmeldingen" />;

    const user = session.user as any;
    const memberships = user.committees || [];
    const hasPriv = memberships.some((c: any) => {
        const name = (c?.name || '').toString().toLowerCase();
        return name.includes('bestuur') || name.includes('ict') || name.includes('kandi');
    });

    // Fetch Event
    let event;
    try {
        event = await getSystemDirectus().request(
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

    if (!hasAccess) {
        return (
            <AdminUnauthorized 
                title="Activiteit Aanmeldingen"
                description="Je hebt geen rechten om deze aanmeldingen te bekijken. Dit gedeelte is alleen voor organisatoren, bestuur of ICT."
            />
        );
    }

    // Fetch Signups
    let signups: any[] = [];
    try {
        signups = await getSystemDirectus().request(
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
                    'checked_in',
                    'checked_in_at'
                ],
                sort: ['-id'],
                limit: -1
            })
        );
    } catch (e: any) {
        console.error("Failed to fetch signups:", e.message, e?.errors || e);
    }

    return (
        <div className="pb-20">
            <ActiviteitAanmeldingenIsland event={event} initialSignups={signups} />
        </div>
    );
}



