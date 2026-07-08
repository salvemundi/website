import { cookies } from 'next/headers';
import ImpersonateIsland from '@/components/islands/admin/ImpersonateIsland';
import { checkAdminAccess } from '@/server/actions/admin/admin-utils.actions';

export const metadata = {
    title: 'Test Modus | Salve Mundi Beheer'
};

export default async function ImpersonatePage() {
    const { impersonation } = await checkAdminAccess();

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
