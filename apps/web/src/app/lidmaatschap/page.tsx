'use client';

import { useState, useEffect } from 'react';
import { PhoneNumberInput } from '@/shared/components/PhoneNumberInput';
import { isValidPhoneNumber } from '@/shared/lib/phone';
import { useAuth } from '@/features/auth/providers/auth-provider';
import { User } from '@/shared/model/types/auth';
import PageHeader from '@/widgets/page-header/ui/PageHeader';
import { formatDateToLocalISO } from '@/shared/lib/utils/date';
import { validateCouponAction } from '@/features/coupons/api/coupon-actions';
import { createPaymentAction } from '@/shared/api/finance-actions';

const DeletionTimer = ({ expiryDateStr }: { expiryDateStr: string }) => {
    const [timeLeft, setTimeLeft] = useState<{ days: number, hours: number, minutes: number } | null>(null);

    useEffect(() => {
        if (!expiryDateStr) return;

        const expiryDate = new Date(expiryDateStr);
        const deletionDate = new Date(expiryDate);
        deletionDate.setFullYear(deletionDate.getFullYear() + 2);

        const calculateTimeLeft = () => {
            const now = new Date();
            const difference = deletionDate.getTime() - now.getTime();

            if (difference <= 0) {
                return { days: 0, hours: 0, minutes: 0 };
            }

            const days = Math.floor(difference / (1000 * 60 * 60 * 24));
            const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
            const minutes = Math.floor((difference / 1000 / 60) % 60);
            return { days, hours, minutes };
        };

        // Calculate immediately so we don't wait for the first interval tick
        setTimeLeft(calculateTimeLeft());

        const timer = setInterval(() => {
            const timeLeft = calculateTimeLeft();
            setTimeLeft(timeLeft);

            if (timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0) {
                clearInterval(timer);
            }
        }, 60000);

        return () => clearInterval(timer);
    }, [expiryDateStr]);

    if (!timeLeft || (timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0)) return null;

    return (
        <div className="bg-theme-purple/10 rounded-2xl p-4 mb-6 text-center border border-theme-purple/20">
            <p className="text-theme-purple font-bold uppercase text-xs tracking-wider mb-2">⚠️ Account Verwijdering (AVG)</p>
            <p className="text-theme-text-subtle text-sm mb-3">
                Je lidmaatschap is verlopen. Als je niet verlengt, worden je gegevens permanent verwijderd over:
            </p>
            <div className="text-2xl font-mono font-bold text-theme-purple">
                {timeLeft.days}d {timeLeft.hours}u {timeLeft.minutes}m
            </div>
        </div>
    );
};

