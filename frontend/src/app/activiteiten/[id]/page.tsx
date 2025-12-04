'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/providers/auth-provider';
import { useSalvemundiEvent } from '@/shared/lib/hooks/useSalvemundiApi';
import { eventsApi, getImageUrl } from '@/shared/lib/api/salvemundi';
import { directusFetch } from '@/shared/lib/directus';
import PageHeader from '@/widgets/page-header/ui/PageHeader';
import {
    CalendarClock,
    Euro,
    Users as UsersIcon,
    Mail,
    Info,
    CheckCircle,
    Users
} from 'lucide-react';

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

    // Check for existing signup
    useEffect(() => {
        const checkSignupStatus = async () => {
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
                    setSignupStatus({ isSignedUp: false });
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
        return new Date(event.event_date).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
    }, [event]);

    // Calculate price based on membership (if we knew it) or just display both/one
    // The modal used `activity.price`, but our event object has `price_members` and `price_non_members`
    // We'll try to be smart about it
    const displayPrice = useMemo(() => {
        if (!event) return 'Loading...';
        if (event.price_members === 0 && event.price_non_members === 0) return 'Gratis';
        if (event.price_members === event.price_non_members) return `€${Number(event.price_members).toFixed(2)}`;
        return `€${Number(event.price_members).toFixed(2)} (leden) / €${Number(event.price_non_members).toFixed(2)}`;
    }, [event]);

    const isPast = event ? new Date(event.event_date) < new Date() : false;
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
        if (!validateForm()) return;

        setIsSubmitting(true);
        setSubmitError(null);

        try {
            await eventsApi.createSignup({
                event_id: Number(eventId),
                email: formData.email,
                name: formData.name,
                phone_number: formData.phoneNumber,
                user_id: user?.id,
                event_name: event.name,
                event_date: event.event_date,
                // Use member price if user is logged in (assumption), or non-member price
                // Ideally backend handles this logic or we check membership status
                event_price: user ? event.price_members : event.price_non_members
            });

            // Refresh status
            setSignupStatus({
                isSignedUp: true,
                paymentStatus: 'open', // Default to open for new signups
            });

        } catch (error: any) {
            console.error('Signup error:', error);
            setSubmitError(error?.message || 'Er is iets misgegaan tijdens het inschrijven.');
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
                <div className="mx-auto max-w-app px-4 py-12">
                    <div className="rounded-3xl bg-white/80 p-8 text-center shadow-lg">
                        <p className="mb-4 text-lg font-semibold text-theme-purple-dark">
                            De gevraagde activiteit kon niet worden gevonden
                        </p>
                        <button
                            onClick={() => router.push('/activiteiten')}
                            className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-oranje to-red-600 px-6 py-3 font-semibold text-white shadow-lg transition hover:-translate-y-0.5"
                        >
                            Terug naar activiteiten
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <PageHeader
                title={event.name}
                backgroundImage={event.image ? getImageUrl(event.image) : '/img/backgrounds/Kroto2025.jpg'}
            >
                {event.committee_name && (
                    <p className="text-lg sm:text-xl text-beige/90 max-w-3xl mx-auto mt-4">
                        Georganiseerd door {event.committee_name.replace(/\s*\|\|\s*SALVE MUNDI\s*/gi, '').trim()}
                    </p>
                )}
            </PageHeader>

            <main className="mx-auto max-w-app px-4 py-8 sm:px-6 lg:px-8">
                {/* Two equal columns on md+: form (left) and compact info card (right); mobile stays stacked */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">


                    {/* Signup Form - Tall Tile (Right column) */}
                    <div className="md:col-span-1 md:row-span-3 rounded-3xl bg-gradient-to-br from-theme-gradient-start to-theme-gradient-end p-6 shadow-lg flex flex-col h-full">
                        <div className="flex-grow">
                                {isPaidAndHasQR ? (
                                // Digital ticket display case
                                <div className="space-y-6 text-slate-900 dark:text-white h-full flex flex-col justify-center">
                                    <h3 className="text-2xl font-extrabold text-theme-purple-dark text-center">🎉 Inschrijving Definitief!</h3>
                                    <p className="text-center text-lg text-slate-600 dark:text-white/90">
                                        Je bent succesvol ingeschreven en betaald voor {event.name}.
                                    </p>

                                    <div className="flex justify-center bg-white p-4 rounded-xl border-2 border-dashed border-slate-300">
                                        {/* Placeholder for QR Display */}
                                        <div className="text-center text-slate-400 py-8">QR Code</div>
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
                                        <p className="text-slate-600 dark:text-white/80">
                                            Je inschrijving is in afwachting van betaling. Controleer je e-mail voor de betaallink.
                                        </p>
                                    ) : (
                                        <p className="text-slate-600 dark:text-white/80">
                                            We zien je graag op {formattedDate}.
                                        </p>
                                    )}
                                </div>
                            ) : isPast ? (
                                // Past event
                                <div className="bg-slate-100 dark:bg-white/5 p-6 rounded-xl text-center h-full flex flex-col justify-center items-center">
                                    <h3 className="text-2xl font-bold text-slate-400 mb-2">Inschrijving Gesloten</h3>
                                    <p className="text-slate-500 dark:text-slate-400">Deze activiteit is al geweest.</p>
                                </div>
                            ) : (
                                // Signup Form
                                <div className="h-full flex flex-col">
                                    <h3 className="text-2xl font-bold text-theme-purple mb-6 flex items-center gap-2">
                                        <Users className="h-6 w-6 text-theme-purple" />
                                        Inschrijven
                                    </h3>
                                    <form onSubmit={handleSubmit} className="space-y-4 flex flex-col">
                                        {/* Name */}
                                        <div>
                                            <label htmlFor="name" className="block text-theme-purple font-semibold mb-2">Naam *</label>
                                            <input
                                                type="text"
                                                id="name"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                className={`w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-white/10 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-paars transition-all ${errors.name ? "ring-2 ring-red-500" : ""}`}
                                                placeholder="Jouw naam"
                                            />
                                            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                                        </div>

                                        {/* Email */}
                                        <div>
                                            <label htmlFor="email" className="block text-theme-purple font-semibold mb-2">Email *</label>
                                            <input
                                                type="email"
                                                id="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                className={`w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-white/10 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-paars transition-all ${errors.email ? "ring-2 ring-red-500" : ""}`}
                                                placeholder="naam.achternaam@salvemundi.nl"
                                            />
                                            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                                        </div>

                                        {/* Phone */}
                                        <div>
                                            <label htmlFor="phoneNumber" className="block text-theme-purple font-semibold mb-2">Telefoonnummer *</label>
                                            <input
                                                type="tel"
                                                id="phoneNumber"
                                                name="phoneNumber"
                                                value={formData.phoneNumber}
                                                onChange={handleInputChange}
                                                className={`w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-white/10 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-paars transition-all ${errors.phoneNumber ? "ring-2 ring-red-500" : ""}`}
                                                placeholder="0612345678"
                                            />
                                            {errors.phoneNumber && <p className="text-red-500 text-sm mt-1">{errors.phoneNumber}</p>}
                                        </div>

                                        {/* Submit Button */}
                                        <div className="pt-6">
                                            <button
                                                type="submit"
                                                disabled={isSubmitting}
                                                className="w-full bg-theme-purple text-theme-purple-darker font-bold py-4 px-6 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                            >
                                                {isSubmitting ? (
                                                    <>
                                                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                                        Bezig...
                                                    </>
                                                ) : (
                                                    'AANMELDEN'
                                                )}
                                            </button>
                                        </div>
                                        {submitError && <p className="text-red-500 font-semibold text-center mt-3">{submitError}</p>}
                                    </form>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Date & Time - Small Tile */}
                    <div className="rounded-3xl  bg-gradient-to-br from-theme-gradient-start to-theme-gradient-end p-6 shadow-lg flex flex-col items-center justify-center text-center gap-3 hover:scale-[1.02] transition-transform">
                        <div className="h-12 w-12 rounded-2xl bg-paars/10 flex items-center justify-center text-theme-purple-dark">
                            <CalendarClock className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-wide text-theme-purple-dark dark:text-white/70 font-bold">Datum & Tijd</p>
                            <p className="text-lg font-bold text-theme-purple dark:text-white">{formattedDate}</p>
                            <p className="text-sm text-theme-purple-dark dark:text-white/80">{formattedTime}</p>
                        </div>
                    </div>

                    {/* Price - Small Tile */}
                    <div className="rounded-3xl bg-gradient-to-br from-theme-gradient-start to-theme-gradient-end p-6 shadow-lg flex flex-col items-center justify-center text-center gap-3 hover:scale-[1.02] transition-transform">
                        <div className="h-12 w-12 rounded-2xl bg-paars/10 flex items-center justify-center text-theme-purple-dark">
                            <Euro className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-wide text-theme-purple-dark dark:text-white/70 font-bold">Prijs</p>
                            <p className="text-lg font-bold text-theme-purple dark:text-white">{displayPrice}</p>
                        </div>
                    </div>

                    {/* Committee - Small Tile */}
                    {event.committee_name && (
                        <div className="rounded-3xl bg-gradient-to-br from-theme-gradient-start to-theme-gradient-end p-6 shadow-lg flex flex-col items-center justify-center text-center gap-3 hover:scale-[1.02] transition-transform">
                            <div className="h-12 w-12 rounded-2xl bg-paars/10 flex items-center justify-center text-theme-purple-dark">
                                <UsersIcon className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-wide text-theme-purple-dark dark:text-white/70 font-bold">Organisatie</p>
                                <p className="text-lg font-bold text-theme-purple dark:text-white">
                                    {event.committee_name.replace(/\s*\|\|\s*SALVE MUNDI\s*/gi, '').trim()}
                                </p>
                            </div>
                        </div>



                    {/* Contact - Small Tile */}
                    {(event.contact_name || committeeEmail) && (
                        <div className="rounded-3xl bg-gradient-to-br from-theme-gradient-start to-theme-gradient-end p-6 shadow-lg flex flex-col items-center justify-center text-center gap-3 hover:scale-[1.02] transition-transform">
                            <div className="h-12 w-12 rounded-2xl bg-paars/10 flex items-center justify-center text-theme-purple-dark">
                                <Mail className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-wide text-theme-purple-dark dark:text-white/70 font-bold">Contact</p>
                                {event.contact_name && (
                                    <p className="text-sm font-semibold text-theme-purple dark:text-white">{event.contact_name}</p>
                                )}
                                {committeeEmail && (
                                    <a href={`mailto:${committeeEmail}`} className="text-sm text-theme-purple hover:underline break-all">
                                        {committeeEmail}
                                    </a>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Description - Large Tile (2x2 on desktop) */}
                    {event.description && (
                        <div className="md:col-span-2 md:row-span-2 rounded-3xl bg-gradient-to-br from-theme-gradient-start to-theme-gradient-end p-8 shadow-lg flex flex-col">
                            <h2 className="mb-4 text-2xl font-bold text-theme-purple dark:text-white flex items-center gap-2">
                                <Info className="h-6 w-6 text-theme-purple-dark" />
                                Over dit evenement
                            </h2>
                            <div
                                className="prose dark:prose-invert max-w-none text-theme-purple dark:text-ink-muted flex-grow"
                                dangerouslySetInnerHTML={{ __html: event.description }}
                            />
                        </div>
                    )}


                </div>
            </main>
        </>
    );
}
