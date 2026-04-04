import { Suspense } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTripSignupByToken } from '@/server/actions/reis-payment.actions';
import TripPaymentFlowIsland from '@/components/islands/activities/TripPaymentFlowIsland';
import { Loader2, CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Restbetaling Reis | SV Salve Mundi',
};

interface PageProps {
    searchParams: Promise<{ id?: string; t?: string }>;
}

export default async function RestbetalingPage({ searchParams }: PageProps) {
    const params = await searchParams;
    const signupId = params.id ? parseInt(params.id) : null;
    const token = params.t;

    if (!signupId) return notFound();

    return (
        <main className="min-h-screen bg-[var(--bg-main)]">
            <Suspense fallback={
                <div className="flex flex-col items-center justify-center py-32">
                    <Loader2 className="animate-spin h-12 w-12 text-orange-500 mb-4" />
                    <p className="text-gray-500 font-black uppercase tracking-widest text-xs tracking-tighter text-sm">Betalingsgegevens laden...</p>
                </div>
            }>
                <PaymentDataWrapper signupId={signupId} token={token} paymentType="final" />
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

    // Redirection logic for final payment:
    if (signup.full_payment_paid) {
        return (
            <div className="max-w-xl mx-auto py-32 px-6 text-center">
                <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center text-green-500 mx-auto mb-8">
                    <CheckCircle2 className="w-10 h-10" />
                </div>
                <h1 className="text-4xl font-black text-white uppercase italic mb-4">Betaling voltooid</h1>
                <p className="text-gray-400 mb-8 leading-relaxed">
                    Je hebt de volledige betaling voor de reis naar <strong>{trip.name}</strong> al voldaan. 
                    Je hoeft verder niets te doen! Je hoort binnenkort meer van ons.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <a href="/reis" className="px-8 py-4 bg-white/5 border border-white/10 text-white font-bold rounded-2xl hover:bg-white/10 transition-all">
                        Terug naar Reizen
                    </a>
                    <a href="/profiel/lidmaatschap" className="px-8 py-4 bg-orange-500 text-white font-bold rounded-2xl shadow-xl shadow-orange-500/10 transition-all">
                        Bekijk je profiel
                    </a>
                </div>
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
