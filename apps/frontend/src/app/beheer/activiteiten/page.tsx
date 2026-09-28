import type { Metadata } from 'next';
import { getEnrichedSession } from '@/server/auth/auth-utils';
import BeheerPageShell from '@/components/ui/beheer/BeheerPageShell';
import BeheerActivitiesIsland from '@/components/islands/beheer/activities/BeheerActivitiesIsland';
import { getAdminActivities } from '@/server/actions/events/activiteiten/activiteiten-read.actions';
import { getCommittees } from '@/server/actions/public/committees.actions';
import { fetchUserCommitteesDb } from '@/server/internal/leden/leden-db.utils';
import { getPermissions } from '@/shared/lib/permissions';
import { safeConsoleError } from '@/server/utils/logger';
import { type EnrichedUser } from '@/types/auth';
import { type BeheerActivity } from "@salvemundi/validations";
import { type Committee } from '@salvemundi/validations/schema/committees.zod';

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
        safeConsoleError('[page.tsx][AdminActiviteitenPage] ', error);
    }

    const permissions = getPermissions(userCommittees);

    const [initialEvents, committees] = await Promise.all([
        getAdminActivities(undefined, 'all'),
        getCommittees()
    ]);

    const events = initialEvents as unknown as BeheerActivity[];

    return (
        <BeheerPageShell
            title="Activiteiten Beheer"
            backHref="/beheer"
            hideToolbar={true}
        >
            <BeheerActivitiesIsland
                initialEvents={events}
                committees={committees as unknown as Committee[]}
                userId={session?.user.id}
                userCommittees={userCommittees as unknown as Committee[]}
                permissions={permissions}
            />
        </BeheerPageShell>
    );
}
