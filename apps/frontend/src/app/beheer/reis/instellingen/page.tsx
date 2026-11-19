import { Box } from '@mantine/core';
import ReisSettingsIsland from '@/components/islands/beheer/reis/ReisSettingsIsland';
import { getReisSiteSettings } from '@/server/actions/events/reis/reis-public.actions';
import { getTrips } from '@/server/queries/reis/beheer-reis.queries';
import type { Trip } from '@salvemundi/validations';
export const metadata = {
    title: 'Reis Instellingen | SV Salve Mundi'
};

export default async function ReisInstellingenPage() {
    const [trips, settings] = await Promise.all([
        getTrips(),
        getReisSiteSettings()
    ]);

    return (
        <Box w="100%">
            <ReisSettingsIsland
                initialTrips={trips as Trip[]}
                initialSettings={{
                    show: settings?.show ?? false
                }}
            />
        </Box>
    );
}
