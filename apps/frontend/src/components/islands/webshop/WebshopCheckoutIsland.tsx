'use client';

import { useMemo, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle, Check, ChevronLeft, ChevronRight, CreditCard, Minus, Plus, ShoppingBag, User } from 'lucide-react';
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
                    message: 'Kies een maat en kleur.',
                    path: ['lines', 0, 'variant_id']
                });
            }
        });
    }, [product.type]);

    const activeVariants = useMemo(() => product.variants.filter(v => v.is_active), [product.variants]);
    const availableSizes = useMemo(() => Array.from(new Set(activeVariants.map(v => v.size).filter((v): v is string => !!v))), [activeVariants]);
    const availableColors = useMemo(() => Array.from(new Set(activeVariants.map(v => v.color).filter((v): v is string => !!v))), [activeVariants]);

    const [selectedSize, setSelectedSize] = useState<string | null>(null);
    const [selectedColor, setSelectedColor] = useState<string | null>(null);
    const [variantTouched, setVariantTouched] = useState(false);

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
    const quantity = line.quantity || 1;

    const applyVariantSelection = (size: string | null, color: string | null) => {
        const matched = activeVariants.find(v =>
            (availableSizes.length === 0 || v.size === size) &&
            (availableColors.length === 0 || v.color === color)
        );
        setValue('lines.0.variant_id', matched?.id ?? null, { shouldValidate: true });
    };

    const handleSelectSize = (size: string) => {
        setSelectedSize(size);
        applyVariantSelection(size, selectedColor);
    };

    const handleSelectColor = (color: string) => {
        setSelectedColor(color);
        applyVariantSelection(selectedSize, color);
    };

    const unitPrice = Number(product.price);
    const subtotal = unitPrice * quantity;
    const maxQuantity = product.stock_quantity === null ? MAX_QUANTITY : Math.min(MAX_QUANTITY, product.stock_quantity);

    const sizeError = variantTouched && availableSizes.length > 0 && !selectedSize ? 'Kies een maat.' : undefined;
    const colorError = variantTouched && availableColors.length > 0 && !selectedColor ? 'Kies een kleur.' : undefined;

    const cover = product.media.length > 0 ? product.media[0] : null;

    const handleNext = async () => {
        setError(null);

        if (step === 1) {
            if (product.type === 'clothing') {
                setVariantTouched(true);
                const sizeMissing = availableSizes.length > 0 && !selectedSize;
                const colorMissing = availableColors.length > 0 && !selectedColor;
                if (sizeMissing || colorMissing) return;
            }
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
        <form onSubmit={(e) => e.preventDefault()} className="@container flex flex-col gap-8">
            <input type="hidden" {...register('drop_window_id', { valueAsNumber: true })} />
            <input type="hidden" {...register('lines.0.product_id', { valueAsNumber: true })} />
            <input {...register('website')} type="text" className="hidden" tabIndex={-1} autoComplete="off" suppressHydrationWarning />

            <div className="flex items-center gap-4 rounded-2xl bg-(--bg-soft) p-4">
                <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-(--bg-card)">
                    {cover ? (
                        <MediaAsset asset={{ id: cover.asset, type: cover.asset_type }} alt={product.name} fill objectFit="cover" sizes="64px" />
                    ) : (
                        <div className="flex size-full items-center justify-center">
                            <ShoppingBag className="size-6 text-(--theme-purple)/20" />
                        </div>
                    )}
                </div>
                <div>
                    <p className="font-bold text-(--theme-purple)/90">{product.name}</p>
                    <p className="text-sm text-(--text-muted)">€{unitPrice.toFixed(2)} per stuk</p>
                </div>
            </div>

            <div className="flex items-center justify-between border-b border-(--border-color) pb-4">
                <div>
                    <h2 className="flex items-center gap-3 text-xl font-black tracking-tighter text-(--theme-purple) italic sm:text-2xl">
                        {step === 1 && <ShoppingBag className="size-6" />}
                        {step === 2 && <User className="size-6" />}
                        {step === 3 && <CreditCard className="size-6" />}
                        {step === 1 && 'Kies je maat en aantal'}
                        {step === 2 && 'Jouw gegevens'}
                        {step === 3 && 'Samenvatting'}
                    </h2>
                </div>
                <div className="rounded-full bg-(--theme-purple)/10 px-3 py-1.5 text-xs font-bold tracking-wider text-(--theme-purple) select-none">
                    Stap {step} van 3
                </div>
            </div>

<div className="animate-in fade-in duration-300" hidden={step !== 1}>
                <div className="space-y-6">
                    {product.type === 'clothing' && (
                        <>
                            {availableSizes.length > 0 && (
                                <FormField label={`Maat${selectedSize ? ` — gekozen: ${selectedSize}` : ''}`} required error={sizeError}>
                                    <div className="flex flex-wrap gap-2">
                                        {availableSizes.map((size) => {
                                            const isSelected = selectedSize === size;
                                            return (
                                                <button
                                                    key={size}
                                                    type="button"
                                                    aria-pressed={isSelected}
                                                    onClick={() => handleSelectSize(size)}
                                                    className={`tab-button hover:scale-1.02 active:scale-0.98 flex cursor-pointer items-center gap-1.5 rounded-full border-2 px-4 py-2 text-sm font-bold transition-all ${
                                                        isSelected
                                                            ? 'scale-105 border-(--theme-purple) bg-(--theme-purple) text-white shadow-md'
                                                            : 'border-(--border-color) bg-transparent text-(--text-muted) hover:border-(--theme-purple) hover:text-(--theme-purple)'
                                                    }`}
                                                >
                                                    {isSelected && <Check className="size-3.5" />}
                                                    {size}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </FormField>
                            )}

                            {availableColors.length > 0 && (
                                <FormField label={`Kleur${selectedColor ? ` — gekozen: ${selectedColor}` : ''}`} required error={colorError}>
                                    <div className="flex flex-wrap gap-2">
                                        {availableColors.map((color) => {
                                            const isSelected = selectedColor === color;
                                            return (
                                                <button
                                                    key={color}
                                                    type="button"
                                                    aria-pressed={isSelected}
                                                    onClick={() => handleSelectColor(color)}
                                                    className={`tab-button hover:scale-1.02 active:scale-0.98 flex cursor-pointer items-center gap-1.5 rounded-full border-2 px-4 py-2 text-sm font-bold transition-all ${
                                                        isSelected
                                                            ? 'scale-105 border-(--theme-purple) bg-(--theme-purple) text-white shadow-md'
                                                            : 'border-(--border-color) bg-transparent text-(--text-muted) hover:border-(--theme-purple) hover:text-(--theme-purple)'
                                                    }`}
                                                >
                                                    {isSelected && <Check className="size-3.5" />}
                                                    {color}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </FormField>
                            )}
                        </>
                    )}

                    <FormField label="Aantal" required>
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setValue('lines.0.quantity', Math.max(1, quantity - 1), { shouldValidate: true })}
                                className="form-button rounded-full bg-(--bg-soft) p-2 text-(--theme-purple) transition-all hover:scale-105 disabled:opacity-30"
                                disabled={quantity <= 1}
                                aria-label="Verminder aantal"
                            >
                                <Minus className="size-4" />
                            </button>
                            <output aria-label="Huidig aantal" className="min-w-10 text-center text-lg font-bold">{quantity}</output>
                            <button
                                type="button"
                                onClick={() => setValue('lines.0.quantity', Math.min(maxQuantity, quantity + 1), { shouldValidate: true })}
                                className="form-button rounded-full bg-(--bg-soft) p-2 text-(--theme-purple) transition-all hover:scale-105 disabled:opacity-30"
                                disabled={quantity >= maxQuantity}
                                aria-label="Verhoog aantal"
                            >
                                <Plus className="size-4" />
                            </button>
                        </div>
                    </FormField>
                </div>
            </div>

            <div className="animate-in fade-in duration-300" hidden={step !== 2}>
                <div className="grid grid-cols-1 gap-x-6 gap-y-5 @md:grid-cols-2">
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
                        <label htmlFor="terms_accepted" className="group mt-2 flex cursor-pointer items-start gap-3 text-(--text-main)">
                            <input
                                {...register('terms_accepted')}
                                id="terms_accepted"
                                type="checkbox"
                                className="mt-1 size-5 rounded border-theme-purple/20 accent-theme-purple transition-all group-hover:scale-110"
                            />
                            <span className="text-sm leading-snug">
                                Ik ga akkoord met de voorwaarden voor preorders: ik betaal nu de volledige prijs,
                                en ik haal mijn bestelling op tijdens een afgesproken afhaalmoment.
                            </span>
                        </label>
                        {errors.terms_accepted && <p className="mt-1 text-xs font-semibold text-red-500">{errors.terms_accepted.message}</p>}
                    </div>
                </div>
            </div>

            <div className="animate-in fade-in duration-300" hidden={step !== 3}>
                <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-(--border-color) py-2">
                        <span className="text-(--text-muted)">{product.name} &times; {quantity}</span>
                        <span className="font-bold text-(--theme-purple)/90">€{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between text-(--text-muted)">
                        <span>Te betalen</span>
                        <span className="font-bold text-(--theme-purple)">€{subtotal.toFixed(2)}</span>
                    </div>
                    <p className="pt-2 text-xs text-(--text-muted)">
                        Je betaalt nu de volledige prijs. Je ontvangt bericht zodra je bestelling klaarstaat om af te halen.
                    </p>
                </div>
            </div>

            <div className="flex flex-col items-center justify-between gap-4 border-t border-(--border-color) pt-6 sm:flex-row">
                <button
                    type="button"
                    onClick={() => setStep(Math.max(1, step - 1))}
                    className="form-button flex w-full items-center justify-center gap-2 rounded-xl px-8 py-3 text-sm font-bold text-(--text-muted) transition-all hover:text-(--text-main) sm:w-auto"
                >
                    <ChevronLeft className="size-4" />
                    Vorige
                </button>

                <div className="flex w-full flex-col items-end gap-3 sm:w-auto">
                    {error && (
                        <div className="flex w-full items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-red-500">
                            <AlertCircle className="size-4 shrink-0" />
                            <p className="text-xs">{error}</p>
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={() => void (step < 3 ? handleNext() : handleSubmit(onSubmit)())}
                        disabled={loading}
                        className={`form-button flex w-full items-center justify-center gap-2 px-10 sm:w-auto ${loading ? 'cursor-not-allowed opacity-50 grayscale' : ''}`}
                    >
                        {loading ? 'Verwerken...' : step < 3 ? (
                            <>Volgende <ChevronRight className="size-4" /></>
                        ) : (
                            <><CreditCard className="size-5" /> Bestelling betalen</>
                        )}
                    </button>
                </div>
            </div>
        </form>
    );
}
