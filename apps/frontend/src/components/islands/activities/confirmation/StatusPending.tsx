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
            const { retryActivityPayment } = await import('@/server/actions/events/public-activiteit-status.actions');
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
        <div className="py-20 text-center space-y-8 animate-in zoom-in-95 duration-500">
            <div className="w-24 h-24 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto ring-1 ring-orange-500/20">
                {isTimeout ? <RefreshCw className="h-12 w-12 text-orange-500 animate-spin-slow" /> : <Loader2 className="h-12 w-12 text-orange-500 animate-spin" />}
            </div>
            <div className="space-y-2">
                <h2 className="text-4xl font-semibold text-[var(--text-main)] tracking-tighter italic">
                    {isTimeout ? 'Status' : 'Betaling'} <span className="text-orange-500">{isTimeout ? 'onduidelijk' : 'open'}</span>
                </h2>
                <p className="text-[var(--text-muted)] text-lg font-medium max-w-md mx-auto">
                    {isTimeout
                        ? 'Het duurt langer dan normaal om de status te verifiëren. Check je bank-app of wacht een momentje op de mail.'
                        : 'Je betaling staat nog op open. Zodra we de bevestiging van de bank hebben, sturen we je ticket per e-mail.'}
                </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                    onClick={() => window.location.reload()}
                    className="inline-flex h-14 px-10 rounded-2xl bg-[var(--bg-soft)] border border-[var(--border-color)] text-[var(--text-main)] font-semibold items-center justify-center gap-2 hover:bg-[var(--bg-soft)]/80 transition-all"
                >
                    <RefreshCw className="h-4 w-4" />
                    Check opnieuw
                </button>
                <button
                    onClick={handleRetry}
                    className="inline-flex h-14 px-10 rounded-2xl bg-[var(--theme-purple)] text-white font-semibold items-center justify-center gap-2 hover:scale-105 transition-all shadow-xl shadow-[var(--theme-purple)]/20"
                >
                    <CreditCard className="h-4 w-4" />
                    Betaal nu
                </button>
                {isLoggedIn && (
                    <a href="/profiel/tickets" className="inline-flex h-14 px-10 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-main)] font-semibold items-center justify-center gap-2 hover:bg-[var(--bg-soft)] transition-all">
                        Mijn tickets
                    </a>
                )}
            </div>
        </div>
    );
}
