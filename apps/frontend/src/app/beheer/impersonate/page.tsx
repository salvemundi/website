import { cookies } from 'next/headers';
import Link from 'next/link';
import { ArrowLeft, Shield } from 'lucide-react';
import ImpersonateIsland from '@/components/islands/admin/ImpersonateIsland';
import { checkAdminAccess } from '@/server/actions/admin.actions';
import { redirect } from 'next/navigation';

export const metadata = {
    title: 'Test Modus | Salve Mundi Beheer',
};

export default async function ImpersonatePage() {
    // 1. Controleer permissies op de server
    const { isAuthorized } = await checkAdminAccess();
    if (!isAuthorized) {
        redirect('/beheer');
    }

    // 2. Halen we impersonatie gegevens op (gebeurt nu centraal in checkAdminAccess)
    const { impersonation } = await checkAdminAccess();
    const cookieStore = await cookies();
    const activeToken = cookieStore.get('directus_test_token')?.value || null;

    return (
        <main className="min-h-screen bg-[var(--bg-main)]">
            <ImpersonateIsland 
                activeToken={activeToken} 
                impersonatedName={impersonation?.name || null}
                impersonatedCommittees={impersonation?.committees || []}
            />
        </main>
    );
}