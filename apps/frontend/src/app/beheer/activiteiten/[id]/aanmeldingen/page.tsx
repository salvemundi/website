import type { Metadata } from 'next';
import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';
import AdminUnauthorized from '@/components/ui/admin/AdminUnauthorized';
import { notFound } from 'next/navigation';
import ActiviteitAanmeldingenIsland, { type Signup, type AdminEvent } from '@/components/islands/admin/activities/ActiviteitAanmeldingenIsland';
import { 
    getActivityByIdInternal,
    getActivitySignupsInternal 
} from '@/server/queries/admin-event.queries';
import AdminPageShell from '@/components/ui/admin/AdminPageShell';
import { type EnrichedUser } from '@/types/auth';
import { type DbEventSignup } from "@salvemundi/validations";

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

    const user = session.user as unknown as EnrichedUser;
    
    // RBAC: Use the standardized permission from the session
    const hasAccess = !!user.canAccessActivitiesView;

    try {
        // Fetch Event using SQL
        const eventData = await getActivityByIdInternal(id);
        
        if (!eventData) return notFound();

        if (!hasAccess) {
            return (
                <AdminUnauthorized 
                    title="Activiteit Aanmeldingen"
                    description="Je hebt geen rechten om deze aanmeldingen te bekijken. Dit gedeelte is alleen voor commissieleden, bestuur of ICT."
                />
            );
        }

        // Remap to legacy format for the Island
        const legacyEventData: AdminEvent = {
            id: eventData.id!,
            name: eventData.titel,
            price_members: eventData.price_members,
            max_sign_ups: eventData.max_sign_ups,
        };

        // Fetch Signups using high-performance SQL query (filters out failed payments)
        const dbSignups = await getActivitySignupsInternal(id);
        
        // Ensure strictly typed mapping for the island
        const signups: Signup[] = dbSignups.map(s => ({
            id: s.id!,
            participant_name: s.participant_name || 'Onbekend',
            participant_email: s.participant_email || '-',
            participant_phone: s.participant_phone,
            payment_status: s.payment_status || 'open',
            created_at: s.created_at || new Date().toISOString(),
            checked_in: !!s.checked_in,
            is_member: !!s.is_member,
            directus_relations: s.directus_relations as unknown as Signup['directus_relations']
        }));

        return (
            <AdminPageShell
                title="Aanmeldingen"
                subtitle={`Lijst van deelnemers voor "${legacyEventData.name}"`}
                backHref={`/beheer/activiteiten`}
                hideToolbar={true}
            >
                <div className="pb-20">
                    <ActiviteitAanmeldingenIsland 
                        event={legacyEventData} 
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



