import { redirect } from 'next/navigation';
import { getEnrichedSession } from '@/server/auth/auth-utils';
import AdminUnauthorized from '@/components/ui/admin/AdminUnauthorized';
import { getPermissions } from '@/shared/lib/permissions';
import { fetchUserCommitteesDb } from '@/server/internal/user-db.utils';

import { type EnrichedUser } from '@/types/auth';
import { safeConsoleError } from '@/server/utils/logger';

export default async function KroegentochtLayout({
    children }: {
    children: React.ReactNode;
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
        safeConsoleError('[kroegentocht-layout][KroegentochtLayout]', error);
        userCommittees = [];
    }

    const permissions = getPermissions(userCommittees);

    if (!permissions.canAccessKroegentocht) {
        return (
            <div className="container mx-auto px-4 py-8">
                <AdminUnauthorized 
                    title="Kroegentocht Beheer"
                    description="Je hebt geen rechten om de Kroegentocht te beheren. Alleen de Feestcommissie, het Bestuur en ICT hebben deze rechten."
                />
            </div>
        );
    }

    return <>{children}</>;
}
