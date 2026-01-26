'use client';

import { useState, useEffect } from 'react';
import { isValidPhoneNumber } from '@/shared/lib/phone';
import { useAuth } from '@/features/auth/providers/auth-provider';
import { User } from '@/shared/model/types/auth';
import PageHeader from '@/widgets/page-header/ui/PageHeader';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { nl } from 'date-fns/locale';

const DeletionTimer = ({ expiryDateStr }: { expiryDateStr: string }) => {
    const [timeLeft, setTimeLeft] = useState<{ days: number, hours: number, minutes: number } | null>(null);

    useEffect(() => {
        if (!expiryDateStr) return;

        const expiryDate = new Date(expiryDateStr);
        const deletionDate = new Date(expiryDate);
        deletionDate.setFullYear(deletionDate.getFullYear() + 2);

        const timer = setInterval(() => {
            const now = new Date();
            const difference = deletionDate.getTime() - now.getTime();

            if (difference <= 0) {
                setTimeLeft({ days: 0, hours: 0, minutes: 0 });
                clearInterval(timer);
            } else {
                const days = Math.floor(difference / (1000 * 60 * 60 * 24));
                const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
                const minutes = Math.floor((difference / 1000 / 60) % 60);
                setTimeLeft({ days, hours, minutes });
            }
        }, 60000);

        return () => clearInterval(timer);
    }, [expiryDateStr]);

    if (!timeLeft || (timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0)) return null;

    return (
        <div className="bg-theme-purple/10 rounded-lg p-4 mb-6 text-center">
            <p className="text-theme-purple font-bold uppercase text-sm mb-1">⚠️ Account Verwijdering (AVG)</p>
            <p className="text-theme-white text-sm mb-2">
                Je lidmaatschap is verlopen. Als je niet verlengt, worden je gegevens permanent verwijderd over:
            </p>
            <div className="text-2xl font-mono font-bold text-theme-purple-lighter">
                {timeLeft.days}d {timeLeft.hours}u {timeLeft.minutes}m
            </div>
        </div>
    );
};

