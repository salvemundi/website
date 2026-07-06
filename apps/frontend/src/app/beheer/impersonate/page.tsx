import { cookies } from 'next/headers';
import ImpersonateIsland from '@/components/islands/admin/ImpersonateIsland';
import { checkAdminAccess } from '@/server/actions/admin/admin-utils.actions';
import { redirect } from 'next/navigation';
import { getPermissions } from '@/shared/lib/permissions';
import AdminUnauthorized from '@/components/ui/admin/AdminUnauthorized';

export const metadata = {
    title: 'Test Modus | Salve Mundi Beheer' };

export default async function ImpersonatePage() {
    const { isAuthorized, user, impersonation } = await checkAdminAccess();
    if (!isAuthorized || !user) {
        redirect('/beheer');
    }

    const permissions = getPermissions(user.committees);
    if (!permissions.includes('impersonate')) {
        return <AdminUnauthorized title="Test Modus" backHref="/beheer" />;
    }

    const cookieStore = await cookies();
    const activeToken = cookieStore.get('directus_test_token')?.value || null;

    return (
        <div className="w-full">
            <ImpersonateIsland 
                activeToken={activeToken} 
                impersonatedName={impersonation?.targetName || null}
                impersonatedCommittees={impersonation?.targetCommittees || []}
            />
        </div>
    );
}
