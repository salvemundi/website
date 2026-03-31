'use client';

import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { createTripSignup, getCurrentUserProfileAction } from '@/server/actions/reis.actions';
import type { ReisTrip } from '@salvemundi/validations';
import { FormField } from '@/shared/ui/FormField';
import { Input } from '@/shared/ui/Input';
import { PhoneInput } from '@/shared/ui/PhoneInput';

interface ReisRegistrationFormProps {
    nextTrip: ReisTrip | null;
    canSignUp: boolean;
    registrationStartText: string;
    currentUser: any;
}

export function ReisRegistrationForm({
    nextTrip,
    canSignUp,
    registrationStartText,
    currentUser
}: ReisRegistrationFormProps) {
    const [form, setForm] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone_number: '',
        date_of_birth: '' as string,
        terms_accepted: false,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Prefill form when Better Auth session is present
    useEffect(() => {
        if (!currentUser) return;

        async function prefill() {
            const profile = await getCurrentUserProfileAction();
            if (profile.success && profile.data) {
                setForm(prev => ({
                    ...prev,
                    last_name: prev.last_name || profile.data.last_name || '',
                    email: prev.email || profile.data.email || '',
                    phone_number: prev.phone_number || profile.data.phone_number || '',
                    date_of_birth: prev.date_of_birth || profile.data.date_of_birth || '',
                }));
            } else {
                // Fallback to basic session data if directus fetch fails
                setForm(prev => ({
                    ...prev,
                    email: prev.email || currentUser?.email || '',
                }));
            }
        }
        
        prefill();
    }, [currentUser]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target as HTMLInputElement;
        if (type === 'checkbox') {
            setForm({ ...form, [name]: (e.target as HTMLInputElement).checked });
        } else {
            setForm({ ...form, [name]: value });
        }
        if (error) setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!form.first_name || !form.last_name || !form.email || !form.phone_number || !form.date_of_birth) {
            setError('Vul alle verplichte velden in.');
            return;
        }

        if (!form.terms_accepted) {
            setError('Je moet de algemene voorwaarden accepteren om door te gaan.');
            return;
        }

        if (!nextTrip) {
            setError('Er is momenteel geen reis beschikbaar.');
            return;
        }

        setLoading(true);
        try {
            const result = await createTripSignup(form as any, nextTrip.id);
            if (!result.success) {
                setError(result.message || 'Fout bij inschrijven.');
            } else {
                window.scrollTo(0, 0);
                window.location.reload();
            }
        } catch {
            setError('Er is een onverwachte fout opgetreden bij het verzenden.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            {error && (
                <div className="bg-white/20 text-white px-4 py-3 rounded">
                    {error}
                </div>
            )}

            {!canSignUp && nextTrip && (
                <div className="bg-white/20 text-white px-4 py-3 rounded">
                    De inschrijvingen voor deze reis zijn momenteel gesloten. Houd deze pagina in de gaten!
                </div>
            )}

            {!nextTrip && (
                <div className="bg-white/20 text-white px-4 py-3 rounded">
                    Momenteel is er geen reis gepland. Houd deze pagina in de gaten voor nieuwe data!
                </div>
            )}

            <p className="text-theme-text dark:text-white/90 text-sm mb-2">
                Let op: dit is een vrijblijvende aanmelding. De daadwerkelijke betaling volgt later.
            </p>

            <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 gap-4">
                    <FormField label="Voornaam" required error={error && !form.first_name ? 'Verplicht' : undefined}>
                        <Input
                            name="first_name"
                            value={form.first_name}
                            onChange={handleChange}
                            required
                            placeholder="Voornaam"
                            autoComplete="given-name"
                        />
                        <span className="text-xs text-theme-text-muted/80 mt-1 block font-normal">
                            Gebruik je volledige naam zoals op je paspoort/ID
                        </span>
                    </FormField>
                </div>

                <FormField label="Tussenvoegsel & Achternaam" required error={error && !form.last_name ? 'Verplicht' : undefined}>
                    <Input
                        name="last_name"
                        value={form.last_name}
                        onChange={handleChange}
                        required
                        placeholder="Achternaam (incl. tussenvoegsel)"
                        autoComplete="family-name"
                    />
                </FormField>

                <FormField label="E-mailadres" required error={error && !form.email ? 'Verplicht' : undefined}>
                    <Input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        required
                        placeholder="jouw@email.nl"
                        autoComplete="email"
                    />
                </FormField>

                <FormField label="Geboortedatum" required error={error && !form.date_of_birth ? 'Verplicht' : undefined}>
                    <Input
                        type="date"
                        name="date_of_birth"
                        value={form.date_of_birth}
                        onChange={handleChange}
                        required
                        autoComplete="bday"
                    />
                </FormField>

                <FormField label="Telefoonnummer" required error={error && !form.phone_number ? 'Verplicht' : undefined}>
                    <PhoneInput
                        name="phone_number"
                        value={form.phone_number}
                        onChange={handleChange}
                        required
                        autoComplete="tel"
                    />
                </FormField>
            </div>

            <label className="flex items-start gap-2 text-theme-text dark:text-white mt-2">
                <input
                    type="checkbox"
                    name="terms_accepted"
                    checked={form.terms_accepted}
                    onChange={handleChange}
                    required
                    className="mt-1 h-5 w-5 rounded accent-theme-purple"
                />
                <span className="text-sm">
                    Ik accepteer de{' '}
                    <a href="/reisvoorwaarden.pdf" download className="underline font-semibold text-theme-purple" target="_blank" rel="noopener noreferrer">
                        algemene voorwaarden
                    </a>
                </span>
            </label>

            <button
                type="submit"
                disabled={loading || !canSignUp || !nextTrip}
                className="form-button mt-4 group"
            >
                <span>
                    {loading
                        ? 'Bezig met aanmelden...'
                        : (canSignUp && nextTrip)
                            ? 'Aanmelden voor de reis'
                            : registrationStartText}
                </span>
                {!loading && (canSignUp && nextTrip) && <span className="group-hover:translate-x-1 transition-transform inline-block ml-2">→</span>}
            </button>
        </form>
    );
}
