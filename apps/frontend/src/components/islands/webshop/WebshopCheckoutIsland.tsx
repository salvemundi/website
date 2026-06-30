'use client';

import { useMemo, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle, ChevronLeft, ChevronRight, CreditCard, Minus, Plus, ShoppingBag, User } from 'lucide-react';
import { FormField } from '@/shared/ui/FormField';
import { Input } from '@/shared/ui/Input';
import { PhoneInput } from '@/shared/ui/PhoneInput';
import MediaAsset from '@/components/ui/media/MediaAsset';
import { webshopPreorderFormSchema, type WebshopCatalogProduct, type WebshopPreorderForm } from '@salvemundi/validations/schema/webshop.zod';
import { submitPreorderAndInitiatePayment } from '@/server/actions/public/webshop-checkout.actions';
import { safeConsoleError } from '@/server/utils/logger';

interface WebshopCheckoutIslandProps {
    product: WebshopCatalogProduct;
    initialUser: { first_name?: string | null; last_name?: string | null; email?: string | null; phone_number?: string | null } | null;
}

const MAX_QUANTITY = 10;

export default function WebshopCheckoutIsland({ product, initialUser }: WebshopCheckoutIslandProps) {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const checkoutSchema = useMemo(() => {
        return webshopPreorderFormSchema.superRefine((data, ctx) => {
            if (product.type === 'clothing' && !data.lines[0]?.variant_id) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'Kies een maat.',
                    path: ['lines', 0, 'variant_id']
                });
            }
        });
    }, [product.type]);

    const { register, control, handleSubmit, watch, setValue, trigger, formState: { errors } } = useForm<WebshopPreorderForm>({
        resolver: zodResolver(checkoutSchema),
        defaultValues: {
            drop_window_id: product.drop_window?.id || 0,
            lines: [{ product_id: product.id, variant_id: null, quantity: 1 }],
            first_name: initialUser?.first_name || '',
            last_name: initialUser?.last_name || '',
            email: initialUser?.email || '',
            phone_number: initialUser?.phone_number || '',
            pickup_notes: '',
            terms_accepted: false,
            website: ''
        },
        mode: 'onChange'
    });

    const line = watch('lines.0');
    const quantity = line?.quantity || 1;
    const variantId = line?.variant_id ?? null;

    const unitPrice = Number(product.price);
    const unitDeposit = Number(product.deposit_amount);
    const subtotal = unitPrice * quantity;
    const deposit = unitDeposit * quantity;
    const remaining = subtotal - deposit;

    const cover = product.media.length > 0 ? product.media[0] : null;

    const handleNext = async () => {
        setError(null);

        if (step === 1) {
            const valid = await trigger('lines');
            if (!valid) return;
            setStep(2);
            return;
        }

        if (step === 2) {
            const valid = await trigger(['first_name', 'last_name', 'email', 'phone_number', 'terms_accepted']);
            if (!valid) return;
            setStep(3);
            return;
        }
    };

    const onSubmit = async (data: WebshopPreorderForm) => {
        setError(null);
        setLoading(true);

        try {
            const result = await submitPreorderAndInitiatePayment(data);
            if (result.success && result.checkoutUrl) {
                window.location.href = result.checkoutUrl;
                return;
            }

            setError(result.error || 'Bestelling plaatsen mislukt.');
            setLoading(false);
        } catch (err) {
            safeConsoleError('[WebshopCheckoutIsland.tsx][onSubmit]', err);
            setError('Er is een onverwachte fout opgetreden.');
            setLoading(false);
        }
    };

    return (
        <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-8 @container">
            <input type="hidden" {...register('drop_window_id', { valueAsNumber: true })} />
            <input type="hidden" {...register('lines.0.product_id', { valueAsNumber: true })} />
            <input {...register('website')} type="text" className="hidden" tabIndex={-1} autoComplete="off" suppressHydrationWarning />

            <div className="flex items-center gap-4 p-4 rounded-2xl bg-(--bg-soft)">
                <div className="relative h-16 w-16 rounded-xl overflow-hidden shrink-0 bg-(--bg-card)">
                    {cover ? (
                        <MediaAsset asset={{ id: cover.asset, type: cover.asset_type }} alt={product.name} fill objectFit="cover" sizes="64px" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <ShoppingBag className="h-6 w-6 text-(--theme-purple)/20" />
                        </div>
                    )}
                </div>
                <div>
                    <p className="font-bold text-(--theme-purple)/90">{product.name}</p>
                    <p className="text-sm text-(--text-muted)">€{unitPrice.toFixed(2)} per stuk</p>
                </div>
            </div>

            <div className="pb-4 border-b border-(--border-color) flex items-center justify-between">
                <div>
                    <h2 className="text-xl sm:text-2xl font-black text-(--theme-purple) italic tracking-tighter flex items-center gap-3">
                        {step === 1 && <ShoppingBag className="w-6 h-6" />}
                        {step === 2 && <User className="w-6 h-6" />}
                        {step === 3 && <CreditCard className="w-6 h-6" />}
                        {step === 1 && 'Kies je maat en aantal'}
                        {step === 2 && 'Jouw gegevens'}
                        {step === 3 && 'Samenvatting'}
                    </h2>
                </div>
                <div className="text-xs font-bold text-(--theme-purple) bg-(--theme-purple)/10 px-3 py-1.5 rounded-full tracking-wider select-none">
                    Stap {step} van 3
                </div>
            </div>

            <div className="animate-in fade-in duration-300" hidden={step !== 1}>
                <div className="space-y-6">
                    {product.type === 'clothing' && (
                        <FormField label="Maat" required error={errors.lines?.[0]?.variant_id?.message}>
                            <div className="flex flex-wrap gap-2">
                                {product.variants.filter(v => v.is_active).map((variant) => {
                                    const label = [variant.size, variant.color].filter(Boolean).join(' / ') || `Variant ${variant.id}`;
                                    const isSelected = variantId === variant.id;
                                    return (
                                        <button
                                            key={variant.id}
                                            type="button"
                                            onClick={() => setValue('lines.0.variant_id', variant.id, { shouldValidate: true })}
                                            className={`px-4 py-2 rounded-full text-sm font-bold border-2 transition-all ${
                                                isSelected
                                                    ? 'border-(--theme-purple) bg-(--theme-purple) text-white'
                                                    : 'border-(--border-color) text-(--text-muted) hover:border-(--theme-purple)'
                                            }`}
                                        >
                                            {label}
                                        </button>
                                    );
                                })}
                            </div>
                        </FormField>
                    )}

                    <FormField label="Aantal" required>
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setValue('lines.0.quantity', Math.max(1, quantity - 1), { shouldValidate: true })}
                                className="p-2 rounded-full bg-(--bg-soft) text-(--theme-purple) hover:scale-105 transition-all disabled:opacity-30"
                                disabled={quantity <= 1}
                                aria-label="Verminder aantal"
                            >
                                <Minus className="h-4 w-4" />
                            </button>
                            <span className="w-10 text-center font-bold text-lg">{quantity}</span>
                            <button
                                type="button"
                                onClick={() => setValue('lines.0.quantity', Math.min(MAX_QUANTITY, quantity + 1), { shouldValidate: true })}
                                className="p-2 rounded-full bg-(--bg-soft) text-(--theme-purple) hover:scale-105 transition-all disabled:opacity-30"
                                disabled={quantity >= MAX_QUANTITY}
                                aria-label="Verhoog aantal"
                            >
                                <Plus className="h-4 w-4" />
                            </button>
                        </div>
                    </FormField>
                </div>
            </div>

            <div className="animate-in fade-in duration-300" hidden={step !== 2}>
                <div className="grid grid-cols-1 @md:grid-cols-2 gap-x-6 gap-y-5">
                    <FormField label="Voornaam" required error={errors.first_name?.message}>
                        <Input {...register('first_name')} placeholder="Voornaam" />
                    </FormField>
                    <FormField label="Achternaam" required error={errors.last_name?.message}>
                        <Input {...register('last_name')} placeholder="Achternaam" />
                    </FormField>
                    <FormField label="E-mailadres" required error={errors.email?.message}>
                        <Input {...register('email')} type="email" placeholder="naam@voorbeeld.nl" />
                    </FormField>
                    <FormField label="Telefoonnummer" required error={errors.phone_number?.message}>
                        <Controller
                            name="phone_number"
                            control={control}
                            render={({ field }) => <PhoneInput {...field} />}
                        />
                    </FormField>
                    <div className="@md:col-span-2">
                        <FormField label="Opmerking voor afhalen (optioneel)" error={errors.pickup_notes?.message}>
                            <textarea {...register('pickup_notes')} className="form-input" rows={3} placeholder="Bijv. een voorkeur voor afhaalmoment" />
                        </FormField>
                    </div>

                    <div className="@md:col-span-2">
                        <label htmlFor="terms_accepted" className="flex items-start gap-3 text-(--text-main) mt-2 cursor-pointer group">
                            <input
                                {...register('terms_accepted')}
                                id="terms_accepted"
                                type="checkbox"
                                className="mt-1 h-5 w-5 rounded border-theme-purple/20 accent-theme-purple transition-all group-hover:scale-110"
                            />
                            <span className="text-sm leading-snug">
                                Ik ga akkoord met de voorwaarden voor preorders: ik betaal nu een aanbetaling, de
                                restbetaling volgt later, en ik haal mijn bestelling op tijdens een afgesproken
                                afhaalmoment.
                            </span>
                        </label>
                        {errors.terms_accepted && <p className="text-xs text-red-500 font-semibold mt-1">{errors.terms_accepted.message}</p>}
                    </div>
                </div>
            </div>

            <div className="animate-in fade-in duration-300" hidden={step !== 3}>
                <div className="space-y-3">
                    <div className="flex items-center justify-between py-2 border-b border-(--border-color)">
                        <span className="text-(--text-muted)">{product.name} &times; {quantity}</span>
                        <span className="font-bold text-(--theme-purple)/90">€{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between text-(--text-muted)">
                        <span>Aanbetaling nu</span>
                        <span className="font-bold text-(--theme-purple)">€{deposit.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between text-(--text-muted)">
                        <span>Restbetaling later</span>
                        <span>€{remaining.toFixed(2)}</span>
                    </div>
                    <p className="text-xs text-(--text-muted) pt-2">
                        Je betaalt nu de aanbetaling. Je ontvangt later een betaalverzoek voor het resterende bedrag.
                    </p>
                </div>
            </div>

            <div className="pt-6 border-t border-(--border-color) flex flex-col sm:flex-row gap-4 justify-between items-center">
                <button
                    type="button"
                    onClick={() => setStep(Math.max(1, step - 1))}
                    className="w-full sm:w-auto px-8 py-3 rounded-xl font-bold text-sm text-(--text-muted) hover:text-(--text-main) transition-all flex items-center justify-center gap-2"
                >
                    <ChevronLeft className="w-4 h-4" />
                    Vorige
                </button>

                <div className="w-full sm:w-auto flex flex-col gap-3 items-end">
                    {error && (
                        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center gap-2 w-full">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <p className="text-xs">{error}</p>
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={() => void (step < 3 ? handleNext() : handleSubmit(onSubmit)())}
                        disabled={loading}
                        className={`form-button w-full sm:w-auto px-10 flex items-center justify-center gap-2 ${loading ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
                    >
                        {loading ? 'Verwerken...' : step < 3 ? (
                            <>Volgende <ChevronRight className="w-4 h-4" /></>
                        ) : (
                            <><CreditCard className="w-5 h-5" /> Aanbetaling voldoen</>
                        )}
                    </button>
                </div>
            </div>
        </form>
    );
}
