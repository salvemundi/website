import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTripSignupByToken } from '@/server/actions/reis-payment.actions';
import TripPaymentFlowIsland from '@/components/islands/reis/TripPaymentFlowIsland';
import { TripAccessDenied, TripWaitlisted, TripAlreadyPaid } from '@/components/ui/reis/TripPaymentStates';

export const metadata: Metadata = {
    title: 'Restbetaling Reis | SV Salve Mundi' 
};

interface PageProps {
    searchParams: Promise<{ id?: string; t?: string }>;
}

/**
 * RestbetalingPage: Afhandeling van de restbetaling (final payment) voor een reis.
 */
export default async function RestbetalingPage({ searchParams }: PageProps) {
    const params = await searchParams;
    const signupId = params.id ? parseInt(params.id) : null;
    const token = params.t;

    if (!signupId) return notFound();

    // NUCLEAR SSR: Fetch all payment and trip data before flushing
    const res = await getTripSignupByToken(signupId, token);

    if (!res.success || !res.data) {
        return <TripAccessDenied error={res.error} />;
    }

    const { signup, trip, allActivities, selectedActivities } = res.data;
    if (!signup || !trip) return notFound();

    // 1. Waitlist check
    if (signup.status === 'waitlist') {
        return <TripWaitlisted />;
    }

    // 2. Already paid check
    if (signup.full_payment_paid) {
        return <TripAlreadyPaid tripName={trip.name} />;
    }

    return (
        <div className="w-full">
            <TripPaymentFlowIsland 
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
