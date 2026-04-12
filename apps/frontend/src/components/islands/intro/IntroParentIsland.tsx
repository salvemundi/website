'use client';

import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { submitIntroParentSignup } from '@/server/actions/intro.actions';
import { FormField } from '@/shared/ui/FormField';
import { PhoneInput } from '@/shared/ui/PhoneInput';
import { Heart } from 'lucide-react';
import { introParentSignupFormSchema, type IntroParentSignupForm } from '@salvemundi/validations/schema/intro.zod';

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
            telefoonnummer: initialPhone,
            motivation: '',
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
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Er is een fout opgetreden bij het versturen van je aanmelding.';
            setError(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <div className="bg-gradient-theme rounded-2xl lg:rounded-3xl p-6 lg:p-8 shadow-lg text-center">
                <h3 className="text-xl lg:text-2xl font-bold text-white mb-4">Je hebt je aangemeld als Intro Ouder</h3>
                <p className="text-theme-text-muted dark:text-theme-text-muted">
                    Bedankt! Je inschrijving is ontvangen. Als je iets wilt aanpassen, neem contact op met de intro commissie.
                </p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="bg-[var(--bg-card)] dark:border dark:border-white/10 rounded-2xl lg:rounded-3xl p-6 lg:p-8 shadow-lg space-y-4" autoComplete="off">
            <div className="flex items-center gap-2 mb-4">
                <Heart className="w-5 h-5 lg:w-6 lg:h-6 text-theme-purple" />
                <h3 className="text-xl lg:text-2xl font-bold text-theme-purple">Word Intro Ouder!</h3>
            </div>

            <div className="bg-white/10 rounded-lg p-3 lg:p-4 mb-4">
                <p className="text-white text-xs lg:text-sm">
                    <strong>Naam:</strong> {userName}
                    <br />
                    <strong>E-mailadres:</strong> {userEmail}
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
                    autoComplete="off"
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
    );
};