export default function SignUp() {
    const { user: realUser } = useAuth();
    const [isMockExpired, setIsMockExpired] = useState(false);
    const [isMockCommittee, setIsMockCommittee] = useState(false);

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
        geboortedatum: null as Date | null,
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
    };

    const verifyCoupon = async () => {
        if (!form.coupon) return;
        const traceId = Math.random().toString(36).substring(7);
        console.info(`[Coupon][${traceId}] Verifying coupon: ${form.coupon}`);

        setVerifyingCoupon(true);
        setCouponStatus(null);

        try {
            const startTime = Date.now();
            const response = await fetch('/api/coupons/validate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Trace-Id': traceId
                },
                body: JSON.stringify({ couponCode: form.coupon }),
            });

            const duration = Date.now() - startTime;
            const data = await response.json();

            console.group(`[Coupon][${traceId}] Result after ${duration}ms`);
            console.log('Status:', response.status);
            console.log('Payload:', data);
            console.groupEnd();

            if (response.ok && data.valid) {
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
            setCouponStatus({ valid: false, message: 'Kon coupon niet valideren' });
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
                dateOfBirth: form.geboortedatum ? form.geboortedatum.toISOString().split('T')[0] : undefined,
                couponCode: couponStatus?.valid ? form.coupon : undefined
            };

            console.log(`[Payment][${traceId}] Payload:`, payload);

            const response = await fetch('/api/payments/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Trace-Id': traceId
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();
            console.log(`[Payment][${traceId}] Response (${response.status}):`, data);

            if (response.ok && (data.checkoutUrl || data.paymentId)) {
                // If we get a checkoutUrl (Mollie) or just a paymentId (Free transaction), proceed
                if (data.checkoutUrl) {
                    console.info(`[Payment][${traceId}] Redirecting to Mollie: ${data.checkoutUrl}`);
                    window.location.href = data.checkoutUrl;
                } else {
                    console.info(`[Payment][${traceId}] Free transaction completed. ID: ${data.paymentId}`);
                }
                return true;
            } else {
                console.error(`[Payment][${traceId}] Creation failed:`, data.error);
                alert(`Er went iets mis: ${data.error || 'Onbekende fout'}`);
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
                {typeof window !== 'undefined' && (
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
                                <span className="text-theme-purple-lighter font-bold text-xs uppercase tracking-widest">Dev Mode</span>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setIsMockCommittee(!isMockCommittee)}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 border-2 ${isMockCommittee
                                        ? 'bg-theme-purple-lighter text-theme-purple border-theme-purple-lighter shadow-[0_0_15px_rgba(180,160,255,0.4)]'
                                        : 'bg-transparent text-theme-purple-lighter border-theme-purple-lighter/50 hover:bg-theme-purple-lighter/10'
                                        }`}
                                >
                                    {isMockCommittee ? '✅ Committee' : 'Simuleer Commissie'}
                                </button>
                                <button
                                    onClick={() => setIsMockExpired(!isMockExpired)}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 border-2 ${isMockExpired
                                        ? 'bg-theme-purple-lighter text-theme-purple border-theme-purple-lighter shadow-[0_0_15px_rgba(180,160,255,0.4)]'
                                        : 'bg-transparent text-theme-purple-lighter border-theme-purple-lighter/50 hover:bg-theme-purple-lighter/10'
                                        }`}
                                >
                                    {isMockExpired ? '✅ Mocking Expired' : 'Simuleer Verlopen Account'}
                                </button>
                            </div>
                        </div>
                    )}
                <div className="flex flex-col sm:flex-row gap-6 px-6 py-8 sm:py-10 md:py-12">
                    <section className="w-full sm:w-1/2 bg-gradient-theme rounded-3xl shadow-xl p-6 sm:p-8">
                        <h1 className="text-3xl font-bold text-white mb-6">
                            {formTitle}
                        </h1>

                        {isValidMember && (
                            <div className="text-theme-white">
                                <div className="bg-green-500/20 p-4 rounded-lg mb-6">
                                    <p className="font-bold text-green-400 text-lg mb-1">✓ Actief Lid</p>
                                    <p className="text-sm text-theme-text-subtle dark:text-theme-text-subtle">Je bent een volwaardig lid van Salve Mundi.</p>
                                </div>

                                <p className="mb-4 text-lg">
                                    Welkom terug, <span className="font-bold text-theme-purple-lighter">{user.first_name}</span>!
                                </p>

                                <div className="bg-theme-white/10 p-4 rounded-lg mb-6">
                                    <p className="text-sm text-theme-purple-lighter font-semibold uppercase tracking-wide">Jouw gegevens</p>
                                    <p className="text-theme-white font-medium">{user.first_name} {user.last_name}</p>
                                    <p className="text-theme-text-muted dark:text-theme-text-muted text-sm">{user.email}</p>
                                    {user.membership_expiry && (
                                        <p className="text-theme-text-light dark:text-theme-text-light text-xs mt-2">
                                            Geldig tot: {new Date(user.membership_expiry).toLocaleDateString('nl-NL')}
                                        </p>
                                    )}
                                </div>

                                <p className="text-sm text-theme-text-light dark:text-theme-text-light italic">
                                    Je hoeft op dit moment geen actie te ondernemen.
                                </p>
                            </div>
                        )}

                        {isExpired && (
                            <div className="text-theme-white">
                                {user.membership_expiry && <DeletionTimer expiryDateStr={user.membership_expiry} />}

                                <p className="mb-4 text-lg">
                                    Welkom terug, <span className="font-bold text-theme-purple-lighter">{user.first_name}</span>.
                                </p>
                                <p className="mb-6 text-theme-text-subtle dark:text-theme-text-subtle">
                                    Je lidmaatschap is verlopen. Om weer toegang te krijgen tot alle activiteiten en je account te behouden, vragen we je de jaarlijkse contributie te voldoen.
                                </p>

                                <button
                                    onClick={() => { setIsProcessing(true); initiateContributionPayment(); }}
                                    disabled={isProcessing}
                                    className="form-button"
                                >
                                    {isProcessing ? 'Verwerken...' : `Nu Verlengen (€${baseAmount.toFixed(2).replace('.', ',')})`}
                                </button>
                            </div>
                        )}

                        {isGuest && (
                            <form className="flex text-start flex-col gap-4" onSubmit={handleSubmit}>
                                <p className="text-theme-text dark:text-theme-white mb-2">Vul je gegevens in om een account aan te maken en lid te worden.</p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <label className="form-label">
                                        Voornaam
                                        <input type="text" name="voornaam" value={form.voornaam} onChange={handleChange} required className="form-input mt-1" />
                                    </label>
                                    <label className="form-label">
                                        Achternaam
                                        <input type="text" name="achternaam" value={form.achternaam} onChange={handleChange} required className="form-input mt-1" />
                                    </label>
                                </div>

                                <label className="form-label">
                                    E-mail
                                    <input type="email" name="email" value={form.email} onChange={handleChange} required className="form-input mt-1" />
                                </label>

                                <label className="form-label">
                                    Geboortedatum
                                    <div className="w-full">
                                        <DatePicker
                                            selected={form.geboortedatum}
                                            onChange={(date) => setForm({ ...form, geboortedatum: date })}
                                            dateFormat="dd-MM-yyyy"
                                            locale={nl}
                                            className="form-input mt-1"
                                            placeholderText="Selecteer datum"
                                            showYearDropdown
                                            scrollableYearDropdown
                                            yearDropdownItemNumber={100}
                                        />
                                    </div>
                                </label>

                                <label className="form-label">
                                    Telefoonnummer
                                    <input type="tel" name="telefoon" value={form.telefoon} onChange={handleChange} required className="form-input mt-1" />
                                    {phoneError && <p className="text-red-300 text-sm mt-1">{phoneError}</p>}
                                </label>

                                <div className="border-t border-theme-white/20 pt-4 mt-2">
                                    <label className="form-label mb-2 text-white">Heb je een coupon code?</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            name="coupon"
                                            value={form.coupon}
                                            onChange={handleChange}
                                            placeholder="Bijv. ACTIE2024"
                                            className="form-input uppercase"
                                        />
                                        <button
                                            type="button"
                                            onClick={verifyCoupon}
                                            disabled={!form.coupon || verifyingCoupon}
                                            className="bg-theme-white text-theme-purple font-bold px-4 rounded-xl hover:bg-white-soft disabled:opacity-50 transition-all shadow-md"
                                        >
                                            {verifyingCoupon ? '...' : 'Check'}
                                        </button>
                                    </div>
                                    {couponStatus && (
                                        <p className={`text-sm mt-2 font-bold ${couponStatus.valid ? 'text-green-400' : 'text-red-300'}`}>
                                            {couponStatus.message}
                                        </p>
                                    )}

                                    {/* Summary of price */}
                                    <div className="mt-4 flex justify-between items-center text-white font-bold text-lg">
                                        <span>Totaal:</span>
                                        <span>
                                            {couponStatus?.valid && couponStatus.discount ? (
                                                <>
                                                    <span className="line-through text-white/50 text-sm mr-2">€20,00</span>
                                                    <span>
                                                        {couponStatus.type === 'percentage'
                                                            ? `€${(20 * (1 - couponStatus.discount / 100)).toFixed(2).replace('.', ',')}`
                                                            : `€${Math.max(0, 20 - couponStatus.discount).toFixed(2).replace('.', ',')}`
                                                        }
                                                    </span>
                                                </>
                                            ) : (
                                                <span>€20,00</span>
                                            )}
                                        </span>
                                    </div>
                                </div>

                                <button type="submit" disabled={isProcessing} className="form-button mt-4">
                                    {isProcessing ? 'Verwerken...' : `Betalen en Inschrijven (€${baseAmount.toFixed(2).replace('.', ',')})`}
                                </button>
                            </form>
                        )}
                    </section>

                    <div className="w-full sm:w-1/2 flex flex-col gap-6">
                        <div className="w-full text-center bg-gradient-theme rounded-3xl p-6">
                            <h2 className="text-2xl font-bold text-white mb-2">
                                Waarom lid worden?
                            </h2>
                            <p className="text-lg mb-4 text-white/90">
                                Als lid van Salve Mundi krijg je toegang tot exclusieve
                                activiteiten, workshops, borrels en nog veel meer! Word vandaag
                                nog lid en ontdek de wereld van ICT samen met ons.
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
}

