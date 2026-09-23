'use client';

import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { submitIntroSignup } from '@/server/actions/public/intro.actions';
import { FormField } from '@/shared/ui/FormField';
import { Input } from '@/shared/ui/Input';
import { DateInput } from '@/shared/ui/DateInput';
import { PhoneInput } from '@/shared/ui/PhoneInput';
import { CheckCircle2, Send, Lock } from 'lucide-react';
import { introSignupFormSchema, type IntroSignupForm } from '@salvemundi/validations/schema/intro.zod';
import { StandardFormCard } from '@/components/ui/forms/StandardFormCard';

interface IntroStudentIslandProps {
    className?: string;
    isOpen?: boolean;
}

export const IntroStudentIsland = ({ className = '', isOpen = true }: IntroStudentIslandProps) => {

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

    if (!isOpen) {
        return (
            <div className={`dark:bg-gradient-theme squircle-xl flex min-h-75 flex-col items-center justify-center border border-border-color bg-bg-card p-10 text-center shadow-xl ${className}`}>
                <div className="mb-6 flex size-20 items-center justify-center rounded-full bg-purple-100 dark:bg-white/20">

                    <Lock className="size-10 text-brand-primary dark:text-white" />
                </div>
                <h3 className="mb-4 text-3xl font-black tracking-tight text-text-main dark:text-white">Inschrijvingen Gesloten</h3>
                <p className="max-w-sm font-medium text-text-muted dark:text-white/80">
                    De inschrijvingen voor de introductie zijn momenteel gesloten.
                </p>
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="dark:bg-gradient-theme squircle-lg border border-border-color bg-bg-card p-6 text-center shadow-lg lg:p-8">
                <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-purple-100 lg:size-20 dark:bg-white/20">
                    <CheckCircle2 className="size-8 text-brand-primary lg:size-10 dark:text-white" />
                </div>
                <h2 className="mb-4 text-2xl font-bold text-text-main lg:text-3xl dark:text-white">Bedankt!</h2>
                <p className="text-base text-text-muted lg:text-lg dark:text-white/80">We hebben je inschrijving ontvangen.</p>
            </div>
        );
    }


    return (
        <StandardFormCard
            title="Schrijf je nu in!"
            icon={<Send className="size-8" />}
            description="Meld je aan voor de gezelligste week van het jaar!"
            className={className}
        >
            <form onSubmit={(e) => { void handleSubmit(onSubmit)(e); }} className="space-y-4 lg:space-y-6" autoComplete="off">
                <input {...register('website')} type="text" className="hidden" tabIndex={-1} autoComplete="off" />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

                {error && <p className="text-xs text-red-500 lg:text-sm dark:text-red-400">{error}</p>}
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="mt-4 form-button w-full"
                >
                    {isSubmitting ? 'Bezig...' : 'Verstuur'}
                </button>
            </form>
        </StandardFormCard>
    );
};
