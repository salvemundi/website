import ReisSettingsIsland from '@/components/islands/admin/reis/ReisSettingsIsland';
import { getReisSiteSettings } from '@/server/actions/events/reis/reis-public.actions';
import { getTrips } from '@/server/queries/reis/admin-reis.queries';
import { tripSchema, type Trip } from '@salvemundi/validations';
export const metadata = {
    title: 'Reis Instellingen | SV Salve Mundi'
};

export default async function ReisInstellingenPage() {
    const [tripsRes, settings] = await Promise.all([
        getTrips(),
        getReisSiteSettings()
    ]);

    const trips = tripSchema.array().parse(tripsRes);

    return (
        <div className="w-full">
            <ReisSettingsIsland
                initialTrips={trips as Trip[]}
                initialSettings={{
                    show: settings?.show ?? false
                }}
            />
        </div>
    );
}
