'use client';

import { useMemo, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle, Check, ChevronLeft, ChevronRight, CreditCard, Minus, Plus, ShoppingBag, User } from 'lucide-react';
import {
    ActionIcon,
    Alert,
    Badge,
    Box,
    Button,
    Checkbox,
    Divider,
    Group,
    InputWrapper,
    Paper,
    SimpleGrid,
    Stack,
    Text,
    Textarea,
    TextInput,
    Title,
} from '@mantine/core';
import { PhoneInput } from '@/shared/ui/PhoneInput';
import { toInternationalPhoneNumber } from '@/shared/lib/countries';
import MediaAsset from '@/components/ui/media/MediaAsset';
import { webshopPreorderFormSchema, type WebshopCatalogProduct, type WebshopPreorderForm } from '@salvemundi/validations/schema/webshop.zod';
import { submitPreorderAndInitiatePayment } from '@/server/actions/public/webshop-checkout.actions';
import { safeConsoleError } from '@/server/utils/logger';
import { isVariantAvailable, maxOrderableQuantity } from '@/shared/lib/utils/webshop-stock';

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
            (product.custom_fields ?? []).forEach((def, index) => {
                const value = (data.lines[0]?.custom_field_answers?.at(index) ?? '').trim();
                if (!value) {
                    ctx.addIssue({ code: z.ZodIssueCode.custom, message: `${def.label} is verplicht.`, path: ['lines', 0, 'custom_field_answers', index] });
                } else if (value.length > def.max_length) {
                    ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Maximaal ${def.max_length} tekens.`, path: ['lines', 0, 'custom_field_answers', index] });
                }
            });
            if (product.type === 'clothing' && !data.lines[0]?.variant_id) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'Kies een maat en kleur.',
                    path: ['lines', 0, 'variant_id']
                });
            }
        });
    }, [product.type, product.custom_fields]);

    const activeVariants = useMemo(() => product.variants.filter(v => v.is_active), [product.variants]);
    const availableSizes = useMemo(() => Array.from(new Set(activeVariants.map(v => v.size).filter((v): v is string => !!v))), [activeVariants]);
    const availableColors = useMemo(() => Array.from(new Set(activeVariants.map(v => v.color).filter((v): v is string => !!v))), [activeVariants]);

    const customFieldDefs = product.custom_fields ?? [];

    const [selectedSize, setSelectedSize] = useState<string | null>(null);
    const [selectedColor, setSelectedColor] = useState<string | null>(null);
    const [variantTouched, setVariantTouched] = useState(false);

    const { register, control, handleSubmit, watch, setValue, trigger, formState: { errors } } = useForm<WebshopPreorderForm>({
        resolver: zodResolver(checkoutSchema),
        defaultValues: {
            drop_window_id: product.drop_window?.id || 0,
            lines: [{ product_id: product.id, variant_id: null, quantity: 1, custom_field_answers: customFieldDefs.map(() => '') }],
            first_name: initialUser?.first_name || '',
            last_name: initialUser?.last_name || '',
            email: initialUser?.email || '',
            phone_number: toInternationalPhoneNumber(initialUser?.phone_number),
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
            (availableColors.length === 0 || v.color === color) &&
            isVariantAvailable(v)
        );
        setValue('lines.0.variant_id', matched?.id ?? null, { shouldValidate: true });
        const variantMax = Math.max(1, maxOrderableQuantity(product, matched ?? null, MAX_QUANTITY));
        if (quantity > variantMax) setValue('lines.0.quantity', variantMax, { shouldValidate: true });
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
    const selectedVariant = activeVariants.find(v => v.id === line.variant_id) ?? null;
    const maxQuantity = Math.max(1, maxOrderableQuantity(product, selectedVariant, MAX_QUANTITY));

    // A size is sold out when every color of it is sold out (and vice versa for colors);
    // with both chosen, the exact combination decides.
    const isSizeSoldOut = (size: string) => !activeVariants.some(v => v.size === size && (!selectedColor || v.color === selectedColor) && isVariantAvailable(v));
    const isColorSoldOut = (color: string) => !activeVariants.some(v => v.color === color && (!selectedSize || v.size === selectedSize) && isVariantAvailable(v));

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
        <form onSubmit={(e) => e.preventDefault()}>
            <Stack gap="xl">
                <input type="hidden" {...register('drop_window_id', { valueAsNumber: true })} />
                <input type="hidden" {...register('lines.0.product_id', { valueAsNumber: true })} />
                <input {...register('website')} type="text" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" suppressHydrationWarning />

                <Paper p="md" withBorder>
                    <Group gap="md" wrap="nowrap">
                        <Box
                            pos="relative"
                            w={64}
                            h={64}
                            style={{
                                flexShrink: 0,
                                borderRadius: 'var(--mantine-radius-md)',
                                overflow: 'hidden',
                                backgroundColor: 'var(--surface-subtle)',
                            }}
                        >
                            {cover ? (
                                <MediaAsset asset={{ id: cover.asset, type: cover.asset_type }} alt={product.name} fill objectFit="cover" sizes="64px" />
                            ) : (
                                <Box h="100%" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Text span c="brand" opacity={0.3} lh={1}>
                                        <ShoppingBag size={24} />
                                    </Text>
                                </Box>
                            )}
                        </Box>
                        <Stack gap={2}>
                            <Text fw={700} c="brand">{product.name}</Text>
                            <Text size="sm" c="dimmed">€{unitPrice.toFixed(2)} per stuk</Text>
                        </Stack>
                    </Group>
                </Paper>

                <Box>
                    <Group justify="space-between" align="center" pb="md">
                        <Group gap="sm">
                            <Text span c="brand" lh={1}>
                                {step === 1 && <ShoppingBag size={24} />}
                                {step === 2 && <User size={24} />}
                                {step === 3 && <CreditCard size={24} />}
                            </Text>
                            <Title order={2} size="h3" c="brand">
                                {step === 1 && 'Kies je maat en aantal'}
                                {step === 2 && 'Jouw gegevens'}
                                {step === 3 && 'Samenvatting'}
                            </Title>
                        </Group>
                        <Badge size="md">
                            Stap {step} van 3
                        </Badge>
                    </Group>
                    <Divider />
                </Box>

                <Box display={step === 1 ? 'block' : 'none'}>
                    <Stack gap="lg">
                        {product.type === 'clothing' && (
                            <>
                                {availableSizes.length > 0 && (
                                    <InputWrapper
                                        label={`Maat${selectedSize ? ` — gekozen: ${selectedSize}` : ''}`}
                                        required
                                        error={sizeError}
                                    >
                                        <Group gap="xs" mt="xs" wrap="wrap">
                                            {availableSizes.map((size) => {
                                                const isSelected = selectedSize === size;
                                                const soldOut = isSizeSoldOut(size);
                                                return (
                                                    <Button
                                                        key={size}
                                                        type="button"
                                                        aria-pressed={isSelected}
                                                        size="sm"
                                                        variant={isSelected ? 'filled' : 'outline'}
                                                        disabled={soldOut && !isSelected}
                                                        title={soldOut ? 'Uitverkocht' : undefined}
                                                        td={soldOut ? 'line-through' : undefined}
                                                        onClick={() => handleSelectSize(size)}
                                                        leftSection={isSelected ? <Check size={14} /> : undefined}
                                                    >
                                                        {size}
                                                        {soldOut && ' (uitverkocht)'}
                                                    </Button>
                                                );
                                            })}
                                        </Group>
                                    </InputWrapper>
                                )}

                                {availableColors.length > 0 && (
                                    <InputWrapper
                                        label={`Kleur${selectedColor ? ` — gekozen: ${selectedColor}` : ''}`}
                                        required
                                        error={colorError}
                                    >
                                        <Group gap="xs" mt="xs" wrap="wrap">
                                            {availableColors.map((color) => {
                                                const isSelected = selectedColor === color;
                                                const soldOut = isColorSoldOut(color);
                                                return (
                                                    <Button
                                                        key={color}
                                                        type="button"
                                                        aria-pressed={isSelected}
                                                        size="sm"
                                                        variant={isSelected ? 'filled' : 'outline'}
                                                        disabled={soldOut && !isSelected}
                                                        title={soldOut ? 'Uitverkocht' : undefined}
                                                        td={soldOut ? 'line-through' : undefined}
                                                        onClick={() => handleSelectColor(color)}
                                                        leftSection={isSelected ? <Check size={14} /> : undefined}
                                                    >
                                                        {color}
                                                        {soldOut && ' (uitverkocht)'}
                                                    </Button>
                                                );
                                            })}
                                        </Group>
                                    </InputWrapper>
                                )}
                            </>
                        )}

                        {customFieldDefs.map((def, index) => (
                            <Controller
                                key={index}
                                name={`lines.0.custom_field_answers.${index}`}
                                control={control}
                                render={({ field: answerField, fieldState }) => (
                                    <TextInput
                                        label={`${def.label} (max. ${def.max_length} tekens)`}
                                        required
                                        maxLength={def.max_length}
                                        placeholder={def.label}
                                        value={answerField.value}
                                        onChange={answerField.onChange}
                                        onBlur={answerField.onBlur}
                                        error={fieldState.error?.message}
                                    />
                                )}
                            />
                        ))}

                        <InputWrapper label="Aantal" required>
                            <Group gap="sm" mt="xs">
                                <ActionIcon
                                    type="button"
                                    size="lg"
                                    onClick={() => setValue('lines.0.quantity', Math.max(1, quantity - 1), { shouldValidate: true })}
                                    disabled={quantity <= 1}
                                    aria-label="Verminder aantal"
                                >
                                    <Minus size={16} />
                                </ActionIcon>
                                <Text component="output" aria-label="Huidig aantal" size="lg" fw={700} miw={40} ta="center">
                                    {quantity}
                                </Text>
                                <ActionIcon
                                    type="button"
                                    size="lg"
                                    onClick={() => setValue('lines.0.quantity', Math.min(maxQuantity, quantity + 1), { shouldValidate: true })}
                                    disabled={quantity >= maxQuantity}
                                    aria-label="Verhoog aantal"
                                >
                                    <Plus size={16} />
                                </ActionIcon>
                            </Group>
                        </InputWrapper>
                    </Stack>
                </Box>

                <Box display={step === 2 ? 'block' : 'none'}>
                    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                        <TextInput
                            label="Voornaam"
                            required
                            placeholder="Voornaam"
                            error={errors.first_name?.message}
                            {...register('first_name')}
                        />
                        <TextInput
                            label="Achternaam"
                            required
                            placeholder="Achternaam"
                            error={errors.last_name?.message}
                            {...register('last_name')}
                        />
                        <TextInput
                            type="email"
                            label="E-mailadres"
                            required
                            placeholder="naam@voorbeeld.nl"
                            error={errors.email?.message}
                            {...register('email')}
                        />
                        <InputWrapper
                            label="Telefoonnummer"
                            required
                            error={errors.phone_number?.message}
                        >
                            <Controller
                                name="phone_number"
                                control={control}
                                render={({ field }) => <PhoneInput {...field} error={!!errors.phone_number} />}
                            />
                        </InputWrapper>
                        <Box style={{ gridColumn: '1 / -1' }}>
                            <Textarea
                                label="Opmerking voor afhalen (optioneel)"
                                rows={3}
                                placeholder="Bijv. een voorkeur voor afhaalmoment"
                                error={errors.pickup_notes?.message}
                                {...register('pickup_notes')}
                            />
                        </Box>
                        <Box style={{ gridColumn: '1 / -1' }}>
                            <Controller
                                name="terms_accepted"
                                control={control}
                                render={({ field }) => (
                                    <Checkbox
                                        id="terms_accepted"
                                        checked={field.value}
                                        onChange={(e) => field.onChange(e.currentTarget.checked)}
                                        error={errors.terms_accepted?.message}
                                        label="Ik ga akkoord met de voorwaarden voor preorders: ik betaal nu de volledige prijs, en ik haal mijn bestelling op tijdens een afgesproken afhaalmoment."
                                    />
                                )}
                            />
                        </Box>
                    </SimpleGrid>
                </Box>

                <Box display={step === 3 ? 'block' : 'none'}>
                    <Stack gap="sm">
                        <Group justify="space-between" py="xs">
                            <Text c="dimmed">{product.name} &times; {quantity}</Text>
                            <Text fw={700} c="brand">€{subtotal.toFixed(2)}</Text>
                        </Group>
                        <Divider />
                        {customFieldDefs.map((def, index) => (
                            <Group key={index} justify="space-between">
                                <Text size="sm" c="dimmed">{def.label}</Text>
                                <Text size="sm" fw={600} c="dimmed">{line.custom_field_answers?.at(index)}</Text>
                            </Group>
                        ))}
                        <Group justify="space-between" pt="xs">
                            <Text c="dimmed">Te betalen</Text>
                            <Text fw={700} c="brand">€{subtotal.toFixed(2)}</Text>
                        </Group>
                        <Text size="xs" c="dimmed" pt="xs">
                            Je betaalt nu de volledige prijs. Je ontvangt bericht zodra je bestelling klaarstaat om af te halen.
                        </Text>
                    </Stack>
                </Box>

                <Divider />

                <Group justify="space-between" align="flex-end" wrap="wrap" gap="md">
                    <Button
                        type="button"
                        onClick={() => setStep(Math.max(1, step - 1))}
                        leftSection={<ChevronLeft size={16} />}
                        w={{ base: '100%', sm: 'auto' }}
                    >
                        Vorige
                    </Button>

                    <Stack gap="xs" align="flex-end" w={{ base: '100%', sm: 'auto' }}>
                        {error && (
                            <Alert color="error" icon={<AlertCircle size={16} />} w="100%">
                                {error}
                            </Alert>
                        )}

                        <Button
                            type="button"
                            onClick={() => void (step < 3 ? handleNext() : handleSubmit(onSubmit)())}
                            loading={loading}
                            size="md"
                            w={{ base: '100%', sm: 'auto' }}
                            leftSection={step === 3 ? <CreditCard size={18} /> : undefined}
                            rightSection={step < 3 ? <ChevronRight size={16} /> : undefined}
                        >
                            {loading ? 'Verwerken...' : step < 3 ? 'Volgende' : 'Bestelling betalen'}
                        </Button>
                    </Stack>
                </Group>
            </Stack>
        </form>
    );
}
