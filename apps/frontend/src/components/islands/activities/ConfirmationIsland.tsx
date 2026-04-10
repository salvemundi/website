'use client';

import { useState, useEffect } from 'react';
import { 
    CheckCircle2, 
    XCircle, 
    Loader2, 
    QrCode, 
    Calendar, 
    MapPin, 
    ArrowRight,
    Download,
    UserPlus,
    Save,
    RefreshCw
} from 'lucide-react';
import { toPng } from 'html-to-image';
import { getSignupStatus, type PaymentStatus } from '@/server/actions/activiteit-actions';
import QRDisplay from '@/shared/ui/QRDisplay';
import { Skeleton } from '@/components/ui/Skeleton';

interface ConfirmationIslandProps {
    initialId?: string;
    initialTransactionId?: string;
    isLoggedIn?: boolean;
    isLoading?: boolean;
}

interface SignupData {
    errorType?: 'canceled' | 'failed' | 'expired' | 'timeout';
    amount_tickets?: number;
    tickets?: Array<{ qr_token: string }>;
    qr_token?: string;
    id?: string | number;
    event_id?: { name: string };
}

export default function ConfirmationIsland({ 
    initialId, 
    initialTransactionId,
    isLoggedIn = false,
    isLoading = false
}: ConfirmationIslandProps) {
    const [status, setStatus] = useState<'loading' | PaymentStatus | 'timeout'>('loading');
    const [signupData, setSignupData] = useState<SignupData | null>(null);
    const [isMembership, setIsMembership] = useState(false);
    const [retryCount, setRetryCount] = useState(0);

    // Skip effect if we are just a server-side skeleton
    useEffect(() => {
        if (isLoading) return;
        
        const checkStatus = async () => {
            try {
                const ts = Date.now().toString();
                const res = await getSignupStatus(initialId, initialTransactionId, ts);
                
                if (res.status === 'paid') {
                    setSignupData(res.signup as SignupData);
                    setIsMembership(!!res.isMembership);
                    setStatus('paid');
                } else if (res.status === 'canceled') {
                    setStatus('failed');
                    setSignupData({ errorType: 'canceled' });
                } else if (res.status === 'failed' || res.status === 'expired') {
                    setStatus('failed');
                    setSignupData({ errorType: res.status as 'failed' | 'expired' });
                } else if (retryCount < 60) { 
                    // Increment retry counter to trigger next poll after 1s
                    setTimeout(() => setRetryCount(prev => prev + 1), 1000);
                } else {
                    console.error('[StatusCheck] Polling timeout');
                    setStatus('timeout');
                    setSignupData({ errorType: 'timeout' });
                }
            } catch (err) {
                console.error('[StatusCheck] Error:', err);
                setStatus('error');
            }
        };

        checkStatus();
    }, [initialId, initialTransactionId, retryCount]);
    
    const downloadTicket = async (elementId: string, ticketName: string) => {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        try {
            // Wait a tiny bit to ensure QR is fully rendered if needed
            const dataUrl = await toPng(element, { 
                quality: 0.95,
                backgroundColor: '#121212', // Match dark theme bg
                style: {
                    borderRadius: '0', // Keep as captured
                }
            });
            
            const link = document.createElement('a');
            link.download = `Ticket-${ticketName.replace(/\s+/g, '-')}-${Date.now()}.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error('[Download] Failed to generate ticket image:', err);
        }
    };

    const renderContent = () => {
        if (isLoading || status === 'loading') {
            return (
                <div className="space-y-12 animate-in fade-in duration-500">
                    <div className="space-y-4 text-center">
                        <Skeleton className="w-24 h-24 rounded-full mx-auto" />
                        <Skeleton className="h-12 md:h-20 w-3/4 max-w-2xl mx-auto rounded-3xl" />
                        <Skeleton className="h-6 w-1/2 max-w-sm mx-auto rounded-xl" />
                    </div>

                    <div className="flex flex-wrap justify-center gap-6 max-w-6xl mx-auto">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] min-w-[300px] max-w-[380px] p-8 rounded-[3rem] bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xl space-y-6">
                                <div className="flex flex-col items-center gap-4">
                                    <Skeleton className="h-4 w-24 rounded-full" />
                                    <Skeleton className="h-[180px] w-[180px] rounded-3xl" />
                                    <div className="space-y-2 text-center w-full">
                                        <Skeleton className="h-6 w-3/4 mx-auto rounded-lg" />
                                        <Skeleton className="h-3 w-1/2 mx-auto rounded-md" />
                                    </div>
                                </div>
                            </div>
                        ))}
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
                            <h1 className="text-4xl md:text-6xl font-black text-[var(--text-main)] uppercase tracking-tighter italic leading-none">
                                Welkom <span className="text-green-500">Lid!</span>
                            </h1>
                            <p className="text-[var(--text-muted)] text-lg font-medium max-w-md mx-auto">
                                Je betaling is geslaagd. Je bent nu officieel lid van SV Salve Mundi!
                            </p>
                        </div>
                        
                        <div className="max-w-md mx-auto p-8 rounded-[3rem] bg-[var(--bg-card)] border border-[var(--border-color)] shadow-2xl space-y-6">
                            <p className="text-sm font-medium text-[var(--text-main)] leading-relaxed">
                                Je hebt zojuist een bevestigingsmail ontvangen met alle details. 
                                Je kunt nu inloggen op de website om gebruik te maken van je ledenvoordelen.
                            </p>
                            <a href="/profiel" className="w-full h-14 rounded-2xl bg-[var(--theme-purple)] text-white font-black flex items-center justify-center gap-2 hover:scale-105 transition-all shadow-xl shadow-[var(--theme-purple)]/20 uppercase tracking-widest">
                                Naar Mijn Profiel
                            </a>
                        </div>
                    </div>
                );
            }

            const amount = signupData?.amount_tickets || (signupData?.tickets?.length) || 1;
            const eventName = signupData?.event_id?.name || 'Evenement';

            return (
                <div className="space-y-12 animate-in zoom-in-95 duration-500">
                    <div className="space-y-4 text-center">
                        <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto ring-1 ring-green-500/20">
                            <CheckCircle2 className="h-12 w-12 text-green-500" />
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black text-[var(--text-main)] uppercase tracking-tighter italic leading-none">
                            Inschrijving <span className="text-green-500">Geslaagd!</span>
                        </h1>
                        <p className="text-[var(--text-muted)] text-lg font-medium max-w-md mx-auto">
                            Bedankt! Je ticket{amount > 1 ? 's' : ''} {amount > 1 ? 'zijn' : 'is'} nu beschikbaar.
                        </p>
                    </div>

                    <div className="flex flex-wrap justify-center gap-6 max-w-6xl mx-auto">
                        {Array.from({ length: amount }).map((_, i) => (
                            <div 
                                key={i} 
                                id={`ticket-card-${i}`} 
                                className="w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] min-w-[300px] max-w-[380px] p-8 rounded-[3rem] bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xl space-y-6 relative overflow-hidden"
                            >
                                <div className="flex flex-col items-center gap-4">
                                    <p className="text-[10px] font-black text-[var(--theme-purple)] uppercase tracking-[0.2em]">TICKET {i + 1} / {amount}</p>
                                    <div className="p-4 bg-white rounded-3xl shadow-lg ring-1 ring-black/5">
                                        <QRDisplay qrToken={signupData?.tickets?.[i]?.qr_token || `${signupData?.qr_token}${amount > 1 ? `#${i}` : ''}`} size={180} />
                                    </div>
                                    <div className="text-center">
                                        <h3 className="font-black text-[var(--text-main)] uppercase tracking-tight">{eventName}</h3>
                                        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest opacity-60">
                                            #{signupData?.id}{amount > 1 ? `-${i+1}` : ''}
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
                        <a href="/activiteiten" className="h-14 px-10 rounded-2xl bg-[var(--theme-purple)] text-white font-black flex items-center justify-center gap-2 hover:scale-105 transition-all shadow-xl shadow-[var(--theme-purple)]/20 uppercase tracking-widest">
                            TERUG NAAR OVERZICHT
                        </a>
                        {isLoggedIn && (
                            <a href="/profiel/tickets" className="h-14 px-10 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-main)] font-black flex items-center justify-center gap-2 hover:bg-[var(--bg-soft)] transition-all uppercase tracking-widest">
                                ALLE TICKETS
                            </a>
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
                        <h2 className="text-4xl font-black text-[var(--text-main)] uppercase tracking-tighter italic">
                            Betaling <span className="text-red-500">{isCanceled ? 'Gecanceld' : isExpired ? 'Verlopen' : 'Mislukt'}</span>
                        </h2>
                        <p className="text-[var(--text-muted)] text-lg font-medium max-w-md mx-auto">
                            {isCanceled 
                                ? 'Je hebt de betaling afgebroken. Geen zorgen, je gegevens zijn nog niet verwerkt.' 
                                : isExpired
                                ? 'De betaalsessie is verlopen. Probeer het opnieuw om je inschrijving te voltooien.'
                                : 'Helaas is je betaling niet gelukt. Probeer het opnieuw of neem contact op als dit probleem blijft optreden.'}
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button 
                            onClick={() => window.location.reload()}
                            className="inline-flex h-14 px-10 rounded-2xl bg-[var(--theme-purple)] text-white font-black items-center justify-center gap-2 hover:scale-105 transition-all shadow-xl shadow-[var(--theme-purple)]/20 uppercase tracking-widest"
                        >
                            Opnieuw Proberen
                        </button>
                        <a href="/" className="inline-flex h-14 px-10 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-main)] font-black items-center justify-center gap-2 hover:bg-[var(--bg-soft)] transition-all uppercase tracking-widest">
                            Terug naar Home
                        </a>
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
                    <h2 className="text-4xl font-black text-[var(--text-main)] uppercase tracking-tighter italic">
                        {isTimeout ? 'Status' : 'Betaling'} <span className="text-orange-500">{isTimeout ? 'Onduidelijk' : 'Open'}</span>
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
                        className="inline-flex h-14 px-10 rounded-2xl bg-[var(--theme-purple)] text-white font-black items-center justify-center gap-2 hover:scale-105 transition-all shadow-xl shadow-[var(--theme-purple)]/20 uppercase tracking-widest"
                    >
                        Check Opnieuw
                    </button>
                    {isLoggedIn && (
                        <a href="/profiel/tickets" className="inline-flex h-14 px-10 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-main)] font-black items-center justify-center gap-2 hover:bg-[var(--bg-soft)] transition-all uppercase tracking-widest">
                            Mijn Tickets
                        </a>
                    )}
                </div>
            </div>
        );
    };

    return renderContent();
}
