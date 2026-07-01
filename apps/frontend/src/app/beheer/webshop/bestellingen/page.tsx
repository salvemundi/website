import type { Metadata } from 'next';
import AdminUnauthorized from '@/components/ui/admin/AdminUnauthorized';
import AdminPageShell from '@/components/ui/admin/AdminPageShell';
import AdminWebshopPreordersIsland from '@/components/islands/admin/webshop/AdminWebshopPreordersIsland';
import { getAdminPreorders } from '@/server/queries/admin-webshop.queries';

export const metadata: Metadata = {
    title: 'Webshop Bestellingen | SV Salve Mundi'
};

async function loadPreorders() {
    try {
        const preorders = await getAdminPreorders();
        return { success: true as const, preorders };
    } catch (e: unknown) {
        return { success: false as const, error: (e instanceof Error) ? e.message : 'Niet geautoriseerd' };
    }
}

export default async function AdminWebshopPreordersPage() {
    const result = await loadPreorders();

    if (!result.success) {
        return <AdminUnauthorized title="Geen Toegang" description={result.error} />;
    }

    return (
        <AdminPageShell title="Webshop Bestellingen" subtitle="Overzicht van preorders en betaalstatus" backHref="/beheer/webshop" hideToolbar={true}>
            <AdminWebshopPreordersIsland initialPreorders={result.preorders} />
        </AdminPageShell>
    );
}
