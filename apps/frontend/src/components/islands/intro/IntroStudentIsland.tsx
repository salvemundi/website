'use client';

import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { submitIntroSignup } from '@/server/actions/public/intro.actions';
import { FormField } from '@/shared/ui/FormField';
import { Input } from '@/shared/ui/Input';
import { DateInput } from '@/shared/ui/DateInput';
import { PhoneInput } from '@/shared/ui/PhoneInput';
import { CheckCircle2, Send } from 'lucide-react';
import { introSignupFormSchema, type IntroSignupForm } from '@salvemundi/validations/schema/intro.zod';
import { StandardFormCard } from '@/components/ui/forms/StandardFormCard';

interface IntroStudentIslandProps {
    className?: string;
}

export const IntroStudentIsland = ({ className = '' }: IntroStudentIslandProps) => {
    const [submitted, setSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const {
        register,
        control,
        handleSubmit,
        formState: { errors }
    } = useForm<IntroSignupForm>({
        resolver: zodResolver(introSignupFormSchema),
        defaultValues: {
            voornaam: '',
            tussenvoegsel: '',
            achternaam: '',
            geboortedatum: '',
            email: '',
            telefoonnummer: '',
            favorieteGif: '',
            website: ''
        }
    });

    const onSubmit = async (data: IntroSignupForm) => {
        // Filter bots
        if (data.website) {
            setSubmitted(true);
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const result = await submitIntroSignup(data);
            if (result.success) {
                setSubmitted(true);
            } else {
                setError(result.error || 'Er is een fout opgetreden.');
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Er is een fout opgetreden bij het versturen van je inschrijving.';
            setError(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <div className="bg-gradient-theme squircle-lg p-6 lg:p-8 text-center shadow-lg">
                <CheckCircle2 className="w-12 h-12 lg:w-16 lg:h-16 text-white mx-auto mb-4" />
                <h2 className="text-2xl lg:text-3xl font-bold text-purple-100 mb-4">Bedankt!</h2>
                <p className="text-white text-base lg:text-lg">We hebben je inschrijving ontvangen.</p>
            </div>
        );
    }

    return (
        <StandardFormCard
            title="Schrijf je nu in!"
            icon={<Send className="w-8 h-8" />}
            description="Meld je aan voor de gezelligste week van het jaar!"
            className={className}
        >
            <form onSubmit={(e) => { void handleSubmit(onSubmit)(e); }} className="space-y-4 lg:space-y-6" autoComplete="off">
                <input {...register('website')} type="text" className="hidden" tabIndex={-1} autoComplete="off" />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField id="field-voornaam" label="Voornaam" required error={errors.voornaam?.message}>
                        <Input
                            {...register('voornaam')}
                            id="field-voornaam"
                            required
                            autoComplete="off"
                        />
                    </FormField>

                    <FormField id="field-tussenvoegsel" label="Tussenvoegsel" error={errors.tussenvoegsel?.message}>
                        <Input
                            {...register('tussenvoegsel')}
                            id="field-tussenvoegsel"
                            autoComplete="off"
                        />
                    </FormField>
                </div>

                <FormField id="field-achternaam" label="Achternaam" required error={errors.achternaam?.message}>
                    <Input
                        {...register('achternaam')}
                        id="field-achternaam"
                        required
                        autoComplete="off"
                    />
                </FormField>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField id="field-geboortedatum" label="Geboortedatum" required error={errors.geboortedatum?.message}>
                        <Controller
                            name="geboortedatum"
                            control={control}
                            render={({ field }) => (
                                <DateInput
                                    {...field}
                                    id="field-geboortedatum"
                                    required
                                    autoComplete="off"
                                />
                            )}
                        />
                    </FormField>

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
                </div>

                <FormField id="field-email" label="E-mailadres" required error={errors.email?.message}>
                    <Input
                        type="email"
                        {...register('email')}
                        id="field-email"
                        required
                        autoComplete="one-time-code"
                    />
                </FormField>

                <FormField id="field-favorieteGif" label="Favoriete GIF URL (optioneel)" error={errors.favorieteGif?.message}>
                    <Input
                        type="url"
                        {...register('favorieteGif')}
                        id="field-favorieteGif"
                        placeholder="https://..."
                    />
                </FormField>

                {error && <p className="text-red-500 dark:text-red-400 text-xs lg:text-sm">{error}</p>}
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="form-button w-full mt-4"
                >
                    {isSubmitting ? 'Bezig...' : 'Verstuur'}
                </button>
            </form>
        </StandardFormCard>
    );
};
