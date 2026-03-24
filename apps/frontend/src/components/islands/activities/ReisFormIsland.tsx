'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CheckCircle2, CreditCard, Loader2, Utensils } from 'lucide-react';
import { createTripSignup, cancelTripSignup, getCurrentUserProfileAction } from '@/server/actions/reis.actions';
import type { ReisTrip, ReisTripSignup } from '@salvemundi/validations';
import { authClient } from '@/lib/auth-client';
import { FormField } from '@/shared/ui/FormField';
import { Input } from '@/shared/ui/Input';
import { PhoneInput } from '@/shared/ui/PhoneInput';

interface ReisFormIslandProps {
    nextTrip: ReisTrip | null;
    userSignup: ReisTripSignup | null;
    canSignUp: boolean;
    registrationStartText: string;
    participantsCount: number;
}

export function ReisFormIsland({ nextTrip, userSignup, canSignUp, registrationStartText }: ReisFormIslandProps) {
    const { data: session } = authClient.useSession(); // Access Better Auth session dynamically on client
    const currentUser = session?.user;

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

    const getSignupStatusDisplay = (signup: ReisTripSignup) => {
        if (signup.status === 'waitlist') return 'Wachtrij';
        if (signup.status === 'cancelled') return 'Geannuleerd';
        if (signup.status === 'registered') return 'Geregistreerd';
        if (signup.status === 'confirmed') {
            if (signup.full_payment_paid) return 'Geregistreerd (Betaald)';
            if (!signup.deposit_paid) return 'Aanbetaling verwacht';
            return 'Restbetaling verwacht';
        }
        return 'In afwachting';
    };

    const handleCancelSignup = async () => {
        if (!userSignup) return;
        if (!confirm('Weet je zeker dat je je aanmelding wilt annuleren? Dit kan niet ongedaan gemaakt worden.')) return;

        setLoading(true);
        try {
            const result = await cancelTripSignup(userSignup.id);
            if (!result.success) {
                setError(result.message || 'Fout bij annuleren.');
            } else {
                window.location.reload();
            }
        } catch {
            setError('Er is een fout opgetreden.');
        } finally {
            setLoading(false);
        }
    };

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
            const formData = {
                ...form
            };

            const result = await createTripSignup(formData as any, nextTrip.id);
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
        <section className="w-full lg:w-1/2 bg-[var(--bg-card)] dark:border dark:border-white/10 rounded-2xl sm:rounded-3xl shadow-lg p-5 sm:p-6 md:p-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-theme-purple dark:text-theme-white mb-4 sm:mb-6">
                Inschrijven voor de Reis
            </h1>

            {userSignup ? (
                <div className="bg-gradient-to-br from-theme-purple/5 to-theme-purple/10 rounded-2xl p-6 border border-theme-purple/20">
                    {error && (
                        <div className="bg-red-500/10 text-red-500 border border-red-500/20 px-4 py-3 rounded-xl mb-6 text-sm font-medium">
                            {error}
                        </div>
                    )}
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-14 h-14 rounded-full bg-theme-purple/20 flex items-center justify-center">
                            <CheckCircle2 className="h-8 w-8 text-theme-purple" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-theme-purple dark:text-theme-white">Jouw Status</h3>
                            <p className="text-theme-text-muted text-sm">Je bent al aangemeld voor deze reis</p>
                        </div>
                    </div>

                    <div className="bg-white/50 dark:bg-white/5 rounded-2xl p-6 border border-theme-purple/10 mb-6">
                        <p className="text-sm font-semibold text-theme-text-muted uppercase tracking-wider mb-2">Huidige status</p>
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <p className="text-2xl sm:text-3xl font-black text-theme-purple dark:text-theme-white break-words">
                                    {getSignupStatusDisplay(userSignup)}
                                </p>
                                {userSignup.status === 'registered' && (
                                    <p className="text-xs text-theme-text-muted mt-1 italic">
                                        Je aanmelding wordt momenteel beoordeeld door de commissie.
                                    </p>
                                )}
                            </div>
                            <div className="px-3 py-1 bg-theme-purple/10 rounded-full text-xs font-bold text-theme-purple uppercase shrink-0">
                                {userSignup.status}
                            </div>
                        </div>
                    </div>

                    {userSignup.status === 'confirmed' && !userSignup.full_payment_paid && (
                        <div className="mt-4 pt-4 border-t border-theme-purple/20">
                            {(!userSignup.deposit_paid || nextTrip?.allow_final_payments) ? (
                                <Link
                                    href={!userSignup.deposit_paid ? `/reis/aanbetaling/${userSignup.id}` : `/reis/restbetaling/${userSignup.id}`}
                                    className="inline-flex items-center gap-2 px-6 py-2 bg-theme-purple text-white rounded-lg hover:bg-theme-purple-dark transition group"
                                >
                                    <CreditCard className="h-5 w-5 group-hover:scale-110 transition-transform" />
                                    Ga naar betaling
                                </Link>
                            ) : (
                                <p className="text-sm italic text-gray-500">
                                    Restbetaling is momenteel nog niet geopend. Je ontvangt bericht zodra dit mogelijk is.
                                </p>
                            )}
                        </div>
                    )}

                    {userSignup.status === 'confirmed' && userSignup.deposit_paid && !userSignup.full_payment_paid && (
                        <div className="mt-4 pt-4 border-t border-theme-purple/20">
                            <Link
                                href={`/reis/activiteiten/${userSignup.id}`}
                                className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition group"
                            >
                                <Utensils className="h-5 w-5 group-hover:scale-110 transition-transform" />
                                Activiteiten aanpassen
                            </Link>
                            <p className="text-xs text-theme-text-muted mt-2 italic">
                                Je kunt je activiteiten aanpassen tot je de restbetaling hebt voldaan.
                            </p>
                        </div>
                    )}

                    <div className="mt-8 flex flex-col gap-3">
                        <button
                            onClick={handleCancelSignup}
                            disabled={loading}
                            className="w-full py-3 border border-red-500/30 text-red-500 rounded-xl font-semibold hover:bg-red-500/5 transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                            <span>Aanmelding annuleren</span>
                        </button>
                    </div>

                </div>
            ) : (
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
            )}
        </section>
    );
}
