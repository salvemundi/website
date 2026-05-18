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
    userName: string;
    userEmail: string;
    initialPhone: string;
}

export const IntroParentIsland = ({ userName, userEmail, initialPhone }: IntroParentIslandProps) => {
    const [submitted, setSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
                <p className="text-theme-text-muted dark:text-theme-text-muted">
                    Bedankt! Je inschrijving is ontvangen. Als je iets wilt aanpassen, neem contact op met de intro commissie.
                </p>
            </div>
        );
    }

    return (
        <StandardFormCard
            title="Word Intro Ouder!"
            subtitle="Begeleiding"
            icon={<Heart className="w-8 h-8" />}
            description="Begeleid de nieuwe lichting studenten tijdens de introweek."
        >
            <form onSubmit={(e) => { void handleSubmit(onSubmit)(e); }} className="space-y-4 lg:space-y-6" autoComplete="off">
                <div className="bg-[var(--bg-soft)] rounded-2xl p-4 lg:p-6 mb-6 border border-[var(--border-color)]/20 shadow-inner">
                    <p className="text-[var(--text-main)] text-sm lg:text-base font-medium space-y-2">
                        <div className="flex justify-between items-center border-b border-[var(--border-color)]/10 pb-2">
                            <span className="text-[var(--text-muted)] font-bold uppercase text-[10px] tracking-widest">Naam</span>
                            <span className="font-bold">{userName}</span>
                        </div>
                        <div className="flex justify-between items-center pt-1">
                            <span className="text-[var(--text-muted)] font-bold uppercase text-[10px] tracking-widest">E-mail</span>
                            <span className="font-bold">{userEmail}</span>
                        </div>
                    </p>
                </div>

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

                <FormField id="field-motivation" label="Motivatie" required error={errors.motivation?.message}>
                    <textarea
                        {...register('motivation')}
                        id="field-motivation"
                        required
                        rows={4}
                        className="form-input w-full"
                        placeholder="Vertel ons waarom jij een goede intro ouder zou zijn..."
                        autoComplete="off"
                        suppressHydrationWarning
                    />
                </FormField>

                {error && <p className="text-red-500 dark:text-red-400 text-xs lg:text-sm">{error}</p>}

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="form-button w-full mt-4"
                >
                    {isSubmitting ? 'Bezig...' : 'Meld je aan als Introouder'}
                </button>
            </form>
        </StandardFormCard>
    );
};
