// src/app/beheer/reis/instellingen/page.tsx

import ReisInstellingenIsland from '@/components/islands/admin/ReisInstellingenIsland';
import AdminPageShell from '@/components/ui/admin/AdminPageShell';
import { getSystemDirectus } from '@/lib/directus';
import { readSingleton } from '@directus/sdk';
import { query } from '@/lib/database';
import { type Trip } from '@salvemundi/validations/schema/admin-reis.zod';

async function getTripsInternal(): Promise<Trip[]> {
    const { rows } = await query('SELECT * FROM "Reis" ORDER BY date_created DESC');
    return rows.map(r => ({
        ...r,
        id: Number(r.id),
        base_price: Number(r.base_price),
        deposit_amount: Number(r.deposit_amount),
        registration_open: Boolean(r.registration_open),
        max_participants: Number(r.max_participants),
        crew_discount: Number(r.crew_discount),
        is_bus_trip: Boolean(r.is_bus_trip),
        allow_final_payments: Boolean(r.allow_final_payments)
    })) as Trip[];
}

interface ReisSettings {
    show: boolean;
    disabled_message: string | null;
}

export default async function ReisInstellingenPage() {
    const trips = await getTripsInternal();

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