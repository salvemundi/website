import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@/server/auth/auth';
import AdminUnauthorized from '@/components/ui/admin/AdminUnauthorized';
import { getPermissions } from '@/shared/lib/permissions';
import { fetchUserCommitteesDb } from '@/server/actions/user-db.utils';

export default async function CommissiesLayout({
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

    if (!permissions.canAccessCommittees) {
        return (
            <div className="container mx-auto px-4 py-8">
                <AdminUnauthorized 
                    title="Commissie Beheer"
                    description="Je hebt geen rechten om commissies te beheren. Alleen het Bestuur en ICT hebben deze rechten."
                />
            </div>
        );
    }

    return <>{children}</>;
}
