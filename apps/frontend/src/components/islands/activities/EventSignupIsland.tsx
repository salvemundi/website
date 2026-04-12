'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/features/auth/providers/auth-provider';
import { signupForActivity } from '@/server/actions/activiteit-actions';
import { eventSignupFormSchema, type EventSignupForm } from '@salvemundi/validations/schema/activity.zod';
import { FormField } from '@/shared/ui/FormField';
import { Input } from '@/shared/ui/Input';
import { PhoneInput } from '@/shared/ui/PhoneInput';
import { Loader2, CheckCircle2, AlertCircle, CreditCard, Send, Users, Ticket, Info } from 'lucide-react';
import QRDisplay from '@/shared/ui/QRDisplay';
import { Skeleton } from '@/components/ui/Skeleton';

interface EventSignupIslandProps {
    isLoading?: boolean;
    isMember?: boolean;
    isPast?: boolean;
    eventId?: number;
    price?: number;
    eventDate?: string;
    description?: string;
    eventName?: string;
    initialUser?: any;
    verifiedPaymentStatus?: 'paid' | null;
    initialQrToken?: string;
}

export default function EventSignupIsland({
    isLoading = false,
    eventId = 0,
    price = 0,
    isPast: serverIsPast = false,
    isPast: clientIsPast = false,
    eventName = 'Activiteit',
    initialUser,
    verifiedPaymentStatus,
    initialQrToken
}: EventSignupIslandProps) {
    const user = initialUser;

    const [isPending, startTransition] = useTransition();
    const [serverError, setServerError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(verifiedPaymentStatus === 'paid' ? 'Betaling geslaagd! Je bent nu ingeschreven.' : null);
    
    const [signupStatus, setSignupStatus] = useState<{
        isSignedUp: boolean;
        paymentStatus?: 'paid' | 'open' | 'failed' | 'canceled';
        qrToken?: string;
    }>({ 
        isSignedUp: verifiedPaymentStatus === 'paid',
        paymentStatus: verifiedPaymentStatus || undefined,
        qrToken: initialQrToken
    });

    const isPaid = price > 0;
    const isPast = serverIsPast || clientIsPast;

    const {
        register,
        control,
        handleSubmit,
        reset,
        formState: { errors }
    } = useForm<EventSignupForm>({
        resolver: zodResolver(eventSignupFormSchema),
        defaultValues: {
            event_id: eventId,
            name: user?.name || (user as any)?.first_name ? `${(user as any).first_name} ${(user as any).last_name || ''}`.trim() : '',
            email: user?.email || '',
            phoneNumber: (user as any)?.phone_number || '',
            website: '',
        }
    });

    // REIS_FORM_V7.6_SSR: reset() useEffect VERWIJDERD om autofill-locks te voorkomen.
    // Gegevens worden nu direct via defaultValues geladen.


    const onSubmit = async (data: EventSignupForm) => {
        if (isLoading) return;
        setServerError(null);

        startTransition(async () => {
            const result = await signupForActivity(data);

            if (result.success) {
                if (result.checkoutUrl) {
                    window.location.href = result.checkoutUrl;
                } else {
                    setSuccess(result.message || 'Inschrijving geslaagd!');
                    setSignupStatus({ isSignedUp: true, paymentStatus: isPaid ? 'open' : 'paid' });
                }
            } else {
                setServerError(result.error || 'Er is iets misgegaan.');
            }
        });
    };

    // Skeletons verwijderd om browser autofill niet te blokkeren. 
    // Het formulier staat nu direct in de HTML.


    if (signupStatus.paymentStatus === 'paid') {
        return (
            <div className="h-full flex flex-col justify-center space-y-8 p-8 rounded-[2rem] bg-[var(--bg-card)] border border-[var(--color-success)]/30 shadow-2xl">
                <div className="text-center space-y-4">
                    <div className="w-20 h-20 bg-[var(--color-success)]/10 rounded-full flex items-center justify-center mx-auto shadow-inner">
                        <CheckCircle2 className="h-10 w-10 text-[var(--color-success)]" />
                    </div>
                    <h3 className="text-3xl font-black text-[var(--text-main)] leading-tight">🎉 Inschrijving Definitief!</h3>
                    <p className="text-[var(--text-muted)] font-medium">
                        Je bent succesvol ingeschreven voor <span className="text-[var(--theme-purple)] font-bold">{eventName}</span>.
                    </p>
                </div>
                <div className="relative group p-6 bg-white rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center">
                    <QRDisplay qrToken={signupStatus.qrToken || 'PENDING_VERIFICATION'} />
                    <div className="mt-4 flex items-center gap-2 text-[10px] uppercase font-black text-slate-400 tracking-widest">
                        <Ticket className="h-3 w-3" /> Toon bij de ingang
                    </div>
                </div>
            </div>
        );
    }

    if (isPast) {
        return (
            <div className="h-full flex flex-col justify-center items-center p-12 rounded-[2rem] bg-slate-50/50 border border-dashed border-slate-300 dark:border-white/10 text-center space-y-4">
                <AlertCircle className="h-12 w-12 text-slate-300" />
                <div>
                    <h3 className="text-xl font-black text-slate-400 uppercase">Activiteit Afgelopen</h3>
                    <p className="text-sm text-slate-400/80 font-medium max-w-[200px] mx-auto">Helaas kun je je voor deze activiteit niet meer aanmelden.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col p-8 rounded-[2rem] bg-[var(--bg-card)] border border-[var(--border-color)] shadow-2xl group transition-all duration-500 hover:shadow-[var(--theme-purple)]/10">
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h3 className="text-2xl font-black text-[var(--theme-purple)] flex items-center gap-3">
                        <Users className="h-6 w-6" /> Inschrijven
                    </h3>
                    <p className="text-[10px] uppercase font-black text-[var(--text-muted)] tracking-[0.2em] mt-1 ml-9">Activiteit Tickets</p>
                </div>
                <div className="text-right">
                    <span className="block text-[10px] uppercase font-black text-[var(--text-muted)] tracking-[0.2em] mb-1">Prijs</span>
                    <span className="text-2xl font-black text-[var(--theme-purple)]">€{price.toFixed(2)}</span>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 flex-1 flex flex-col" autoComplete="off">

                <div className="space-y-4 flex-1">
                    <FormField 
                        id="field-name"
                        label="Naam" 
                        required 
                        error={errors.name?.message}
                        labelClassName="text-[10px] uppercase font-black text-[var(--theme-purple)]/50 ml-3 tracking-widest"
                    >
                        <Input
                            {...register('name')}
                            id="field-name"
                            placeholder="Naam Achternaam"
                            className="bg-[var(--bg-soft)] border-none rounded-2xl h-14 px-6 focus:ring-2 focus:ring-[var(--theme-purple)]/20 transition-all font-bold text-[var(--text-main)]"
                        />
                    </FormField>

                    <FormField 
                        id="field-email"
                        label="Email" 
                        required 
                        error={errors.email?.message}
                        labelClassName="text-[10px] uppercase font-black text-[var(--theme-purple)]/50 ml-3 tracking-widest"
                    >
                        <Input
                            {...register('email')}
                            id="field-email"
                            type="email"
                            placeholder="voorbeeld@mail.com"
                            className="bg-[var(--bg-soft)] border-none rounded-2xl h-14 px-6 focus:ring-2 focus:ring-[var(--theme-purple)]/20 transition-all font-bold text-[var(--text-main)]"
                        />
                    </FormField>

                    <FormField 
                        id="field-phoneNumber"
                        label="Telefoonnummer" 
                        required 
                        error={errors.phoneNumber?.message}
                        labelClassName="text-[10px] uppercase font-black text-[var(--theme-purple)]/50 ml-3 tracking-widest"
                    >
                        <Controller
                            name="phoneNumber"
                            control={control}
                            render={({ field }) => (
                                <PhoneInput
                                    {...field}
                                    id="field-phoneNumber"
                                    className="bg-[var(--bg-soft)] border-none rounded-2xl h-14 px-6 focus:ring-2 focus:ring-[var(--theme-purple)]/20 transition-all font-bold text-[var(--text-main)]"
                                />
                            )}
                        />
                    </FormField>
                </div>

                {serverError && (
                    <div className="p-4 rounded-2xl bg-red-50 border border-red-100 flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                        <p className="text-xs text-red-700 font-bold italic">{serverError}</p>
                    </div>
                )}

                <div className="pt-4 space-y-4">
                    <button
                        type="submit"
                        disabled={isPending}
                        className="w-full relative group h-16 bg-gradient-to-br from-[var(--theme-purple)] via-[var(--color-purple-600)] to-[var(--theme-purple)] bg-[length:200%_auto] hover:bg-[position:right_center] text-white font-black rounded-2xl shadow-xl shadow-[var(--theme-purple)]/20 hover:shadow-2xl hover:shadow-[var(--theme-purple)]/40 hover:-translate-y-1 active:scale-95 transition-all duration-500 disabled:opacity-70"
                    >
                        <div className="flex items-center justify-center gap-3">
                            {isPending ? (
                                <><Loader2 className="h-6 w-6 animate-spin" /><span className="tracking-widest">VERWERKEN...</span></>
                            ) : (
                                <>{isPaid ? <CreditCard className="h-6 w-6" /> : <Send className="h-6 w-6" />}
                                <span className="tracking-widest">AANMELDEN (€{price.toFixed(2).replace('.', ',')})</span></>
                            )}
                        </div>
                    </button>
                    <div className="flex items-center justify-center gap-2 text-[10px] font-black text-[var(--text-muted)] opacity-50 uppercase tracking-tighter">
                        <Info className="h-3 w-3" /> <span>Beveiligid verwerking & Directe bevestiging</span>
                    </div>
                </div>
                {/* Honeypot at bottom to avoid breaking browser autofill sections */}
                <input {...register('website')} type="text" className="hidden" tabIndex={-1} autoComplete="off" suppressHydrationWarning />
            </form>
        </div>
    );
}

