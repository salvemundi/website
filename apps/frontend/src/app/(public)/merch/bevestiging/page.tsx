import type { Metadata } from 'next';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import PublicPageShell from '@/components/ui/layout/PublicPageShell';
import BackButton from '@/components/ui/navigation/BackButton';
import { getPreorderStatus, syncPreorderPaymentStatus } from '@/server/actions/public/webshop.actions';

export const metadata: Metadata = {
    title: 'Bestelstatus | Webshop | Salve Mundi'
};

interface PageProps {
    searchParams: Promise<{ preorder?: string; token?: string; t?: string }>;
}

function ErrorCard({ title, message }: { title: string; message: string }) {
    return (
        <div className="flex min-h-[70vh] items-center justify-center p-6">
            <div className="w-full max-w-md rounded-[1.75rem] border border-(--border-color) bg-(--bg-card) p-12 text-center shadow-xl">
                <XCircle className="mx-auto mb-6 size-16 text-red-500" />
                <h1 className="mb-4 text-2xl font-black text-(--theme-purple)">{title}</h1>
                <p className="mb-8 leading-relaxed text-(--text-muted)">{message}</p>
                <BackButton href="/merch" text="Terug naar merch" />
            </div>
        </div>
    );
}

const STATUS_LABELS: Record<string, string> = {
    awaiting_deposit: 'Wacht op betaling',
    completed: 'Betaald',
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

    if (params.t) {
        await syncPreorderPaymentStatus(params.t);
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
            <div className="container mx-auto max-w-2xl px-4 py-16 sm:py-24">
                <div className="rounded-[1.75rem] border border-(--border-color) bg-(--bg-card) p-8 shadow-xl sm:p-12">
                    <div className="mb-8 flex flex-col items-center text-center">
                        {isCancelled ? (
                            <XCircle className="mb-4 size-16 text-red-500" />
                        ) : isCompleted ? (
                            <CheckCircle2 className="mb-4 size-16 text-green-500" />
                        ) : (
                            <Clock className="mb-4 size-16 text-(--theme-purple)" />
                        )}
                        <h1 className="text-2xl font-black text-(--theme-purple) sm:text-3xl">Bestelling #{preorder.id}</h1>
                        <p className="mt-2 text-(--text-muted)">{statusLabel}</p>
                    </div>

                    <div className="mb-6 space-y-3">
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

                    <div className="mb-8 space-y-1">
                        <div className="flex items-center justify-between text-(--text-muted)">
                            <span>Totaalprijs {preorder.deposit_paid ? '(betaald)' : '(nog niet betaald)'}</span>
                            <span>€{Number(preorder.subtotal_amount).toFixed(2)}</span>
                        </div>
                    </div>

                    <p className="mb-8 text-center text-sm text-(--text-muted)">
                        Je ontvangt per e-mail bericht zodra je bestelling klaarstaat om af te halen.
                    </p>

                    <div className="flex justify-center">
                        <BackButton href="/merch" text="Terug naar merch" />
                    </div>
                </div>
            </div>
        </PublicPageShell>
    );
}
