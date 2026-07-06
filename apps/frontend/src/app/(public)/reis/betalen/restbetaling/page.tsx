import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTripSignupByToken } from '@/server/actions/events/reis/reis-payment.actions';
import ReisPaymentFlowIsland from '@/components/islands/reis/ReisPaymentFlowIsland';
import { TripAccessDenied, TripWaitlisted, TripAlreadyPaid } from '@/components/ui/reis/ReisPaymentStates';

export const metadata: Metadata = {
    title: 'Restbetaling Reis | Salve Mundi'
};

interface PageProps {
    searchParams: Promise<{ id?: string; t?: string }>;
}

export default async function RestbetalingPage({ searchParams }: PageProps) {
    const params = await searchParams;
    const signupId = params.id ? parseInt(params.id) : null;
    const token = params.t;

    if (!signupId) return notFound();

    const res = await getTripSignupByToken(signupId, token);

    if (!res.success || !res.data) {
        return <TripAccessDenied error={res.error} />;
    }

    const { signup, trip, allActivities, selectedActivities } = res.data;

    if (signup.status === 'waitlist') {
        return <TripWaitlisted />;
    }

    if (signup.full_payment_paid) {
        return <TripAlreadyPaid tripName={trip.name || "deze reis"} />;
    }

    return (
        <div className="w-full">
            <ReisPaymentFlowIsland
                signup={signup}
                trip={trip}
                allActivities={allActivities}
                selectedActivities={selectedActivities}
                paymentType="final"
                token={token}
            />
        </div>
    );
}
