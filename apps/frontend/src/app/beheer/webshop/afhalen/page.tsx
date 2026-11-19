import type { Metadata } from 'next';
import BeheerWebshopPickupIsland from '@/components/islands/beheer/webshop/BeheerWebshopPickupIsland';
import { getBeheerPickupList } from '@/server/queries/webshop/beheer-webshop.queries';

export const metadata: Metadata = {
    title: 'Webshop Afhaallijst | SV Salve Mundi'
};

export default async function AdminWebshopAfhalenPage() {
    const preorders = await getBeheerPickupList();

    return <BeheerWebshopPickupIsland initialPreorders={preorders} />;
}
