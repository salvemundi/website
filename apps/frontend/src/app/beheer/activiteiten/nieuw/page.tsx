import { getEnrichedSession } from '@/server/auth/auth-utils';
import AdminUnauthorized from '@/components/ui/admin/AdminUnauthorized';
import ActiviteitNieuwIsland from '@/components/islands/admin/activities/ActiviteitNieuwIsland';
import { getPermissions } from '@/shared/lib/permissions';
import { fetchUserCommitteesDb } from '@/server/internal/leden/leden-db.utils';
import { db, schema } from '@salvemundi/db';
import { inArray, asc } from 'drizzle-orm';
import { type EnrichedUser } from '@/types/auth';
import { safeConsoleError } from '@/server/utils/logger';

async function getCommitteesForUser(
    user: EnrichedUser,
    permissions: ReturnType<typeof getPermissions>
): Promise<{ id: number; name: string; email?: string | null }[]> {
    const memberships = user.committees ?? [];
    const isPowerful = permissions.includes('leader') || permissions.includes('ict');

    try {
        if (isPowerful) {
            const rows = await db.select({
                id: schema.committees.id,
                name: schema.committees.name,
                email: schema.committees.email
            })
            .from(schema.committees)
            .orderBy(asc(schema.committees.name));
            return rows as { id: number; name: string; email?: string | null }[];
        } else {
            if (memberships.length === 0) return [];

            const committeeIds = memberships.map((m) => Number(m.id)).filter(Boolean);
            if (committeeIds.length === 0) return [];

            const rows = await db.select({
                id: schema.committees.id,
                name: schema.committees.name,
                email: schema.committees.email
            })
            .from(schema.committees)
            .where(inArray(schema.committees.id, committeeIds))
            .orderBy(asc(schema.committees.name));
            return rows as { id: number; name: string; email?: string | null }[];
        }
    } catch (error) {
        safeConsoleError('[page.tsx][getCommitteesForUser] ', error);
        return [];
    }
}

export default async function ActivityCreatePage() {
    const session = await getEnrichedSession();

    if (!session) {
        return (
            <AdminUnauthorized
                title="Activiteit Aanmaken"
                description="Je moet ingelogd zijn met een Salve Mundi account om activiteiten te kunnen aanmaken."
            />
        );
    }

    const user = session.user as unknown as EnrichedUser;

    let userCommittees: Awaited<ReturnType<typeof fetchUserCommitteesDb>> = [];

    try {
        userCommittees = await fetchUserCommitteesDb(user.id);
    } catch (error) {
        safeConsoleError('[page.tsx][ActivityCreatePage] ', error);
    }

    const permissions = getPermissions(userCommittees);

    if (!permissions.includes('activiteiten:edit')) {
        return (
            <AdminUnauthorized
                title="Activiteit Aanmaken"
                description="Je hebt geen rechten om activiteiten aan te maken."
            />
        );
    }

    const committees = await getCommitteesForUser(user, permissions);

    return (
        <div className="pb-20">
            <ActiviteitNieuwIsland committees={committees} />
        </div>
    );
}
