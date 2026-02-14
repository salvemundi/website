'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useAuthActions } from '@/features/auth/providers/auth-provider';
import { getImageUrl } from '@/shared/lib/api/salvemundi';
import { sanitizeHtml } from '@/shared/lib/utils/sanitize';
import AttendanceButton from '@/entities/activity/ui/AttendanceButton';
import PageHeader from '@/widgets/page-header/ui/PageHeader';
import { PhoneInput } from '@/shared/ui/PhoneInput';
import QRDisplay from '@/entities/activity/ui/QRDisplay';
import {
    CalendarClock,
    Euro,
    Users as UsersIcon,
    Mail,
    Info,
    CheckCircle,
    Users,
    MapPin
} from 'lucide-react';
import { isEventPast } from '@/shared/lib/utils/date';
import { getEventSignupStatusAction, createEventSignupAction } from '@/shared/api/event-actions';
import { createPaymentAction } from '@/shared/api/finance-actions';

// Helper function
const buildCommitteeEmail = (name?: string | null) => {
    if (!name) return undefined;
    const normalized = name.toLowerCase();
    if (normalized.includes('feest')) return 'feest@salvemundi.nl';
    if (normalized.includes('activiteit')) return 'activiteiten@salvemundi.nl';
    if (normalized.includes('studie')) return 'studie@salvemundi.nl';

    const slug = name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/commissie|committee/g, '')
        .replace(/[^a-z0-9]+/g, '')
        .trim();
    if (!slug) return undefined;
    return `${slug}@salvemundi.nl`;
};

interface EventDetailClientProps {
    initialEvent: any;
}

