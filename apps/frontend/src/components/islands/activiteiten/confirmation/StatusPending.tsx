'use client';

import { RefreshCw, Loader2, CreditCard } from 'lucide-react';
import { type SignupData } from '../ConfirmationIsland';

interface StatusPendingProps {
    signupData: SignupData | null;
    initialId?: string;
    isLoggedIn: boolean;
}

export default function StatusPending({ signupData, initialId, isLoggedIn }: StatusPendingProps) {
    const isTimeout = signupData?.errorType === 'timeout';

    const handleRetry = async () => {
        try {
            const signupId = signupData?.id || initialId;
            if (!signupId) {
                alert("Geen aanmeldings-ID gevonden.");
                return;
            }
            const { retryActivityPayment } = await import('@/server/actions/events/activiteiten/activiteiten-status.actions');
            const result = await retryActivityPayment(Number(signupId));
            if (result.success && result.checkoutUrl) {
                window.location.href = result.checkoutUrl;
            } else {
                alert(result.error || "Herbetaling mislukt.");
            }
        } catch {
            alert("Er is een fout opgetreden bij het herstarten van de betaling.");
        }
    };

    return (
        <div className="animate-in zoom-in-95 space-y-8 py-20 text-center duration-500">
            <div className="mx-auto flex size-24 items-center justify-center rounded-full bg-orange-500/10 ring-1 ring-orange-500/20">
                {isTimeout ? <RefreshCw className="animate-spin-slow size-12 text-orange-500" /> : <Loader2 className="size-12 animate-spin text-orange-500" />}
            </div>
            <div className="space-y-2">
                <h2 className="text-4xl font-semibold tracking-tighter text-(--text-main) italic">
                    {isTimeout ? 'Status' : 'Betaling'} <span className="text-orange-500">{isTimeout ? 'onduidelijk' : 'open'}</span>
                </h2>
                <p className="mx-auto max-w-md text-lg font-medium text-(--text-muted)">
                    {isTimeout
                        ? 'Het duurt langer dan normaal om de status te verifiëren. Check je bank-app of wacht een momentje op de mail.'
                        : 'Je betaling staat nog op open. Zodra we de bevestiging van de bank hebben, sturen we je ticket per e-mail.'}
                </p>
            </div>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
                <button
                    onClick={() => window.location.reload()}
                    className="form-button inline-flex h-14 items-center justify-center gap-2 rounded-2xl border border-(--border-color) bg-(--bg-soft) px-10 font-semibold text-(--text-main) transition-all hover:bg-(--bg-soft)/80"
                >
                    <RefreshCw className="size-4" />
                    Check opnieuw
                </button>
                <button
                    onClick={() => { void handleRetry(); }}
                    className="form-button inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-(--theme-purple) px-10 font-semibold text-white shadow-(--theme-purple)/20 shadow-xl transition-all hover:scale-105"
                >
                    <CreditCard className="size-4" />
                    Betaal nu
                </button>
                {isLoggedIn && (
                    <a href="/profiel/tickets" className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl border border-(--border-color) bg-(--bg-card) px-10 font-semibold text-(--text-main) transition-all hover:bg-(--bg-soft)">
                        Mijn tickets
                    </a>
                )}
            </div>
        </div>
    );
}
