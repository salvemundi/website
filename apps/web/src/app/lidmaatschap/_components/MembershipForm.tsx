'use client';

import { useState } from 'react';
import { PhoneNumberInput } from '@/shared/components/PhoneNumberInput';
import { isValidPhoneNumber } from '@/shared/lib/phone';
import { validateCouponAction } from '@/features/coupons/api/coupon-actions';
import { createPaymentAction } from '@/shared/api/finance-actions';

interface MembershipFormProps {
    baseAmount: number;
    user?: {
        id: string;
        first_name?: string;
        last_name?: string;
        email?: string;
        phone_number?: string;
        date_of_birth?: string;
    };
    isExpired?: boolean;
}

export const MembershipForm = ({ baseAmount, user, isExpired }: MembershipFormProps) => {
    const [form, setForm] = useState({
        voornaam: user?.first_name || '',
        achternaam: user?.last_name || '',
        email: user?.email || '',
        geboortedatum: user?.date_of_birth ? user.date_of_birth.split('T')[0] : '',
        telefoon: user?.phone_number || '',
        coupon: '',
    });

    const [couponStatus, setCouponStatus] = useState<{ valid: boolean; message: string; discount?: number; type?: string } | null>(null);
    const [verifyingCoupon, setVerifyingCoupon] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [phoneError, setPhoneError] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        if (e.target.name === 'telefoon' && phoneError) setPhoneError(null);
        if (e.target.name === 'coupon' && couponStatus) setCouponStatus(null);
    };

    const verifyCoupon = async () => {
        if (!form.coupon) return;
        const traceId = Math.random().toString(36).substring(7);

        setVerifyingCoupon(true);
        setCouponStatus(null);

        try {
            const data = await validateCouponAction(form.coupon, traceId);

            if (data.valid) {
                setCouponStatus({
                    valid: true,
                    message: `Korting toegepast: ${data.description}`,
                    discount: data.discount_value,
                    type: data.discount_type
                });
            } else {
                setCouponStatus({ valid: false, message: data.error || 'Ongeldige coupon code' });
            }
        } catch (error: any) {
            console.error(`[Coupon] Fatal Error:`, error.message);
            const isNetworkError = error.message.includes('fetch') || error.name === 'TypeError';
            setCouponStatus({
                valid: false,
                message: isNetworkError
                    ? 'Netwerkfout: Probeer het over 10 seconden opnieuw.'
                    : 'Kon coupon niet valideren'
            });
        } finally {
            setVerifyingCoupon(false);
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
            const traceId = Math.random().toString(36).substring(7);
            const payload = {
                amount: baseAmount.toFixed(2),
                description: 'Contributie Salve Mundi',
                redirectUrl: window.location.origin + '/lidmaatschap/bevestiging' + (isExpired ? '?type=renewal' : ''),
                isContribution: true,
                userId: user?.id || null,
                firstName: user ? undefined : form.voornaam,
                lastName: user ? undefined : form.achternaam,
                email: user ? user.email : form.email,
                dateOfBirth: form.geboortedatum ? form.geboortedatum : undefined,
                phoneNumber: form.telefoon,
                couponCode: couponStatus?.valid ? form.coupon : undefined
            };

            const result = await createPaymentAction(payload, traceId);

            if (result.success && (result.checkoutUrl || result.paymentId)) {
                if (result.checkoutUrl) {
                    window.location.href = result.checkoutUrl;
                } else {
                    // Success without payment (free)
                    window.location.href = payload.redirectUrl;
                }
            } else {
                alert(`Er ging iets mis: ${result.error || 'Onbekende fout'}`);
            }
        } catch (error: any) {
            console.error('Payment initiation failed:', error);
            alert('Er is een fout opgetreden. Probeer het opnieuw.');
        } finally {
            setIsProcessing(false);
        }
    };

    const currentPrice = couponStatus?.valid && couponStatus.discount
        ? (couponStatus.type === 'percentage'
            ? baseAmount * (1 - couponStatus.discount / 100)
            : Math.max(0, baseAmount - couponStatus.discount))
        : baseAmount;

    return (
        <form className="flex text-start flex-col gap-4" onSubmit={handleSubmit}>
            {!user && (
                <>
                    <p className="text-theme-text dark:text-theme-white mb-2">Vul je gegevens in om een account aan te maken en lid te worden.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label htmlFor="voornaam" className="form-label">
                            Voornaam
                            <input type="text" id="voornaam" name="voornaam" value={form.voornaam} onChange={handleChange} required className="form-input mt-1" suppressHydrationWarning={true} />
                        </label>
                        <label htmlFor="achternaam" className="form-label">
                            Achternaam
                            <input type="text" id="achternaam" name="achternaam" value={form.achternaam} onChange={handleChange} required className="form-input mt-1" suppressHydrationWarning={true} />
                        </label>
                    </div>
                    <label htmlFor="email" className="form-label">
                        E-mail
                        <input type="email" id="email" name="email" value={form.email} onChange={handleChange} required className="form-input mt-1" suppressHydrationWarning={true} />
                    </label>
                </>
            )}

            <label htmlFor="geboortedatum" className="form-label">
                Geboortedatum
                <input
                    type="date"
                    id="geboortedatum"
                    name="geboortedatum"
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
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        ) : 'Check'}
                    </button>
                </div>
                {couponStatus && (
                    <p className={`text-sm mt-2 font-bold ${couponStatus.valid ? 'text-green-500' : 'text-red-500'}`}>
                        {couponStatus.message}
                    </p>
                )}

                <div className="mt-6 flex justify-between items-center text-theme-text font-bold text-lg p-4 bg-theme-purple/5 rounded-2xl">
                    <span>Totaal:</span>
                    <span>
                        {couponStatus?.valid && couponStatus.discount ? (
                            <>
                                <span className="line-through text-theme-text-muted/50 text-sm mr-2">€{baseAmount.toFixed(2).replace('.', ',')}</span>
                                <span className="text-theme-purple">€{currentPrice.toFixed(2).replace('.', ',')}</span>
                            </>
                        ) : (
                            <span className="text-theme-purple">€{baseAmount.toFixed(2).replace('.', ',')}</span>
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
                    `Betalen en Inschrijven (€${currentPrice.toFixed(2).replace('.', ',')})`
                )}
            </button>
        </form>
    );
};
