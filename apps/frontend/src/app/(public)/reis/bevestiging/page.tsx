import type { Metadata } from 'next';
import PaymentStatusIsland from '@/components/islands/activiteiten/PaymentStatusIsland';
import { getPaymentStatusAction } from '@/server/actions/events/reis/reis-payment.actions';
import { CheckCircle2, ChevronRight, XCircle } from 'lucide-react';
import BackButton from '@/components/ui/navigation/BackButton';

export const metadata: Metadata = {
    title: 'Bevestiging Betaling | Salve Mundi' };


interface PageProps {
    searchParams: Promise<{ id?: string; t?: string; tr?: string }>;
}

import PublicPageShell from '@/components/ui/layout/PublicPageShell';

export default async function TripConfirmationPage({ searchParams }: PageProps) {
    const params = await searchParams;
    const token = params.tr || params.t; 

    if (!token) {
        return (
            <PublicPageShell title="Bevestiging" hideHeader={true}>
                <div className="flex min-h-[70vh] items-center justify-center p-6">
                    <div className="squircle-lg w-full max-w-md border border-border-color bg-bg-card p-12 text-center shadow-xl">
                        <XCircle className="mx-auto mb-6 size-16 text-red-500" />
                        <h1 className="mb-4 text-2xl font-black text-theme-purple">Ongeldige Status</h1>
                        <p className="mb-8 leading-relaxed text-text-muted">We kunnen de status van je betaling niet verifiëren zonder een geldige transactie- of token-ID.</p>
                        <BackButton href="/reis" text="Terug naar Reizen" />
                    </div>
                </div>
            </PublicPageShell>
        );
    }

    // NUCLEAR SSR: Fetch initial status server-side
    const statusRes = await getPaymentStatusAction(token);
    const initialStatus = statusRes.success ? (statusRes.payment_status as 'loading' | 'open' | 'paid' | 'expired' | 'failed' | 'canceled') : 'loading';
    const isPaid = initialStatus === 'paid';

    return (
        <PublicPageShell title="Betaling Status" hideHeader={true}>
            <div className="container mx-auto flex min-h-[80vh] max-w-2xl items-center justify-center px-4 py-32">
                {isPaid ? (
                    <div className="squircle-lg flex flex-col items-center justify-center border border-border-color bg-bg-card p-12 text-center shadow-2xl backdrop-blur-xl">
                        <div className="relative mb-8">
                            <div className="absolute inset-0 rounded-full bg-green-500/20 blur-3xl" />
                            <CheckCircle2 className="relative z-10 mx-auto size-20 text-green-500" />
                        </div>
                        <h2 className="mb-4 text-4xl font-black text-theme-purple">
                            Betaling Geslaagd!
                        </h2>
                        <p className="mx-auto mb-10 max-w-sm leading-relaxed text-text-muted">
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

