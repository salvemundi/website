'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import PageHeader from '@/widgets/page-header/ui/PageHeader';
import { getImageUrl, tripSignupsApi } from '@/shared/lib/api/salvemundi';
import { useSalvemundiTrips, useSalvemundiSiteSettings, useSalvemundiTripSignups } from '@/shared/lib/hooks/useSalvemundiApi';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { CheckCircle2, Plane, Users, Calendar } from 'lucide-react';

export default function ReisPage() {
    const [form, setForm] = useState({
        first_name: '',
        middle_name: '',
        last_name: '',
        email: '',
        phone_number: '',
        terms_accepted: false,
    });
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { data: trips, isLoading: tripsLoading } = useSalvemundiTrips();
    const { data: siteSettings, isLoading: isSettingsLoading } = useSalvemundiSiteSettings('reis');

    const isReisEnabled = siteSettings?.show ?? true;
    const reisDisabledMessage = siteSettings?.disabled_message || 'De inschrijvingen voor de reis zijn momenteel gesloten.';

    // Get the next upcoming trip
    const nextTrip = useMemo(() => {
        if (!trips || trips.length === 0) return null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const validTrips = trips.filter((trip) => {
            if (!trip.event_date) return false;
            const parsed = new Date(trip.event_date);
            if (isNaN(parsed.getTime())) return false;

            const normalized = new Date(parsed);
            normalized.setHours(0, 0, 0, 0);
            return normalized.getTime() >= today.getTime();
        });

        if (validTrips.length === 0) return null;

        validTrips.sort((a, b) => {
            const dateA = new Date(a.event_date!);
            const dateB = new Date(b.event_date!);
            return dateA.getTime() - dateB.getTime();
        });

        return validTrips[0];
    }, [trips]);

    const { data: signups } = useSalvemundiTripSignups(nextTrip?.id);

    const nextTripDate = nextTrip?.event_date ? new Date(nextTrip.event_date) : null;
    const formattedNextTripDate =
        nextTripDate && !isNaN(nextTripDate.getTime())
            ? format(nextTripDate, 'd MMMM yyyy', { locale: nl })
            : null;

    const canSignUp = Boolean(nextTrip && nextTrip.registration_open);
    const headerBackgroundImage = nextTrip?.image
        ? getImageUrl(nextTrip.image)
        : '/img/placeholder.svg';

    // Calculate participants stats
    const participantsCount = signups?.filter(s => s.status === 'confirmed' || s.status === 'registered').length || 0;
    const waitlistCount = signups?.filter(s => s.status === 'waitlist').length || 0;
    const spotsLeft = nextTrip ? Math.max(0, nextTrip.max_participants - participantsCount) : 0;

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

        if (!form.first_name || !form.last_name || !form.email || !form.phone_number) {
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
            // Determine if user should be on waitlist
            const shouldBeWaitlisted = participantsCount >= nextTrip.max_participants;

            const signupData = {
                trip_id: nextTrip.id,
                first_name: form.first_name,
                middle_name: form.middle_name || undefined,
                last_name: form.last_name,
                email: form.email,
                phone_number: form.phone_number,
                terms_accepted: form.terms_accepted,
                status: shouldBeWaitlisted ? 'waitlist' as const : 'registered' as const,
                role: 'participant' as const,
                deposit_paid: false,
                full_payment_paid: false,
            };

            await tripSignupsApi.create(signupData);

            // TODO: Send confirmation email

            setSubmitted(true);
            setForm({
                first_name: '',
                middle_name: '',
                last_name: '',
                email: '',
                phone_number: '',
                terms_accepted: false,
            });
        } catch (err: any) {
            console.error('Error submitting signup:', err);
            setError(err?.message || 'Er is een fout opgetreden bij het verzenden van je aanmelding. Probeer het opnieuw.');
        } finally {
            setLoading(false);
        }
    };

    if (tripsLoading || isSettingsLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-50 to-white">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-purple-600"></div>
            </div>
        );
    }

    return (
        <>
            <PageHeader
                title={nextTrip?.name || "Salve Mundi Reis"}
                backgroundImage={headerBackgroundImage}
            />

            <div className="container mx-auto px-4 py-12 max-w-6xl">
                {/* Disabled message */}
                {!isReisEnabled && (
                    <div className="mb-8 bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-lg">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <svg className="h-6 w-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-yellow-800 font-medium">{reisDisabledMessage}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Trip Info */}
                {nextTrip && (
                    <div className="mb-12">
                        {/* Stats cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-600">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-500 text-sm font-medium">Datum</p>
                                        <p className="text-2xl font-bold text-gray-900 mt-1">{formattedNextTripDate}</p>
                                    </div>
                                    <Calendar className="h-12 w-12 text-purple-600 opacity-80" />
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-600">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-500 text-sm font-medium">Deelnemers</p>
                                        <p className="text-2xl font-bold text-gray-900 mt-1">{participantsCount} / {nextTrip.max_participants}</p>
                                    </div>
                                    <Users className="h-12 w-12 text-blue-600 opacity-80" />
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-600">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-500 text-sm font-medium">Plekken over</p>
                                        <p className="text-2xl font-bold text-gray-900 mt-1">{spotsLeft > 0 ? spotsLeft : 'Vol'}</p>
                                        {waitlistCount > 0 && (
                                            <p className="text-sm text-gray-600 mt-1">({waitlistCount} op wachtlijst)</p>
                                        )}
                                    </div>
                                    <Plane className="h-12 w-12 text-green-600 opacity-80" />
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        {nextTrip.description && (
                            <div className="bg-white rounded-xl shadow-md p-8 mb-8">
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">Over de reis</h2>
                                <div 
                                    className="prose prose-lg max-w-none text-gray-700"
                                    dangerouslySetInnerHTML={{ __html: nextTrip.description }}
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* Success message */}
                {submitted && (
                    <div className="mb-8 bg-green-50 border-l-4 border-green-400 p-6 rounded-lg">
                        <div className="flex items-start">
                            <CheckCircle2 className="h-6 w-6 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                            <div>
                                <h3 className="text-green-800 font-bold text-lg mb-2">Aanmelding succesvol!</h3>
                                <p className="text-green-700">
                                    {spotsLeft > 1 
                                        ? 'Je bent succesvol ingeschreven voor de reis. Je ontvangt binnenkort een bevestigingsmail met meer informatie.'
                                        : 'Je bent succesvol ingeschreven en op de wachtlijst geplaatst. Je ontvangt een mail zodra er een plek vrijkomt.'}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Registration form */}
                {nextTrip && isReisEnabled && canSignUp && !submitted && (
                    <div className="bg-white rounded-xl shadow-lg p-8 border-t-4 border-purple-600">
                        <h2 className="text-3xl font-bold text-gray-900 mb-6">Inschrijven</h2>
                        <p className="text-gray-600 mb-8">
                            Vul het formulier in om je aan te melden voor de reis. Let op: dit is een vrijblijvende aanmelding. 
                            De daadwerkelijke betaling volgt later.
                        </p>

                        {error && (
                            <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded">
                                <p className="text-red-700">{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Voornaam <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="first_name"
                                        value={form.first_name}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent transition"
                                        placeholder="Volledige voornaam (incl. doopnamen)"
                                        required
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Let op: gebruik je volledige naam zoals op je paspoort/ID
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Tussenvoegsel
                                    </label>
                                    <input
                                        type="text"
                                        name="middle_name"
                                        value={form.middle_name}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent transition"
                                        placeholder="bijv. van, de"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Achternaam <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="last_name"
                                        value={form.last_name}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent transition"
                                        placeholder="Achternaam"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        E-mailadres <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={form.email}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent transition"
                                        placeholder="jouw@email.nl"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Telefoonnummer <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="tel"
                                        name="phone_number"
                                        value={form.phone_number}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent transition"
                                        placeholder="+31 6 12345678"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="flex items-start pt-4">
                                <input
                                    type="checkbox"
                                    name="terms_accepted"
                                    checked={form.terms_accepted}
                                    onChange={handleChange}
                                    className="mt-1 h-5 w-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                                    required
                                />
                                <label className="ml-3 text-sm text-gray-700">
                                    Ik accepteer de{' '}
                                    <Link href="/algemene-voorwaarden" className="text-purple-600 hover:text-purple-700 font-semibold underline">
                                        algemene voorwaarden
                                    </Link>
                                    <span className="text-red-500"> *</span>
                                </label>
                            </div>

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white font-bold py-4 px-8 rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                >
                                    {loading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white mr-3"></div>
                                            Bezig met aanmelden...
                                        </>
                                    ) : (
                                        <>
                                            <Plane className="mr-2 h-5 w-5" />
                                            Aanmelden voor de reis
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* No trip available */}
                {!nextTrip && !tripsLoading && (
                    <div className="bg-white rounded-xl shadow-md p-12 text-center">
                        <Plane className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Geen aankomende reis</h2>
                        <p className="text-gray-600">
                            Er is momenteel geen reis gepland. Houd deze pagina in de gaten voor updates!
                        </p>
                    </div>
                )}

                {/* Not open for registration */}
                {nextTrip && !canSignUp && !submitted && (
                    <div className="bg-white rounded-xl shadow-md p-12 text-center">
                        <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Inschrijvingen gesloten</h2>
                        <p className="text-gray-600">
                            De inschrijvingen voor deze reis zijn momenteel gesloten.
                        </p>
                    </div>
                )}
            </div>
        </>
    );
}
