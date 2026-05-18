'use client';

import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { eventSignupFormSchema, type EventSignupForm } from '@salvemundi/validations/schema/activity.zod';
import { FormField } from '@/shared/ui/FormField';
import { Input } from '@/shared/ui/Input';
import { PhoneInput } from '@/shared/ui/PhoneInput';
import { Loader2, CreditCard, Send, Users, Info, AlertCircle } from 'lucide-react';
import { StandardFormCard } from '@/components/ui/forms/StandardFormCard';

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
        <StandardFormCard
            title="Aanmelden"
            subtitle="Activiteit"
            icon={<Users className="h-8 w-8" />}
            price={price}
            className="h-full"
        >
            <form onSubmit={(e) => { void handleSubmit(onSubmit)(e); }} className="space-y-6 flex-1 flex flex-col" autoComplete="off">
                <div className="space-y-4 flex-1">
                    <FormField
                        id="field-name"
                        label="Naam"
                        required
                        error={errors.name?.message}
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
                        <Info className="h-3 w-3" /> <span>Beveiligde verwerking & Directe bevestiging</span>
                    </div>
                </div>
                {/* Honeypot at bottom to avoid breaking browser autofill sections */}
                <input {...register('website')} type="text" className="hidden" tabIndex={-1} autoComplete="off" suppressHydrationWarning />
            </form>
        </StandardFormCard>
    );
}