export default function EventDetailClient({ initialEvent: event }: EventDetailClientProps) {
    const router = useRouter();
    const { user } = useAuth();
    const { loginWithRedirect } = useAuthActions();

    // State for signup status
    const [signupStatus, setSignupStatus] = useState<{
        isSignedUp: boolean;
        paymentStatus?: 'paid' | 'open' | 'failed' | 'canceled';
        qrToken?: string;
        signupId?: number;
    }>({ isSignedUp: false });

    // Form state
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phoneNumber: "",
        website: "", // Honeypot
    });
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [hasMounted, setHasMounted] = useState(false);

    useEffect(() => {
        setHasMounted(true);
    }, []);

    // 1. Check for existing signup or payment return from URL
    useEffect(() => {
        const checkSignupStatus = async () => {
            const urlParams = new URLSearchParams(window.location.search);
            const statusParam = urlParams.get('status');

            if (statusParam === 'paid') {
                setSignupStatus(prev => ({
                    ...prev,
                    isSignedUp: true,
                    paymentStatus: 'paid',
                    qrToken: prev.qrToken || 'status-verified'
                }));
            }

            // Check details from server if logged in
            if (user && event?.id) {
                try {
                    const signup = await getEventSignupStatusAction(event.id, user.id);
                    if (signup) {
                        setSignupStatus({
                            isSignedUp: true,
                            paymentStatus: signup.payment_status,
                            qrToken: signup.qr_token,
                            signupId: signup.id
                        });
                    } else if (statusParam !== 'paid') {
                        setSignupStatus({ isSignedUp: false });
                    }
                } catch (err) {
                    console.error('Error checking signup status:', err);
                }
            }
        };

        checkSignupStatus();
    }, [user, event?.id]);

    // 2. Pre-fill form
    useEffect(() => {
        if (user) {
            const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
            setFormData({
                name: fullName || "",
                email: user.email || "",
                phoneNumber: user.phone_number || "",
                website: "",
            });
        }
    }, [user]);

    // 3. Derived values
    const committeeEmail = event?.committee_email || buildCommitteeEmail(event?.committee_name);
    const rawDate = event?.event_date;

    const formattedDate = useMemo(() => {
        if (!rawDate) return null;
        const date = new Date(rawDate);
        if (Number.isNaN(date.getTime())) return rawDate;

        const formatOptions: Intl.DateTimeFormatOptions = {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        };

        const startDateFormatted = new Intl.DateTimeFormat('nl-NL', formatOptions).format(date);

        if (event?.event_date_end && event.event_date_end !== event.event_date) {
            const endDate = new Date(event.event_date_end);
            if (!Number.isNaN(endDate.getTime())) {
                const endDateFormatted = new Intl.DateTimeFormat('nl-NL', formatOptions).format(endDate);
                return `${startDateFormatted} t/m ${endDateFormatted}`;
            }
        }

        return startDateFormatted;
    }, [rawDate, event?.event_date_end]);

    const formattedTime = useMemo(() => {
        if (!event) return null;
        if (event.event_time) {
            const [hours, minutes] = event.event_time.split(':');
            return `${hours}:${minutes}`;
        }
        const raw = event.event_date || '';
        const hasTimeInDate = raw.includes('T') || /\d{2}:\d{2}/.test(raw);
        if (hasTimeInDate) {
            const parsed = new Date(raw);
            if (!Number.isNaN(parsed.getTime())) return parsed.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
        }
        return null;
    }, [event]);

    const formattedStart = useMemo(() => {
        if (!event) return null;
        if (event.event_time) {
            const [hours, minutes] = event.event_time.split(':');
            return `${hours}:${minutes}`;
        }
        const raw = event.event_date || '';
        const hasTimeInDate = raw.includes('T') || /\d{2}:\d{2}/.test(raw);
        if (hasTimeInDate) {
            const parsed = new Date(raw);
            if (!Number.isNaN(parsed.getTime())) return parsed.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
        }
        return null;
    }, [event]);

    const formattedEnd = useMemo(() => {
        if (!event) return null;
        const endRaw = event.event_time_end || event.time_end || event.end_time;
        if (endRaw) {
            const [hours, minutes] = endRaw.split(':');
            return `${hours}:${minutes}`;
        }
        return null;
    }, [event]);

    const formattedTimeRange = useMemo(() => {
        if (!formattedStart) return null;
        return formattedEnd ? `${formattedStart} - ${formattedEnd}` : formattedStart;
    }, [formattedStart, formattedEnd]);

    const applicablePrice = useMemo(() => {
        if (!event) return 0;
        return user?.is_member ? Number(event.price_members) : Number(event.price_non_members);
    }, [event, user]);

    const displayPrice = useMemo(() => {
        if (!event) return 'Loading...';
        if (event.price_members === 0 && event.price_non_members === 0) return 'Gratis';
        const price = applicablePrice;
        return `€${price.toFixed(2).replace('.', ',')}`;
    }, [event, applicablePrice]);

    // Use hasMounted to avoid hydration mismatch for time-dependent values
    const isPast = (event && hasMounted) ? isEventPast(event.event_date) : false;
    const isDeadlinePassed = (event?.inschrijf_deadline && hasMounted) ? new Date(event.inschrijf_deadline) < new Date() : false;
    const isPaidAndHasQR = signupStatus.isSignedUp && signupStatus.paymentStatus === 'paid' && !!signupStatus.qrToken;

    // Form logic
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    };

    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};
        if (!formData.name.trim()) newErrors.name = "Naam is verplicht";
        if (!formData.email.trim()) newErrors.email = "Email is verplicht";
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Ongeldig email adres";
        if (!formData.phoneNumber.trim()) newErrors.phoneNumber = "Telefoonnummer is verplicht";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Honeypot
        if (formData.website) {
            console.log("Bot detected via honeypot");
            setSignupStatus({ isSignedUp: true, paymentStatus: 'paid' });
            return;
        }

        if (formData.name.match(/https?:\/\//) || formData.name.includes('www.') || formData.name.includes('http')) {
            console.log("Bot detected via name content");
            setSubmitError('Ongeldige invoer (spam gedetecteerd).');
            return;
        }

        if (isDeadlinePassed) {
            setSubmitError('De inschrijfdeadline voor deze activiteit is verstreken.');
            return;
        }

        if (!validateForm()) return;

        setIsSubmitting(true);
        setSubmitError(null);

        try {
            // 1. Create Signup via Server Action
            const signupResult = await createEventSignupAction({
                event_id: Number(event.id),
                email: formData.email,
                name: formData.name,
                phone_number: formData.phoneNumber,
                user_id: user?.id,
                event_name: event.name,
                event_date: event.event_date,
                event_price: applicablePrice,
                payment_status: 'open'
            });

            if (!signupResult.success || !signupResult.signup) {
                setSubmitError(signupResult.error || 'Kon inschrijving niet aanmaken.');
                setIsSubmitting(false);
                return;
            }

            const signup = signupResult.signup;

            // 2. Initiate Payment (if paid)
            if (applicablePrice > 0 && signupResult.isRecycled !== true && signup.payment_status !== 'paid') {
                // Use Server Action for payment
                const paymentPayload = {
                    amount: applicablePrice.toFixed(2),
                    description: `Inschrijving - ${event.name}`,
                    redirectUrl: window.location.origin + `/activiteiten/${event.id}?status=paid`,
                    registrationId: signup.id,
                    registrationType: 'event_signup',
                    email: formData.email,
                    firstName: formData.name.split(' ')[0],
                    lastName: formData.name.split(' ').slice(1).join(' '),
                    userId: user?.id,
                    isContribution: false,
                    qrToken: signup.qr_token
                };

                const paymentRes = await createPaymentAction(paymentPayload);

                if (!paymentRes.success) {
                    setSubmitError(paymentRes.error || 'Fout bij het aanmaken van de betaling.');
                    setIsSubmitting(false);
                    return;
                }

                if (paymentRes.checkoutUrl) {
                    window.location.href = paymentRes.checkoutUrl;
                    return;
                }
            }

            // Refresh status for free activity or recycled paid signup
            setSignupStatus({
                isSignedUp: true,
                paymentStatus: applicablePrice > 0 && signup.payment_status !== 'paid' ? 'open' : 'paid',
                qrToken: signup.qr_token,
                signupId: signup.id
            });

        } catch (error: any) {
            console.error('Signup error:', error);
            setSubmitError(error?.message || 'Er is iets misgegaan tijdens het inschrijven.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePayAgain = async () => {
        if (!signupStatus.isSignedUp || applicablePrice <= 0 || !signupStatus.signupId && !user) return;

        setIsSubmitting(true);
        setSubmitError(null);

        try {
            // If we don't have signupId in state, try to fetch it again (redundant if useEffect worked)
            let signupId = signupStatus.signupId;
            let qrToken = signupStatus.qrToken;

            if (!signupId && user) {
                const signup = await getEventSignupStatusAction(event.id, user.id);
                if (signup) {
                    signupId = signup.id;
                    qrToken = signup.qr_token;
                }
            }

            if (!signupId) {
                throw new Error('Inschrijving niet gevonden. Neem contact op.');
            }

            const paymentPayload = {
                amount: applicablePrice.toFixed(2),
                description: `Betaling Inschrijving - ${event.name}`,
                redirectUrl: window.location.origin + `/activiteiten/${event.id}?status=paid`,
                registrationId: signupId,
                registrationType: 'event_signup',
                email: formData.email,
                firstName: formData.name.split(' ')[0],
                lastName: formData.name.split(' ').slice(1).join(' '),
                userId: user?.id,
                isContribution: false,
                qrToken: qrToken
            };

            const paymentRes = await createPaymentAction(paymentPayload);

            if (!paymentRes.success) {
                setSubmitError(paymentRes.error || 'Fout bij het herstarten van de betaling.');
                setIsSubmitting(false);
                return;
            }

            if (paymentRes.checkoutUrl) {
                window.location.href = paymentRes.checkoutUrl;
                return;
            }

        } catch (error: any) {
            console.error('Retry payment error:', error);
            setSubmitError(error?.message || 'Fout bij het herstarten van de betaling.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const headerFilter = isPast ? 'grayscale(100%) brightness(0.6) contrast(0.95)' : undefined;
    const descriptionToUse = event?.description_logged_in || event?.description;

    return (
        <>
            <PageHeader
                title={event.name}
                backgroundImage={event.image ? getImageUrl(event.image) : undefined}
                imageFilter={headerFilter}
            >
                <div className="flex flex-col items-center gap-2">
                    {isPast && (
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-semibold text-sm">
                            Afgelopen evenement
                        </div>
                    )}

                    {event.committee_name && (
                        <div className="flex flex-col items-center gap-2 mt-2">
                            <p className="text-lg sm:text-xl text-beige/90 max-w-3xl mx-auto mt-0">
                                Georganiseerd door {event.committee_name.replace(/\s*\|\|\s*SALVE MUNDI\s*/gi, '').trim()}
                            </p>
                            {event.only_members && (
                                <span className="bg-amber-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg uppercase tracking-wider">
                                    Leden Alleen
                                </span>
                            )}
                        </div>
                    )}
                    {user && (
                        <div>
                            <AttendanceButton eventId={event.id} userId={user.id} />
                        </div>
                    )}
                </div>
            </PageHeader>

            <main className="mx-auto max-w-app px-4 py-8 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">

                    {/* Signup Form - Tall Tile (Right column on desktop, but 1st in grid logic usually? No, existing code had it as 1st col, so sticking to it) */}
                    <div className="md:col-span-1 md:row-span-3 rounded-3xl bg-[var(--bg-card)] dark:border dark:border-white/10 p-6 shadow-lg flex flex-col h-full">
                        <div className="flex-grow">
                            {isPaidAndHasQR ? (
                                <div className="space-y-6 text-slate-900 dark:text-white h-full flex flex-col justify-center">
                                    <h3 className="text-2xl font-extrabold text-theme-purple-dark text-center">🎉 Inschrijving Definitief!</h3>
                                    <p className="text-center text-lg text-slate-600 dark:text-white/90">
                                        Je bent succesvol ingeschreven voor {event.name} en je betaling is ontvangen.
                                    </p>

                                    <div className="flex justify-center bg-white p-4 rounded-xl border-2 border-dashed border-slate-300">
                                        <QRDisplay qrToken={signupStatus.qrToken!} />
                                    </div>

                                    <p className="text-center text-sm text-slate-500 dark:text-white/70 mt-4">
                                        Dit ticket is ook per e-mail naar je verzonden.
                                    </p>
                                </div>
                            ) : signupStatus.isSignedUp ? (
                                <div className="bg-green-500/10 p-6 rounded-xl text-center border border-green-500/20 h-full flex flex-col justify-center items-center">
                                    <div className="flex justify-center mb-3">
                                        <CheckCircle className="h-16 w-16 text-green-500" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Je bent ingeschreven!</h3>
                                    {signupStatus.paymentStatus === 'open' ? (
                                        <div className="space-y-4">
                                            <p className="text-slate-600 dark:text-white/80">
                                                Je inschrijving is in afwachting van betaling.
                                            </p>
                                            <button
                                                onClick={handlePayAgain}
                                                disabled={isSubmitting}
                                                className="w-full bg-paars text-white font-bold py-3 px-6 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md disabled:opacity-70 flex items-center justify-center gap-2"
                                            >
                                                {isSubmitting ? (
                                                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                                ) : (
                                                    `BETAAL NU (€${applicablePrice.toFixed(2).replace('.', ',')})`
                                                )}
                                            </button>
                                        </div>
                                    ) : (
                                        <p className="text-slate-600 dark:text-white/80">
                                            We zien je graag op {formattedDate}.
                                        </p>
                                    )}
                                </div>
                            ) : isDeadlinePassed ? (
                                <div className="bg-slate-100 dark:bg-white/5 p-6 rounded-xl text-center h-full flex flex-col justify-center items-center">
                                    <h3 className="text-2xl font-bold text-slate-400 mb-2">Inschrijving Gesloten</h3>
                                    <p className="text-slate-500 dark:text-slate-400">De inschrijfdeadline voor deze activiteit is verstreken.</p>
                                </div>
                            ) : isPast ? (
                                <div className="bg-slate-100 dark:bg-white/5 p-6 rounded-xl text-center h-full flex flex-col justify-center items-center">
                                    <h3 className="text-2xl font-bold text-slate-400 mb-2">Inschrijving Gesloten</h3>
                                    <p className="text-slate-500 dark:text-slate-400">Deze activiteit is al geweest.</p>
                                </div>
                            ) : (event.only_members && !user?.is_member) ? (
                                <div className="bg-amber-500/10 p-8 rounded-xl text-center border border-amber-500/30 h-full flex flex-col justify-center items-center">
                                    <div className="bg-amber-500/20 p-4 rounded-full mb-4">
                                        <UsersIcon className="h-10 w-10 text-amber-500 transition-transform group-hover:scale-110" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Leden Alleen</h3>
                                    <p className="text-slate-600 dark:text-white/80 mb-6">
                                        Deze activiteit is exclusief toegankelijk voor leden van Salve Mundi.
                                    </p>
                                    {!user ? (
                                        <button
                                            onClick={() => {
                                                const returnTo = window.location.pathname + window.location.search;
                                                loginWithRedirect(returnTo);
                                            }}
                                            className="w-full bg-paars text-white font-bold py-3 px-6 rounded-xl hover:scale-[1.02] transition-all shadow-md"
                                        >
                                            INLOGGEN OM IN TE SCHRIJVEN
                                        </button>
                                    ) : (
                                        <div className="space-y-4 w-full">
                                            <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                                                Je bent ingelogd als gast, maar je hebt nog geen actief lidmaatschap.
                                            </p>
                                            <button
                                                onClick={() => router.push('/word-lid')}
                                                className="w-full bg-theme-purple text-white font-bold py-3 px-6 rounded-xl hover:scale-[1.02] transition-all shadow-md"
                                            >
                                                WORD NU LID
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="signup-form-container h-full flex flex-col">
                                    <h3 className="text-2xl font-bold text-theme-purple mb-6 flex items-center gap-2">
                                        <Users className="h-6 w-6 text-theme-purple" />
                                        Inschrijven
                                    </h3>
                                    <form onSubmit={handleSubmit} className="space-y-4 flex flex-col">
                                        <div className="opacity-0 absolute top-0 left-0 h-0 w-0 -z-10 pointer-events-none overflow-hidden" aria-hidden="true">
                                            <label htmlFor="website">Website</label>
                                            <input
                                                type="text"
                                                id="website"
                                                name="website"
                                                value={formData.website}
                                                onChange={handleInputChange}
                                                tabIndex={-1}
                                                autoComplete="off"
                                                suppressHydrationWarning
                                            />
                                        </div>

                                        <div>
                                            <label htmlFor="name" className="block text-sm font-semibold text-theme-purple dark:text-white mb-1">Naam *</label>
                                            <input
                                                type="text"
                                                id="name"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                required
                                                className={`w-full px-4 py-3 rounded-xl dark:!bg-white/10 dark:!border-white/30 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-paars focus:border-paars transition-all ${errors.name ? "ring-2 ring-red-500 !border-red-500" : ""}`}
                                                placeholder="Jouw naam"
                                                suppressHydrationWarning
                                            />
                                            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                                        </div>

                                        <div>
                                            <label htmlFor="email" className="block text-sm font-semibold text-theme-purple dark:text-white mb-1">Email *</label>
                                            <input
                                                type="email"
                                                id="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                required
                                                className={`w-full px-4 py-3 rounded-xl dark:!bg-white/10 dark:!border-white/30 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-paars focus:border-paars transition-all ${errors.email ? "ring-2 ring-red-500 !border-red-500" : ""}`}
                                                placeholder="naam.achternaam@salvemundi.nl"
                                                suppressHydrationWarning
                                            />
                                            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                                        </div>

                                        <div>
                                            <label htmlFor="phone" className="block text-sm font-semibold text-theme-purple dark:text-white mb-1">Telefoonnummer *</label>
                                            <PhoneInput
                                                id="phone"
                                                name="phoneNumber"
                                                value={formData.phoneNumber}
                                                onChange={handleInputChange}
                                                required
                                                className={`w-full px-4 py-3 rounded-xl dark:!bg-white/10 dark:!border-white/30 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-paars focus:border-paars transition-all ${errors.phoneNumber ? "ring-2 ring-red-500 !border-red-500" : ""}`}
                                                placeholder="0612345678"
                                                suppressHydrationWarning
                                            />
                                            {errors.phoneNumber && <p className="text-red-500 text-sm mt-1">{errors.phoneNumber}</p>}
                                        </div>

                                        <div className="pt-6">
                                            <button
                                                type="submit"
                                                disabled={isSubmitting}
                                                className="w-full bg-theme-purple text-theme-purple-darker font-bold py-4 px-6 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
                                            >
                                                {isSubmitting ? (
                                                    <>
                                                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                                        Bezig...
                                                    </>
                                                ) : (
                                                    `AANMELDEN (${displayPrice})`
                                                )}
                                            </button>
                                        </div>
                                        {submitError && <p className="text-red-500 font-semibold text-center mt-3">{submitError}</p>}
                                    </form>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right column: compact info tiles */}
                    <div className="md:col-span-1 md:row-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4 h-full">
                        <div className="rounded-2xl bg-[var(--bg-card)] dark:border dark:border-white/10 p-6 shadow-md flex items-center gap-4">
                            <div className="h-12 w-12 rounded-lg bg-theme-purple/10 dark:bg-white/10 flex items-center justify-center text-theme-purple dark:text-theme-white">
                                <CalendarClock className="h-6 w-6" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm uppercase tracking-wide text-theme-purple/60 dark:text-theme-white/60 font-bold">Datum & Tijd</p>
                                <p className="text-base font-semibold text-theme-purple dark:text-theme-white truncate">{formattedDate}</p>
                                {(formattedTimeRange || formattedTime) && (
                                    <p className="text-sm text-theme-purple/80 dark:text-theme-white/80">{formattedTimeRange || formattedTime}</p>
                                )}
                            </div>
                        </div>

                        <div className="rounded-2xl bg-[var(--bg-card)] dark:border dark:border-white/10 p-6 shadow-md flex items-center gap-4">
                            <div className="h-12 w-12 rounded-lg bg-theme-purple/10 dark:bg-white/10 flex items-center justify-center text-theme-purple dark:text-theme-white">
                                <Euro className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-sm uppercase tracking-wide text-theme-purple/60 dark:text-theme-white/60 font-bold">Prijs</p>
                                <p className="text-base font-semibold text-theme-purple dark:text-theme-white">{displayPrice}</p>
                            </div>
                        </div>

                        {event.location && (
                            <div className="rounded-2xl bg-[var(--bg-card)] dark:border dark:border-white/10 p-6 shadow-md flex items-center gap-4">
                                <div className="h-12 w-12 rounded-lg bg-theme-purple/10 dark:bg-white/10 flex items-center justify-center text-theme-purple dark:text-theme-white">
                                    <MapPin className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-sm uppercase tracking-wide text-theme-purple/60 dark:text-theme-white/60 font-bold">Locatie</p>
                                    <p className="text-base font-semibold text-theme-purple dark:text-theme-white break-words max-w-[18rem]">{event.location}</p>
                                </div>
                            </div>
                        )}

                        {event.committee_name && (
                            <div className="rounded-2xl bg-[var(--bg-card)] dark:border dark:border-white/10 p-6 shadow-md flex items-center gap-4">
                                <div className="h-12 w-12 rounded-lg bg-theme-purple/10 dark:bg-white/10 flex items-center justify-center text-theme-purple dark:text-theme-white">
                                    <UsersIcon className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-sm uppercase tracking-wide text-theme-purple/60 dark:text-theme-white/60 font-bold">Organisatie</p>
                                    <p className="text-base font-semibold text-theme-purple dark:text-theme-white truncate">
                                        {event.committee_name.replace(/\s*\|\|\s*SALVE MUNDI\s*/gi, '').trim()}
                                    </p>
                                </div>
                            </div>
                        )}

                        {(event.contact_name || committeeEmail || event.contact) && (
                            <div className="rounded-2xl bg-[var(--bg-card)] dark:border dark:border-white/10 p-6 shadow-md flex items-center gap-4">
                                <div className="h-12 w-12 rounded-lg bg-theme-purple/10 dark:bg-white/10 flex items-center justify-center text-theme-purple dark:text-theme-white">
                                    <Mail className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-sm uppercase tracking-wide text-theme-purple/60 dark:text-theme-white/60 font-bold">Contact</p>
                                    {event.contact_name && (
                                        <p className="text-base font-semibold text-theme-purple dark:text-theme-white">{event.contact_name}</p>
                                    )}
                                    {committeeEmail && (
                                        <a href={`mailto:${committeeEmail}`} className="text-sm text-theme-purple/80 dark:text-theme-white/80 hover:underline break-all">
                                            {committeeEmail}
                                        </a>
                                    )}
                                    {event.contact && typeof event.contact === 'string' && event.contact.includes('@') && (
                                        <a href={`mailto:${event.contact}`} className="text-sm text-theme-purple/80 dark:text-theme-white/80 hover:underline break-all block mt-1">
                                            {event.contact}
                                        </a>
                                    )}
                                    {event.contact && typeof event.contact === 'string' && !event.contact.includes('@') && (
                                        <p className="text-sm text-theme-purple/80 dark:text-theme-white/80 break-all mt-1">{event.contact}</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {descriptionToUse && (
                        <div className="md:col-span-2 md:row-span-2 rounded-3xl bg-[var(--bg-card)] dark:border dark:border-white/10 p-8 shadow-lg flex flex-col">
                            <h2 className="mb-4 text-2xl font-bold text-theme-purple dark:text-theme-white flex items-center gap-2">
                                <Info className="h-6 w-6 text-theme-purple dark:text-theme-white" />
                                Over dit evenement
                            </h2>
                            <div
                                className="prose dark:prose-invert max-w-none text-slate-600 dark:text-white/80"
                                dangerouslySetInnerHTML={{ __html: sanitizeHtml(descriptionToUse) }}
                            />
                        </div>
                    )}
                </div>
            </main>
        </>
    );
}
