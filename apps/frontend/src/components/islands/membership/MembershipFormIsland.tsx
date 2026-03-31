'use client';

import React, { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormField } from '@/shared/ui/FormField';
import { Input } from '@/shared/ui/Input';
import { PhoneInput } from '@/shared/ui/PhoneInput';
import { validateCouponAction, initiateMembershipPaymentAction } from '@/server/actions/membership.actions';
import { signupSchema, type SignupFormData } from '@salvemundi/validations';
import { calculateDiscountedPrice } from '@/shared/lib/price-utils';
import AdminToast from '@/components/ui/admin/AdminToast';
import { useAdminToast } from '@/hooks/use-admin-toast';

interface MembershipFormIslandProps {
    baseAmount: number;
}

export default function MembershipFormIsland({ baseAmount }: MembershipFormIslandProps) {
    const { toast, showToast, hideToast } = useAdminToast();
    const [isPending, startTransition] = useTransition();
    const [couponStatus, setCouponStatus] = useState<{ valid: boolean; message: string; discount?: number; type?: string } | null>(null);

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors }
    } = useForm<SignupFormData>({
        resolver: zodResolver(signupSchema),
        defaultValues: {
            voornaam: '',
            tussenvoegsel: '',
            achternaam: '',
            email: '',
            geboortedatum: '',
            telefoon: '',
            coupon: '',
        }
    });

    const couponValue = watch('coupon');
    const telefoonValue = watch('telefoon');

    const handleCouponCheck = async () => {
        if (!couponValue) return;

        const formData = new FormData();
        formData.append('couponCode', couponValue);

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

    const onSubmit = async (data: SignupFormData) => {
        startTransition(async () => {
            const result = await initiateMembershipPaymentAction(data);

            if (result.success && result.checkoutUrl) {
                window.location.href = result.checkoutUrl;
            } else if (result.errors) {
                // Handle Zod server-side errors if any returned
                console.error('Validation errors:', result.errors);
            } else {
                showToast(result.error || 'Er ging iets mis', 'error');
            }
        });
    };

    const total = calculateDiscountedPrice(baseAmount, couponStatus);

    return (
        <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-4 animate-in fade-in duration-500"
            suppressHydrationWarning
        >
            <p className="text-theme-text dark:text-white/90 mb-2">
                Vul je gegevens in om een account aan te maken en lid te worden.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Voornaam" required error={errors.voornaam?.message}>
                    <Input
                        {...register('voornaam')}
                        autoComplete="given-name"
                    />
                </FormField>
                <FormField label="Achternaam" required error={errors.achternaam?.message}>
                    <Input
                        {...register('achternaam')}
                        autoComplete="family-name"
                    />
                </FormField>
            </div>

            <FormField label="Tussenvoegsel" error={errors.tussenvoegsel?.message}>
                <Input
                    {...register('tussenvoegsel')}
                    autoComplete="additional-name"
                />
            </FormField>

            <FormField label="E-mailadres" required error={errors.email?.message}>
                <Input
                    type="email"
                    {...register('email')}
                    autoComplete="email"
                />
            </FormField>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Geboortedatum" required error={errors.geboortedatum?.message}>
                    <Input
                        type="date"
                        {...register('geboortedatum')}
                        autoComplete="bday"
                    />
                </FormField>
                <FormField label="Telefoonnummer" required error={errors.telefoon?.message}>
                    <PhoneInput
                        name="telefoon"
                        value={telefoonValue}
                        onChange={(e) => setValue('telefoon', e.target.value, { shouldValidate: true })}
                        autoComplete="tel"
                        error={!!errors.telefoon}
                    />
                </FormField>
            </div>

            <div className="border-t border-purple-100 dark:border-white/10 pt-6 mt-6">
                <label className="form-label mb-2">Heb je een coupon code?</label>
                <div className="flex gap-2">
                    <input
                        type="text"
                        {...register('coupon')}
                        placeholder="Bijv. ACTIE2024"
                        autoComplete="off"
                        className="form-input uppercase flex-grow"
                        suppressHydrationWarning
                    />
                    <button
                        type="button"
                        onClick={handleCouponCheck}
                        disabled={!couponValue || isPending}
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
            <AdminToast toast={toast} onClose={hideToast} />
        </form>
    );
}
