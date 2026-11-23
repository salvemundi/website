import React from 'react';
import { CreditCard } from 'lucide-react';
import { Card, Divider, Group, Stack, Text, Title } from '@mantine/core';
import { TripPricingResult } from '@/lib/reis/pricing';

interface PaymentSummaryProps {
    pricing: TripPricingResult;
    paymentType: 'deposit' | 'final';
    hideHeader?: boolean;
}

export function PaymentSummary({ pricing, paymentType, hideHeader = false }: PaymentSummaryProps) {
    return (
        <Stack gap="xl">
            {!hideHeader && (
                <Stack gap={4}>
                    <Group gap="sm">
                        <Text span c="brand" lh={1}>
                            <CreditCard size={26} />
                        </Text>
                        <Title order={2} size="h2">
                            Betalingssamenvatting
                        </Title>
                    </Group>
                    <Text size="sm" c="dimmed">
                        Controleer de gegevens voordat we je doorsturen naar Mollie.
                    </Text>
                    <Divider mt="sm" />
                </Stack>
            )}

            <Stack gap="md">
                <Card padding="lg" withBorder shadow="md">
                    <Stack gap="sm">
                        <Group justify="space-between">
                            <Text size="sm" c="dimmed">Basisprijs Reis</Text>
                            <Text size="sm" fw={700}>€{pricing.base.toFixed(2)}</Text>
                        </Group>
                        {pricing.discount > 0 && (
                            <Group justify="space-between">
                                <Text size="sm" c="success" fs="italic">Crew Korting</Text>
                                <Text size="sm" fw={700} c="success">-€{pricing.discount.toFixed(2)}</Text>
                            </Group>
                        )}
                        {pricing.actPrice > 0 && (
                            <Group justify="space-between">
                                <Text size="sm" c="dimmed">Optionele Activiteiten</Text>
                                <Text size="sm" fw={700}>+€{pricing.actPrice.toFixed(2)}</Text>
                            </Group>
                        )}
                        <Divider />
                        <Group justify="space-between">
                            <Text size="xs" fw={700} tt="uppercase">Totaalbedrag</Text>
                            <Text size="xl" fw={700}>€{pricing.total.toFixed(2)}</Text>
                        </Group>
                        {paymentType === 'final' && (
                            <Group justify="space-between">
                                <Text size="sm" c="success" fs="italic">Reeds voldaan (Aanbetaling)</Text>
                                <Text size="sm" fw={700} c="success">-€{pricing.deposit.toFixed(2)}</Text>
                            </Group>
                        )}
                    </Stack>
                </Card>

                <Card
                    padding="xl"
                    shadow="lg"
                    style={{ backgroundColor: 'var(--mantine-color-brand-filled)', color: 'var(--mantine-color-white)' }}
                >
                    <Group justify="space-between" align="flex-end">
                        <Stack gap={4}>
                            <Text size="xs" fw={700} tt="uppercase" c="white" style={{ opacity: 0.85 }}>
                                {paymentType === 'deposit' ? 'Nu te voldoen (Aanbetaling)' : 'Nu te voldoen (Restbetaling)'}
                            </Text>
                            <Title order={3} fz="3rem" c="white">
                                €{pricing.toPayNow.toFixed(2)}
                            </Title>
                        </Stack>
                        <CreditCard size={48} style={{ opacity: 0.3 }} />
                    </Group>
                </Card>
            </Stack>
        </Stack>
    );
}
