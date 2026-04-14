import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import PaymentStatusIsland from '@/components/islands/activities/PaymentStatusIsland';
import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';

import { getPaymentStatusAction } from '@/server/actions/reis-payment.actions';

interface PageProps {
    searchParams: Promise<{ id?: string; transaction_id?: string; t?: string }>;
}

export default async function KroegentochtConfirmationPage({ searchParams }: PageProps) {
    const { id, transaction_id, t } = await searchParams;

    if (!id && !transaction_id && !t) notFound();

    const token = transaction_id || t;
    if (!token) {
        return (
            <main className="min-h-screen bg-[var(--bg-main)] pt-8">
                <h1 className="sr-only">Bevestiging</h1>
                <div className="container mx-auto px-4 py-32 max-w-2xl text-center">
                    <h1 className="text-2xl font-black text-white uppercase italic mb-4">Ongeldige Status</h1>
                    <p className="text-gray-400 mb-8">We kunnen de status van je betaling niet verifiëren zonder een geldige transactie.</p>
                    <a href="/kroegentocht" className="inline-block px-8 py-4 bg-white text-black font-bold rounded-2xl">
                        Terug naar Kroegentocht
                    </a>
                </div>
            </main>
        );
    }

    const statusRes = await getPaymentStatusAction(token);
    const isPaid = statusRes.success && statusRes.payment_status === 'paid';

    return (
        <main className="min-h-screen bg-[var(--bg-main)] pt-8">
            <h1 className="sr-only">Bevestiging</h1>
            <div className="container mx-auto px-4 max-w-2xl mt-12 pb-24">
                {isPaid ? (
                    <div className="flex flex-col items-center justify-center text-center p-12 bg-white/5 border border-white/5 rounded-3xl backdrop-blur-xl animate-in fade-in zoom-in duration-500">
                        <div className="relative mb-8">
                            <div className="absolute inset-0 bg-green-500/20 blur-3xl rounded-full" />
                            <div className="w-20 h-20 bg-green-500 rounded-full text-white flex items-center justify-center relative z-10 mx-auto text-4xl font-bold">✓</div>
                        </div>
                        <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter italic mb-4">
                            Betaling Geslaagd!
                        </h2>
                        <p className="text-gray-400 max-w-sm mx-auto leading-relaxed mb-10">
                            Je betaling voor de kroegentocht is succesvol verwerkt. Je ontvangt binnen enkele minuten een bevestiging en je tickets in je e-mail.
                        </p>
                        <a 
                            href="/kroegentocht"
                            className="px-10 py-5 rounded-2xl bg-white text-black font-black uppercase tracking-widest text-sm hover:bg-green-500 hover:text-white transition-all shadow-2xl shadow-green-500/10 flex items-center gap-2 mx-auto"
                        >
                            Terug naar Kroegentocht
                        </a>
                    </div>
                ) : (
                    <Suspense fallback={
                        <div className="flex flex-col items-center justify-center py-40 animate-pulse">
                            <div className="w-16 h-16 bg-[var(--theme-purple)]/10 rounded-full mb-4" />
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)]">Status controleren...</p>
                        </div>
                    }>
                        <PaymentStatusIsland 
                            mollieId={token}
                            returnUrl="/kroegentocht"
                            returnText="Terug naar Kroegentocht"
                            successText="Je betaling voor de kroegentocht is succesvol verwerkt. Je ontvangt binnen enkele minuten een bevestiging en je tickets in je e-mail."
                        />
                    </Suspense>
                )}
            </div>
        </main>
    );
}
