// src/app/beheer/reis/instellingen/page.tsx

import ReisInstellingenIsland from '@/components/islands/admin/ReisInstellingenIsland';
import AdminPageShell from '@/components/ui/admin/AdminPageShell';
import { getSystemDirectus } from '@/lib/directus';
import { readSingleton } from '@directus/sdk';
import { getTrips } from '@/server/queries/admin-reis.queries';

interface ReisSettings {
    show: boolean;
    disabled_message: string | null;
}

export default async function ReisInstellingenPage() {
    const trips = await getTrips();

    const directus = getSystemDirectus();
    const settings = await directus.request<ReisSettings>(
        readSingleton('Reis_Settings' as never)
    );

    return (
        <AdminPageShell
            title="Reis Instellingen"
            subtitle="Beheer de algemene configuratie van de reizen module."
            backHref="/beheer/reis"
        >
            <ReisInstellingenIsland
                initialTrips={trips}
                initialSettings={{
                    show: settings?.show ?? false,
                    disabled_message: settings?.disabled_message ?? null
                }}
            />
        </AdminPageShell>
    );
}