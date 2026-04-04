import { Suspense } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTripSignupByToken } from '@/server/actions/reis-payment.actions';
import TripPaymentFlowIsland from '@/components/islands/activities/TripPaymentFlowIsland';
import { Loader2 } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Aanbetaling Reis | SV Salve Mundi',
};

interface PageProps {
    searchParams: Promise<{ id?: string; t?: string }>;
}

export default async function AanbetalingPage({ searchParams }: PageProps) {
    const params = await searchParams;
    const signupId = params.id ? parseInt(params.id) : null;
    const token = params.t;

    if (!signupId) return notFound();

    return (
        <main className="min-h-screen bg-[var(--bg-main)]">
            <Suspense fallback={
                <div className="flex flex-col items-center justify-center py-32">
                    <Loader2 className="animate-spin h-12 w-12 text-orange-500 mb-4" />
                    <p className="text-gray-500 font-black uppercase tracking-widest text-xs tracking-tighter">Betalingsgegevens laden...</p>
                </div>
            }>
                <PaymentDataWrapper signupId={signupId} token={token} paymentType="deposit" />
            </Suspense>
        </main>
    );
}

async function PaymentDataWrapper({ signupId, token, paymentType }: { signupId: number; token?: string; paymentType: 'deposit' | 'final' }) {
    const res = await getTripSignupByToken(signupId, token);

    if (!res.success || !res.data) {
        return (
            <div className="max-w-xl mx-auto py-32 px-6 text-center">
                <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mx-auto mb-6">
                    <path d="M12 9v4m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 14c-.77 1.333.192 3 1.732 3z" />
                </div>
                <h1 className="text-2xl font-black text-white uppercase italic mb-4">Toegang Geweigerd</h1>
                <p className="text-gray-400 mb-8">{res.error || 'Deze link is ongeldig of verlopen.'}</p>
                <a href="/reis" className="inline-block px-8 py-4 bg-white text-black font-bold rounded-2xl hover:bg-orange-500 hover:text-white transition-all">
                    Terug naar overzicht
                </a>
            </div>
        );
    }

    const { signup, trip, allActivities, selectedActivities } = res.data;

    if (!signup || !trip) return notFound();

    // Redirection logic from legacy requirements:
    // "Als de aanbetaling al is voldaan, moet de gebruiker automatisch worden doorgestuurd naar de restbetalingspagina."
    if (paymentType === 'deposit' && signup.deposit_paid) {
        const url = `/reis/betalen/restbetaling?id=${signupId}${token ? `&t=${token}` : ''}`;
        // Note: Using a meta-refresh or simple link if redirect() is problematic in Suspense
        return (
            <div className="max-w-xl mx-auto py-32 px-6 text-center">
                <h1 className="text-2xl font-black text-white uppercase italic mb-4">Aanbetaling al voldaan</h1>
                <p className="text-gray-400 mb-8">Je hebt de aanbetaling voor deze reis al gedaan. Je wordt doorverwezen naar de restbetaling.</p>
                <a href={url} className="inline-block px-8 py-4 bg-[var(--sm-orange)] text-white font-bold rounded-2xl">
                    Ga naar Restbetaling
                </a>
            </div>
        );
    }

    return (
        <TripPaymentFlowIsland 
            signup={signup}
            trip={trip}
            allActivities={allActivities}
            selectedActivities={selectedActivities}
            paymentType={paymentType}
            token={token}
        />
    );
}
