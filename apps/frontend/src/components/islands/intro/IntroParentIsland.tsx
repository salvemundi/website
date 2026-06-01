'use client';

import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { submitIntroParentSignup } from '@/server/actions/public/intro.actions';
import { FormField } from '@/shared/ui/FormField';
import { PhoneInput } from '@/shared/ui/PhoneInput';
import { Heart } from 'lucide-react';
import { introParentSignupFormSchema, type IntroParentSignupForm } from '@salvemundi/validations/schema/intro.zod';
import { formatPhoneNumber } from '@/lib/utils/phone-utils';
import { StandardFormCard } from '@/components/ui/forms/StandardFormCard';

interface IntroParentIslandProps {
    initialPhone: string;
    className?: string;
}

export const IntroParentIsland = ({ initialPhone, className = '' }: IntroParentIslandProps) => {
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

    if (submitted) {
        return (
            <div className="bg-gradient-theme squircle-lg p-6 lg:p-8 shadow-lg text-center">
                <h3 className="text-xl lg:text-2xl font-bold text-white mb-4">Je hebt je aangemeld als Intro Ouder</h3>
                <p className="text-text-muted">
                    Bedankt! Je inschrijving is ontvangen. Als je iets wilt aanpassen, neem contact op met de intro commissie.
                </p>
            </div>
        );
    }

    return (
        <StandardFormCard
            title="Word Intro Ouder!"
            icon={<Heart className="w-8 h-8" />}
            description="Begeleid de nieuwe lichting studenten tijdens de introweek."
            className={className}
        >
            <form onSubmit={(e) => { void handleSubmit(onSubmit)(e); }} className="space-y-4 lg:space-y-6 flex-1 flex flex-col justify-between" autoComplete="off">
                <div className="flex-1 flex flex-col space-y-4 lg:space-y-6">
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

                    <FormField id="field-motivation" label="Motivatie" required error={errors.motivation?.message} className="flex-1 flex flex-col">
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

                {error && <p className="text-red-500 dark:text-red-400 text-xs lg:text-sm">{error}</p>}

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="form-button w-full mt-4 shrink-0"
                >
                    {isSubmitting ? 'Bezig...' : 'Meld je aan als Intro Ouder'}
                </button>
            </form>
        </StandardFormCard>
    );
};
