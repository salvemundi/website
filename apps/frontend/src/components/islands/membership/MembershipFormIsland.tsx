'use client';

import { useState, useEffect, useTransition } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Box, Button, Divider, Group, InputWrapper, Paper, SimpleGrid, Stack, Text, TextInput } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { PhoneInput } from '@/shared/ui/PhoneInput';
import { validateCouponAction, initiateMembershipPaymentAction } from '@/server/actions/profile/membership.actions';
import { signupSchema, type SignupFormData } from '@salvemundi/validations/schema/membership.zod';
import { calculateDiscountedPrice } from '@/shared/lib/price-utils';
import { useAdminToast } from '@/hooks/use-beheer-toast';

interface MembershipFormIslandProps {
    baseAmount: number;
}

const parseNlDate = (input: string): string | null => {
    const trimmed = input.trim();
    const nlMatch = /^(\d{1,2})-(\d{1,2})-(\d{4})$/.exec(trimmed);
    if (nlMatch) {
        return `${nlMatch[3]}-${nlMatch[2].padStart(2, '0')}-${nlMatch[1].padStart(2, '0')}`;
    }
    const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
    return isoMatch ? trimmed : null;
};

export default function MembershipFormIsland({ baseAmount }: MembershipFormIslandProps) {
    const { showToast } = useAdminToast();
    const [isPending, startTransition] = useTransition();
    const [couponStatus, setCouponStatus] = useState<{ valid: boolean; message: string; discount?: number; type?: string } | null>(null);

    const {
        register,
        control,
        handleSubmit,
        watch,
        formState: { errors }
    } = useForm<SignupFormData>({
        resolver: zodResolver(signupSchema),
        defaultValues: {
            voornaam: '',
            achternaam: '',
            email: '',
            geboortedatum: '',
            telefoon: '',
            coupon: ''
        }
    });

    const couponValue = watch('coupon');

    useEffect(() => {
        setCouponStatus(null);
    }, [couponValue]);

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
                type: result.type ?? undefined
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
            } else {
                showToast(result.error || 'Er ging iets mis bij het starten van de inschrijving.', 'error');
            }
        });
    };

    const total = calculateDiscountedPrice(baseAmount, couponStatus);

    return (
        <Box
            component="form"
            onSubmit={(e) => { void handleSubmit(onSubmit)(e); }}
            autoComplete="off"
            suppressHydrationWarning
        >
            <Stack gap="md">
                <Text c="dimmed">
                    Vul je gegevens in om een account aan te maken en lid te worden.
                </Text>

                <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                    <TextInput
                        id="field-voornaam"
                        label="Voornaam"
                        required
                        autoComplete="given-name"
                        error={errors.voornaam?.message}
                        {...register('voornaam')}
                    />
                    <TextInput
                        id="field-achternaam"
                        label="Achternaam (incl. tussenvoegsel)"
                        required
                        autoComplete="family-name"
                        error={errors.achternaam?.message}
                        {...register('achternaam')}
                    />
                </SimpleGrid>

                <TextInput
                    id="field-email"
                    type="email"
                    label="E-mailadres"
                    required
                    autoComplete="email"
                    error={errors.email?.message}
                    {...register('email')}
                />

                <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                    <Controller
                        name="geboortedatum"
                        control={control}
                        render={({ field }) => (
                            <DateInput
                                id="field-geboortedatum"
                                label="Geboortedatum"
                                required
                                value={field.value || null}
                                onChange={(val) => field.onChange(val ?? '')}
                                valueFormat="DD-MM-YYYY"
                                dateParser={parseNlDate}
                                placeholder="dd-mm-jjjj"
                                autoComplete="bday"
                                error={errors.geboortedatum?.message}
                            />
                        )}
                    />
                    <InputWrapper
                        id="field-telefoon"
                        label="Telefoonnummer"
                        required
                        error={errors.telefoon?.message}
                    >
                        <Controller
                            name="telefoon"
                            control={control}
                            render={({ field }) => (
                                <PhoneInput
                                    {...field}
                                    id="field-telefoon"
                                    autoComplete="tel"
                                    error={!!errors.telefoon}
                                />
                            )}
                        />
                    </InputWrapper>
                </SimpleGrid>

                <Divider my="sm" />

                <Stack gap="xs">
                    <Group gap="xs" align="flex-end" wrap="nowrap">
                        <TextInput
                            id="coupon_code"
                            label="Heb je een coupon code?"
                            placeholder="Bijv. ACTIE2024"
                            autoComplete="off"
                            style={{ flex: 1 }}
                            styles={{ input: { textTransform: 'uppercase' } }}
                            {...register('coupon')}
                        />
                        <Button
                            type="button"
                            onClick={() => { void handleCouponCheck(); }}
                            disabled={!couponValue || isPending}
                            loading={isPending}
                        >
                            Check
                        </Button>
                    </Group>

                    {couponStatus && (
                        <Text size="sm" fw={700} c={couponStatus.valid ? 'success' : 'error'}>
                            {couponStatus.message}
                        </Text>
                    )}

                    <Paper p="lg" withBorder mt="md">
                        <Group justify="space-between" align="center">
                            <Text size="xl" fw={700} c="dimmed">
                                Totaal:
                            </Text>
                            <Text size="1.5rem" fw={900} c="brand">
                                €{total.toFixed(2).replace('.', ',')}
                            </Text>
                        </Group>
                    </Paper>
                </Stack>

                <Button type="submit" size="lg" loading={isPending} mt="sm">
                    {isPending ? 'Verwerken...' : `Betalen en Inschrijven (€${total.toFixed(2).replace('.', ',')})`}
                </Button>
            </Stack>
        </Box>
    );
}
