import type { Metadata } from 'next';
import AdminPageShell from '@/components/ui/admin/AdminPageShell';
import AdminWebshopPreordersIsland from '@/components/islands/admin/webshop/AdminWebshopPreordersIsland';
import { getAdminPreorders } from '@/server/queries/webshop/admin-webshop.queries';

export const metadata: Metadata = {
    title: 'Webshop Bestellingen | SV Salve Mundi'
};

export default async function AdminWebshopPreordersPage() {
    const preorders = await getAdminPreorders();

    return (
        <AdminPageShell
        title="Webshop Bestellingen"
        backHref="/beheer/webshop" hideToolbar={true}>
            <AdminWebshopPreordersIsland initialPreorders={preorders} />
        </AdminPageShell>
    );
}
