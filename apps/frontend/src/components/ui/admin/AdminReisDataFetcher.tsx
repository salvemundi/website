import { getTripSignups, getSignupActivities } from '@/server/actions/reis-admin-signups.actions';
import AdminReisTableIsland from '@/components/islands/admin/AdminReisTableIsland';
import type { Trip } from '@salvemundi/validations';

interface AdminReisDataFetcherProps {
    tripId: number;
    trip: Trip;
}

export default async function AdminReisDataFetcher({ tripId, trip }: AdminReisDataFetcherProps) {
    const signups = await getTripSignups(tripId);
    
    // Fetch activities for all signups to satisfy AdminReisTableIslandProps
    const signupActivitiesMap: Record<number, any[]> = {};
    await Promise.all(signups.map(async (s) => {
        signupActivitiesMap[s.id] = await getSignupActivities(s.id);
    }));

    const stats = {
        total: signups.length,
        confirmed: signups.filter(s => s.status === 'confirmed' || s.status === 'registered').length,
        waitlist: signups.filter(s => s.status === 'waitlist').length,
        depositPaid: signups.filter(s => s.deposit_paid).length,
        fullPaid: signups.filter(s => s.full_payment_paid).length,
    };

    return (
        <AdminReisTableIsland
            initialSignups={signups}
            initialSignupActivities={signupActivitiesMap}
            trip={trip}
            stats={stats}
        />
    );
}
