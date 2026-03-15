'use client';

import React, { useState } from 'react';
import { submitIntroParentSignup } from '@/server/actions/intro.actions';
import { FormField } from '@/shared/ui/FormField';
import { PhoneInput } from '@/shared/ui/PhoneInput';
import { Heart } from 'lucide-react';

interface IntroParentIslandProps {
    userName: string;
    userEmail: string;
    initialPhone: string;
}

export const IntroParentIsland = ({ userName, userEmail, initialPhone }: IntroParentIslandProps) => {
    const [phone, setPhone] = useState(initialPhone);
    const [motivation, setMotivation] = useState('');

    const [submitted, setSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [phoneError, setPhoneError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setPhoneError(null);

        if (!phone || phone.length < 10) {
            setPhoneError('Ongeldig telefoonnummer');
            return;
        }

        if (!motivation) {
            setError('Motivatie is verplicht');
            return;
        }

        setIsSubmitting(true);

        try {
            const result = await submitIntroParentSignup({
                telefoonnummer: phone,
                motivation: motivation,
            });

            if (result.success) {
                setSubmitted(true);
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
        <form onSubmit={handleSubmit} className="bg-[var(--bg-card)] dark:border dark:border-white/10 rounded-2xl lg:rounded-3xl p-6 lg:p-8 shadow-lg space-y-4">
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

            <FormField label="Telefoonnummer" required error={phoneError ?? undefined}>
                <PhoneInput
                    name="telefoonnummer"
                    value={phone}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setPhone(e.target.value); setPhoneError(null); }}
                    required
                    autoComplete="tel"
                    error={!!phoneError}
                />
            </FormField>

            <FormField label="Motivatie" required error={error ?? undefined}>
                <textarea
                    name="motivation"
                    value={motivation}
                    onChange={(e) => { setMotivation(e.target.value); setError(null); }}
                    required
                    rows={4}
                    className="form-input w-full"
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
