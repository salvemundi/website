import { redirect } from 'next/navigation';
import { getEnrichedSession } from '@/server/auth/auth-utils';
import AdminUnauthorized from '@/components/ui/admin/AdminUnauthorized';
import { getPermissions } from '@/shared/lib/permissions';
import { fetchUserCommitteesDb } from '@/server/internal/user-db.utils';
import { safeConsoleError } from '@/server/utils/logger';
import { type EnrichedUser } from '@/types/auth';
import type { ReactNode } from 'react';

export default async function StickersLayout({
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
        safeConsoleError('[layout][StickersLayout]', error);
    }

    const permissions = getPermissions(userCommittees);

    if (!permissions.canAccessStickers) {
        return (
            <div className="container mx-auto px-4 py-8">
                <AdminUnauthorized
                    title="Sticker Beheer"
                    description="Je hebt geen rechten om stickers te beheren. Alleen het Bestuur en ICT hebben deze rechten."
                />
            </div>
        );
    }

    return <>{children}</>;
}