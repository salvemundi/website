import type { Metadata } from 'next';
import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';
import AdminUnauthorized from '@/components/ui/admin/AdminUnauthorized';
import ActiviteitNieuwIsland from '@/components/islands/admin/activities/ActiviteitNieuwIsland';

import { getPermissions } from '@/shared/lib/permissions';
import { fetchUserCommitteesDb } from '@/server/actions/user-db.utils';
import { query } from '@/lib/database';

import { type EnrichedUser } from '@/types/auth';

async function getCommitteesForUser(user: EnrichedUser, permissions: ReturnType<typeof getPermissions>) {
    const memberships = user.committees || [];
    const isPowerful = permissions.isLeader || permissions.isICT;

    try {
        if (isPowerful) {
            const { rows } = await query('SELECT id, name FROM committees ORDER BY name ASC');
            return rows;
        } else {
            if (memberships.length === 0) return [];
            
            const committeeIds = memberships.map((m) => m.id).filter(Boolean);
            if (committeeIds.length === 0) return [];

            const placeholders = committeeIds.map((_, i) => `$${i + 1}`).join(', ');
            const { rows } = await query(`SELECT id, name FROM committees WHERE id IN (${placeholders}) ORDER BY name ASC`, committeeIds);
            return rows;
        }
    } catch (error) {
        return [];
    }
}

export default async function ActivityCreatePage() {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session || !session.user) {
        return (
            <AdminUnauthorized 
                title="Activiteit Aanmaken"
                description="Je moet ingelogd zijn met een Salve Mundi account om activiteiten te kunnen aanmaken."
            />
        );
    }

    const user = session.user as unknown as EnrichedUser;
    const userCommittees = await fetchUserCommitteesDb(user.id).catch(() => []);
    const permissions = getPermissions(userCommittees || []);

    if (!permissions.canAccessActivitiesEdit) {
        return (
            <AdminUnauthorized 
                title="Activiteit Aanmaken"
                description="Je hebt geen rechten om activiteiten aan te maken. Alleen commissieleiders en beheer hebben deze rechten."
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
