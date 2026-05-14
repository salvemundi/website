import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getTripSignupByToken } from '@/server/actions/events/reis-payment.actions';
import TripPaymentFlowIsland from '@/components/islands/reis/TripPaymentFlowIsland';
import { TripAccessDenied, TripWaitlisted } from '@/components/ui/reis/TripPaymentStates';

export const metadata: Metadata = {
    title: 'Aanbetaling Reis | SV Salve Mundi' 
};

interface PageProps {
    searchParams: Promise<{ id?: string; t?: string }>;
}

/**
 * AanbetalingPage: Afhandeling van de eerste betaling (deposit) voor een reis.
 */
export default async function AanbetalingPage({ searchParams }: PageProps) {
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

    // 2. Already paid check: Redirect to final payment if deposit is already done
    if (signup.deposit_paid) {
        redirect(`/reis/betalen/restbetaling?id=${signupId}${token ? `&t=${token}` : ''}`);
    }

    return (
        <div className="w-full">
            <TripPaymentFlowIsland 
                signup={signup}
                trip={trip}
                allActivities={allActivities}
                selectedActivities={selectedActivities}
                paymentType="deposit"
                token={token}
            />
        </div>
    );
}
