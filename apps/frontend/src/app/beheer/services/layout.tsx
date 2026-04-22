import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@/server/auth/auth';
import AdminUnauthorized from '@/components/ui/admin/AdminUnauthorized';
import { getPermissions } from '@/shared/lib/permissions';
import { fetchUserCommitteesDb } from '@/server/actions/user-db.utils';

export default async function ServicesLayout({
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

    const user = session.user as any;
    const userCommittees = await fetchUserCommitteesDb(user.id).catch(() => []);
    const permissions = getPermissions(userCommittees || []);

    if (!permissions.isICT) {
        return (
            <div className="container mx-auto px-4 py-8">
                <AdminUnauthorized 
                    title="Systeem Status"
                    description="Deze systeemfunctie is exclusief gereserveerd voor de ICT-commissie."
                />
            </div>
        );
    }

    return <>{children}</>;
}
