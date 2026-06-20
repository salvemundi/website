import type { Metadata } from 'next';
import { getEnrichedSession } from '@/server/auth/auth-utils';
import AdminPageShell from '@/components/ui/admin/AdminPageShell';
import AdminActivitiesIsland from '@/components/islands/admin/activities/AdminActivitiesIsland';
import { getAdminActivities } from '@/server/actions/events/activiteiten/activities-read.actions';
import { getCommittees } from '@/server/actions/public/committees.actions';
import { fetchUserCommitteesDb } from '@/server/internal/user-db.utils';
import { getPermissions } from '@/shared/lib/permissions';
import { safeConsoleError } from '@/server/utils/logger';
import { type EnrichedUser } from '@/types/auth';
import { type AdminActivity } from "@salvemundi/validations";
import { type DbCommittee } from '@salvemundi/validations/directus/schema';

export const metadata: Metadata = {
    title: 'Beheer Activiteiten | SV Salve Mundi'
};

export default async function AdminActiviteitenPage() {
    const session = await getEnrichedSession();
    const user = session?.user as unknown as EnrichedUser | undefined;

    let userCommittees: Awaited<ReturnType<typeof fetchUserCommitteesDb>> = [];
    try {
        userCommittees = await fetchUserCommitteesDb(user?.id || '');
    } catch (error) {
        safeConsoleError('[page][AdminActiviteitenPage]', error);
    }

    const permissions = getPermissions(userCommittees);

    const [initialEvents, committees] = await Promise.all([
        getAdminActivities(undefined, 'all'),
        getCommittees()
    ]);

    const events = initialEvents as unknown as AdminActivity[];

    return (
        <AdminPageShell
            title="Activiteiten Beheer"
            subtitle="Organiseer en beheer alle activiteiten van Salve Mundi"
            backHref="/beheer"
            hideToolbar={true}
        >
            <AdminActivitiesIsland
                initialEvents={events}
                committees={committees as unknown as DbCommittee[]}
                userId={session?.user.id}
                userCommittees={userCommittees as unknown as DbCommittee[]}
                permissions={permissions}
            />
        </AdminPageShell>
    );
}