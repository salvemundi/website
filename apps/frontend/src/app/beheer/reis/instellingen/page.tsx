import TripSettingsIsland from '@/components/islands/admin/TripSettingsIsland';
import { getReisSiteSettings } from '@/server/actions/events/trip.actions';
import { getTrips } from '@/server/queries/admin-trip.queries';
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
            <TripSettingsIsland
                initialTrips={trips as Trip[]}
                initialSettings={{
                    show: settings?.show ?? false
                }}
            />
        </div>
    );
}
