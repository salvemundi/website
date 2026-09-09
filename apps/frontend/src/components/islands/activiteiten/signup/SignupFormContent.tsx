'use client';

import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { eventSignupFormSchema, phoneNumberSchema, type EventSignupForm } from '@salvemundi/validations';
import { FormField } from '@/shared/ui/FormField';
import { Input } from '@/shared/ui/Input';
import { PhoneInput } from '@/shared/ui/PhoneInput';
import { Loader2, CreditCard, Send, Users, AlertCircle, CheckCircle2 } from 'lucide-react';
import { StandardFormCard } from '@/components/ui/forms/StandardFormCard';
import { type EnrichedUser } from '@/types/auth';

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
    isLoggedIn?: boolean;
    user?: EnrichedUser | null;
}

export default function SignupFormContent({
    onSubmit,
    isPending,
    price,
    initialData,
    serverError,
    isLoggedIn = false,
    user
}: SignupFormContentProps) {
    const isPaid = price > 0;

    const schema = isLoggedIn
        ? eventSignupFormSchema
        : eventSignupFormSchema.extend({
            phoneNumber: phoneNumberSchema
        });

    const {
        register,
        control,
        handleSubmit,
        formState: { errors }
    } = useForm<EventSignupForm>({
        resolver: zodResolver(schema),
        defaultValues: {
            ...initialData,
            website: ''
        }
    });

    const displayName = user?.first_name 
        ? `${user.first_name} ${user.last_name || ''}`.trim() 
        : (user?.name || initialData.name || 'Lid');

    const initialFirst = user?.first_name ? user.first_name[0] : (user?.name ? user.name[0] : 'U');
    const initialLast = user?.last_name ? user.last_name[0] : '';
    const initials = `${initialFirst}${initialLast}`.toUpperCase();

    return (
        <StandardFormCard
            title="Aanmelden"
            icon={<Users className="h-8 w-8" />}
            price={price > 0 ? price : undefined}
            className="h-fit"
        >
            <form onSubmit={(e) => { void handleSubmit(onSubmit)(e); }} className="space-y-6" autoComplete="off">
                {isLoggedIn ? (
                    <div className="space-y-4">
                        <div className="rounded-2xl bg-bg-soft/80 border border-border-color/80 p-4 flex items-center gap-4 shadow-xs">
                            <div className="h-12 w-12 rounded-2xl bg-linear-to-br from-theme-purple to-purple-600 text-white font-black flex items-center justify-center text-base shrink-0 shadow-md shadow-theme-purple/20">
                                {initials}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <p className="font-bold text-text-main text-sm truncate">
                                        {displayName}
                                    </p>
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-theme-purple/10 text-theme-purple">
                                        <CheckCircle2 className="h-3 w-3" /> Ingelogd
                                    </span>
                                </div>
                                <p className="text-xs text-text-muted font-medium truncate mt-0.5">{user?.email || initialData.email}</p>
                                {initialData.phoneNumber ? (
                                    <p className="text-[11px] text-text-muted/80 font-mono mt-0.5">{initialData.phoneNumber}</p>
                                ) : null}
                            </div>
                        </div>

                        {/* Hidden form values for submission */}
                        <input {...register('name')} type="hidden" />
                        <input {...register('email')} type="hidden" />
                        <input {...register('phoneNumber')} type="hidden" />
                    </div>
                ) : (
                    <div className="space-y-4">
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
                                className="bg-bg-soft border-none rounded-2xl h-14 px-6 focus:ring-2 focus:ring-theme-purple/20 transition-all font-bold text-text-main"
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
                                className="bg-bg-soft border-none rounded-2xl h-14 px-6 focus:ring-2 focus:ring-theme-purple/20 transition-all font-bold text-text-main"
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
                                        autoComplete="tel"
                                        error={!!errors.phoneNumber}
                                        className="bg-bg-soft border-none rounded-2xl h-14 px-6 focus:ring-2 focus:ring-theme-purple/20 transition-all font-bold text-text-main"
                                    />
                                )}
                            />
                        </FormField>
                    </div>
                )}

                {serverError && (
                    <div className="p-4 rounded-2xl bg-red-50 border border-red-100 flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                        <p className="text-xs text-red-700 font-bold italic">{serverError}</p>
                    </div>
                )}

                <div className="pt-2 space-y-4">
                    <button
                        type="submit"
                        disabled={isPending}
                        className="form-button w-full relative group py-4 bg-linear-to-br from-theme-purple via-purple-600 to-theme-purple bg-size-[200%_auto] enabled:hover:bg-position-[right_center] text-white font-black rounded-2xl shadow-xl shadow-theme-purple/20 enabled:hover:shadow-2xl enabled:hover:shadow-theme-purple/40 enabled:hover:-translate-y-1 enabled:active:scale-95 transition-all duration-500 disabled:opacity-70"
                    >
                        <div className="flex items-center justify-center gap-3">
                            {isPending ? (
                                <><Loader2 className="h-6 w-6 animate-spin" /><span className="tracking-widest">VERWERKEN...</span></>
                            ) : isPaid ? (
                                <><CreditCard className="h-6 w-6" /><span className="tracking-widest">Naar betaling (€{price.toFixed(2).replace('.', ',')})</span></>
                            ) : (
                                <><Send className="h-6 w-6" /><span className="tracking-widest">Aanmelden</span></>
                            )}
                        </div>
                    </button>
                </div>
                {/* Honeypot at bottom to avoid breaking browser autofill sections */}
                <input {...register('website')} type="text" className="hidden" tabIndex={-1} autoComplete="off" suppressHydrationWarning />
            </form>
        </StandardFormCard>
    );
}
