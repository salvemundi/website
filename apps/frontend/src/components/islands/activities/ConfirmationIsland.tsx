'use client';

import { useState, useEffect } from 'react';
import {
    CheckCircle2,
    XCircle,
    Loader2,
    QrCode,
    UserPlus,
    Save,
    RefreshCw,
    Home,
    CreditCard
} from 'lucide-react';
import BackButton from '@/components/ui/navigation/BackButton';
import { toPng } from 'html-to-image';
import { getSignupStatus, type PaymentStatus } from '@/server/actions/events/public-activiteit-status.actions';
import QRDisplay from '@/shared/ui/QRDisplay';
import { slugify } from '@/shared/lib/utils/slug';

interface ConfirmationIslandProps {
    initialId?: string;
    initialTransactionId?: string;
    isLoggedIn?: boolean;
}

export interface SignupData {
    errorType?: 'canceled' | 'failed' | 'expired' | 'timeout';
    amount_tickets?: number;
    tickets?: Array<{ qr_token: string | null }>;
    qr_token?: string | null;
    id?: string | number | null;
    event_id?: { id?: string | number; name: string; custom_url?: string };
    custom_url?: string;
}

export default function ConfirmationIsland({
    initialId,
    initialTransactionId,
    isLoggedIn = false,
    initialStatus = 'loading',
    initialData = null
}: ConfirmationIslandProps & { initialStatus?: 'loading' | PaymentStatus | 'timeout', initialData?: SignupData | null }) {
    const [status, setStatus] = useState<'loading' | PaymentStatus | 'timeout'>(initialStatus);
    const [signupData, setSignupData] = useState<SignupData | null>(initialData);
    const [isMembership, setIsMembership] = useState(false);
    const [isTrip, setIsTrip] = useState(false);
    const [retryCount, setRetryCount] = useState(0);

    useEffect(() => {
        if (status === 'paid' || status === 'failed') return;

        const checkStatus = async () => {
            try {
                const res = await getSignupStatus(initialId, initialTransactionId);

                if (res.status === 'paid') {
                    setSignupData(res.signup as SignupData);
                    setIsMembership(!!res.isMembership);
                    setIsTrip(!!res.isTrip);
                    setStatus('paid');
                } else if (res.status === 'canceled') {
                    setStatus('failed');
                    setIsMembership(!!res.isMembership);
                    setIsTrip(!!res.isTrip);
                    setSignupData(prev => ({
                        ...prev,
                        ...(res.signup as SignupData),
                        errorType: 'canceled'
                    }));
                } else if (res.status === 'failed' || res.status === 'expired') {
                    setStatus('failed');
                    setIsMembership(!!res.isMembership);
                    setIsTrip(!!res.isTrip);
                    setSignupData(prev => ({
                        ...prev,
                        ...(res.signup as SignupData),
                        errorType: res.status as 'failed' | 'expired'
                    }));
                } else if (retryCount < 60) {
                    setTimeout(() => setRetryCount(prev => prev + 1), 1000);
                } else {
                    setStatus('timeout');
                    setSignupData({ errorType: 'timeout' });
                }
            } catch {
                setStatus('failed');
            }
        };

        checkStatus();
    }, [initialId, initialTransactionId, retryCount, status]);

    useEffect(() => {
        if (status === 'paid' && !isMembership && !isTrip) {
            const customUrl = signupData?.event_id?.custom_url || signupData?.custom_url;
            if (customUrl) {
                const timeout = setTimeout(() => {
                    window.location.href = customUrl;
                }, 3000);
                return () => clearTimeout(timeout);
            }
        }
    }, [status, signupData, isMembership, isTrip]);

    const downloadTicket = async (elementId: string, ticketName: string) => {
        const element = document.getElementById(elementId);
        if (!element) return;

        try {
            const dataUrl = await toPng(element, {
                quality: 0.95,
                backgroundColor: '#121212',
                style: { borderRadius: '0' }
            });

            const link = document.createElement('a');
            link.download = `Ticket-${ticketName.replace(/\s+/g, '-')}-${Date.now()}.png`;
            link.href = dataUrl;
            link.click();
        } catch {
            // Silent catch to comply with project policies
        }
    };

    const renderContent = () => {
        if (status === 'loading') {
            return (
                <div className="py-20 text-center space-y-8 animate-in fade-in duration-500">
                    <div className="w-24 h-24 bg-[var(--theme-purple)]/10 rounded-full flex items-center justify-center mx-auto ring-1 ring-[var(--theme-purple)]/20">
                        <Loader2 className="h-12 w-12 text-[var(--theme-purple)] animate-spin" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-4xl font-semibold text-[var(--text-main)] tracking-tighter italic">
                            Betaling <span className="text-[var(--theme-purple)]">verifiëren</span>
                        </h2>
                        <p className="text-[var(--text-muted)] text-lg font-medium max-w-sm mx-auto">
                            Eén moment geduld, we controleren de status van je transactie bij de bank...
                        </p>
                    </div>
                </div>
            );
        }

        if (status === 'paid') {
            if (isMembership) {
                return (
                    <div className="space-y-12 animate-in zoom-in-95 duration-500 text-center">
                        <div className="space-y-4">
                            <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto ring-1 ring-green-500/20">
                                <UserPlus className="h-12 w-12 text-green-500" />
                            </div>
                            <h1 className="text-4xl md:text-6xl font-semibold text-[var(--text-main)] tracking-tighter italic leading-none">
                                Welkom <span className="text-green-500">lid!</span>
                            </h1>
                            <p className="text-[var(--text-muted)] text-lg font-medium max-w-md mx-auto">
                                Je betaling is geslaagd. Je bent nu officieel lid van SV Salve Mundi!
                            </p>
                        </div>

                        <div className="max-w-md mx-auto p-8 rounded-[3rem] bg-[var(--bg-card)] border border-[var(--border-color)] shadow-2xl space-y-6">
                            <p className="text-base font-medium text-[var(--text-main)] leading-relaxed">
                                Je hebt zojuist een bevestigingsmail ontvangen met alle details.
                                Je kunt nu inloggen op de website om gebruik te maken van je ledenvoordelen.
                            </p>
                            <a href="/profiel" className="w-full h-14 rounded-2xl bg-[var(--theme-purple)] text-white font-semibold flex items-center justify-center gap-2 hover:scale-105 transition-all shadow-xl shadow-[var(--theme-purple)]/20">
                                Naar mijn profiel
                            </a>
                        </div>
                    </div>
                );
            }

            const amount = signupData?.amount_tickets || (signupData?.tickets?.length) || 1;
            const eventName = signupData?.event_id?.name || 'Activiteit';

            return (
                <div className="space-y-12 animate-in zoom-in-95 duration-500">
                    <div className="space-y-4 text-center">
                        <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto ring-1 ring-green-500/20">
                            <CheckCircle2 className="h-12 w-12 text-green-500" />
                        </div>
                        <h1 className="text-4xl md:text-6xl font-semibold text-[var(--text-main)] tracking-tighter italic leading-none">
                            Aanmelding <span className="text-green-500">geslaagd!</span>
                        </h1>
                        <p className="text-[var(--text-muted)] text-lg font-medium max-w-md mx-auto">
                            Bedankt! Je ticket{amount > 1 ? 's' : ''} {amount > 1 ? 'zijn' : 'is'} nu beschikbaar.
                        </p>
                        {((signupData as { event_id?: { custom_url?: string }; custom_url?: string })?.event_id?.custom_url || (signupData as { custom_url?: string })?.custom_url) && (
                            <p className="text-base font-semibold text-[var(--theme-purple)] mt-2">
                                Je wordt zo automatisch doorgestuurd...
                            </p>
                        )}
                    </div>

                    <div className="flex flex-wrap justify-center gap-6 max-w-6xl mx-auto">
                        {Array.from({ length: amount }).map((_, i) => (
                            <div
                                key={i}
                                id={`ticket-card-${i}`}
                                className="w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] min-w-[300px] max-w-[380px] p-8 rounded-[3rem] bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xl space-y-6 relative overflow-hidden"
                            >
                                <div className="flex flex-col items-center gap-4">
                                    <p className="text-base font-semibold text-[var(--theme-purple)]">Ticket {i + 1} / {amount}</p>
                                    <div className="p-4 bg-white rounded-3xl shadow-lg ring-1 ring-black/5">
                                        <QRDisplay qrToken={
                                            (() => {
                                                const data = signupData as { tickets?: { qr_token?: string }[], qr_token?: string };
                                                const tickets = data.tickets || [];
                                                // eslint-disable-next-line security/detect-object-injection
                                                const ticket = tickets[i];
                                                return ticket?.qr_token || `${data.qr_token || ''}${amount > 1 ? `#${i}` : ''}`;
                                            })()
                                        } size={180} />
                                    </div>
                                    <div className="text-center">
                                        <h3 className="text-base font-semibold text-[var(--text-main)] tracking-tight">{eventName}</h3>
                                        <p className="text-sm font-bold text-[var(--text-muted)] opacity-60">
                                            #{signupData?.id}{amount > 1 ? `-${i + 1}` : ''}
                                        </p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => downloadTicket(`ticket-card-${i}`, eventName)}
                                    className="absolute top-4 right-4 p-3 rounded-full bg-[var(--bg-soft)] border border-[var(--border-color)] text-[var(--text-muted)] hover:bg-[var(--theme-purple)] hover:text-white hover:scale-110 transition-all shadow-lg backdrop-blur-md"
                                    title="Download Ticket"
                                >
                                    <Save className="h-5 w-5" />
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                        <BackButton
                            href="/activiteiten"
                            text="Terug naar overzicht"
                            className="h-14 px-10 rounded-2xl bg-[var(--theme-purple)] text-white shadow-xl shadow-[var(--theme-purple)]/20"
                        />
                        {isLoggedIn && (
                            <BackButton
                                href="/profiel/tickets"
                                text="Alle tickets"
                                icon={QrCode}
                                className="h-14 px-10 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-main)]"
                            />
                        )}
                    </div>
                </div>
            );
        }

        if (status === 'failed') {
            const isCanceled = signupData?.errorType === 'canceled';
            const isExpired = signupData?.errorType === 'expired';

            return (
                <div className="py-20 text-center space-y-8 animate-in zoom-in-95 duration-500">
                    <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mx-auto ring-1 ring-red-500/20">
                        <XCircle className="h-12 w-12 text-red-500" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-4xl font-semibold text-[var(--text-main)] tracking-tighter italic">
                            Betaling <span className="text-red-500">{isCanceled ? 'gecanceld' : isExpired ? 'verlopen' : 'mislukt'}</span>
                        </h2>
                        <p className="text-[var(--text-muted)] text-lg font-medium max-w-md mx-auto">
                            {isCanceled
                                ? 'Je hebt de betaling afgebroken. Geen zorgen, je gegevens zijn nog niet verwerkt.'
                                : isExpired
                                    ? 'De betaalsessie is verlopen. Probeer het opnieuw om je aanmelding te voltooien.'
                                    : 'Helaas is je betaling niet gelukt. Probeer het opnieuw of neem contact op als dit probleem blijft optreden.'}
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <BackButton
                            href={
                                isMembership ? '/lidmaatschap' :
                                    isTrip ? '/reis' :
                                        (signupData?.event_id?.name ? `/activiteiten/${slugify(signupData.event_id.name)}` : '/activiteiten')
                            }
                            text="Opnieuw proberen"
                            icon={RefreshCw}
                            className="h-14 px-10 rounded-2xl bg-[var(--theme-purple)] text-white shadow-xl shadow-[var(--theme-purple)]/20"
                        />
                        <BackButton
                            href="/"
                            text="Terug naar home"
                            icon={Home}
                            className="h-14 px-10 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-main)]"
                        />
                    </div>
                </div>
            );
        }

        const isTimeout = signupData?.errorType === 'timeout';

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
                        onClick={async () => {
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
                        }}
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
    };

    return renderContent();
}