import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@/server/auth/auth';
import AdminUnauthorized from '@/components/ui/admin/AdminUnauthorized';
import { getPermissions } from '@/shared/lib/permissions';
import { fetchUserCommitteesDb } from '@/server/actions/user-db.utils';

import { type EnrichedUser } from '@/types/auth';

export default async function MailLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session || !session.user) {
        redirect('/login');
    }

    const user = session.user as unknown as EnrichedUser;
    const userCommittees = await fetchUserCommitteesDb(user.id).catch(() => []);
    const permissions = getPermissions(userCommittees || []);

    if (!permissions.isICT) {
        return (
            <div className="container mx-auto px-4 py-8">
                <AdminUnauthorized 
                    title="Mail Beheer"
                    description="Deze systeemfunctie is exclusief gereserveerd voor de ICT-commissie."
                />
            </div>
        );
    }

    return <>{children}</>;
}
