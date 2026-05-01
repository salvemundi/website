import type { Metadata } from 'next';
import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';
import AdminUnauthorized from '@/components/ui/admin/AdminUnauthorized';
import { notFound } from 'next/navigation';
import ActiviteitBewerkenIsland from '@/components/islands/admin/activities/ActiviteitBewerkenIsland';

import { getActivityByIdInternal } from '@/server/queries/admin-event.queries';
import { query } from '@/lib/database';
import { getPermissions } from '@/shared/lib/permissions';
import { fetchUserCommitteesDb } from '@/server/actions/user-db.utils';
import { type EnrichedUser } from '@/types/auth';
import { type AdminActivity } from "@salvemundi/validations";
import { type Committee } from '@/shared/lib/permissions';

export const metadata: Metadata = {
    title: 'Activiteit Bewerken | SV Salve Mundi',
};

export default async function BewerkenActiviteitPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    const id = resolvedParams.id;
    
    // Check initial session to avoid ghost skeletons for guests
    const session = await auth.api.getSession({
        headers: await headers()
    });
    if (!session || !session.user) return <AdminUnauthorized title="Activiteit Bewerken" />;

    const user = session.user as unknown as EnrichedUser;
    const userCommittees = await fetchUserCommitteesDb(user.id).catch(() => []);
    const permissions = getPermissions(userCommittees || []);

    if (!permissions.canAccessActivitiesEdit) {
        return (
            <AdminUnauthorized 
                title="Activiteit Bewerken"
                description="Je hebt geen rechten om activiteiten te bewerken. Alleen commissieleiders en beheer hebben deze rechten."
            />
        );
    }

    const isPowerful = permissions.isLeader || permissions.isICT;

    // Fetch data using SQL instead of Directus API for better performance and consistency
    const [eventData, allCommittees] = await Promise.all([
        getActivityByIdInternal(id),
        query('SELECT id, name, email FROM committees WHERE is_visible = true').then(res => res.rows as { id: number; name: string; email: string }[])
    ]);
    
    if (!eventData) return notFound();
    
    // Remap database fields to match the form expectations (if needed)
    const legacyEventData = {
        ...eventData,
        name: eventData.titel,
        description: eventData.beschrijving,
        event_date: eventData.datum_start,
        event_date_end: eventData.datum_eind,
        location: eventData.locatie,
        image: eventData.afbeelding_id,
        // Ensure numeric fields are correctly typed
        price_members: eventData.price_members,
        price_non_members: eventData.price_non_members,
        max_sign_ups: eventData.max_sign_ups,
        // Missing fields
        description_logged_in: eventData.description_logged_in,
        publish_date: eventData.publish_date,
        only_members: eventData.only_members,
    };

    const cleanedCommittees = allCommittees.map((c) => ({
        id: c.id,
        name: c.name.replace(/\|\|.*salvemundi.*$/i, '').replace(/\|+$/g, '').trim(),
        email: c.email
    }));

    // Filter allowed committees for the dropdown (only if not powerful, otherwise show all)
    const allowedCommitteesForDropdown = isPowerful 
        ? cleanedCommittees 
        : cleanedCommittees.filter((c) => (userCommittees || []).some((m) => String(m.id) === String(c.id)));

    return (
        <div className="pb-20">
            <ActiviteitBewerkenIsland 
                event={legacyEventData as unknown as AdminActivity} 
                committees={allowedCommitteesForDropdown as unknown as Committee[]} 
            />
        </div>
    );
}