export default function SignUp() {
    const { user: realUser } = useAuth();
    const [isMounted, setIsMounted] = useState(false);
    const [isMockExpired, setIsMockExpired] = useState(false);
    const [isMockCommittee, setIsMockCommittee] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const user = isMockExpired
        ? (realUser
            ? { ...realUser, is_member: false, membership_expiry: realUser.membership_expiry || new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(), committees: isMockCommittee ? [{ id: 'mock', name: 'Mock Committee' }] : realUser.committees }
            : { id: 'mock-id', first_name: 'Mock', last_name: 'Gebruiker', email: 'test@example.com', is_member: false, membership_expiry: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(), committees: isMockCommittee ? [{ id: 'mock', name: 'Mock Committee' }] : [] } as User
        )
        : realUser;

    const [form, setForm] = useState({
        voornaam: '',
        tussenvoegsel: '',
        achternaam: '',
        email: '',
        geboortedatum: '',
        telefoon: '',
        coupon: '',
    });

    const [couponStatus, setCouponStatus] = useState<{ valid: boolean; message: string; discount?: number; type?: string } | null>(null);
    const [verifyingCoupon, setVerifyingCoupon] = useState(false);

    const [isProcessing, setIsProcessing] = useState(false);
    const [phoneError, setPhoneError] = useState<string | null>(null);

    const isGuest = !user;
    const isValidMember = user && user.is_member;
    const isExpired = user && !user.is_member;
    const isCommitteeMember = user?.committees && user.committees.length > 0;
    const baseAmount = isCommitteeMember ? 10.00 : 20.00;

    let pageTitle = "WORD LID!";
    let formTitle = "Inschrijfformulier";

    if (isValidMember) {
        pageTitle = "MIJN LIDMAATSCHAP";
        formTitle = "Huidige Status";
    } else if (isExpired) {
        pageTitle = "LIDMAATSCHAP VERLENGEN";
        formTitle = "Verlengen";
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        if (e.target.name === 'telefoon' && phoneError) setPhoneError(null);
        if (e.target.name === 'coupon' && couponStatus) setCouponStatus(null);
    };

    const verifyCoupon = async () => {
        if (!form.coupon) return;
        const traceId = Math.random().toString(36).substring(7);
        console.info(`[Coupon][${traceId}] Verifying coupon: ${form.coupon}`);

        setVerifyingCoupon(true);
        setCouponStatus(null);

        try {
            const startTime = Date.now();
            const data = await validateCouponAction(form.coupon, traceId);
            const duration = Date.now() - startTime;

            console.group(`[Coupon][${traceId}] Result after ${duration}ms (Server Action)`);
            console.log('Payload:', data);
            console.groupEnd();

            if (data.valid) {
                console.info(`[Coupon][${traceId}] Success! Applied discount: ${data.discount_value}`);
                setCouponStatus({
                    valid: true,
                    message: `Korting toegepast: ${data.description}`,
                    discount: data.discount_value,
                    type: data.discount_type
                });
            } else {
                console.warn(`[Coupon][${traceId}] Invalid/Failed:`, data.error || 'Unknown');
                setCouponStatus({ valid: false, message: data.error || 'Ongeldige coupon code' });
            }
        } catch (error: any) {
            console.error(`[Coupon][${traceId}] Fatal Fetch Error:`, error.message);
            // Specific message for network interruptions/server restarts
            const isNetworkError = error.message.includes('fetch') || error.name === 'TypeError';
            setCouponStatus({
                valid: false,
                message: isNetworkError
                    ? 'Netwerkfout: De server is mogelijk aan het herstarten. Probeer het over 10 seconden opnieuw.'
                    : 'Kon coupon niet valideren'
            });
        } finally {
            setVerifyingCoupon(false);
        }
    };

    const initiateContributionPayment = async (): Promise<boolean> => {
        const traceId = Math.random().toString(36).substring(7);
        console.info(`[Payment][${traceId}] Initiating payment process...`);

        try {
            const payload = {
                amount: baseAmount.toFixed(2),
                description: 'Contributie Salve Mundi',
                redirectUrl: window.location.origin + '/lidmaatschap/bevestiging' + (isExpired ? '?type=renewal' : ''),
                isContribution: true, // Make sure backend expects this boolean
                userId: user ? user.id : null,
                firstName: user ? undefined : form.voornaam,
                lastName: user ? undefined : form.achternaam,
                email: user ? user.email : form.email,
                dateOfBirth: form.geboortedatum ? form.geboortedatum : undefined,
                phoneNumber: form.telefoon,
                couponCode: couponStatus?.valid ? form.coupon : undefined
            };

            console.log(`[Payment][${traceId}] Payload:`, payload);

            const result = await createPaymentAction(payload, traceId);
            console.log(`[Payment][${traceId}] Result:`, result);

            if (result.success && (result.checkoutUrl || result.paymentId)) {
                // If we get a checkoutUrl (Mollie) or just a paymentId (Free transaction), proceed
                if (result.checkoutUrl) {
                    console.info(`[Payment][${traceId}] Redirecting to Mollie: ${result.checkoutUrl}`);
                    window.location.href = result.checkoutUrl;
                } else {
                    console.info(`[Payment][${traceId}] Free transaction completed. ID: ${result.paymentId}`);
                }
                return true;
            } else {
                console.error(`[Payment][${traceId}] Creation failed:`, result.error);
                alert(`Er went iets mis: ${result.error || 'Onbekende fout'}`);
                setIsProcessing(false);
                return false;
            }
        } catch (error: any) {
            console.error(`[Payment][${traceId}] Connection error:`, error.message);
            alert('Er ging iets mis bij de verbinding voor de betaling.');
            setIsProcessing(false);
            return false;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setPhoneError(null);

        if (!isValidPhoneNumber(form.telefoon)) {
            setPhoneError('Ongeldig telefoonnummer');
            return;
        }

        setIsProcessing(true);

        try {
            const success = await initiateContributionPayment();
            if (!success) {
                // initiateContributionPayment already handled alert regarding error
                return;
            }

            // Check if we're in development environment
            const isDev = typeof window !== 'undefined' && (
                window.location.hostname.includes('dev.') ||
                window.location.hostname.includes('localhost') ||
                window.location.hostname.includes('127.0.0.1')
            );

            if (isDev && isGuest) {
                // Only show this if we didn't redirect (which happens for paid tx)
                // But typically window.location.href kills the page so this won't show for paid.
                // For free transactions (if we supported redirectUrl there properly), it might.
                // safe to leave for now as "Success fallback"
            }
        } catch (error) {
            console.error('Payment initiation failed:', error);
            alert('Er is een fout opgetreden bij het initiëren van de betaling. Probeer het opnieuw.');
        } finally {
            // Only stop processing if we are NOT redirecting (i.e. if it failed)
            // But since we returned false on failure, we are here. 
            // If it succeeded, we might be redirecting, so unmounting.
            // But just in case:
            setIsProcessing(false);
        }
    };

    useEffect(() => {
        if (user) {
            setForm(prev => ({
                ...prev,
                voornaam: user.first_name || prev.voornaam,
                achternaam: user.last_name || prev.achternaam,
                email: user.email || prev.email,
                telefoon: user.phone_number || prev.telefoon,
                geboortedatum: user.date_of_birth ? formatDateToLocalISO(user.date_of_birth) : prev.geboortedatum,
            }));
        }
    }, [user]);

    return (
        <>
            <div className="flex flex-col w-full">
                <PageHeader
                    title={pageTitle}
                    backgroundImage="/img/backgrounds/homepage-banner.jpg"
                    backgroundPosition="center 75%"
                    /* match activiteiten banner size and add a subtle blur */
                    contentPadding="py-20"
                    variant="centered"
                    titleClassName="text-theme-purple dark:text-theme-white text-3xl sm:text-4xl md:text-6xl drop-shadow-sm"
                    description={
                        <p className="text-lg sm:text-xl text-theme-purple dark:text-theme-white max-w-3xl mt-4 font-medium drop-shadow-sm mx-auto">
                            Beheer je lidmaatschap bij Salve Mundi.
                        </p>
                    }
                />
            </div>

            <main className="">
                {isMounted && (
                    window.location.hostname.includes('dev.') ||
                    window.location.hostname.includes('localhost') ||
                    window.location.hostname.includes('127.0.0.1')
                ) && (
                        <div className="mx-6 sm:mx-10 mt-6 p-4 bg-theme-purple/20 border border-theme-purple/50 rounded-2xl flex flex-wrap gap-4 items-center justify-between shadow-lg backdrop-blur-sm">
                            <div className="flex items-center gap-3">
                                <span className="flex h-3 w-3 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-theme-purple-lighter opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-theme-purple-lighter"></span>
                                </span>
                                <span className="text-theme-purple font-bold text-xs uppercase tracking-widest">Dev Mode</span>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setIsMockCommittee(!isMockCommittee)}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 border-2 ${isMockCommittee
                                        ? 'bg-theme-purple text-white border-theme-purple shadow-[0_0_15px_rgba(102,50,101,0.2)]'
                                        : 'bg-transparent text-theme-purple border-theme-purple/50 hover:bg-theme-purple/10'
                                        }`}
                                >
                                    {isMockCommittee ? '✅ Committee' : 'Simuleer Commissie'}
                                </button>
                                <button
                                    onClick={() => setIsMockExpired(!isMockExpired)}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 border-2 ${isMockExpired
                                        ? 'bg-theme-purple text-white border-theme-purple shadow-[0_0_15px_rgba(102,50,101,0.2)]'
                                        : 'bg-transparent text-theme-purple border-theme-purple/50 hover:bg-theme-purple/10'
                                        }`}
                                >
                                    {isMockExpired ? '✅ Mocking Expired' : 'Simuleer Verlopen Account'}
                                </button>
                            </div>
                        </div>
                    )}
                <div className="flex flex-col sm:flex-row gap-6 px-6 py-8 sm:py-10 md:py-12">
                    <section className="w-full sm:w-1/2 bg-[var(--bg-card)] dark:border dark:border-white/10 rounded-3xl shadow-lg p-6 sm:p-8">
                        <h1 className="text-3xl font-bold text-theme-purple dark:text-theme-white mb-6">
                            {formTitle}
                        </h1>

                        {isValidMember && (
                            <div className="text-theme-text">
                                <div className="bg-green-500/10 border border-green-500/20 p-5 rounded-2xl mb-6 flex items-start gap-4">
                                    <div className="bg-green-500 rounded-full p-1 mt-0.5">
                                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="font-bold text-green-600 dark:text-green-400 text-lg">Actief Lid</p>
                                        <p className="text-sm text-theme-text-subtle">Je bent een volwaardig lid van Salve Mundi.</p>
                                    </div>
                                </div>

                                <p className="mb-6 text-lg">
                                    Welkom terug, <span className="font-bold text-theme-purple">{user.first_name}</span>!
                                </p>

                                <div className="bg-theme-purple/5 border border-theme-purple/10 p-5 rounded-2xl mb-8">
                                    <p className="text-xs text-theme-purple font-bold uppercase tracking-widest mb-3">Jouw gegevens</p>
                                    <div className="space-y-1">
                                        <p className="text-theme-text font-bold text-lg leading-tight flex flex-wrap gap-x-1">
                                            <span>{user.first_name}</span>
                                            {user.last_name && <span>{user.last_name}</span>}
                                        </p>
                                        <p className="text-theme-text-muted text-sm break-all leading-snug">
                                            {user.email?.includes('@') ? (
                                                <>
                                                    {user.email.split('@')[0]}@
                                                    <wbr />
                                                    {user.email.split('@')[1]}
                                                </>
                                            ) : user.email}
                                        </p>
                                    </div>
                                    {user.membership_expiry && (
                                        <div className="mt-4 pt-4 border-t border-theme-purple/10">
                                            <p className="text-theme-text-muted text-sm flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-theme-purple/40"></span>
                                                Geldig tot: <span className="font-semibold text-theme-text">{new Date(user.membership_expiry.includes('T') || user.membership_expiry.includes(' ') ? user.membership_expiry : `${user.membership_expiry}T12:00:00`).toLocaleDateString('nl-NL')}</span>
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <p className="text-sm text-theme-text-light italic text-center">
                                    Je hoeft op dit moment geen actie te ondernemen.
                                </p>
                            </div>
                        )}

                        {isExpired && (
                            <div className="text-theme-text">
                                {user.membership_expiry && <DeletionTimer expiryDateStr={user.membership_expiry} />}

                                <div className="mb-6">
                                    <p className="mb-2 text-2xl font-bold text-theme-purple">
                                        Welkom terug, {user.first_name}.
                                    </p>
                                    <p className="text-theme-text-subtle text-lg leading-relaxed">
                                        Je lidmaatschap is verlopen. Om weer toegang te krijgen tot alle activiteiten en je account te behouden, vragen we je de jaarlijkse contributie te voldoen.
                                    </p>
                                </div>

                                <div className="bg-theme-purple/5 border border-theme-purple/10 rounded-2xl p-6 mb-8">
                                    <p className="text-sm font-bold text-theme-purple uppercase tracking-widest mb-4">Verlenging</p>
                                    <button
                                        onClick={() => { setIsProcessing(true); initiateContributionPayment(); }}
                                        disabled={isProcessing}
                                        className="form-button shadow-glow transition-transform active:scale-95"
                                    >
                                        {isProcessing ? 'Verwerken...' : `Nu Verlengen (€${baseAmount.toFixed(2).replace('.', ',')})`}
                                    </button>
                                </div>
                            </div>
                        )}

                        {isGuest && (
                            <form className="flex text-start flex-col gap-4" onSubmit={handleSubmit}>
                                <p className="text-theme-text dark:text-theme-white mb-2">Vul je gegevens in om een account aan te maken en lid te worden.</p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <label htmlFor="voornaam" className="form-label">
                                        Voornaam
                                        <input type="text" id="voornaam" name="voornaam" autoComplete="given-name" value={form.voornaam} onChange={handleChange} required className="form-input mt-1" suppressHydrationWarning={true} />
                                    </label>
                                    <label htmlFor="achternaam" className="form-label">
                                        Achternaam
                                        <input type="text" id="achternaam" name="achternaam" autoComplete="family-name" value={form.achternaam} onChange={handleChange} required className="form-input mt-1" suppressHydrationWarning={true} />
                                    </label>
                                </div>

                                <label htmlFor="email" className="form-label">
                                    E-mail
                                    <input type="email" id="email" name="email" autoComplete="email" value={form.email} onChange={handleChange} required className="form-input mt-1" suppressHydrationWarning={true} />
                                </label>

                                <label htmlFor="geboortedatum" className="form-label">
                                    Geboortedatum
                                    <input
                                        type="date"
                                        id="geboortedatum"
                                        name="geboortedatum"
                                        autoComplete="bday"
                                        value={form.geboortedatum}
                                        onChange={handleChange}
                                        className="form-input mt-1 w-full"
                                        suppressHydrationWarning={true}
                                    />
                                </label>

                                <label className="form-label">
                                    Telefoonnummer
                                    <PhoneNumberInput
                                        value={form.telefoon}
                                        onChange={(val) => handleChange({ target: { name: 'telefoon', value: val || '' } } as any)}
                                        required
                                        error={phoneError || undefined}
                                    />
                                </label>

                                <div className="border-t border-theme-purple/10 pt-6 mt-6">
                                    <label htmlFor="coupon" className="form-label mb-2">Heb je een coupon code?</label>
                                    <div className="flex gap-2">
                                        <input
                                            id="coupon"
                                            name="coupon"
                                            type="text"
                                            value={form.coupon}
                                            onChange={handleChange}
                                            placeholder="Bijv. SALVEMUNDI2024"
                                            className="form-input flex-1"
                                            suppressHydrationWarning={true}
                                        />
                                        <button
                                            type="button"
                                            onClick={verifyCoupon}
                                            disabled={!form.coupon || verifyingCoupon}
                                            className="bg-theme-purple text-white font-bold px-4 rounded-xl hover:bg-theme-purple-light disabled:opacity-50 transition-all shadow-md min-w-[100px] flex items-center justify-center gap-2"
                                        >
                                            {verifyingCoupon ? (
                                                <>
                                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                                    <span>...</span>
                                                </>
                                            ) : 'Check'}
                                        </button>
                                    </div>
                                    {couponStatus && (
                                        <p className={`text-sm mt-2 font-bold ${couponStatus.valid ? 'text-green-400' : 'text-red-300'}`}>
                                            {couponStatus.message}
                                        </p>
                                    )}

                                    {/* Summary of price */}
                                    <div className="mt-6 flex justify-between items-center text-theme-text font-bold text-lg p-4 bg-theme-purple/5 rounded-2xl">
                                        <span>Totaal:</span>
                                        <span>
                                            {couponStatus?.valid && couponStatus.discount ? (
                                                <>
                                                    <span className="line-through text-theme-text-muted/50 text-sm mr-2">€20,00</span>
                                                    <span className="text-theme-purple">
                                                        {couponStatus.type === 'percentage'
                                                            ? `€${(20 * (1 - couponStatus.discount / 100)).toFixed(2).replace('.', ',')}`
                                                            : `€${Math.max(0, 20 - couponStatus.discount).toFixed(2).replace('.', ',')}`
                                                        }
                                                    </span>
                                                </>
                                            ) : (
                                                <span className="text-theme-purple">€20,00</span>
                                            )}
                                        </span>
                                    </div>
                                </div>

                                <button type="submit" disabled={isProcessing} className="form-button mt-4 flex items-center justify-center gap-3">
                                    {isProcessing ? (
                                        <>
                                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                            <span>Verwerken...</span>
                                        </>
                                    ) : (
                                        `Betalen en Inschrijven (€${baseAmount.toFixed(2).replace('.', ',')})`
                                    )}
                                </button>
                            </form>
                        )}
                    </section>

                    <div className="w-full sm:w-1/2 flex flex-col gap-6">
                        <div className="w-full text-center bg-[var(--bg-card)] dark:border dark:border-white/10 rounded-3xl p-6">
                            <h2 className="text-2xl font-bold text-theme-purple dark:text-theme-white mb-2">
                                Waarom lid worden?
                            </h2>
                            <p className="text-lg mb-4 text-theme-text dark:text-theme-white/90">
                                Als lid van Salve Mundi krijg je toegang tot exclusieve
                                activiteiten, workshops, borrels en nog veel meer! Word vandaag
                                nog lid en ontdek de wereld van ICT samen met ons.
                            </p>
                        </div>
                    </div>
                </div>
            </main >
        </>
    );
}

