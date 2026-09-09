import type { Metadata } from 'next';
import AdminPageShell from '@/components/ui/admin/AdminPageShell';
import AdminWebshopPickupIsland from '@/components/islands/admin/webshop/AdminWebshopPickupIsland';
import { getAdminPickupList } from '@/server/queries/webshop/admin-webshop.queries';

export const metadata: Metadata = {
    title: 'Webshop Afhaallijst | SV Salve Mundi'
};

export default async function AdminWebshopAfhalenPage() {
    const preorders = await getAdminPickupList();

    return (
        <AdminPageShell
        title="Afhaallijst"
        backHref="/beheer/webshop" hideToolbar={true}>
            <AdminWebshopPickupIsland initialPreorders={preorders} />
        </AdminPageShell>
    );
}
