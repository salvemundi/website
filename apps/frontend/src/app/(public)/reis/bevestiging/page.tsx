import { Suspense } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PaymentStatusIsland from '@/components/islands/activities/PaymentStatusIsland';
import { getPaymentStatusAction } from '@/server/actions/reis-payment.actions';
import { Loader2, CheckCircle2, ChevronRight, XCircle } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Bevestiging Betaling | SV Salve Mundi',
};

interface PageProps {
    searchParams: Promise<{ id?: string; t?: string }>;
}

export default async function TripConfirmationPage({ searchParams }: PageProps) {
    const params = await searchParams;
    const token = params.t; 

    if (!token) {
        return (
            <main className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center p-6">
                <div className="max-w-md w-full p-12 bg-white/5 border border-white/5 rounded-3xl text-center">
                    <h1 className="text-2xl font-black text-white uppercase italic mb-4">Ongeldige Status</h1>
                    <p className="text-gray-400 mb-8">We kunnen de status van je betaling niet verifiëren zonder een geldige transactie- of token-ID.</p>
                    <a href="/reis" className="inline-block px-8 py-4 bg-white text-black font-bold rounded-2xl">
                        Terug naar Reizen
                    </a>
                </div>
            </main>
        );
    }

    // Server-side check for immediate success
    const statusRes = await getPaymentStatusAction(token);
    const isPaid = statusRes.success && statusRes.payment_status === 'paid';

    return (
        <main className="min-h-screen bg-[var(--bg-main)]">
            <div className="container mx-auto px-4 py-32 max-w-2xl">
                {isPaid ? (
                    <div className="flex flex-col items-center justify-center text-center p-12 bg-white/5 border border-white/5 rounded-3xl backdrop-blur-xl animate-in fade-in zoom-in duration-500">
                        <div className="relative mb-8">
                            <div className="absolute inset-0 bg-green-500/20 blur-3xl rounded-full" />
                            <CheckCircle2 className="w-20 h-20 text-green-500 relative z-10 mx-auto" />
                        </div>
                        <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter italic mb-4">
                            Betaling Geslaagd!
                        </h2>
                        <p className="text-gray-400 max-w-sm mx-auto leading-relaxed mb-10">
                            Je betaling is succesvol verwerkt. Je ontvangt binnen enkele minuten een bevestiging in je e-mail.
                        </p>
                        <a 
                            href="/reis"
                            className="px-10 py-5 rounded-2xl bg-white text-black font-black uppercase tracking-widest text-sm hover:bg-green-500 hover:text-white transition-all shadow-2xl shadow-green-500/10 flex items-center gap-2 mx-auto"
                        >
                            Terug naar Reizen
                            <ChevronRight className="w-5 h-5" />
                        </a>
                    </div>
                ) : (
                    <Suspense fallback={
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 className="w-12 h-12 text-orange-500 animate-spin mb-4" />
                            <p className="text-xs font-black uppercase tracking-widest text-gray-500">Status voorbereiden...</p>
                        </div>
                    }>
                        <PaymentStatusIsland mollieId={token} />
                    </Suspense>
                )}
            </div>
        </main>
    );
}
