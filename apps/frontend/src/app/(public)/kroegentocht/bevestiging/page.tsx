import { notFound } from 'next/navigation';
import PaymentStatusIsland from '@/components/islands/activities/PaymentStatusIsland';
import BackButton from '@/components/ui/navigation/BackButton';
import { getPaymentStatusAction } from '@/server/actions/events/reis-payment.actions';
import { KroegentochtWhatsAppPopup } from '@/components/islands/kroegentocht/KroegentochtWhatsAppPopup';
import PublicPageShell from '@/components/ui/layout/PublicPageShell';

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
                <div className="min-h-[70vh] flex items-center justify-center p-6">
                    <div className="max-w-md w-full p-12 bg-[var(--bg-card)] border border-[var(--beheer-border)] rounded-3xl text-center shadow-xl">
                        <h1 className="text-2xl font-black text-white uppercase italic mb-4">Ongeldige Status</h1>
                        <p className="text-[var(--text-muted)] mb-8">We kunnen de status van je betaling niet verifiëren zonder een geldige transactie.</p>
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
            <div className="container mx-auto px-4 py-32 max-w-2xl min-h-[80vh] flex items-center justify-center">
                {isPaid ? (
                    <div className="flex flex-col items-center justify-center text-center p-12 bg-[var(--bg-card)] border border-[var(--beheer-border)] rounded-3xl backdrop-blur-xl shadow-2xl w-full">
                        <div className="relative mb-8">
                            <div className="absolute inset-0 bg-green-500/20 blur-3xl rounded-full" />
                            <div className="w-20 h-20 bg-green-500 rounded-full text-white flex items-center justify-center relative z-10 mx-auto text-4xl font-bold">✓</div>
                        </div>
                        <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter mb-4">
                            Betaling Geslaagd!
                        </h2>
                        <p className="text-[var(--text-muted)] max-w-sm mx-auto leading-relaxed mb-10 text-base font-semibold">
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

