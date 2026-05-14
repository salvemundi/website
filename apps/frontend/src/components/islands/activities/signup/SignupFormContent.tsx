'use client';

import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { eventSignupFormSchema, type EventSignupForm } from '@salvemundi/validations/schema/activity.zod';
import { FormField } from '@/shared/ui/FormField';
import { Input } from '@/shared/ui/Input';
import { PhoneInput } from '@/shared/ui/PhoneInput';
import { Loader2, CreditCard, Send, Users, Info, AlertCircle } from 'lucide-react';

interface SignupFormContentProps {
    onSubmit: (data: EventSignupForm) => void;
    isPending: boolean;
    price: number;
    initialData: {
        event_id: number;
        name: string;
        email: string;
        phoneNumber: string;
    };
    serverError: string | null;
}

export default function SignupFormContent({
    onSubmit,
    isPending,
    price,
    initialData,
    serverError
}: SignupFormContentProps) {
    const isPaid = price > 0;

    const {
        register,
        control,
        handleSubmit,
        formState: { errors }
    } = useForm<EventSignupForm>({
        resolver: zodResolver(eventSignupFormSchema),
        defaultValues: {
            ...initialData,
            website: ''
        }
    });

    return (
        <div className={`h-full flex flex-col p-8 rounded-[2rem] bg-[var(--bg-card)] border border-[var(--border-color)] shadow-2xl group transition-all duration-500 hover:shadow-[var(--theme-purple)]/10`}>
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h3 className="text-2xl font-semibold text-[var(--theme-purple)] flex items-center gap-3">
                        <Users className="h-6 w-6" /> Aanmelden
                    </h3>
                    <p className="text-[10px]  font-semibold text-[var(--text-muted)] tracking-[0.2em] mt-1 ml-9">Activiteit Tickets</p>
                </div>
                <div className="text-right">
                    <span className="block text-[10px]  font-semibold text-[var(--text-muted)] tracking-[0.2em] mb-1">Prijs</span>
                    <span className="text-2xl font-semibold text-[var(--theme-purple)]">€{price.toFixed(2)}</span>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 flex-1 flex flex-col" autoComplete="off">
                <div className="space-y-4 flex-1">
                    <FormField
                        id="field-name"
                        label="Naam"
                        required
                        error={errors.name?.message}
                        labelClassName="text-[10px]  font-semibold text-[var(--theme-purple)]/50 ml-3 tracking-widest"
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
                        labelClassName="text-[10px]  font-semibold text-[var(--theme-purple)]/50 ml-3 tracking-widest"
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
                        labelClassName="text-[10px]  font-semibold text-[var(--theme-purple)]/50 ml-3 tracking-widest"
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
