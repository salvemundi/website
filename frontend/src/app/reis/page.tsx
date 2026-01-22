'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import PageHeader from '@/widgets/page-header/ui/PageHeader';
import { getImageUrl, tripSignupsApi } from '@/shared/lib/api/salvemundi';
import { useSalvemundiTrips, useSalvemundiSiteSettings, useSalvemundiTripSignups } from '@/shared/lib/hooks/useSalvemundiApi';
import { fetchUserDetails } from '@/shared/lib/auth';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { CheckCircle2, Calendar } from 'lucide-react';

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
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

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

    // Support trips with a start and end date when available. Fall back to `event_date`.
    const nextTripStartDate = nextTrip?.start_date
        ? new Date(nextTrip.start_date)
        : nextTrip?.event_date
            ? new Date(nextTrip.event_date)
            : null;

    const nextTripEndDate = nextTrip?.end_date
        ? new Date(nextTrip.end_date)
        : nextTrip?.event_date
            ? new Date(nextTrip.event_date)
            : null;

    const formattedFromDate =
        nextTripStartDate && !isNaN(nextTripStartDate.getTime())
            ? format(nextTripStartDate, 'd MMMM yyyy', { locale: nl })
            : null;

    const formattedUntilDate =
        nextTripEndDate && !isNaN(nextTripEndDate.getTime())
            ? format(nextTripEndDate, 'd MMMM yyyy', { locale: nl })
            : null;

    const canSignUp = Boolean(nextTrip && nextTrip.registration_open);
    const headerBackgroundImage = nextTrip?.image
        ? getImageUrl(nextTrip.image)
        : '/img/placeholder.svg';

    const openLightbox = (src: string) => {
        setLightboxSrc(src);
        setLightboxOpen(true);
    };

    const closeLightbox = () => {
        setLightboxOpen(false);
        setLightboxSrc(null);
    };

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') closeLightbox();
        };
        if (lightboxOpen) window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [lightboxOpen]);

    // Calculate participants stats
    const participantsCount = signups?.filter(s => s.status === 'confirmed' || s.status === 'registered').length || 0;
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

    // Prefill form when user is logged in (session token in localStorage)
    useEffect(() => {
        try {
            if (typeof window === 'undefined') return;
            const token = localStorage.getItem('auth_token');
            if (!token) return;

            // fetchUserDetails will throw or return null if token invalid
            fetchUserDetails(token)
                .then((user) => {
                    if (!user) return;
                    setForm((prev) => ({
                        ...prev,
                        first_name: prev.first_name || user.first_name || '',
                        middle_name: prev.middle_name || '',
                        last_name: prev.last_name || user.last_name || '',
                        email: prev.email || user.email || '',
                        phone_number: prev.phone_number || user.phone_number || '',
                    }));
                })
                .catch(() => {
                    // ignore failures - user may not be logged in
                    // console.debug('No logged-in user to prefill signup form', e);
                });
        } catch (e) {
            // ignore
        }
    }, []);

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
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-50 to-white dark:from-[var(--bg-soft-dark)] dark:to-[var(--bg-main-dark)]">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-purple-600"></div>
            </div>
        );
    }

    return (
        <>
            <div className="flex flex-col w-full">
                <PageHeader
                    title={nextTrip?.name || "SALVE MUNDI REIS"}
                    backgroundImage={headerBackgroundImage}
                />
            </div>

            <main className="relative overflow-hidden bg-white dark:bg-gray-900">
                {!isReisEnabled ? (
                    <section className="px-4 sm:px-6 lg:px-10 py-12 lg:py-16">
                        <div className="max-w-4xl mx-auto bg-[var(--bg-card)] dark:border dark:border-white/10 rounded-2xl lg:rounded-3xl p-6 lg:p-8 text-center shadow-2xl">
                            <h2 className="text-2xl lg:text-3xl font-bold text-gradient mb-4">Reis momenteel niet beschikbaar</h2>
                            <p className="text-base lg:text-lg text-theme-muted mb-6">{reisDisabledMessage}</p>
                            {isSettingsLoading && <p className="text-sm text-theme-muted mb-6">Bezig met controleren van status...</p>}
                            <Link href="/" className="inline-flex items-center justify-center px-6 py-3 bg-gradient-theme text-theme-white font-semibold rounded-full">
                                Terug naar Home
                            </Link>
                        </div>
                    </section>
                ) : (
                    <div className="flex flex-col lg:flex-row gap-6 p-6 sm:p-10 items-start">
                        {/* Form Section */}
                        <section className="w-full lg:w-1/2 bg-gradient-theme rounded-3xl shadow-lg p-6 sm:p-8">
                            <h1 className="text-3xl font-bold text-white mb-6">
                                Inschrijven voor de Reis
                            </h1>

                            {submitted ? (
                                <div className="text-white">
                                    <div className="flex items-center justify-center mb-4">
                                        <CheckCircle2 className="w-12 h-12 lg:w-16 lg:h-16 text-white" />
                                    </div>
                                    <h2 className="text-2xl font-semibold mb-4 text-center">Aanmelding Voltooid!</h2>
                                    <p className="text-lg mb-4">
                                        {spotsLeft > 1 
                                            ? 'Je bent succesvol ingeschreven voor de reis!'
                                            : 'Je bent succesvol ingeschreven en op de wachtlijst geplaatst!'}
                                    </p>
                                    <p className="text-white/90 mb-2">
                                        Je ontvangt binnenkort een bevestigingsmail met alle details op <strong>{form.email}</strong>.
                                    </p>
                                    <button
                                        onClick={() => {
                                            setSubmitted(false);
                                            setForm({
                                                first_name: '',
                                                middle_name: '',
                                                last_name: '',
                                                email: '',
                                                phone_number: '',
                                                terms_accepted: false,
                                            });
                                        }}
                                        className="bg-white text-theme-purple font-bold py-2 px-4 rounded hover:bg-white/90 transition mt-4"
                                    >
                                        Nieuwe inschrijving
                                    </button>
                                </div>
                            ) : (
                                <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                                    {error && (
                                        <div className="bg-white/20 text-white px-4 py-3 rounded">
                                            {error}
                                        </div>
                                    )}

                                    {!tripsLoading && !canSignUp && nextTrip && (
                                        <div className="bg-white/20 text-white px-4 py-3 rounded">
                                            De inschrijvingen voor deze reis zijn momenteel gesloten. Houd deze pagina in de gaten!
                                        </div>
                                    )}

                                    {!tripsLoading && !nextTrip && (
                                        <div className="bg-white/20 text-white px-4 py-3 rounded">
                                            Momenteel is er geen reis gepland. Houd deze pagina in de gaten voor nieuwe data!
                                        </div>
                                    )}

                                    <p className="text-white/90 text-sm mb-2">
                                        Let op: dit is een vrijblijvende aanmelding. De daadwerkelijke betaling volgt later.
                                    </p>

                                    {/* Name fields */}
                                    <label className="font-semibold text-white">
                                        Voornaam
                                        <input
                                            type="text"
                                            name="first_name"
                                            value={form.first_name}
                                            onChange={handleChange}
                                            required
                                            placeholder="Volledige voornaam (incl. doopnamen)"
                                            className="mt-1 p-2 rounded w-full bg-white text-theme-purple dark:bg-gray-800 dark:text-theme"
                                        />
                                        <span className="text-xs text-white/80 mt-1 block">
                                            Gebruik je volledige naam zoals op je paspoort/ID
                                        </span>
                                    </label>

                                    <label className="font-semibold text-white">
                                        Tussenvoegsel
                                        <input
                                            type="text"
                                            name="middle_name"
                                            value={form.middle_name}
                                            onChange={handleChange}
                                            placeholder="bijv. van, de"
                                            className="mt-1 p-2 rounded w-full bg-white text-theme-purple dark:bg-gray-800 dark:text-theme"
                                        />
                                    </label>

                                    <label className="font-semibold text-white">
                                        Achternaam
                                        <input
                                            type="text"
                                            name="last_name"
                                            value={form.last_name}
                                            onChange={handleChange}
                                            required
                                            placeholder="Achternaam"
                                            className="mt-1 p-2 rounded w-full bg-white text-theme-purple dark:bg-gray-800 dark:text-theme"
                                        />
                                    </label>

                                    {/* Email */}
                                    <label className="font-semibold text-white">
                                        E-mailadres
                                        <input
                                            type="email"
                                            name="email"
                                            value={form.email}
                                            onChange={handleChange}
                                            required
                                            placeholder="jouw@email.nl"
                                            className="mt-1 p-2 rounded w-full bg-white text-theme-purple dark:bg-gray-800 dark:text-theme"
                                        />
                                    </label>

                                    {/* Phone */}
                                    <label className="font-semibold text-white">
                                        Telefoonnummer
                                        <input
                                            type="tel"
                                            name="phone_number"
                                            value={form.phone_number}
                                            onChange={handleChange}
                                            required
                                            placeholder="+31 6 12345678"
                                            className="mt-1 p-2 rounded w-full bg-white text-theme-purple dark:bg-gray-800 dark:text-theme"
                                        />
                                    </label>

                                    {/* Terms */}
                                    <label className="flex items-start gap-2 text-white">
                                        <input
                                            type="checkbox"
                                            name="terms_accepted"
                                            checked={form.terms_accepted}
                                            onChange={handleChange}
                                            required
                                            className="mt-1 h-5 w-5 rounded"
                                        />
                                        <span className="text-sm">
                                            Ik accepteer de{' '}
                                            <Link href="/algemene-voorwaarden" className="underline font-semibold">
                                                algemene voorwaarden
                                            </Link>
                                        </span>
                                    </label>

                                    <button
                                        type="submit"
                                        disabled={loading || !canSignUp || !nextTrip}
                                        className="bg-white text-theme-purple font-bold py-3 px-6 rounded shadow-lg shadow-theme-purple/30 transition-transform hover:-translate-y-0.5 hover:shadow-xl mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading
                                            ? 'Bezig met aanmelden...'
                                            : (canSignUp && nextTrip)
                                                ? 'Aanmelden voor de reis'
                                                : 'Inschrijving nog niet beschikbaar'}
                                    </button>
                                </form>
                            )}
                        </section>

                        {/* Info Section */}
                        <div className="w-full lg:w-1/2 flex flex-col gap-6">
                            {/* Image + Date Card (removed Deelnemers & Plekken over) */}
                            {nextTrip && (
                                <div className="bg-gradient-theme rounded-3xl p-6 shadow-lg">
                                    {nextTrip.image && (
                                        <button
                                            type="button"
                                            onClick={() => openLightbox(getImageUrl(nextTrip.image))}
                                            className="w-full rounded-2xl overflow-hidden focus:outline-none"
                                        >
                                            <img
                                                src={getImageUrl(nextTrip.image)}
                                                alt={nextTrip.name}
                                                className="w-full h-64 object-cover rounded-2xl"
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    target.src = '/img/placeholder.svg';
                                                }}
                                            />
                                        </button>
                                    )}

                                    <div className="bg-white/10 rounded-lg p-4 mt-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-white/80 text-sm font-medium">Datum</p>
                                                <p className="text-2xl font-bold text-white mt-1">
                                                    {formattedFromDate && formattedUntilDate ? (
                                                        formattedFromDate === formattedUntilDate ? formattedFromDate : `${formattedFromDate} — ${formattedUntilDate}`
                                                    ) : (
                                                        'Nog te bepalen'
                                                    )}
                                                </p>
                                            </div>
                                            <Calendar className="h-10 w-10 text-white/60" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {lightboxOpen && lightboxSrc && (
                                <div
                                    role="dialog"
                                    aria-modal="true"
                                    className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/70"
                                    onClick={closeLightbox}
                                >
                                    <button
                                        onClick={closeLightbox}
                                        aria-label="Sluiten"
                                        className="absolute top-6 right-6 text-white text-3xl leading-none"
                                    >
                                        ×
                                    </button>

                                    <img
                                        src={lightboxSrc}
                                        alt={nextTrip?.name || 'Reis afbeelding'}
                                        className="max-h-[90vh] max-w-full rounded shadow-lg"
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                </div>
                            )}

                            {/* Description */}
                            {nextTrip?.description && (
                                <div className="bg-gradient-theme rounded-3xl p-6 shadow-lg">
                                    <h2 className="text-2xl font-bold text-white mb-4">
                                        ✈️ Over de Reis
                                    </h2>
                                    <div 
                                        className="text-white space-y-3 prose prose-invert max-w-none"
                                        dangerouslySetInnerHTML={{ __html: nextTrip.description }}
                                    />
                                </div>
                            )}

                            {/* Important Info */}
                            <div className="bg-gradient-theme rounded-3xl p-6 shadow-lg">
                                <h2 className="text-2xl font-bold text-white mb-4">
                                    ℹ️ Belangrijke Informatie
                                </h2>
                                <div className="text-white space-y-2">
                                    <p className="flex items-start gap-2">
                                        <span className="text-white/80">•</span>
                                        <span>Je hoeft <strong>geen lid</strong> te zijn om deel te nemen</span>
                                    </p>
                                    <p className="flex items-start gap-2">
                                        <span className="text-white/80">•</span>
                                        <span>Je ontvangt een bevestigingsmail na inschrijving</span>
                                    </p>
                                    <p className="flex items-start gap-2">
                                        <span className="text-white/80">•</span>
                                        <span>Minimumleeftijd: 18 jaar</span>
                                    </p>
                                    <p className="flex items-start gap-2">
                                        <span className="text-white/80">•</span>
                                        <span>Gebruik je volledige naam zoals op je paspoort/ID</span>
                                    </p>
                                    <p className="flex items-start gap-2">
                                        <span className="text-white/80">•</span>
                                        <span>Bij vragen? Neem contact op via <a href="/contact" className="text-white underline">onze contactpagina</a></span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </>
    );
}
