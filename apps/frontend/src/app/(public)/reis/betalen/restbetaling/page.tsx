import { Suspense } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTripSignupByToken } from '@/server/actions/reis-payment.actions';
import TripPaymentFlowIsland from '@/components/islands/reis/TripPaymentFlowIsland';
import { Loader2, CheckCircle2, Search, Home } from 'lucide-react';

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
        <div className="w-full">
            <Suspense fallback={
                <div className="flex flex-col items-center justify-center py-32">
                    <Loader2 className="animate-spin h-12 w-12 text-orange-500 mb-4" />
                    <p className="text-gray-500 font-black uppercase tracking-widest text-xs tracking-tighter text-sm">Betalingsgegevens laden...</p>
                </div>
            }>
                <PaymentDataWrapper signupId={signupId} token={token} paymentType="final" />
            </Suspense>
        </div>
    );
}

async function PaymentDataWrapper({ signupId, token, paymentType }: { signupId: number; token?: string; paymentType: 'deposit' | 'final' }) {
    const res = await getTripSignupByToken(signupId, token);

    if (!res.success || !res.data) {
        return (
            <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
                <div className="relative mb-8 pt-10">
                    <div className="absolute inset-x-0 top-0 h-40 w-40 mx-auto blur-3xl bg-[var(--color-purple-500)]/10 rounded-full pointer-events-none" />
                    <div className="relative rounded-3xl bg-[var(--bg-card)] p-6 shadow-2xl border border-[var(--border-color)]/20 text-[var(--color-purple-500)] inline-block">
                        <Search className="h-16 w-16" />
                    </div>
                </div>

                <h2 className="text-4xl font-black text-[var(--text-main)] mb-3 tracking-tight italic uppercase">
                    Toegang Geweigerd
                </h2>
                
                <p className="text-[var(--text-muted)] max-w-md mx-auto mb-10 font-medium">
                    {res.error || 'Deze link is ongeldig of verlopen. Gebruik de link uit de e-mail of log in op je account.'}
                </p>

                <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
                    <a
                        href="/reis"
                        className="flex items-center gap-2 rounded-full bg-[var(--color-purple-500)] text-white px-8 py-3.5 font-bold shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 hover:-translate-y-0.5 transition-all text-sm uppercase tracking-widest"
                    >
                        <Home className="h-4 w-4" />
                        Terug naar Reizen
                    </a>
                </div>
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
