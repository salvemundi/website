import type { Metadata } from 'next';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import PublicPageShell from '@/components/ui/layout/PublicPageShell';
import BackButton from '@/components/ui/navigation/BackButton';
import WebshopFinalPaymentIsland from '@/components/islands/webshop/WebshopFinalPaymentIsland';
import { getPreorderStatus } from '@/server/actions/public/webshop.actions';

export const metadata: Metadata = {
    title: 'Restbetaling | Webshop | Salve Mundi'
};

interface PageProps {
    searchParams: Promise<{ preorder?: string; token?: string }>;
}

function InfoCard({ icon: Icon, iconClassName, title, message }: { icon: typeof Clock; iconClassName: string; title: string; message: string }) {
    return (
        <div className="min-h-[60vh] flex items-center justify-center p-6">
            <div className="max-w-md w-full p-12 bg-(--bg-card) border border-(--border-color) rounded-[1.75rem] text-center shadow-xl">
                <Icon className={`w-16 h-16 mx-auto mb-6 ${iconClassName}`} />
                <h1 className="text-2xl font-black text-(--theme-purple) mb-4">{title}</h1>
                <p className="text-(--text-muted) mb-8 leading-relaxed">{message}</p>
                <BackButton href="/webshop" text="Terug naar webshop" />
            </div>
        </div>
    );
}

export default async function WebshopRestbetalingPage({ searchParams }: PageProps) {
    const params = await searchParams;
    const preorderId = params.preorder ? Number(params.preorder) : NaN;

    if (!params.preorder || Number.isNaN(preorderId)) {
        return (
            <PublicPageShell>
                <InfoCard icon={XCircle} iconClassName="text-red-500" title="Ongeldige bestelling" message="We kunnen je bestelling niet vinden zonder een geldig bestelnummer." />
            </PublicPageShell>
        );
    }

    const result = await getPreorderStatus(preorderId, params.token);

    if (result.status === 'not_found') {
        return (
            <PublicPageShell>
                <InfoCard icon={XCircle} iconClassName="text-red-500" title="Bestelling niet gevonden" message="Deze bestelling bestaat niet (meer)." />
            </PublicPageShell>
        );
    }

    if (result.status === 'unauthorized') {
        return (
            <PublicPageShell>
                <InfoCard icon={XCircle} iconClassName="text-red-500" title="Geen toegang" message="Je hebt geen toegang tot deze bestelling. Log in met het account waarmee je hebt besteld, of gebruik de link uit je e-mail." />
            </PublicPageShell>
        );
    }

    if (result.status === 'error') {
        return (
            <PublicPageShell>
                <InfoCard icon={XCircle} iconClassName="text-red-500" title="Er ging iets mis" message="We konden je bestelling niet ophalen. Probeer het later opnieuw." />
            </PublicPageShell>
        );
    }

    const { preorder } = result;

    if (!preorder.deposit_paid) {
        return (
            <PublicPageShell>
                <InfoCard icon={Clock} iconClassName="text-(--theme-purple)" title="Aanbetaling nog niet voldaan" message="Je kunt pas een restbetaling doen nadat de aanbetaling is voldaan." />
            </PublicPageShell>
        );
    }

    if (preorder.final_payment_paid) {
        return (
            <PublicPageShell>
                <InfoCard icon={CheckCircle2} iconClassName="text-green-500" title="Al volledig betaald" message="Deze bestelling is al volledig betaald. Je ontvangt bericht zodra je bestelling klaarstaat om af te halen." />
            </PublicPageShell>
        );
    }

    return (
        <PublicPageShell>
            <div className="container mx-auto px-4 py-16 sm:py-24 max-w-2xl">
                <div className="p-8 sm:p-12 bg-(--bg-card) border border-(--border-color) rounded-[1.75rem] shadow-xl">
                    <h1 className="text-2xl sm:text-3xl font-black text-(--theme-purple) mb-8 text-center">Restbetaling bestelling #{preorder.id}</h1>
                    <WebshopFinalPaymentIsland preorder={preorder} token={params.token} />
                </div>
            </div>
        </PublicPageShell>
    );
}
