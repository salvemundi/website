'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/providers/auth-provider';
import { useSalvemundiEvent } from '@/shared/lib/hooks/useSalvemundiApi';
import { eventsApi, getImageUrl } from '@/shared/lib/api/salvemundi';
import { directusFetch } from '@/shared/lib/directus';
import AttendanceButton from '@/entities/activity/ui/AttendanceButton';
import PageHeader from '@/widgets/page-header/ui/PageHeader';
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

// Helper function from the modal code
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

export default function EventDetailPage() {
    const params = useParams();
    const router = useRouter();
    const eventId = params?.id as string;
    const { user } = useAuth();

    // Fetch event data
    const { data: event, isLoading, error } = useSalvemundiEvent(eventId);

    // State for signup status
    const [signupStatus, setSignupStatus] = useState<{
        isSignedUp: boolean;
        paymentStatus?: 'paid' | 'open' | 'failed' | 'canceled';
        qrToken?: string;
    }>({ isSignedUp: false });


    // Form state
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phoneNumber: "",
    });
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    // Check for existing signup or payment return from URL
    useEffect(() => {
        const checkSignupStatus = async () => {
            // Priority 1: Check URL params for payment status (works for guests too)
            // Note: We use window.location because searchParams hook might not be reactive enough for instant feedback 
            // or we want to be explicit about reading the browser URL.
            const urlParams = new URLSearchParams(window.location.search);
            const statusParam = urlParams.get('status');

            if (statusParam === 'paid') {
                setSignupStatus({
                    isSignedUp: true,
                    paymentStatus: 'paid',
                    // We might not have the QR token here for guests without a fetch, 
                    // but we can at least show the "Paid" state.
                    qrToken: 'status-verified'
                });
                // Continue to check DB if user is logged in, to get real QR token if possible
                if (!user) return;
            }

            // Priority 2: Check backend if logged in
            if (!user || !eventId) return;

            try {
                // We need to query event_signups for this user and event
                // Note: This assumes we have permission to read our own signups
                const query = new URLSearchParams({
                    filter: JSON.stringify({
                        event_id: { _eq: eventId },
                        directus_relations: { _eq: user.id }
                    }),
                    fields: 'id,payment_status,qr_token'
                });

                const signups = await directusFetch<any[]>(`/items/event_signups?${query}`);

                if (signups && signups.length > 0) {
                    const signup = signups[0];
                    setSignupStatus({
                        isSignedUp: true,
                        paymentStatus: signup.payment_status,
                        qrToken: signup.qr_token
                    });
                } else {
                    // Only reset if we didn't just find a paid status in URL
                    if (statusParam !== 'paid') {
                        setSignupStatus({ isSignedUp: false });
                    }
                }
            } catch (err) {
                console.error('Error checking signup status:', err);
            };
        };

        checkSignupStatus();
    }, [user, eventId]);

    // Pre-fill form with user data
    useEffect(() => {
        if (user) {
            const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
            setFormData({
                name: fullName || "",
                email: user.email || "",
                phoneNumber: user.phone_number || "",
            });
        }
    }, [user]);

    // Derived values
    const committeeEmail = event?.committee_email || buildCommitteeEmail(event?.committee_name);
    const rawDate = event?.event_date;

    const formattedDate = useMemo(() => {
        if (!rawDate) return null;
        const date = new Date(rawDate);
        if (Number.isNaN(date.getTime())) return rawDate;
        return new Intl.DateTimeFormat('nl-NL', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        }).format(date);
    }, [rawDate]);

    const formattedTime = useMemo(() => {
        if (!event) return null;
        if (event.event_time) {
            // event_time is likely "HH:MM:SS"
            const [hours, minutes] = event.event_time.split(':');
            return `${hours}:${minutes}`;
        }
        // Only show a time if the stored `event_date` contains a time portion.
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
        // Only fallback to the date's time if the date actually contains a time portion
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

    // Calculate price based on membership (if we knew it) or just display both/one
    // The modal used `activity.price`, but our event object has `price_members` and `price_non_members`
    // We'll try to be smart about it
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

    // Treat an event as past only after the end of its calendar day (local timezone)
    const isPast = event ? isEventPast(event.event_date) : false;

    // Check if registration deadline has passed
    const isDeadlinePassed = event?.inschrijf_deadline ? new Date(event.inschrijf_deadline) < new Date() : false;

    const isPaidAndHasQR = signupStatus.isSignedUp && signupStatus.paymentStatus === 'paid' && !!signupStatus.qrToken;

    

    // Form handlers
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: "" }));
        }
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

        // Safety check: prevent submission if deadline has passed
        if (isDeadlinePassed) {
            setSubmitError('De inschrijfdeadline voor deze activiteit is verstreken.');
            return;
        }

        if (!validateForm()) return;

        setIsSubmitting(true);
        setSubmitError(null);

        try {
            const signup = await eventsApi.createSignup({
                event_id: Number(eventId),
                email: formData.email,
                name: formData.name,
                phone_number: formData.phoneNumber,
                user_id: user?.id,
                event_name: event.name,
                event_date: event.event_date,
                event_price: applicablePrice
            });

            if (!signup || !signup.id) {
                throw new Error('Kon inschrijving niet aanmaken.');
            }

            // If it's a paid activity, initiate payment
            if (applicablePrice > 0) {
                const traceId = Math.random().toString(36).substring(7);
                const paymentPayload = {
                    amount: applicablePrice.toFixed(2),
                    description: `Inschrijving - ${event.name}`,
                    redirectUrl: window.location.origin + `/activiteiten/${eventId}?status=paid`,
                    registrationId: signup.id,
                    registrationType: 'event_signup',
                    email: formData.email,
                    firstName: formData.name.split(' ')[0],
                    lastName: formData.name.split(' ').slice(1).join(' '),
                    userId: user?.id,
                    isContribution: false,
                    qrToken: signup.qr_token // Add QR token to payment metadata
                };

                const paymentRes = await fetch('/api/payments/create', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Trace-Id': traceId
                    },
                    body: JSON.stringify(paymentPayload),
                });

                if (!paymentRes.ok) {
                    const errorData = await paymentRes.json();
                    throw new Error(errorData.details || errorData.error || 'Fout bij het aanmaken van de betaling.');
                }

                const paymentData = await paymentRes.json();
                if (paymentData.checkoutUrl) {
                    window.location.href = paymentData.checkoutUrl;
                    return;
                }
            }

            // Refresh status for free activity
            setSignupStatus({
                isSignedUp: true,
                paymentStatus: applicablePrice > 0 ? 'open' : 'paid',
            });

        } catch (error: any) {
            console.error('Signup error:', error);
            setSubmitError(error?.message || 'Er is iets misgegaan tijdens het inschrijven.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePayAgain = async () => {
        if (!signupStatus.isSignedUp || applicablePrice <= 0) return;

        setIsSubmitting(true);
        setSubmitError(null);

        try {
            // Find the signup ID (we should ideally have it in signupStatus)
            const query = new URLSearchParams({
                filter: JSON.stringify({
                    event_id: { _eq: eventId },
                    directus_relations: { _eq: user?.id },
                    participant_email: { _eq: formData.email }
                }),
                fields: 'id,qr_token'
            });

            const signups = await directusFetch<any[]>(`/items/event_signups?${query}`);
            if (!signups || signups.length === 0) {
                throw new Error('Inschrijving niet gevonden.');
            }

            const signupId = signups[0].id;
            const qrToken = signups[0].qr_token;

            const traceId = Math.random().toString(36).substring(7);
            const paymentPayload = {
                amount: applicablePrice.toFixed(2),
                description: `Betaling Inschrijving - ${event.name}`,
                redirectUrl: window.location.origin + `/activiteiten/${eventId}?status=paid`,
                registrationId: signupId,
                registrationType: 'event_signup',
                email: formData.email,
                firstName: formData.name.split(' ')[0],
                lastName: formData.name.split(' ').slice(1).join(' '),
                userId: user?.id,
                isContribution: false,
                qrToken: qrToken // Add QR token to payment metadata
            };

            const paymentRes = await fetch('/api/payments/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Trace-Id': traceId
                },
                body: JSON.stringify(paymentPayload),
            });

            if (!paymentRes.ok) {
                const errorData = await paymentRes.json();
                throw new Error(errorData.details || errorData.error || 'Fout bij het aanmaken van de betaling.');
            }

            const paymentData = await paymentRes.json();
            if (paymentData.checkoutUrl) {
                window.location.href = paymentData.checkoutUrl;
                return;
            }
        } catch (error: any) {
            console.error('Retry payment error:', error);
            setSubmitError(error?.message || 'Fout bij het herstarten van de betaling.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Loading State
    if (isLoading) {
        return (
            <div className="relative min-h-screen">
                <div className="absolute inset-0 bg-gradient-to-br from-oranje/10/80 via-transparent to-oranje/20/60" />
                <div className="relative z-10">
                    <div className="mx-auto max-w-app px-4 py-12">
                        <div className="h-96 animate-pulse rounded-3xl bg-white/60" />
                    </div>
                </div>
            </div>
        );
    }

    // Error State
    if (error || !event) {
        return (
            <div className="relative min-h-screen">
                <PageHeader
                    title="Activiteit niet gevonden"
                    backgroundImage="/img/backgrounds/Kroto2025.jpg"
                />
                <main className="mx-auto max-w-app px-4 py-8 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <p className="text-lg font-bold mb-4">De gevraagde activiteit kon niet worden gevonden.</p>
                        <button
                            onClick={() => router.push('/activiteiten')}
                            className="inline-flex items-center gap-2 bg-theme-purple text-white font-bold py-2 px-4 rounded-xl"
                        >
                            Terug naar activiteiten
                        </button>
                    </div>
                </main>
            </div>
        );
    }

    const headerFilter = isPast ? 'grayscale(100%) brightness(0.6) contrast(0.95)' : undefined;

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
                        <p className="text-lg sm:text-xl text-beige/90 max-w-3xl mx-auto mt-0">
                            Georganiseerd door {event.committee_name.replace(/\s*\|\|\s*SALVE MUNDI\s*/gi, '').trim()}
                        </p>
                    )}
                    {user && (
                        <div>
                            {/* Show attendance button if authorized */}
                            <AttendanceButton eventId={event.id} userId={user.id} />
                        </div>
                    )}
                </div>
            </PageHeader>

            <main className="mx-auto max-w-app px-4 py-8 sm:px-6 lg:px-8">
                {/* Two equal columns on md+: form (left) and compact info card (right); mobile stays stacked */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">


                    {/* Signup Form - Tall Tile (Right column) */}
                    <div className="md:col-span-1 md:row-span-3 rounded-3xl bg-[var(--bg-card)] dark:border dark:border-white/10 p-6 shadow-lg flex flex-col h-full">
                        <div className="flex-grow">
                            {isPaidAndHasQR ? (
                                // Digital ticket display case
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
                                // Already signed up
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
                                // Deadline passed
                                <div className="bg-slate-100 dark:bg-white/5 p-6 rounded-xl text-center h-full flex flex-col justify-center items-center">
                                    <h3 className="text-2xl font-bold text-slate-400 mb-2">Inschrijving Gesloten</h3>
                                    <p className="text-slate-500 dark:text-slate-400">De inschrijfdeadline voor deze activiteit is verstreken.</p>
                                </div>
                            ) : isPast ? (
                                // Past event
                                <div className="bg-slate-100 dark:bg-white/5 p-6 rounded-xl text-center h-full flex flex-col justify-center items-center">
                                    <h3 className="text-2xl font-bold text-slate-400 mb-2">Inschrijving Gesloten</h3>
                                    <p className="text-slate-500 dark:text-slate-400">Deze activiteit is al geweest.</p>
                                </div>
                            ) : (
                                // Signup Form
                                <div className="signup-form-container h-full flex flex-col">
                                    <h3 className="text-2xl font-bold text-theme-purple mb-6 flex items-center gap-2">
                                        <Users className="h-6 w-6 text-theme-purple" />
                                        Inschrijven
                                    </h3>
                                    <form onSubmit={handleSubmit} className="space-y-4 flex flex-col">
                                        {/* Name */}
                                        <div>
                                            <label htmlFor="name" className="block text-sm font-semibold text-theme-purple dark:text-white mb-1">Naam *</label>
                                            <input
                                                type="text"
                                                id="name"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                className={`w-full px-4 py-3 rounded-xl dark:!bg-white/10 dark:!border-white/30 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-paars focus:border-paars transition-all ${errors.name ? "ring-2 ring-red-500 !border-red-500" : ""}`}
                                                placeholder="Jouw naam"
                                            />
                                            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                                        </div>

                                        {/* Email */}
                                        <div>
                                            <label htmlFor="email" className="block text-sm font-semibold text-theme-purple dark:text-white mb-1">Email *</label>
                                            <input
                                                type="email"
                                                id="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                className={`w-full px-4 py-3 rounded-xl dark:!bg-white/10 dark:!border-white/30 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-paars focus:border-paars transition-all ${errors.email ? "ring-2 ring-red-500 !border-red-500" : ""}`}
                                                placeholder="naam.achternaam@salvemundi.nl"
                                            />
                                            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                                        </div>

                                        {/* Phone */}
                                        <div>
                                            <label htmlFor="phone" className="block text-sm font-semibold text-theme-purple dark:text-white mb-1">Telefoonnummer *</label>
                                            <input
                                                type="tel"
                                                id="phone"
                                                name="phoneNumber"
                                                value={formData.phoneNumber}
                                                onChange={handleInputChange}
                                                className={`w-full px-4 py-3 rounded-xl dark:!bg-white/10 dark:!border-white/30 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-paars focus:border-paars transition-all ${errors.phoneNumber ? "ring-2 ring-red-500 !border-red-500" : ""}`}
                                                placeholder="0612345678"
                                            />
                                            {errors.phoneNumber && <p className="text-red-500 text-sm mt-1">{errors.phoneNumber}</p>}
                                        </div>

                                        {/* Submit Button */}
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
                        {/* Date & Time - Compact */}
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

                        {/* Price - Compact */}
                        <div className="rounded-2xl bg-[var(--bg-card)] dark:border dark:border-white/10 p-6 shadow-md flex items-center gap-4">
                            <div className="h-12 w-12 rounded-lg bg-theme-purple/10 dark:bg-white/10 flex items-center justify-center text-theme-purple dark:text-theme-white">
                                <Euro className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-sm uppercase tracking-wide text-theme-purple/60 dark:text-theme-white/60 font-bold">Prijs</p>
                                <p className="text-base font-semibold text-theme-purple dark:text-theme-white">{displayPrice}</p>
                            </div>
                        </div>

                        {/* Location - Compact */}
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

                        {/* Committee - Compact */}
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

                        {/* Contact - Compact */}
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
                                    {/* Show explicit contact email if set on the event */}
                                    {event.contact && typeof event.contact === 'string' && event.contact.includes('@') && (
                                        <a href={`mailto:${event.contact}`} className="text-sm text-theme-purple/80 dark:text-theme-white/80 hover:underline break-all block mt-1">
                                            {event.contact}
                                        </a>
                                    )}
                                    {/* Fallback: show contact (e.g., phone) when it's not an email */}
                                    {event.contact && typeof event.contact === 'string' && !event.contact.includes('@') && (
                                        <p className="text-sm text-theme-purple/80 dark:text-theme-white/80 break-all mt-1">{event.contact}</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Description - Large Tile (2x2 on desktop) */}
                    {event.description && (
                        <div className="md:col-span-2 md:row-span-2 rounded-3xl bg-[var(--bg-card)] dark:border dark:border-white/10 p-8 shadow-lg flex flex-col">
                            <h2 className="mb-4 text-2xl font-bold text-theme-purple dark:text-theme-white flex items-center gap-2">
                                <Info className="h-6 w-6 text-theme-purple dark:text-theme-white" />
                                Over dit evenement
                            </h2>
                            <div
                                className="prose dark:prose-invert max-w-none text-theme-purple dark:text-theme-white/90 flex-grow"
                                dangerouslySetInnerHTML={{ __html: event.description }}
                            />
                        </div>
                    )}


                </div>
            </main>
        </>
    );
}
