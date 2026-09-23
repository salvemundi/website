import { notFound } from 'next/navigation';
import PaymentStatusIsland from '@/components/islands/activiteiten/PaymentStatusIsland';
import BackButton from '@/components/ui/navigation/BackButton';
import { getPaymentStatusAction } from '@/server/actions/events/reis/reis-payment.actions';
import { KroegentochtWhatsAppPopup } from '@/components/islands/kroegentocht/KroegentochtWhatsAppPopup';
import PublicPageShell from '@/components/ui/layout/PublicPageShell';
import { CheckCircle2 } from 'lucide-react';

interface PageProps {
    searchParams: Promise<{ id?: string; transaction_id?: string; t?: string }>;
}

export default async function KroegentochtConfirmationPage({ searchParams }: PageProps) {
    const { id, transaction_id, t } = await searchParams;

    if (!id && !transaction_id && !t) notFound();

    const token = transaction_id || t;
    if (!token) {
        return (
            <PublicPageShell title="Bevestiging" hideHeader={true}>
                <div className="flex min-h-[70vh] items-center justify-center p-6">
                    <div className="squircle-lg w-full max-w-md border border-border-color bg-bg-card p-12 text-center shadow-xl">
                        <h1 className="mb-4 text-2xl font-black text-theme-purple">Ongeldige Status</h1>
                        <p className="mb-8 text-text-muted">We kunnen de status van je betaling niet verifiëren zonder een geldige transactie.</p>
                        <BackButton href="/kroegentocht" text="Terug naar Kroegentocht" />
                    </div>
                </div>
            </PublicPageShell>
        );
    }

    // NUCLEAR SSR: Fetch initial status server-side
    const statusRes = await getPaymentStatusAction(token);
    const initialStatus = statusRes.success && 'payment_status' in statusRes ? statusRes.payment_status : 'loading';
    const isPaid = initialStatus === 'paid';

    return (
        <PublicPageShell 
            title="Bevestiging Betaling" 
            backgroundImage="/img/backgrounds/Kroto2025.jpg"
            imageFilter="brightness(0.55)"
        >
            <div className="container mx-auto flex min-h-[80vh] max-w-2xl items-center justify-center px-4 py-32">
                {isPaid ? (
                    <div className="squircle-lg flex w-full flex-col items-center justify-center border border-border-color bg-bg-card p-12 text-center shadow-2xl backdrop-blur-xl">
                        <div className="relative mb-8">
                            <div className="absolute inset-0 rounded-full bg-green-500/20 blur-3xl" />
                            <CheckCircle2 className="relative z-10 mx-auto size-20 text-green-500" />
                        </div>
                        <h2 className="mb-4 text-4xl font-black text-theme-purple">
                            Betaling Geslaagd!
                        </h2>
                        <p className="mx-auto mb-10 max-w-sm text-base leading-relaxed font-semibold text-text-muted">
                            Je betaling voor de kroegentocht is succesvol verwerkt. Je ontvangt binnen enkele minuten een bevestiging en je tickets in je e-mail.
                        </p>
                        <BackButton 
                            href="/kroegentocht" 
                            text="Terug naar Kroegentocht" 
                            className="bg-white text-black hover:bg-green-500 hover:text-white" 
                        />
                    </div>
                ) : (
                    <PaymentStatusIsland 
                        mollieId={token}
                        returnUrl="/kroegentocht"
                        returnText="Terug naar Kroegentocht"
                        successText="Je betaling voor de kroegentocht is succesvol verwerkt. Je ontvangt binnen enkele minuten een bevestiging en je tickets in je e-mail."
                        initialStatus={initialStatus}
                    />
                )}
            </div>
            <KroegentochtWhatsAppPopup signupId={id ? Number(id) : undefined} token={token} />
        </PublicPageShell>
    );
}

