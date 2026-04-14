import type { Metadata } from 'next';
import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';
import AdminUnauthorized from '@/components/ui/admin/AdminUnauthorized';
import { notFound } from 'next/navigation';
import ActiviteitAanmeldingenIsland from '@/components/islands/admin/activities/ActiviteitAanmeldingenIsland';
import { getSystemDirectus } from '@/lib/directus';
import { readItem } from '@directus/sdk';
import { 
    getActivitySignupsInternal 
} from '@/server/queries/admin-event.queries';
import AdminPageShell from '@/components/ui/admin/AdminPageShell';

export const metadata: Metadata = {
    title: 'Activiteit Aanmeldingen | SV Salve Mundi',
};

export default async function AanmeldingenPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    const id = resolvedParams.id;
    
    // NUCLEAR SSR: All access and permission checks must happen before flushing anything
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

    try {
        // Fetch Event
        const event = await getSystemDirectus().request(
            readItem<any, any, any>('events', id, {
                fields: ['id', 'name', 'price_members', 'committee_id', 'max_sign_ups']
            })
        );
        
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
            <AdminPageShell
                title="Aanmeldingen"
                subtitle={`Lijst van deelnemers voor "${event.name}"`}
                backHref={`/beheer/activiteiten`}
            >
                <div className="pb-20">
                    <ActiviteitAanmeldingenIsland event={event} initialSignups={signups} />
                </div>
            </AdminPageShell>
        );
    } catch (e) {
        return notFound();
    }
}



