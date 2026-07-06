import type { Metadata } from 'next';
import { getEnrichedSession } from '@/server/auth/auth-utils';
import AdminUnauthorized from '@/components/ui/admin/AdminUnauthorized';
import { notFound } from 'next/navigation';
import ActiviteitBewerkenIsland from '@/components/islands/admin/activities/ActiviteitBewerkenIsland';
import { getActivityByIdInternal } from '@/server/queries/activiteiten/admin-activiteiten.queries';
import { db, schema } from '@salvemundi/db';
import { eq } from 'drizzle-orm';
import { getPermissions } from '@/shared/lib/permissions';
import { fetchUserCommitteesDb } from '@/server/internal/leden/leden-db.utils';
import { safeConsoleError } from '@/server/utils/logger';
import { type EnrichedUser } from '@/types/auth';
import { type AdminActivity } from "@salvemundi/validations";
import { type Committee } from '@salvemundi/validations';

export const metadata: Metadata = {
    title: 'Activiteit Bewerken | SV Salve Mundi'
};

export default async function BewerkenActiviteitPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    const id = resolvedParams.id;

    const session = await getEnrichedSession();
    if (!session) return <AdminUnauthorized title="Activiteit Bewerken" />;

    const user = session.user as unknown as EnrichedUser;

    let userCommittees: Awaited<ReturnType<typeof fetchUserCommitteesDb>> = [];
    try {
        userCommittees = await fetchUserCommitteesDb(user.id);
    } catch (error) {
        safeConsoleError('[page.tsx][BewerkenActiviteitPage] ', error);
    }

    const permissions = getPermissions(userCommittees);

    if (!permissions.includes('activiteiten:edit')) {
        return (
            <AdminUnauthorized
                title="Activiteit Bewerken"
                description="Je hebt geen rechten om activiteiten te bewerken. Alleen commissieleiders en beheer hebben deze rechten."
            />
        );
    }

    const isPowerful = permissions.includes('leader') || permissions.includes('ict');

    const [eventData, allCommittees] = await Promise.all([
        getActivityByIdInternal(id),
        db.select({
            id: schema.committees.id,
            name: schema.committees.name,
            email: schema.committees.email
        }).from(schema.committees).where(eq(schema.committees.is_visible, true))
        .then(rows => rows as { id: number; name: string; email: string }[])
    ]);

    if (!eventData) return notFound();

    const event = {
        ...eventData,
        name: eventData.name,
        description: eventData.description,
        short_description: eventData.short_description,
        event_date: eventData.event_date,
        event_date_end: eventData.event_date_end,
        location: eventData.location,
        image: eventData.image,
        price_members: eventData.price_members,
        price_non_members: eventData.price_non_members,
        max_sign_ups: eventData.max_sign_ups,
        description_logged_in: eventData.description_logged_in,
        publish_date: eventData.publish_date,
        only_members: eventData.only_members
    };

    const cleanedCommittees = allCommittees.map((c) => ({
        id: c.id,
        name: c.name.replace(/\|\|.*salvemundi.*$/i, '').replace(/\|+$/g, '').trim(),
        email: c.email
    }));

    const allowedCommitteesForDropdown = isPowerful
        ? cleanedCommittees
        : cleanedCommittees.filter((c) => userCommittees.some((m) => String(m.id) === String(c.id)));

    return (
        <div className="pb-20">
            <ActiviteitBewerkenIsland
                event={event as unknown as AdminActivity}
                committees={allowedCommitteesForDropdown as unknown as Committee[]}
            />
        </div>
    );
}