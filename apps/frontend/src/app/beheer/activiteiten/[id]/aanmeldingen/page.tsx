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
    
    // RBAC: Use the standardized permission from the session
    const hasAccess = !!user.canAccessActivitiesView;

    try {
        // Fetch Event
        const event = await getSystemDirectus().request(
            readItem<any, any, any>('events', id, {
                fields: ['id', 'name', 'price_members', 'committee_id', 'max_sign_ups']
            })
        );
        
        if (!event) return notFound();

        if (!hasAccess) {
            return (
                <AdminUnauthorized 
                    title="Activiteit Aanmeldingen"
                    description="Je hebt geen rechten om deze aanmeldingen te bekijken. Dit gedeelte is alleen voor commissieleden, bestuur of ICT."
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
                hideToolbar={true}
            >
                <div className="pb-20">
                    <ActiviteitAanmeldingenIsland 
                        event={event as any} 
                        initialSignups={signups} 
                        canAccessEdit={!!user.canAccessActivitiesEdit}
                    />
                </div>
            </AdminPageShell>
        );
    } catch (e) {
        return notFound();
    }
}



