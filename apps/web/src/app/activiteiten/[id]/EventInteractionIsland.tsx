'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PhoneNumberInput } from '@/shared/components/PhoneNumberInput';
import QRDisplay from '@/entities/activity/ui/QRDisplay';
import { CheckCircle, Users } from 'lucide-react';
import { createEventSignupAction, getEventSignupStatusAction } from '@/shared/api/event-actions';
import { createPaymentAction } from '@/shared/api/finance-actions';

interface EventInteractionIslandProps {
    event: any;
    user: any | null;
    initialSignup: any | null;
    isPast: boolean;
    isDeadlinePassed: boolean;
    applicablePrice: number;
    displayPrice: string;
    formattedDate: string | null;
    loginRedirectUrl: string;
}

export default function EventInteractionIsland({
    event,
    user,
    initialSignup,
    isPast,
    isDeadlinePassed,
    applicablePrice,
    displayPrice,
    formattedDate,
    loginRedirectUrl
}: EventInteractionIslandProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [signupStatus, setSignupStatus] = useState<{
        isSignedUp: boolean;
        paymentStatus?: 'paid' | 'open' | 'failed' | 'canceled';
        qrToken?: string;
        signupId?: number;
    }>({
        isSignedUp: !!initialSignup,
        paymentStatus: initialSignup?.payment_status,
        qrToken: initialSignup?.qr_token,
        signupId: initialSignup?.id
    });

    const [formData, setFormData] = useState({
        name: user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : "",
        email: user?.email || "",
        phoneNumber: user?.phone_number || "",
        website: "", // Honeypot
    });

    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    // Hydrate payment status from URL if missing
    useEffect(() => {
        const statusParam = searchParams.get('status');
        if (statusParam === 'paid') {
            setSignupStatus(prev => ({
                ...prev,
                isSignedUp: true,
                paymentStatus: 'paid',
                qrToken: prev.qrToken || 'status-verified'
            }));
        } else if (user && event?.id && !initialSignup) {
            // Re-check just in case
            (async () => {
                const signup = await getEventSignupStatusAction(event.id, user.id);
                if (signup) {
                    setSignupStatus({
                        isSignedUp: true,
                        paymentStatus: signup.payment_status,
                        qrToken: signup.qr_token,
                        signupId: signup.id
                    });
                }
            })();
        }
    }, [searchParams, user, event?.id, initialSignup]);

    const isPaidAndHasQR = signupStatus.isSignedUp && signupStatus.paymentStatus === 'paid' && !!signupStatus.qrToken;

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

        if (formData.website) {
            setSignupStatus({ isSignedUp: true, paymentStatus: 'paid' });
            return;
        }

        if (formData.name.match(/https?:\/\//) || formData.name.includes('www.') || formData.name.includes('http')) {
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

            if (applicablePrice > 0 && signupResult.isRecycled !== true && signup.payment_status !== 'paid') {
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
        if (!signupStatus.isSignedUp || applicablePrice <= 0) return;
        setIsSubmitting(true);
        setSubmitError(null);

        try {
            let signupId = signupStatus.signupId;
            let qrToken = signupStatus.qrToken;

            if (!signupId && user) {
                const signup = await getEventSignupStatusAction(event.id, user.id);
                if (signup) {
                    signupId = signup.id;
                    qrToken = signup.qr_token;
                }
            }

            if (!signupId) throw new Error('Inschrijving niet gevonden. Neem contact op.');

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

    return (
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
                                We zien je graag {formattedDate ? `op ${formattedDate}` : 'dan'}.
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
                            <Users className="h-10 w-10 text-amber-500 transition-transform group-hover:scale-110" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Leden Alleen</h3>
                        <p className="text-slate-600 dark:text-white/80 mb-6">
                            Deze activiteit is exclusief toegankelijk voor leden van Salve Mundi.
                        </p>
                        {!user ? (
                            <button
                                onClick={() => router.push(loginRedirectUrl)}
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
                                />
                                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                            </div>

                            <PhoneNumberInput
                                value={formData.phoneNumber}
                                onChange={(val) => {
                                    setFormData(prev => ({ ...prev, phoneNumber: val || '' }));
                                    if (errors.phoneNumber) setErrors(prev => ({ ...prev, phoneNumber: "" }));
                                }}
                                required
                                error={errors.phoneNumber}
                            />

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
    );
}
