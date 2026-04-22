import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PaymentStatusIsland from '@/components/islands/activities/PaymentStatusIsland';
import { getPaymentStatusAction } from '@/server/actions/reis-payment.actions';
import { CheckCircle2, ChevronRight, XCircle, Home } from 'lucide-react';
import BackButton from '@/components/ui/navigation/BackButton';

export const metadata: Metadata = {
    title: 'Bevestiging Betaling | SV Salve Mundi',
};

interface PageProps {
    searchParams: Promise<{ id?: string; t?: string }>;
}

import PublicPageShell from '@/components/ui/layout/PublicPageShell';

export default async function TripConfirmationPage({ searchParams }: PageProps) {
    const params = await searchParams;
    const token = params.t; 

    if (!token) {
        return (
            <PublicPageShell title="Bevestiging" hideHeader={true}>
                <div className="min-h-[70vh] flex items-center justify-center p-6">
                    <div className="max-w-md w-full p-12 bg-[var(--bg-card)] border border-[var(--beheer-border)] rounded-3xl text-center shadow-xl">
                        <XCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
                        <h1 className="text-2xl font-black text-white uppercase italic mb-4 tracking-tighter">Ongeldige Status</h1>
                        <p className="text-[var(--text-muted)] mb-8 leading-relaxed">We kunnen de status van je betaling niet verifiëren zonder een geldige transactie- of token-ID.</p>
                        <BackButton href="/reis" text="Terug naar Reizen" />
                    </div>
                </div>
            </PublicPageShell>
        );
    }

    // NUCLEAR SSR: Fetch initial status server-side
    const statusRes = await getPaymentStatusAction(token);
    const initialStatus = statusRes.success ? (statusRes.payment_status as any) : 'loading';
    const isPaid = initialStatus === 'paid';

    return (
        <PublicPageShell title="Betaling Status" hideHeader={true}>
            <div className="container mx-auto px-4 py-32 max-w-2xl min-h-[80vh] flex items-center justify-center">
                {isPaid ? (
                    <div className="flex flex-col items-center justify-center text-center p-12 bg-[var(--bg-card)] border border-[var(--beheer-border)] rounded-3xl backdrop-blur-xl shadow-2xl">
                        <div className="relative mb-8">
                            <div className="absolute inset-0 bg-green-500/20 blur-3xl rounded-full" />
                            <CheckCircle2 className="w-20 h-20 text-green-500 relative z-10 mx-auto" />
                        </div>
                        <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter mb-4">
                            Betaling Geslaagd!
                        </h2>
                        <p className="text-[var(--text-muted)] max-w-sm mx-auto leading-relaxed mb-10">
                            Je betaling is succesvol verwerkt. Je ontvangt binnen enkele minuten een bevestiging in je e-mail.
                        </p>
                        <BackButton 
                            href="/reis" 
                            text="Terug naar Reizen" 
                            icon={ChevronRight} 
                            className="bg-white text-black hover:bg-green-500 hover:text-white" 
                        />
                    </div>
                ) : (
                    <PaymentStatusIsland mollieId={token} initialStatus={initialStatus} />
                )}
            </div>
        </PublicPageShell>
    );
}

