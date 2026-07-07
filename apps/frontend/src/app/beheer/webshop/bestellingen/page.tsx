import type { Metadata } from 'next';
import AdminUnauthorized from '@/components/ui/admin/AdminUnauthorized';
import AdminPageShell from '@/components/ui/admin/AdminPageShell';
import { getEnrichedSession } from '@/server/auth/auth-utils';
import { getPermissions } from '@/shared/lib/permissions';
import { redirect } from 'next/navigation';
import AdminWebshopPreordersIsland from '@/components/islands/admin/webshop/AdminWebshopPreordersIsland';
import { getAdminPreorders } from '@/server/queries/webshop/admin-webshop.queries';

export const metadata: Metadata = {
    title: 'Webshop Bestellingen | SV Salve Mundi'
};

async function loadPreorders() {
    try {
        const session = await getEnrichedSession();
        if (!session?.user) redirect('/?needLogin=true');
        const permissions = getPermissions(session.user.committees);
        if (!permissions.includes('webshop')) {
            return { success: false as const, error: 'unauthorized' };
        }
        const preorders = await getAdminPreorders();
        return { success: true as const, preorders };
    } catch (error: unknown) {
        return { success: false as const, error: (error instanceof Error) ? error.message : 'Niet geautoriseerd' };
    }
}

export default async function AdminWebshopPreordersPage() {
    const result = await loadPreorders();

    if (!result.success) {
        if (result.error === 'unauthorized') return <AdminUnauthorized title="Webshop Bestellingen" backHref="/beheer/webshop" />;
        return <AdminUnauthorized title="Geen Toegang" description={result.error} />;
    }

    return (
        <AdminPageShell title="Webshop Bestellingen" subtitle="Overzicht van preorders en betaalstatus" backHref="/beheer/webshop" hideToolbar={true}>
            <AdminWebshopPreordersIsland initialPreorders={result.preorders} />
        </AdminPageShell>
    );
}
