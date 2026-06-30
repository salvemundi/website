import type { Metadata } from 'next';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import PublicPageShell from '@/components/ui/layout/PublicPageShell';
import BackButton from '@/components/ui/navigation/BackButton';
import { getPreorderStatus } from '@/server/actions/public/webshop.actions';

export const metadata: Metadata = {
    title: 'Bestelstatus | Webshop | Salve Mundi'
};

interface PageProps {
    searchParams: Promise<{ preorder?: string; token?: string }>;
}

function ErrorCard({ title, message }: { title: string; message: string }) {
    return (
        <div className="min-h-[70vh] flex items-center justify-center p-6">
            <div className="max-w-md w-full p-12 bg-(--bg-card) border border-(--border-color) rounded-[1.75rem] text-center shadow-xl">
                <XCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
                <h1 className="text-2xl font-black text-(--theme-purple) mb-4">{title}</h1>
                <p className="text-(--text-muted) mb-8 leading-relaxed">{message}</p>
                <BackButton href="/webshop" text="Terug naar webshop" />
            </div>
        </div>
    );
}

const STATUS_LABELS: Record<string, string> = {
    awaiting_deposit: 'Wacht op aanbetaling',
    awaiting_final: 'Aanbetaling ontvangen — restbetaling volgt later',
    completed: 'Volledig betaald',
    cancelled: 'Geannuleerd'
};

export default async function WebshopBevestigingPage({ searchParams }: PageProps) {
    const params = await searchParams;
    const preorderId = params.preorder ? Number(params.preorder) : NaN;

    if (!params.preorder || Number.isNaN(preorderId)) {
        return (
            <PublicPageShell>
                <ErrorCard
                    title="Ongeldige bestelling"
                    message="We kunnen de status van je bestelling niet verifiëren zonder een geldig bestelnummer."
                />
            </PublicPageShell>
        );
    }

    const result = await getPreorderStatus(preorderId, params.token);

    if (result.status === 'not_found') {
        return (
            <PublicPageShell>
                <ErrorCard title="Bestelling niet gevonden" message="Deze bestelling bestaat niet (meer)." />
            </PublicPageShell>
        );
    }

    if (result.status === 'unauthorized') {
        return (
            <PublicPageShell>
                <ErrorCard title="Geen toegang" message="Je hebt geen toegang tot deze bestelling. Log in met het account waarmee je hebt besteld." />
            </PublicPageShell>
        );
    }

    if (result.status === 'error') {
        return (
            <PublicPageShell>
                <ErrorCard title="Er ging iets mis" message="We konden de status van je bestelling niet ophalen. Probeer het later opnieuw." />
            </PublicPageShell>
        );
    }

    const { preorder } = result;
    const isCompleted = preorder.status === 'completed';
    const isCancelled = preorder.status === 'cancelled';
    const statusLabel = preorder.status ? STATUS_LABELS[preorder.status] ?? preorder.status : 'Onbekend';

    return (
        <PublicPageShell>
            <div className="container mx-auto px-4 py-16 sm:py-24 max-w-2xl">
                <div className="p-8 sm:p-12 bg-(--bg-card) border border-(--border-color) rounded-[1.75rem] shadow-xl">
                    <div className="flex flex-col items-center text-center mb-8">
                        {isCancelled ? (
                            <XCircle className="w-16 h-16 text-red-500 mb-4" />
                        ) : isCompleted ? (
                            <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
                        ) : (
                            <Clock className="w-16 h-16 text-(--theme-purple) mb-4" />
                        )}
                        <h1 className="text-2xl sm:text-3xl font-black text-(--theme-purple)">Bestelling #{preorder.id}</h1>
                        <p className="text-(--text-muted) mt-2">{statusLabel}</p>
                    </div>

                    <div className="space-y-3 mb-6">
                        {preorder.lines.map((line) => (
                            <div key={line.id} className="flex items-center justify-between border-b border-(--border-color) pb-3">
                                <div>
                                    <p className="font-bold text-(--theme-purple)/90">{line.product_name_snapshot}</p>
                                    {line.variant_label_snapshot && (
                                        <p className="text-sm text-(--text-muted)">{line.variant_label_snapshot} &middot; {line.quantity}x</p>
                                    )}
                                </div>
                                <span className="font-bold text-(--theme-purple)/80">€{(Number(line.unit_price) * line.quantity).toFixed(2)}</span>
                            </div>
                        ))}
                    </div>

                    <div className="space-y-1 mb-8">
                        <div className="flex items-center justify-between text-(--text-muted)">
                            <span>Totaalprijs</span>
                            <span>€{Number(preorder.subtotal_amount).toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between text-(--text-muted)">
                            <span>Aanbetaling {preorder.deposit_paid ? '(betaald)' : '(nog niet betaald)'}</span>
                            <span>€{Number(preorder.deposit_amount).toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between text-(--text-muted)">
                            <span>Restbetaling {preorder.final_payment_paid ? '(betaald)' : '(later)'}</span>
                            <span>€{(Number(preorder.subtotal_amount) - Number(preorder.deposit_amount)).toFixed(2)}</span>
                        </div>
                    </div>

                    <p className="text-sm text-(--text-muted) text-center mb-8">
                        Je ontvangt per e-mail bericht zodra je bestelling klaarstaat om af te halen.
                    </p>

                    <div className="flex justify-center">
                        <BackButton href="/webshop" text="Terug naar webshop" />
                    </div>
                </div>
            </div>
        </PublicPageShell>
    );
}
