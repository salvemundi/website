import type { Metadata } from 'next';
import BeheerPageShell from '@/components/ui/beheer/BeheerPageShell';
import BeheerWebshopPickupIsland from '@/components/islands/beheer/webshop/BeheerWebshopPickupIsland';
import { getBeheerPickupList } from '@/server/queries/webshop/beheer-webshop.queries';

export const metadata: Metadata = {
    title: 'Webshop Afhaallijst | SV Salve Mundi'
};

export default async function AdminWebshopAfhalenPage() {
    const preorders = await getBeheerPickupList();

    return (
        <BeheerPageShell
        title="Afhaallijst"
        backHref="/beheer/webshop" hideToolbar={true}>
            <BeheerWebshopPickupIsland initialPreorders={preorders} />
        </BeheerPageShell>
    );
}
