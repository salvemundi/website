import type { Metadata } from 'next';
import BeheerPageShell from '@/components/ui/beheer/BeheerPageShell';
import BeheerWebshopPreordersIsland from '@/components/islands/beheer/webshop/BeheerWebshopPreordersIsland';
import { getBeheerPreorders } from '@/server/queries/webshop/beheer-webshop.queries';

export const metadata: Metadata = {
    title: 'Webshop Bestellingen | SV Salve Mundi'
};

export default async function AdminWebshopPreordersPage() {
    const preorders = await getBeheerPreorders();

    return (
        <BeheerPageShell
        title="Webshop Bestellingen"
        backHref="/beheer/webshop" hideToolbar={true}>
            <BeheerWebshopPreordersIsland initialPreorders={preorders} />
        </BeheerPageShell>
    );
}
