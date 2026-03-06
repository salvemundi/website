'use client';

import React, { useState } from 'react';
import { submitIntroSignup } from '@/server/actions/intro.actions';
import { FormField } from '@/shared/ui/FormField';
import { Input } from '@/shared/ui/Input';
import { PhoneInput } from '@/shared/ui/PhoneInput';
import { isValidPhoneNumber } from '@/shared/lib/phone-validation';
import { Users, CheckCircle2 } from 'lucide-react';

export const IntroStudentIsland = () => {
    const [form, setForm] = useState({
        voornaam: '',
        tussenvoegsel: '',
        achternaam: '',
        geboortedatum: '',
        email: '',
        telefoonnummer: '',
        favorieteGif: '',
        website: '', // Honeypot
    });

    const [submitted, setSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [phoneError, setPhoneError] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        if (error) setError(null);
        if (e.target.name === 'telefoonnummer' && phoneError) setPhoneError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setPhoneError(null);

        // Filter bots
        if (form.website) {
            console.log('Bot detected (intro honeypot)');
            setSubmitted(true);
            return;
        }

        if ((form.voornaam + form.achternaam).match(/https?:\/\//)) {
            setError('Ongeldige invoer.');
            return;
        }

        if (!isValidPhoneNumber(form.telefoonnummer)) {
            setPhoneError('Ongeldig telefoonnummer');
            return;
        }

        setIsSubmitting(true);

        try {
            const result = await submitIntroSignup(form);
            if (result.success) {
                setSubmitted(true);
            }
        } catch (err: any) {
            setError(err?.message || 'Er is een fout opgetreden bij het versturen van je inschrijving.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <div className="bg-gradient-theme rounded-2xl lg:rounded-3xl p-6 lg:p-8 text-center shadow-lg">
                <CheckCircle2 className="w-12 h-12 lg:w-16 lg:h-16 text-white mx-auto mb-4" />
                <h2 className="text-2xl lg:text-3xl font-bold text-theme-purple-lighter mb-4">Bedankt!</h2>
                <p className="text-theme-white text-base lg:text-lg">We hebben je inschrijving ontvangen.</p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="bg-[var(--bg-card)] dark:border dark:border-white/10 rounded-2xl lg:rounded-3xl p-6 lg:p-8 shadow-lg space-y-4">
            {/* Honeypot */}
            <div className="opacity-0 absolute top-0 left-0 h-0 w-0 -z-10 pointer-events-none overflow-hidden" aria-hidden="true">
                <label htmlFor="website">Website</label>
                <input
                    type="text"
                    id="website"
                    name="website"
                    value={form.website}
                    onChange={handleChange}
                    tabIndex={-1}
                    autoComplete="off"
                />
            </div>

            <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 lg:w-6 lg:h-6 text-theme-purple" />
                <h3 className="text-xl lg:text-2xl font-bold text-theme-purple">Meld je aan!</h3>
            </div>

            <FormField label="Voornaam" required>
                <Input
                    name="voornaam"
                    value={form.voornaam}
                    onChange={handleChange}
                    required
                    autoComplete="given-name"
                />
            </FormField>

            <FormField label="Tussenvoegsel">
                <Input
                    name="tussenvoegsel"
                    value={form.tussenvoegsel}
                    onChange={handleChange}
                    autoComplete="additional-name"
                />
            </FormField>

            <FormField label="Achternaam" required>
                <Input
                    name="achternaam"
                    value={form.achternaam}
                    onChange={handleChange}
                    required
                    autoComplete="family-name"
                />
            </FormField>

            <FormField label="Geboortedatum" required>
                <Input
                    type="date"
                    name="geboortedatum"
                    value={form.geboortedatum}
                    onChange={handleChange}
                    required
                    autoComplete="bday"
                />
            </FormField>

            <FormField label="E-mailadres" required>
                <Input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    autoComplete="email"
                />
            </FormField>

            <FormField label="Telefoonnummer" required error={phoneError ?? undefined}>
                <PhoneInput
                    name="telefoonnummer"
                    value={form.telefoonnummer}
                    onChange={handleChange}
                    required
                    autoComplete="tel"
                    error={!!phoneError}
                />
            </FormField>

            <FormField label="Favoriete GIF URL (optioneel)">
                <Input
                    type="url"
                    name="favorieteGif"
                    value={form.favorieteGif}
                    onChange={handleChange}
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
    );
};
