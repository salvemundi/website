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
    UserPlus
} from 'lucide-react';
import { getSignupStatus } from '@/server/actions/activiteit-actions';
import QRDisplay from '@/shared/ui/QRDisplay';

interface ConfirmationIslandProps {
    initialId?: string;
    initialTransactionId?: string;
    isLoggedIn?: boolean;
}

export default function ConfirmationIsland({ 
    initialId, 
    initialTransactionId,
    isLoggedIn = false
}: ConfirmationIslandProps) {
    const [status, setStatus] = useState<'loading' | 'paid' | 'open' | 'failed' | 'error'>('loading');
    const [signupData, setSignupData] = useState<any>(null);
    const [isMembership, setIsMembership] = useState(false);
    const [retryCount, setRetryCount] = useState(0);

    const isPubCrawl = signupData?.pub_crawl_event_id !== undefined || signupData?.tickets !== undefined;

    useEffect(() => {
        /**
         * We poll for the payment status because Mollie webhooks might take a few 
         * seconds to reach our Directus backend. 30 seconds (15 retries * 2s) 
         * covers the typical 'fast' payment window.
         */
        const checkStatus = async () => {
            try {
                const res = await getSignupStatus(initialId, initialTransactionId);
                
                if (res.status === 'paid') {
                    setSignupData(res.signup);
                    setIsMembership(!!res.isMembership);
                    setStatus('paid');
                } else if (res.status === 'failed' || res.status === 'canceled' || res.status === 'expired') {
                    setStatus('failed');
                } else if (retryCount < 15) {
                    setTimeout(() => setRetryCount(prev => prev + 1), 2000);
                } else {
                    setStatus('open');
                }
            } catch (err) {
                console.error('Error checking status:', err);
                setStatus('error');
            }
        };

        checkStatus();
    }, [initialId, initialTransactionId, retryCount]);

    const renderContent = () => {
        if (status === 'loading') {
            return (
                <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-500">
                    <div className="w-20 h-20 rounded-full bg-[var(--theme-purple)]/5 flex items-center justify-center mb-6">
                        <Loader2 className="h-10 w-10 text-[var(--theme-purple)] animate-spin" />
                    </div>
                    <h2 className="text-2xl font-black text-[var(--text-main)] uppercase tracking-tighter italic">Status <span className="text-[var(--theme-purple)]">Controleren</span></h2>
                    <p className="text-[var(--text-muted)] mt-2 font-medium">We verifiëren je gegevens bij de bank...</p>
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

            const isPubCrawl = !!signupData?.pub_crawl_event_id;
            const amount = signupData?.amount_tickets || 1;
            const eventName = isPubCrawl ? signupData.pub_crawl_event_id.name : signupData?.event_id?.name;

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

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
                        {Array.from({ length: amount }).map((_, i) => (
                            <div key={i} className="p-8 rounded-[3rem] bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xl space-y-6 relative overflow-hidden group">
                                <div className="flex flex-col items-center gap-4">
                                    <p className="text-[10px] font-black text-[var(--theme-purple)] uppercase tracking-[0.2em]">TICKET {i + 1} / {amount}</p>
                                    <div className="p-4 bg-white rounded-3xl shadow-lg ring-1 ring-black/5">
                                        <QRDisplay qrToken={`${signupData.qr_token}${amount > 1 ? `#${i}` : ''}`} size={180} />
                                    </div>
                                    <div className="text-center">
                                        <h3 className="font-black text-[var(--text-main)] uppercase tracking-tight">{eventName}</h3>
                                        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest opacity-60">
                                            #{signupData.id}{amount > 1 ? `-${i+1}` : ''}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                        <a href={isPubCrawl ? "/kroegentocht" : "/activiteiten"} className="h-14 px-10 rounded-2xl bg-[var(--theme-purple)] text-white font-black flex items-center justify-center gap-2 hover:scale-105 transition-all shadow-xl shadow-[var(--theme-purple)]/20 uppercase tracking-widest">
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
            return (
                <div className="py-20 text-center space-y-8 animate-in zoom-in-95 duration-500">
                    <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mx-auto ring-1 ring-red-500/20">
                        <XCircle className="h-12 w-12 text-red-500" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-4xl font-black text-[var(--text-main)] uppercase tracking-tighter italic">Betaling <span className="text-red-500">Mislukt</span></h2>
                        <p className="text-[var(--text-muted)] text-lg font-medium max-w-md mx-auto">
                            Helaas is je betaling niet gelukt. Probeer het opnieuw of neem contact op als dit probleem blijft optreden.
                        </p>
                    </div>
                    <a href="/" className="inline-flex h-14 px-10 rounded-2xl bg-[var(--theme-purple)] text-white font-black items-center justify-center gap-2 hover:scale-105 transition-all shadow-xl shadow-[var(--theme-purple)]/20 uppercase tracking-widest">
                        Probeer Opnieuw
                    </a>
                </div>
            );
        }

        return (
            <div className="py-20 text-center space-y-8 animate-in zoom-in-95 duration-500">
                <div className="w-24 h-24 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto ring-1 ring-orange-500/20">
                    <Loader2 className="h-12 w-12 text-orange-500 animate-spin" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-4xl font-black text-[var(--text-main)] uppercase tracking-tighter italic">Betaling <span className="text-orange-500">Open</span></h2>
                    <p className="text-[var(--text-muted)] text-lg font-medium max-w-md mx-auto">
                        Je betaling staat nog open. Zodra we de bevestiging van de bank hebben, sturen we je ticket per e-mail.
                    </p>
                </div>
                {isLoggedIn && (
                    <a href="/profiel/tickets" className="inline-flex h-14 px-10 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-main)] font-black items-center justify-center gap-2 hover:bg-[var(--bg-soft)] transition-all uppercase tracking-widest">
                        Check Mijn Tickets
                    </a>
                )}
            </div>
        );
    };

    return renderContent();
}
