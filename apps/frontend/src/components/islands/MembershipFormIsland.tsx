'use client';

import React, { useState, useTransition } from 'react';
import { FormField } from '@/shared/ui/FormField';
import { Input } from '@/shared/ui/Input';
import { PhoneInput } from '@/shared/ui/PhoneInput';
import { isValidPhoneNumber } from '@/shared/lib/phone-validation';
import { validateCouponAction, initiateMembershipPaymentAction } from '@/server/actions/membership.actions';
import { type SignupFormData } from '@salvemundi/validations';

interface MembershipFormIslandProps {
    baseAmount: number;
}

export default function MembershipFormIsland({ baseAmount }: MembershipFormIslandProps) {
    const [isPending, startTransition] = useTransition();
    const [couponStatus, setCouponStatus] = useState<{ valid: boolean; message: string; discount?: number; type?: string } | null>(null);
    const [phoneError, setPhoneError] = useState<string | null>(null);

    const [form, setForm] = useState<SignupFormData>({
        voornaam: '',
        tussenvoegsel: '',
        achternaam: '',
        email: '',
        geboortedatum: '',
        telefoon: '',
        coupon: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        if (e.target.name === 'telefoon') setPhoneError(null);
    };

    const handleCouponCheck = async () => {
        if (!form.coupon) return;

        const formData = new FormData();
        formData.append('couponCode', form.coupon);

        const result = await validateCouponAction(formData);

        if (result.success) {
            setCouponStatus({
                valid: true,
                message: result.description || 'Korting toegepast',
                discount: result.discount,
                type: result.type
            });
        } else {
            setCouponStatus({ valid: false, message: result.error || 'Ongeldige coupon' });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isValidPhoneNumber(form.telefoon)) {
            setPhoneError('Ongeldig nummer');
            return;
        }

        startTransition(async () => {
            const result = await initiateMembershipPaymentAction(form);

            if (result.success && result.checkoutUrl) {
                window.location.href = result.checkoutUrl;
            } else if (result.errors) {
                // Handle Zod server-side errors
                console.error('Validation errors:', result.errors);
            } else {
                alert(result.error || 'Er ging iets mis');
            }
        });
    };

    const calculateTotal = () => {
        if (couponStatus?.valid && couponStatus.discount) {
            if (couponStatus.type === 'percentage') {
                return baseAmount * (1 - couponStatus.discount / 100);
            }
            return Math.max(0, baseAmount - couponStatus.discount);
        }
        return baseAmount;
    };

    const total = calculateTotal();

    return (
        <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4 animate-in fade-in duration-500"
            suppressHydrationWarning
        >
            <p className="text-theme-text dark:text-white/90 mb-2">
                Vul je gegevens in om een account aan te maken en lid te worden.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Voornaam" required>
                    <Input
                        name="voornaam"
                        value={form.voornaam}
                        onChange={handleChange}
                        required
                        autoComplete="given-name"
                    />
                </FormField>
                <FormField label="Achternaam" required>
                    <Input
                        name="achternaam"
                        value={form.achternaam}
                        onChange={handleChange}
                        required
                        autoComplete="family-name"
                    />
                </FormField>
            </div>

            <FormField label="E-mailadres" required>
                <Input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    autoComplete="email"
                />
            </FormField>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Geboortedatum" required>
                    <Input
                        type="date"
                        name="geboortedatum"
                        value={form.geboortedatum}
                        onChange={handleChange}
                        required
                        autoComplete="bday"
                    />
                </FormField>
                <FormField label="Telefoonnummer" required error={phoneError ?? undefined}>
                    <PhoneInput
                        name="telefoon"
                        value={form.telefoon}
                        onChange={handleChange}
                        required
                        autoComplete="tel"
                        error={!!phoneError}
                    />
                </FormField>
            </div>

            <div className="border-t border-purple-100 dark:border-white/10 pt-6 mt-6">
                <label className="form-label mb-2">Heb je een coupon code?</label>
                <div className="flex gap-2">
                    <input
                        type="text"
                        name="coupon"
                        value={form.coupon}
                        onChange={handleChange}
                        placeholder="Bijv. ACTIE2024"
                        autoComplete="off"
                        className="form-input uppercase flex-grow"
                    />
                    <button
                        type="button"
                        onClick={handleCouponCheck}
                        disabled={!form.coupon || isPending}
                        className="form-button !bg-theme-purple !text-white w-auto py-2 px-6 shadow-md shrink-0 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isPending ? '...' : 'Check'}
                    </button>
                </div>
                {couponStatus && (
                    <p className={`text-sm mt-2 font-bold ${couponStatus.valid ? 'text-green-600 dark:text-green-400' : 'text-theme-error'}`}>
                        {couponStatus.message}
                    </p>
                )}

                <div className="mt-8 flex justify-between items-center text-theme-purple dark:text-white font-bold text-xl p-5 bg-purple-50/50 dark:bg-purple-900/20 rounded-3xl border border-purple-100 dark:border-purple-800/30 shadow-inner">
                    <span className="opacity-80">Totaal:</span>
                    <span className="text-2xl font-black">
                        €{total.toFixed(2).replace('.', ',')}
                    </span>
                </div>
            </div>

            <button type="submit" disabled={isPending} className="form-button mt-4 shadow-glow">
                {isPending ? 'Verwerken...' : `Betalen en Inschrijven (€${total.toFixed(2).replace('.', ',')})`}
            </button>
        </form>
    );
}
