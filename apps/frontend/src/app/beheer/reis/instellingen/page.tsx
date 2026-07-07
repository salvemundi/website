import ReisSettingsIsland from '@/components/islands/admin/reis/ReisSettingsIsland';
import { getReisSiteSettings } from '@/server/actions/events/reis/reis-public.actions';
import { getTrips } from '@/server/queries/reis/admin-reis.queries';
import { tripSchema, type Trip } from '@salvemundi/validations';
import AdminUnauthorized from '@/components/ui/admin/AdminUnauthorized';
import { getEnrichedSession } from '@/server/auth/auth-utils';
import { getPermissions } from '@/shared/lib/permissions';
import { redirect } from 'next/navigation';
export const metadata = {
    title: 'Reis Instellingen | SV Salve Mundi'
};

export default async function ReisInstellingenPage() {
    const session = await getEnrichedSession();
    if (!session?.user) redirect('/?needLogin=true');
    const permissions = getPermissions(session.user.committees);
    if (!permissions.includes('reis')) {
        return <AdminUnauthorized title="Reis Instellingen" backHref="/beheer/reis" />;
    }

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
