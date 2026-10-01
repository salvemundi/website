'use client';

import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { submitIntroParentSignup } from '@/server/actions/public/intro.actions';
import { FormField } from '@/shared/ui/FormField';
import { PhoneInput } from '@/shared/ui/PhoneInput';
import { Heart, Lock } from 'lucide-react';

import { introParentSignupFormSchema, type IntroParentSignupForm } from '@salvemundi/validations/schema/intro.zod';
import { formatPhoneNumber } from '@/lib/utils/phone-utils';
import { StandardFormCard } from '@/components/ui/forms/StandardFormCard';

interface IntroParentIslandProps {
    initialPhone: string;
    className?: string;
    isOpen?: boolean;
}

export const IntroParentIsland = ({ initialPhone, className = '', isOpen = true }: IntroParentIslandProps) => {

    const [submitted, setSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const hasValidPhone = !!(
        initialPhone &&
        /^\+[1-9][0-9\s\-()]+$/.test(formatPhoneNumber(initialPhone)) &&
        formatPhoneNumber(initialPhone).length >= 8 &&
        formatPhoneNumber(initialPhone).length <= 16
    );

    const {
        register,
        control,
        handleSubmit,
        formState: { errors }
    } = useForm<IntroParentSignupForm>({
        resolver: zodResolver(introParentSignupFormSchema),
        defaultValues: {
            telefoonnummer: formatPhoneNumber(initialPhone),
            motivation: ''
        }
    });

    const onSubmit = async (data: IntroParentSignupForm) => {
        setIsSubmitting(true);
        setError(null);

        try {
            const result = await submitIntroParentSignup(data);

            if (result.success) {
                setSubmitted(true);
            } else {
                setError(result.error || 'Er is een fout opgetreden.');
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Er is een fout opgetreden bij het versturen van je aanmelding.';
            setError(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) {
        return (
            <div className={`dark:bg-gradient-theme squircle-xl flex min-h-75 flex-col items-center justify-center border border-border-color bg-bg-card p-10 text-center shadow-xl ${className}`}>
                <div className="mb-6 flex size-20 items-center justify-center rounded-full bg-purple-100 dark:bg-white/20">

                    <Lock className="size-10 text-brand-primary dark:text-white" />
                </div>
                <h3 className="mb-4 text-3xl font-black tracking-tight text-text-main dark:text-white">Inschrijvingen Gesloten</h3>
                <p className="max-w-sm font-medium text-text-muted dark:text-white/80">
                    De inschrijvingen voor Intro Ouders zijn momenteel gesloten.
                </p>
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="dark:bg-gradient-theme squircle-lg border border-border-color bg-bg-card p-6 text-center shadow-lg lg:p-8">
                <h3 className="mb-4 text-xl font-bold text-text-main lg:text-2xl dark:text-white">Je hebt je aangemeld als Intro Ouder</h3>
                <p className="text-text-muted dark:text-white/80">
                    Bedankt! Je inschrijving is ontvangen. Als je iets wilt aanpassen, neem contact op met de intro commissie.
                </p>
            </div>
        );
    }


    return (
        <StandardFormCard
            title="Word Intro Ouder!"
            icon={<Heart className="size-8" />}
            description="Begeleid de nieuwe lichting studenten tijdens de introweek."
            className={className}
        >
            <form onSubmit={(e) => { void handleSubmit(onSubmit)(e); }} className="flex flex-1 flex-col justify-between space-y-4 lg:space-y-6" autoComplete="off">
                <div className="flex flex-1 flex-col space-y-4 lg:space-y-6">
                    {!hasValidPhone ? (
                        <FormField id="field-telefoonnummer" label="Telefoonnummer" required error={errors.telefoonnummer?.message}>
                            <Controller
                                name="telefoonnummer"
                                control={control}
                                render={({ field }) => (
                                    <PhoneInput
                                        {...field}
                                        id="field-telefoonnummer"
                                        required
                                        autoComplete="one-time-code"
                                    />
                                )}
                            />
                        </FormField>
                    ) : (
                        <input type="hidden" {...register('telefoonnummer')} />
                    )}

                    <FormField id="field-motivation" label="Motivatie" required error={errors.motivation?.message} className="flex flex-1 flex-col">
                        <textarea
                            {...register('motivation')}
                            id="field-motivation"
                            required
                            className="form-input w-full flex-1 resize-none"
                            placeholder="Vertel ons waarom jij een goede Intro Ouder zou zijn..."
                            autoComplete="off"
                            suppressHydrationWarning
                        />
                    </FormField>
                </div>

                {error && <p className="text-xs text-red-500 lg:text-sm dark:text-red-400">{error}</p>}

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="mt-4 form-button w-full shrink-0"
                >
                    {isSubmitting ? 'Bezig...' : 'Meld je aan als Intro Ouder'}
                </button>
            </form>
        </StandardFormCard>
    );
};
