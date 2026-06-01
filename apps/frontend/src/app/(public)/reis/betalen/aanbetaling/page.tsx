import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getTripSignupByToken } from '@/server/actions/events/reis-payment.actions';
import TripPaymentFlowIsland from '@/components/islands/reis/TripPaymentFlowIsland';
import { TripAccessDenied, TripWaitlisted } from '@/components/ui/reis/TripPaymentStates';

export const metadata: Metadata = {
    title: 'Aanbetaling Reis | Salve Mundi'
};

interface PageProps {
    searchParams: Promise<{ id?: string; t?: string }>;
}

export default async function AanbetalingPage({ searchParams }: PageProps) {
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