import ReisInstellingenIsland from '@/components/islands/admin/ReisInstellingenIsland';
import { getReisSiteSettings } from '@/server/actions/events/reis.actions';
import { getTrips } from '@/server/queries/admin-reis.queries';
import { tripSchema, type Trip } from '@salvemundi/validations';

export const metadata = {
    title: 'Reis Instellingen | SV Salve Mundi'
};

export default async function ReisInstellingenPage() {
    const [tripsRes, settings] = await Promise.all([
        getTrips(),
        getReisSiteSettings()
    ]);

    // Error handling is managed at the action/db level or via Error Boundaries
    const trips = tripSchema.array().parse(tripsRes);

    return (
        <div className="w-full">
            <ReisInstellingenIsland
                initialTrips={trips as Trip[]}
                initialSettings={{
                    show: settings?.show ?? false
                }}
            />
        </div>
    );
}