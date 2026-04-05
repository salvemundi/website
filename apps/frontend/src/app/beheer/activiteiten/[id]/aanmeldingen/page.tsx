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
import { readItem } from '@directus/sdk';
import { 
    getActivitySignupsInternal 
} from '@/server/queries/admin-event.queries';

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
                fields: ['id', 'name', 'price_members', 'committee_id', 'max_sign_ups']
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

    // Fetch Signups using high-performance SQL query (filters out failed payments)
    const signups = await getActivitySignupsInternal(id);

    return (
        <div className="pb-20">
            <ActiviteitAanmeldingenIsland event={event} initialSignups={signups} />
        </div>
    );
}



