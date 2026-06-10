import { getEnrichedSession } from '@/server/auth/auth-utils';
import AdminUnauthorized from '@/components/ui/admin/AdminUnauthorized';
import ActiviteitNieuwIsland from '@/components/islands/admin/activities/ActiviteitNieuwIsland';
import { getPermissions } from '@/shared/lib/permissions';
import { fetchUserCommitteesDb } from '@/server/internal/user-db.utils';
import { query } from '@/lib/database';
import { type EnrichedUser } from '@/types/auth';
import { safeConsoleError } from '@/server/utils/logger';

async function getCommitteesForUser(
    user: EnrichedUser,
    permissions: ReturnType<typeof getPermissions>
): Promise<{ id: number; name: string; email?: string | null }[]> {
    const memberships = user.committees ?? [];
    const isPowerful = permissions.isLeader || permissions.isICT;

    try {
        if (isPowerful) {
            const { rows } = await query('SELECT id, name, email FROM committees ORDER BY name ASC');
            return rows as { id: number; name: string; email?: string | null }[];
        } else {
            if (memberships.length === 0) return [];

            const committeeIds = memberships.map((m) => m.id).filter(Boolean);
            if (committeeIds.length === 0) return [];

            const placeholders = committeeIds.map((_, i) => `$${i + 1}`).join(', ');
            const { rows } = await query(`SELECT id, name, email FROM committees WHERE id IN (${placeholders}) ORDER BY name ASC`, committeeIds);
            return rows as { id: number; name: string; email?: string | null }[];
        }
    } catch (error) {
        safeConsoleError('[page][ActivityCreatePage]', error);
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
        safeConsoleError('[page][ActivityCreatePage]', error);
    }

    const permissions = getPermissions(userCommittees);

    if (!permissions.canAccessActivitiesEdit) {
        return (
            <AdminUnauthorized
                title="Activiteit Aanmaken"
                description="Je hebt geen rechten om activiteiten aan te maken. Alleen commissieleiders en bestuur hebben deze rechten."
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