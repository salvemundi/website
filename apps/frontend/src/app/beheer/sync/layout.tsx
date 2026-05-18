import { redirect } from 'next/navigation';
import { getEnrichedSession } from '@/server/auth/auth-utils';
import AdminUnauthorized from '@/components/ui/admin/AdminUnauthorized';
import { getPermissions } from '@/shared/lib/permissions';
import { fetchUserCommitteesDb } from '@/server/internal/user-db.utils';
import { safeConsoleError } from '@/server/utils/logger';
import { type EnrichedUser } from '@/types/auth';
import type { ReactNode } from 'react';

export default async function SyncLayout({
    children
}: {
    children: ReactNode;
}) {
    const session = await getEnrichedSession();

    if (!session) {
        redirect('/?needLogin=true');
    }

    const user = session.user as unknown as EnrichedUser;

    let userCommittees: Awaited<ReturnType<typeof fetchUserCommitteesDb>> = [];

    try {
        userCommittees = await fetchUserCommitteesDb(user.id);
    } catch (error) {
        safeConsoleError('[layout][SyncLayout]', error);
    }

    const permissions = getPermissions(userCommittees);

    if (!permissions.isICT) {
        return (
            <div className="container mx-auto px-4 py-8">
                <AdminUnauthorized
                    title="Azure Sync"
                    description="Deze systeemfunctie is exclusief gereserveerd voor de ICT-commissie."
                />
            </div>
        );
    }

    return <>{children}</>;
}