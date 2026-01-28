'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import PageHeader from '@/widgets/page-header/ui/PageHeader';
import { getImageUrl, tripSignupsApi } from '@/shared/lib/api/salvemundi';
import { useSalvemundiTrips, useSalvemundiSiteSettings, useSalvemundiTripSignups } from '@/shared/lib/hooks/useSalvemundiApi';
import { fetchUserDetails, fetchAndPersistUserCommittees } from '@/shared/lib/auth';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { isUserInReisCommittee } from '@/shared/lib/committee-utils';
import { TripSignup } from '@/shared/lib/api/salvemundi';
import { User } from '@/shared/model/types/auth';
import { CheckCircle2, Calendar, CreditCard, Loader2, Utensils } from 'lucide-react';

export default function ReisPage() {
    const [form, setForm] = useState({
        first_name: '',
        middle_name: '',
        last_name: '',
        email: '',
        phone_number: '',
        date_of_birth: null as Date | null,
        terms_accepted: false,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isCommitteeMember, setIsCommitteeMember] = useState(false);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

    const { data: trips, isLoading: tripsLoading } = useSalvemundiTrips();
    const { data: siteSettings, isLoading: isSettingsLoading } = useSalvemundiSiteSettings('reis');

    const isReisEnabled = siteSettings?.show ?? true;
    const reisDisabledMessage = siteSettings?.disabled_message || 'De inschrijvingen voor de reis zijn momenteel gesloten.';

    // Get the next upcoming or currently active trip
    const nextTrip = useMemo(() => {
        if (!trips || trips.length === 0) return null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const validTrips = trips.filter((trip) => {
            // If it has an end_date, use that to check if the trip is still relevant
            if (trip.end_date) {
                const endDate = new Date(trip.end_date);
                endDate.setHours(23, 59, 59, 999);
                return endDate >= today;
            }

            // Otherwise use event_date (start date)
            const dateStr = trip.event_date || trip.start_date;
            if (!dateStr) return false;
            const eventDate = new Date(dateStr);
            eventDate.setHours(23, 59, 59, 999); // Even if it started today, it's still valid
            return eventDate >= today;
        });

        if (validTrips.length === 0) return null;

        validTrips.sort((a, b) => {
            const dateA = new Date((a.event_date || a.start_date)!);
            const dateB = new Date((b.event_date || b.start_date)!);
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

    const registrationStartDate = nextTrip?.registration_start_date ? new Date(nextTrip.registration_start_date) : null;
    const now = new Date();

    // Logic: 
    // 1. If registration_open is TRUE -> OPEN.
    // 2. If registration_open is FALSE, but start date is passed -> OPEN.
    const isRegistrationDateReached = registrationStartDate ? now >= registrationStartDate : false;
    const canSignUp = Boolean(nextTrip && (nextTrip.registration_open || isRegistrationDateReached));

    // Show start text only if it's NOT open yet, but there IS a start date planned
    const showStartText = !canSignUp && registrationStartDate;

    const registrationStartText = showStartText
        ? `Inschrijving opent op ${format(registrationStartDate!, 'd MMMM yyyy HH:mm', { locale: nl })}`
        : 'Inschrijving nog niet beschikbaar';
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

    // Calculate participants count for waitlist check
    const participantsCount = signups?.filter(s => s.status === 'confirmed' || s.status === 'registered').length || 0;

    const userSignup = useMemo(() => {
        if (!signups || !currentUser) return null;
        return signups.find(s => s.email.toLowerCase() === currentUser.email.toLowerCase() && s.status !== 'cancelled');
    }, [signups, currentUser]);

    const getSignupStatusDisplay = (signup: TripSignup) => {
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
            await tripSignupsApi.update(userSignup.id, { status: 'cancelled' });
            // Refresh logic - in a real app you might use a query client cache invalidate
            window.location.reload();
        } catch (err: any) {
            console.error('Error cancelling signup:', err);
            setError('Er is een fout opgetreden bij het annuleren van je aanmelding.');
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

    // Prefill form when user is logged in (session token in localStorage)
    useEffect(() => {
        try {
            if (typeof window === 'undefined') return;
            const token = localStorage.getItem('auth_token');
            if (!token) return;

            // fetchUserDetails will throw or return null if token invalid
            fetchUserDetails(token)
                .then(async (user) => {
                    if (!user) return;

                    setForm((prev) => ({
                        ...prev,
                        // Only first_name is NOT auto-filled - user must enter legal first name as on ID
                        middle_name: prev.middle_name || user.middle_name || '',
                        last_name: prev.last_name || user.last_name || '',
                        email: prev.email || user.email || '',
                        phone_number: prev.phone_number || user.phone_number || '',
                        date_of_birth: prev.date_of_birth || (user.date_of_birth ? new Date(user.date_of_birth) : null),
                    }));
                    setCurrentUser(user as User);

                    // Fetch committees separately since fetchUserDetails returns empty committees
                    const committees = await fetchAndPersistUserCommittees(user.id, token);
                    const userWithCommittees = { ...user, committees };
                    console.log('[ReisPage] User committees:', committees);
                    setIsCommitteeMember(isUserInReisCommittee(userWithCommittees));
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
            // Check for existing signup (duplicate prevention)
            if (signups && signups.some(s => s.email.toLowerCase() === form.email.toLowerCase() && s.status !== 'cancelled')) {
                setError('Er is al een actieve aanmelding gevonden met dit e-mailadres.');
                setLoading(false);
                return;
            }

            // Determine if user should be on waitlist
            const shouldBeWaitlisted = participantsCount >= nextTrip.max_participants;

            const signupData = {
                trip_id: nextTrip.id,
                first_name: form.first_name,
                middle_name: form.middle_name || undefined,
                last_name: form.last_name,
                email: form.email,
                phone_number: form.phone_number,
                date_of_birth: form.date_of_birth.toISOString().split('T')[0],
                terms_accepted: form.terms_accepted,
                status: shouldBeWaitlisted ? 'waitlist' as const : 'registered' as const,
                role: isCommitteeMember ? 'crew' as const : 'participant' as const,
                deposit_paid: false,
                full_payment_paid: false,
            };

            await tripSignupsApi.create(signupData);

            // Reload page to show user's new status immediately
            window.location.reload();
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
                    variant="centered"
                    titleClassName="text-theme-purple dark:text-theme-white text-3xl sm:text-4xl md:text-6xl drop-shadow-sm"
                    description={
                        <p className="mx-auto text-center text-lg sm:text-xl text-white/90 max-w-3xl mt-4 font-medium drop-shadow-sm">
                            Schrijf je in voor de jaarlijkse reis van Salve Mundi! Een onvergetelijke ervaring vol gezelligheid en avontuur.
                        </p>
                    }
                />
            </div>

            <main className="relative overflow-hidden bg-background">
                {!isReisEnabled ? (
                    <section className="px-4 sm:px-6 lg:px-10 py-12 lg:py-16">
                        <div className="max-w-4xl mx-auto bg-surface dark:border dark:border-white/10 rounded-2xl lg:rounded-3xl p-6 lg:p-8 text-center shadow-card dark:shadow-card-elevated">
                            <h2 className="text-2xl lg:text-3xl font-bold text-gradient mb-4">Reis momenteel niet beschikbaar</h2>
                            <p className="text-base lg:text-lg text-theme-text-muted mb-6">{reisDisabledMessage}</p>
                            {isSettingsLoading && <p className="text-sm text-theme-text-muted mb-6">Bezig met controleren van status...</p>}
                            <Link href="/" className="inline-flex items-center justify-center px-6 py-3 bg-gradient-theme text-white font-semibold rounded-full shadow-lg shadow-theme-purple/30 hover:-translate-y-0.5 transition-all">
                                Terug naar Home
                            </Link>
                        </div>
                    </section>
                ) : (
                    <div className="mx-auto max-w-app px-4 py-8 sm:py-10 md:py-12">
                        <div className="flex flex-col lg:flex-row gap-8 items-start">
                            {/* Form Section */}
                            <section className="w-full lg:w-1/2 bg-[var(--bg-card)] dark:border dark:border-white/10 rounded-3xl shadow-lg p-6 sm:p-8">
                                <h1 className="text-3xl font-bold text-theme-purple dark:text-theme-white mb-6">
                                    Inschrijven voor de Reis
                                </h1>

                                {userSignup ? (
                                    <div className="bg-gradient-to-br from-theme-purple/5 to-theme-purple/10 rounded-2xl p-6 border border-theme-purple/20">
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
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-3xl font-black text-theme-purple dark:text-theme-white">
                                                        {getSignupStatusDisplay(userSignup)}
                                                    </p>
                                                    {userSignup.status === 'registered' && (
                                                        <p className="text-xs text-theme-text-muted mt-1 italic">
                                                            Je aanmelding wordt momenteel beoordeeld door de commissie.
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="px-3 py-1 bg-theme-purple/10 rounded-full text-xs font-bold text-theme-purple uppercase">
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

                                        {/* Edit Activities link - only show if deposit paid but not full payment */}
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

                                        <p className="text-theme-text dark:text-white/90 text-sm mb-2">
                                            Let op: dit is een vrijblijvende aanmelding. De daadwerkelijke betaling volgt later.
                                        </p>

                                        <div className="flex flex-col gap-4">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <label className="form-label">
                                                    Voornaam
                                                    <input
                                                        type="text"
                                                        name="first_name"
                                                        value={form.first_name}
                                                        onChange={handleChange}
                                                        required
                                                        placeholder="Voornaam"
                                                        className="form-input mt-1"
                                                    />
                                                    <span className="text-xs text-white/80 mt-1 block font-normal">
                                                        Gebruik je volledige naam zoals op je paspoort/ID
                                                    </span>
                                                </label>

                                                <label className="form-label">
                                                    Tussenvoegsel
                                                    <input
                                                        type="text"
                                                        name="middle_name"
                                                        value={form.middle_name}
                                                        onChange={handleChange}
                                                        placeholder="bijv. van, de"
                                                        className="form-input mt-1"
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
                                                    placeholder="Achternaam"
                                                    className="form-input mt-1"
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
                                                    placeholder="jouw@email.nl"
                                                    className="form-input mt-1"
                                                />
                                            </label>

                                            <label className="form-label">
                                                Geboortedatum
                                                <div className="w-full">
                                                    <DatePicker
                                                        selected={form.date_of_birth}
                                                        onChange={(date) => setForm({ ...form, date_of_birth: date })}
                                                        dateFormat="dd-MM-yyyy"
                                                        locale={nl}
                                                        className="form-input mt-1"
                                                        placeholderText="Selecteer datum"
                                                        showYearDropdown
                                                        scrollableYearDropdown
                                                        yearDropdownItemNumber={100}
                                                        required
                                                    />
                                                </div>
                                            </label>

                                            <label className="form-label">
                                                Telefoonnummer
                                                <input
                                                    type="tel"
                                                    name="phone_number"
                                                    value={form.phone_number}
                                                    onChange={handleChange}
                                                    required
                                                    placeholder="+31 6 12345678"
                                                    className="form-input mt-1"
                                                />
                                            </label>
                                        </div>

                                        {/* Terms */}
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
                                                <a href="/reisvoorwaarden.pdf" download className="underline font-semibold" target="_blank" rel="noopener noreferrer">
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
                                            {!loading && (canSignUp && nextTrip) && <span className="group-hover:translate-x-1 transition-transform">→</span>}
                                        </button>
                                    </form>
                                )}
                            </section>

                            {/* Info Section */}
                            <div className="w-full lg:w-1/2 flex flex-col gap-8">
                                {/* Image + Date Card */}
                                {nextTrip && (
                                    <div className="bg-surface dark:border dark:border-white/10 rounded-3xl p-6 shadow-card">
                                        {nextTrip.image && (
                                            <button
                                                type="button"
                                                onClick={() => openLightbox(getImageUrl(nextTrip.image))}
                                                className="w-full rounded-2xl overflow-hidden focus:outline-none group relative"
                                            >
                                                <img
                                                    src={getImageUrl(nextTrip.image)}
                                                    alt={nextTrip.name}
                                                    className="w-full h-72 object-cover rounded-2xl transition-transform duration-500 group-hover:scale-105"
                                                    onError={(e) => {
                                                        const target = e.target as HTMLImageElement;
                                                        target.src = '/img/placeholder.svg';
                                                    }}
                                                />
                                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <span className="text-white bg-black/40 px-4 py-2 rounded-full backdrop-blur-md">Bekijk afbeelding</span>
                                                </div>
                                            </button>
                                        )}

                                        <div className="mt-6 flex items-center justify-between p-4 bg-theme-white-soft dark:bg-white/5 rounded-2xl border border-theme-purple/10 dark:border-white/5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-full bg-theme-purple/10 flex items-center justify-center">
                                                    <Calendar className="h-6 w-6 text-theme-purple" />
                                                </div>
                                                <div>
                                                    <p className="text-theme-text-muted text-xs font-semibold uppercase tracking-wider">Datum Reis</p>
                                                    <p className="text-xl font-bold text-theme-purple dark:text-theme-white mt-0.5">
                                                        {formattedFromDate && formattedUntilDate ? (
                                                            formattedFromDate === formattedUntilDate ? formattedFromDate : `${formattedFromDate} — ${formattedUntilDate}`
                                                        ) : (
                                                            'Nog te bepalen'
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Description */}
                                {nextTrip?.description && (
                                    <div className="bg-surface dark:border dark:border-white/10 rounded-3xl p-8 shadow-card">
                                        <h2 className="text-2xl font-bold text-theme-purple dark:text-theme-white mb-6 flex items-center gap-2">
                                            <span>✈️</span> Over de Reis
                                        </h2>
                                        <div
                                            className="text-theme-text-muted dark:text-theme-text-muted space-y-4 prose prose-purple dark:prose-invert max-w-none prose-p:leading-relaxed"
                                            dangerouslySetInnerHTML={{ __html: nextTrip.description }}
                                        />
                                    </div>
                                )}

                                {/* Important Info */}
                                <div className="bg-surface dark:border dark:border-white/10 rounded-3xl p-8 shadow-card">
                                    <h2 className="text-2xl font-bold text-theme-purple dark:text-theme-white mb-6 flex items-center gap-2">
                                        <span>ℹ️</span> Belangrijke Informatie
                                    </h2>
                                    <ul className="space-y-4">
                                        {[
                                            { icon: '👥', text: 'Je hoeft <strong>geen lid</strong> te zijn om deel te nemen' },
                                            { icon: '📧', text: 'Je ontvangt een bevestigingsmail na inschrijving' },
                                            { icon: '🔞', text: 'Minimumleeftijd: 18 jaar' },
                                            { icon: '🪪', text: 'Gebruik je volledige naam zoals op je paspoort/ID' },
                                            { icon: '📞', text: 'Bij vragen? Neem contact op via <a href="mailto:reis@salvemundi.nl" class="text-theme-purple underline font-semibold">reis@salvemundi.nl</a>' },
                                        ].map((item, i) => (
                                            <li key={i} className="flex items-start gap-4">
                                                <span className="text-xl flex-shrink-0">{item.icon}</span>
                                                <span className="text-theme-text-muted leading-snug" dangerouslySetInnerHTML={{ __html: item.text }} />
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {lightboxOpen && lightboxSrc && (
                <div
                    role="dialog"
                    aria-modal="true"
                    className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm"
                    onClick={closeLightbox}
                >
                    <button
                        onClick={closeLightbox}
                        aria-label="Sluiten"
                        className="absolute top-6 right-6 text-white text-4xl leading-none hover:scale-110 transition-transform"
                    >
                        ×
                    </button>

                    <img
                        src={lightboxSrc}
                        alt={nextTrip?.name || 'Reis afbeelding'}
                        className="max-h-[90vh] max-w-full rounded-2xl shadow-2xl animate-fade-in"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </>
    );
}
