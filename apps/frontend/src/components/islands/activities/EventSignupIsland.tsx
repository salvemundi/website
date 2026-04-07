'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { useAuth } from '@/features/auth/providers/auth-provider';
import { signupForActivity } from '@/server/actions/activiteit-actions';
import { PhoneInput } from '@/shared/ui/PhoneInput';
import { Input } from '@/shared/ui/Input';
import { Loader2, CheckCircle2, AlertCircle, CreditCard, Send, Users, Ticket, Info } from 'lucide-react';
import QRDisplay from '@/shared/ui/QRDisplay';

interface EventSignupIslandProps {
    isLoading?: boolean;
    eventId?: number;
    price?: number;
    eventDate?: string;
    description?: string;
    isPast?: boolean;
    eventName?: string;
    initialUser?: any;
    verifiedPaymentStatus?: 'paid' | null;
    initialQrToken?: string;
}

export default function EventSignupIsland({
    isLoading = false,
    eventId = 0,
    price = 0,
    eventDate = '',
    description = '',
    isPast = false,
    eventName = 'Evenement',
    initialUser,
    verifiedPaymentStatus,
    initialQrToken
}: EventSignupIslandProps) {
    const { user: clientUser } = useAuth();
    
    // Use initialUser for SSR-safe initial state, fall back to clientUser after mount
    const user = initialUser || clientUser;

    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(verifiedPaymentStatus === 'paid' ? 'Betaling geslaagd! Je bent nu ingeschreven.' : null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
    
    // Status tracking (Platform consistency)
    const [signupStatus, setSignupStatus] = useState<{
        isSignedUp: boolean;
        paymentStatus?: 'paid' | 'open' | 'failed' | 'canceled';
        qrToken?: string;
    }>({ 
        isSignedUp: verifiedPaymentStatus === 'paid',
        paymentStatus: verifiedPaymentStatus || undefined,
        qrToken: initialQrToken
    });

    const [form, setForm] = useState({
        name: user?.name || (user as any)?.first_name ? `${(user as any).first_name} ${(user as any).last_name || ''}`.trim() : '',
        email: user?.email || '',
        phoneNumber: (user as any)?.phone_number || '',
        website: '', // Honeypot
    });

    const isPaid = price > 0;

    // Sync form with user
    useEffect(() => {
        if (user && !isLoading) {
            const userName = user.name || ((user as any).first_name ? `${(user as any).first_name} ${(user as any).last_name || ''}`.trim() : '');
            const userPhone = (user as any).phone_number || '';
            
            setForm(prev => ({
                ...prev,
                name: prev.name || userName || '',
                email: prev.email || user.email || '',
                phoneNumber: prev.phoneNumber || userPhone || ''
            }));
        }
    }, [user, isLoading]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isLoading) return;
        setError(null);
        setFieldErrors({});

        startTransition(async () => {
            const result = await signupForActivity({
                event_id: eventId,
                name: form.name,
                email: form.email,
                phoneNumber: form.phoneNumber,
                website: form.website,
            });

            if (result.success) {
                if (result.checkoutUrl) {
                    window.location.href = result.checkoutUrl;
                } else {
                    setSuccess(result.message || 'Inschrijving geslaagd!');
                    setSignupStatus({ isSignedUp: true, paymentStatus: isPaid ? 'open' : 'paid' });
                }
            } else {
                if (result.errors) {
                    setFieldErrors(result.errors);
                } else {
                    setError(result.error || 'Er is iets misgegaan.');
                }
            }
        });
    };

    // Loading State
    if (isLoading) {
        return (
            <div className="h-full flex flex-col p-8 rounded-[2rem] bg-[var(--bg-card)] border border-[var(--border-color)] shadow-2xl shadow-[var(--theme-purple)]/5 animate-pulse" aria-busy="true">
                <div className="flex justify-between items-start mb-8">
                    <div className="space-y-3">
                        <div className="h-8 w-32 bg-[var(--theme-purple)]/10 rounded-lg" />
                        <div className="h-3 w-24 bg-[var(--text-muted)]/10 rounded ml-9" />
                    </div>
                    <div className="text-right space-y-2">
                        <div className="h-3 w-12 bg-[var(--text-muted)]/10 rounded ml-auto" />
                        <div className="h-8 w-20 bg-[var(--theme-purple)]/10 rounded-lg ml-auto" />
                    </div>
                </div>

                <div className="space-y-6 flex-1">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="space-y-2">
                            <div className="h-3 w-20 bg-[var(--theme-purple)]/10 rounded ml-3" />
                            <div className="h-14 w-full bg-[var(--bg-soft)] rounded-2xl" />
                        </div>
                    ))}
                </div>

                <div className="pt-8 space-y-4">
                    <div className="h-16 w-full bg-gradient-to-br from-[var(--theme-purple)]/10 to-[var(--theme-purple)]/20 rounded-2xl" />
                    <div className="h-3 w-48 bg-[var(--text-muted)]/10 rounded mx-auto" />
                </div>
            </div>
        );
    }

    // Digital Ticket View (Standard platform pattern)
    if (signupStatus.paymentStatus === 'paid') {
        return (
            <div className="h-full flex flex-col justify-center space-y-8 p-8 rounded-[2rem] bg-[var(--bg-card)] border border-[var(--color-success)]/30 shadow-2xl shadow-[var(--color-success)]/10 animate-in zoom-in-95 duration-500">
                <div className="text-center space-y-4">
                    <div className="w-20 h-20 bg-[var(--color-success)]/10 rounded-full flex items-center justify-center mx-auto shadow-inner">
                        <CheckCircle2 className="h-10 w-10 text-[var(--color-success)]" />
                    </div>
                    <h3 className="text-3xl font-black text-[var(--text-main)] leading-tight text-center">🎉 Inschrijving Definitief!</h3>
                    <p className="text-[var(--text-muted)] font-medium text-center">
                        Je bent succesvol ingeschreven voor <span className="text-[var(--theme-purple)] font-bold">{eventName}</span> en je betaling is ontvangen.
                    </p>
                </div>

                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-[var(--theme-purple)] to-[var(--color-purple-400)] rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                    <div className="relative bg-white p-6 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center">
                        <QRDisplay qrToken={signupStatus.qrToken || 'PENDING_VERIFICATION'} />
                        <div className="mt-4 flex items-center gap-2 text-[10px] uppercase font-black text-slate-400 tracking-widest">
                            <Ticket className="h-3 w-3" />
                            Toon bij de ingang
                        </div>
                    </div>
                </div>

                <p className="text-[11px] text-center text-[var(--text-muted)] font-bold italic mt-4">
                    Dit ticket is ook per e-mail naar je verzonden.
                </p>
            </div>
        );
    }

    if (isPast) {
        return (
            <div className="h-full flex flex-col justify-center items-center p-12 rounded-[2rem] bg-slate-50/50 border border-dashed border-slate-300 dark:border-white/10 text-center space-y-4">
                <AlertCircle className="h-12 w-12 text-slate-300" />
                <div>
                    <h3 className="text-xl font-black text-slate-400 uppercase tracking-tight">Evenement Afgelopen</h3>
                    <p className="text-sm text-slate-400/80 font-medium max-w-[200px] mx-auto">Helaas kun je je voor deze activiteit niet meer aanmelden.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col p-8 rounded-[2rem] bg-[var(--bg-card)] border border-[var(--border-color)] shadow-2xl shadow-[var(--theme-purple)]/5 group transition-all duration-500 hover:shadow-[var(--theme-purple)]/10">
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h3 className="text-2xl font-black text-[var(--theme-purple)] flex items-center gap-3">
                        <Users className="h-6 w-6" />
                        Inschrijven
                    </h3>
                    <p className="text-[10px] uppercase font-black text-[var(--text-muted)] tracking-[0.2em] mt-1 ml-9">Evenement Tickets</p>
                </div>
                <div className="text-right">
                    <span className="block text-[10px] uppercase font-black text-[var(--text-muted)] tracking-[0.2em] mb-1">Prijs</span>
                    <span className="text-2xl font-black text-[var(--theme-purple)]">€{price.toFixed(2)}</span>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 flex-1 flex flex-col">
                <input
                    type="text"
                    name="website"
                    className="hidden"
                    value={form.website}
                    onChange={(e) => setForm({ ...form, website: e.target.value })}
                    tabIndex={-1}
                    autoComplete="off"
                    suppressHydrationWarning
                />

                <div className="space-y-4 flex-1">
                    <div className="space-y-1.5 focus-within:translate-x-1 transition-transform">
                        <label className="text-[10px] uppercase font-black text-[var(--theme-purple)]/50 ml-3 tracking-widest">Naam *</label>
                        <Input
                            required
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            placeholder="Naam Achternaam"
                            className="bg-[var(--bg-soft)] border-none rounded-2xl h-14 px-6 focus:ring-2 focus:ring-[var(--theme-purple)]/20 transition-all font-bold text-[var(--text-main)]"
                        />
                        {fieldErrors.name && <p className="text-[10px] text-red-500 ml-3 font-black italic">{fieldErrors.name[0]}</p>}
                    </div>

                    <div className="space-y-1.5 focus-within:translate-x-1 transition-transform">
                        <label className="text-[10px] uppercase font-black text-[var(--theme-purple)]/50 ml-3 tracking-widest">Email *</label>
                        <Input
                            required
                            type="email"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            placeholder="voorbeeld@mail.com"
                            className="bg-[var(--bg-soft)] border-none rounded-2xl h-14 px-6 focus:ring-2 focus:ring-[var(--theme-purple)]/20 transition-all font-bold text-[var(--text-main)]"
                        />
                        {fieldErrors.email && <p className="text-[10px] text-red-500 ml-3 font-black italic">{fieldErrors.email[0]}</p>}
                    </div>

                    <div className="space-y-1.5 focus-within:translate-x-1 transition-transform">
                        <label className="text-[10px] uppercase font-black text-[var(--theme-purple)]/50 ml-3 tracking-widest">Telefoonnummer *</label>
                        <PhoneInput
                            required
                            value={form.phoneNumber}
                            onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                            className="bg-[var(--bg-soft)] border-none rounded-2xl h-14 px-6 focus:ring-2 focus:ring-[var(--theme-purple)]/20 transition-all font-bold text-[var(--text-main)]"
                        />
                        {fieldErrors.phoneNumber && <p className="text-[10px] text-red-500 ml-3 font-black italic">{fieldErrors.phoneNumber[0]}</p>}
                    </div>
                </div>

                {error && (
                    <div className="p-4 rounded-2xl bg-red-50 border border-red-100 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                        <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                        <p className="text-xs text-red-700 font-bold italic">{error}</p>
                    </div>
                )}

                <div className="pt-4 space-y-4">
                    <button
                        type="submit"
                        disabled={isPending}
                        className="w-full relative group h-16 bg-gradient-to-br from-[var(--theme-purple)] via-[var(--color-purple-600)] to-[var(--theme-purple)] bg-[length:200%_auto] hover:bg-[position:right_center] text-white font-black rounded-2xl shadow-xl shadow-[var(--theme-purple)]/20 hover:shadow-2xl hover:shadow-[var(--theme-purple)]/40 hover:-translate-y-1 active:scale-95 transition-all duration-500 disabled:opacity-70 disabled:pointer-events-none"
                    >
                        <div className="flex items-center justify-center gap-3">
                            {isPending ? (
                                <>
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                    <span className="tracking-widest">VERWERKEN...</span>
                                </>
                            ) : (
                                <>
                                    {isPaid ? <CreditCard className="h-6 w-6" /> : <Send className="h-6 w-6" />}
                                    <span className="tracking-widest">AANMELDEN (€{price.toFixed(2).replace('.', ',')})</span>
                                </>
                            )}
                        </div>
                    </button>

                    <div className="flex items-center justify-center gap-2 text-[10px] font-black text-[var(--text-muted)] opacity-50 uppercase tracking-tighter">
                        <Info className="h-3 w-3" />
                        <span>Beveiligde verwerking & Directe bevestiging</span>
                    </div>
                </div>
            </form>
        </div>
    );
}

