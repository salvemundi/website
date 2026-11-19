import type { Metadata } from 'next';
import BeheerWebshopPreordersIsland from '@/components/islands/beheer/webshop/BeheerWebshopPreordersIsland';
import { getBeheerPreorders } from '@/server/queries/webshop/beheer-webshop.queries';

export const metadata: Metadata = {
    title: 'Webshop Bestellingen | SV Salve Mundi'
};

export default async function AdminWebshopPreordersPage() {
    const preorders = await getBeheerPreorders();

    return <BeheerWebshopPreordersIsland initialPreorders={preorders} />;
}
