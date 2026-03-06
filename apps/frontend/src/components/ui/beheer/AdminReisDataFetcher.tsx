import { getTripSignups } from '@/server/actions/admin-reis.actions';
import AdminReisTableIsland from '@/components/islands/beheer/AdminReisTableIsland';
import type { Trip } from '@salvemundi/validations';

interface AdminReisDataFetcherProps {
    tripId: number;
    trip: Trip;
}

export default async function AdminReisDataFetcher({ tripId, trip }: AdminReisDataFetcherProps) {
    const signups = await getTripSignups(tripId);

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
            trip={trip}
            stats={stats}
        />
    );
}
