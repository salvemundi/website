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
            icon={<Users className="size-8" />}
            price={price > 0 ? price : undefined}
            className="h-fit"
        >
            <form onSubmit={(e) => { void handleSubmit(onSubmit)(e); }} className="space-y-6" autoComplete="off">
                {isLoggedIn ? (
                    <div className="space-y-4">
                        <div className="flex items-center gap-4 rounded-2xl border border-border-color/80 bg-bg-soft/80 p-4 shadow-xs">
                            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-theme-purple to-purple-600 text-base font-black text-white shadow-md shadow-theme-purple/20">
                                {initials}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <p className="truncate text-sm font-bold text-text-main">
                                        {displayName}
                                    </p>
                                    <span className="inline-flex items-center gap-1 rounded-full bg-theme-purple/10 px-2 py-0.5 text-[10px] font-black tracking-wider text-theme-purple uppercase">
                                        <CheckCircle2 className="size-3" /> Ingelogd
                                    </span>
                                </div>
                                <p className="mt-0.5 truncate text-xs font-medium text-text-muted">{user?.email || initialData.email}</p>
                                {initialData.phoneNumber ? (
                                    <p className="mt-0.5 font-mono text-[11px] text-text-muted/80">{initialData.phoneNumber}</p>
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
                                className="h-14 rounded-2xl border-none bg-bg-soft px-6 font-bold text-text-main transition-all focus:ring-2 focus:ring-theme-purple/20"
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
                                className="h-14 rounded-2xl border-none bg-bg-soft px-6 font-bold text-text-main transition-all focus:ring-2 focus:ring-theme-purple/20"
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
                                        className="h-14 rounded-2xl border-none bg-bg-soft px-6 font-bold text-text-main transition-all focus:ring-2 focus:ring-theme-purple/20"
                                    />
                                )}
                            />
                        </FormField>
                    </div>
                )}

                {serverError && (
                    <div className="flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4">
                        <AlertCircle className="mt-0.5 size-5 shrink-0 text-red-500" />
                        <p className="text-xs font-bold text-red-700 italic">{serverError}</p>
                    </div>
                )}

                <div className="space-y-4 pt-2">
                    <button
                        type="submit"
                        disabled={isPending}
                        className="group relative form-button w-full rounded-2xl bg-linear-to-br from-theme-purple via-purple-600 to-theme-purple bg-size-[200%_auto] py-4 font-black text-white shadow-xl shadow-theme-purple/20 transition-all duration-500 enabled:hover:-translate-y-1 enabled:hover:bg-position-[right_center] enabled:hover:shadow-2xl enabled:hover:shadow-theme-purple/40 enabled:active:scale-95 disabled:opacity-70"
                    >
                        <div className="flex items-center justify-center gap-3">
                            {isPending ? (
                                <><Loader2 className="size-6 animate-spin" /><span className="tracking-widest">VERWERKEN...</span></>
                            ) : isPaid ? (
                                <><CreditCard className="size-6" /><span className="tracking-widest">Naar betaling (€{price.toFixed(2).replace('.', ',')})</span></>
                            ) : (
                                <><Send className="size-6" /><span className="tracking-widest">Aanmelden</span></>
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
