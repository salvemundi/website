'use client';

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createTripSignup } from '@/server/actions/reis.actions';
import { type ReisTrip, reisSignupFormSchema, type ReisSignupForm } from '@salvemundi/validations/schema/reis.zod';
import { FormField } from '@/shared/ui/FormField';
import { Input } from '@/shared/ui/Input';
import { DateInput } from '@/shared/ui/DateInput';
import { PhoneInput } from '@/shared/ui/PhoneInput';
import { useAdminToast } from '@/hooks/use-admin-toast';
import AdminToast from '@/components/ui/admin/AdminToast';

// Sub-components
import { RegistrationSuccess } from './registration/RegistrationSuccess';
import { RegistrationClosed } from './registration/RegistrationClosed';

interface ReisRegistrationFormProps {
    nextTrip: ReisTrip | null;
    canSignUp: boolean;
    registrationStartText: string;
    currentUser: any;
    onRefresh?: () => void;
}

export function ReisRegistrationForm({
    nextTrip,
    canSignUp,
    registrationStartText,
    currentUser,
    onRefresh
}: ReisRegistrationFormProps) {
    const [isSuccess, setIsSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const { toast, showToast, hideToast } = useAdminToast();

    const formatDateForInput = (dateStr?: string | null) => {
        if (!dateStr) return '';
        try {
            if (typeof dateStr === 'string' && dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) return dateStr;
            const date = new Date(dateStr!);
            if (isNaN(date.getTime())) return '';
            return date.toISOString().split('T')[0];
        } catch {
            return '';
        }
    };

    const {
        register,
        control,
        handleSubmit,
        formState
    } = useForm<ReisSignupForm>({
        resolver: zodResolver(reisSignupFormSchema),
        defaultValues: {
            first_name: currentUser?.first_name || '',
            last_name: currentUser?.last_name || '',
            email: currentUser?.email || '',
            phone_number: currentUser?.phone_number || '',
            date_of_birth: formatDateForInput(currentUser?.date_of_birth),
            terms_accepted: false,
        }
    });

    const { errors } = formState;

    const onSubmit = async (data: ReisSignupForm) => {
        if (!nextTrip) return;

        setLoading(true);
        try {
            const result = await createTripSignup(data as any, nextTrip.id);
            if (!result.success) {
                showToast(result.message || 'Fout bij inschrijven.', 'error');
            } else {
                setIsSuccess(true);
                showToast('Je bent succesvol ingeschreven!', 'success');
                
                if (currentUser && onRefresh) {
                    setTimeout(() => {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                        onRefresh();
                    }, 1000);
                }
            }
        } catch {
            showToast('Er is een onverwachte fout opgetreden bij het verzenden.', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <RegistrationSuccess 
                currentUser={currentUser} 
                onReset={() => setIsSuccess(false)} 
            />
        );
    }

    if (!nextTrip) {
        return (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-theme-purple/5 rounded-2xl border border-theme-purple/10">
                <div className="w-16 h-16 bg-theme-purple/10 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-theme-purple opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </div>
                <h2 className="text-xl font-bold text-theme-purple dark:text-theme-white mb-2">Geen reis gepland</h2>
                <p className="text-[var(--text-muted)] text-sm max-w-xs">
                    Momenteel is er geen reis gepland. Houd deze pagina in de gaten voor nieuwe data!
                </p>
            </div>
        );
    }

    if (!canSignUp) {
        return <RegistrationClosed registrationStartText={registrationStartText} />;
    }

    return (
        <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
            autoComplete="off"
            suppressHydrationWarning
        >
            <p className="text-theme-text dark:text-white/90 text-sm mb-2 font-medium">
                Let op: dit is een vrijblijvende aanmelding. De daadwerkelijke betaling volgt later.
            </p>

            <div className="flex flex-col gap-4">
                <FormField id="field-first_name" label="Voornaam" required error={errors.first_name?.message}>
                    <Controller
                        name="first_name"
                        control={control}
                        render={({ field }) => (
                            <Input
                                {...field}
                                id="field-first_name"
                                placeholder="Voornaam"
                                autoComplete="off"
                                suppressHydrationWarning
                            />
                        )}
                    />
                    <span className="text-[10px] text-[var(--text-muted)]/80 mt-1 block font-bold uppercase tracking-wider">
                        Gebruik je volledige naam zoals op je paspoort/ID
                    </span>
                </FormField>

                <FormField id="field-last_name" label="Tussenvoegsel & Achternaam" required error={errors.last_name?.message}>
                    <Controller
                        name="last_name"
                        control={control}
                        render={({ field }) => (
                            <Input
                                {...field}
                                id="field-last_name"
                                placeholder="Achternaam (incl. tussenvoegsel)"
                                autoComplete="off"
                                suppressHydrationWarning
                            />
                        )}
                    />
                </FormField>

                <FormField id="field-email" label="E-mailadres" required error={errors.email?.message}>
                    <Controller
                        name="email"
                        control={control}
                        render={({ field }) => (
                            <Input
                                {...field}
                                id="field-email"
                                type="email"
                                placeholder="jouw@email.nl"
                                autoComplete="off"
                                suppressHydrationWarning
                                data-lpignore="true"
                            />
                        )}
                    />
                </FormField>

                <FormField id="field-date_of_birth" label="Geboortedatum" required error={errors.date_of_birth?.message}>
                    <Controller
                        name="date_of_birth"
                        control={control}
                        render={({ field }) => (
                            <DateInput
                                {...field}
                                id="field-date_of_birth"
                                placeholder="dd-mm-jjjj"
                                autoComplete="off"
                            />
                        )}
                    />
                </FormField>

                <FormField id="field-phone_number" label="Telefoonnummer" required error={errors.phone_number?.message}>
                    <Controller
                        name="phone_number"
                        control={control}
                        render={({ field }) => (
                            <PhoneInput
                                {...field}
                                id="field-phone_number"
                                placeholder="06 12345678"
                                autoComplete="off"
                            />
                        )}
                    />
                </FormField>
            </div>

            <label 
                htmlFor="terms_accepted"
                className="flex items-start gap-3 text-theme-text dark:text-white mt-2 cursor-pointer group"
            >
                <input
                    {...register('terms_accepted')}
                    id="terms_accepted"
                    type="checkbox"
                    className="mt-1 h-5 w-5 rounded border-theme-purple/20 accent-theme-purple transition-all group-hover:scale-110"
                />
                <span className="text-sm leading-snug">
                    Ik accepteer de{' '}
                    <a href="/reisvoorwaarden.pdf" download className="underline font-semibold text-theme-purple hover:text-theme-purple/80" target="_blank" rel="noopener noreferrer">
                        algemene voorwaarden
                    </a>
                </span>
            </label>
            {errors.terms_accepted && <p className="text-xs text-red-500 font-bold">{errors.terms_accepted.message}</p>}

            {/* Honeypot at bottom to avoid breaking browser autofill sections */}
            <input {...register('website')} type="text" className="hidden" tabIndex={-1} autoComplete="off" suppressHydrationWarning />

            <button
                type="submit"
                disabled={loading}
                className="form-button mt-4 group"
            >
                <span>
                    {loading ? 'Bezig met aanmelden...' : 'Aanmelden voor de reis'}
                </span>
                {!loading && <span className="group-hover:translate-x-1 transition-transform inline-block ml-2">→</span>}
            </button>
            <AdminToast toast={toast} onClose={hideToast} />
        </form>
    );
}
