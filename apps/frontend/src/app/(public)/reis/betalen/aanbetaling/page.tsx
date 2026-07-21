import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getTripSignupByToken } from '@/server/actions/events/reis/reis-payment.actions';
import ReisPaymentFlowIsland from '@/components/islands/reis/ReisPaymentFlowIsland';
import { TripAccessDenied, TripWaitlisted } from '@/components/ui/reis/ReisPaymentStates';

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

    if (!trip.allow_deposit_payments && signup.role !== 'admin') {
        return <TripAccessDenied error="De aanbetalingen zijn momenteel nog niet geopend voor deze reis. Je ontvangt een e-mail zodra je kunt betalen." />;
    }

    if (signup.deposit_paid) {
        redirect(`/reis/betalen/restbetaling?id=${signupId}${token ? `&t=${token}` : ''}`);
    }

    return (
        <div className="w-full">
            <ReisPaymentFlowIsland
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
