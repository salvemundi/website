'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { registerForTrip } from '@/app/reis/actions';
import { Trip } from '@/shared/lib/api/types';
import { PhoneInput } from '@/shared/ui/PhoneInput';
import { formatDateToLocalISO } from '@/shared/lib/utils/date';
import { splitDutchLastName } from '@/shared/lib/utils/dutch-name';
import { Loader2 } from 'lucide-react';

interface ReisRegistrationFormProps {
    trip: Trip;
    currentUser?: any;
}

export default function ReisRegistrationForm({ trip, currentUser }: ReisRegistrationFormProps) {
    const router = useRouter();
    const [form, setForm] = useState({
        first_name: '',
        middle_name: '',
        last_name: '',
        email: '',
        phone_number: '',
        date_of_birth: '',
        terms_accepted: false,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Prefill form
    useEffect(() => {
        if (!currentUser) return;

        let middleName = currentUser.middle_name || '';
        let lastName = currentUser.last_name || '';

        if (!middleName && lastName) {
            const split = splitDutchLastName(lastName);
            if (split.prefix) {
                middleName = split.prefix;
                lastName = split.lastName;
            }
        }

        setForm(prev => ({
            ...prev,
            // first_name: currentUser.first_name || '', // Removed per user request
            middle_name: middleName,
            last_name: lastName,
            email: currentUser.email || '',
            phone_number: currentUser.phone_number || '',
            date_of_birth: currentUser.date_of_birth ? formatDateToLocalISO(currentUser.date_of_birth) : '',
        }));
    }, [currentUser]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        if (error) setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!form.terms_accepted) {
            setError('Je moet de algemene voorwaarden accepteren.');
            return;
        }

        setLoading(true);
        try {
            const result = await registerForTrip({
                trip_id: trip.id,
                ...form
            });

            if (!result.success) {
                setError(result.error || 'Er is iets misgegaan.');
                setLoading(false);
                return;
            }

            // Refresh to show status
            router.refresh();
        } catch (err: any) {
            console.error('Registration error:', err);
            setError('Er is een fout opgetreden.');
            setLoading(false);
        }
    };

    return (
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded">
                    {error}
                </div>
            )}

            <p className="text-theme-text dark:text-white/90 text-sm mb-2">
                Let op: dit is een vrijblijvende aanmelding. De daadwerkelijke betaling volgt later.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="form-label">
                    Voornaam
                    <input
                        type="text"
                        name="first_name"
                        value={form.first_name}
                        onChange={handleChange}
                        required
                        className="form-input mt-1"
                        placeholder="Voornaam"
                        autoComplete="off"
                        suppressHydrationWarning
                    />
                </label>
                <label className="form-label">
                    Tussenvoegsel
                    <input
                        type="text"
                        name="middle_name"
                        value={form.middle_name}
                        onChange={handleChange}
                        className="form-input mt-1"
                        placeholder="bijv. van, de"
                        autoComplete="off"
                        suppressHydrationWarning
                    />
                </label>
            </div>

            <label className="form-label">
                Achternaam
                <input
                    type="text"
                    name="last_name"
                    value={form.last_name}
                    onChange={handleChange}
                    required
                    className="form-input mt-1"
                    placeholder="Achternaam"
                    autoComplete="off"
                    suppressHydrationWarning
                />
            </label>

            <label className="form-label">
                E-mailadres
                <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    className="form-input mt-1"
                    placeholder="jouw@email.nl"
                    autoComplete="off"
                    suppressHydrationWarning
                />
            </label>

            <label className="form-label">
                Geboortedatum
                <input
                    type="date"
                    name="date_of_birth"
                    value={form.date_of_birth}
                    onChange={handleChange}
                    required
                    className="form-input mt-1 w-full"
                    autoComplete="off"
                    suppressHydrationWarning
                />
            </label>

            <label className="form-label">
                Telefoonnummer
                <PhoneInput
                    id="phone_number"
                    name="phone_number"
                    value={form.phone_number}
                    onChange={handleChange}
                    required
                    className="form-input mt-1"
                />
            </label>

            <label className="flex items-start gap-2 text-theme-text dark:text-white mt-2 cursor-pointer">
                <input
                    type="checkbox"
                    name="terms_accepted"
                    checked={form.terms_accepted}
                    onChange={handleChange}
                    className="mt-1 h-5 w-5 rounded accent-theme-purple"
                />
                <span className="text-sm">
                    Ik accepteer de{' '}
                    <a href="/reisvoorwaarden.pdf" download className="underline font-semibold hover:text-theme-purple" target="_blank" rel="noopener noreferrer">
                        algemene voorwaarden
                    </a>
                </span>
            </label>

            <button
                type="submit"
                disabled={loading}
                className="form-button mt-4 group flex items-center justify-center gap-2"
            >
                {loading && <Loader2 className="animate-spin h-5 w-5" />}
                <span>{loading ? 'Bezig met aanmelden...' : 'Aanmelden voor de reis'}</span>
                {!loading && <span className="group-hover:translate-x-1 transition-transform">→</span>}
            </button>
        </form>
    );
}
