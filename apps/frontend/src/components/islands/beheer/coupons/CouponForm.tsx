'use client';

import React from 'react';
import {
    Percent,
    Euro,
    AlertCircle,
    Save
} from 'lucide-react';
import {
    Alert,
    Box,
    Button,
    Checkbox,
    Divider,
    Group,
    NumberInput,
    SegmentedControl,
    SimpleGrid,
    Stack,
    Text,
    TextInput,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';

interface Props {
    onSave: (formData: FormData, discountType: 'fixed' | 'percentage') => void;
    onCancel: () => void;
    isPending: boolean;
    error: string | null;
}

export default function CouponForm({
    onSave,
    onCancel,
    isPending,
    error
}: Props) {
    const [couponCode, setCouponCode] = React.useState('');
    const [discountType, setDiscountType] = React.useState<'fixed' | 'percentage'>('fixed');
    const [validFrom, setValidFrom] = React.useState<string | null>(null);
    const [validUntil, setValidUntil] = React.useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        onSave(fd, discountType);
    };

    return (
        <form onSubmit={handleSubmit} autoComplete="off">
            <Stack gap="lg">
                {error && (
                    <Alert color="error" icon={<AlertCircle size={16} />}>
                        {error}
                    </Alert>
                )}

                <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                    <TextInput
                        label="Coupon Code"
                        name="coupon_code"
                        required
                        placeholder="BV. KORTING2025"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.currentTarget.value.toUpperCase())}
                        styles={{ input: { fontFamily: 'monospace', fontWeight: 600 } }}
                    />

                    <Stack gap={4}>
                        <Text size="sm" fw={500}>Type Korting</Text>
                        <SegmentedControl
                            value={discountType}
                            onChange={(val) => setDiscountType(val as 'fixed' | 'percentage')}
                            fullWidth
                            color="accent"
                            data={[
                                {
                                    value: 'fixed',
                                    label: (
                                        <Group justify="center" gap={6} wrap="nowrap">
                                            <Euro size={14} />
                                            <Text span inherit>Vast Bedrag</Text>
                                        </Group>
                                    ),
                                },
                                {
                                    value: 'percentage',
                                    label: (
                                        <Group justify="center" gap={6} wrap="nowrap">
                                            <Percent size={14} />
                                            <Text span inherit>Percentage</Text>
                                        </Group>
                                    ),
                                },
                            ]}
                        />
                    </Stack>

                    <NumberInput
                        label="Waarde"
                        name="discount_value"
                        required
                        min={0.01}
                        max={discountType === 'percentage' ? 100 : undefined}
                        step={0.01}
                        decimalScale={2}
                        placeholder={discountType === 'fixed' ? '12.34' : '20'}
                        rightSection={
                            <Text size="xs" fw={700} c="dimmed" pr="xs">
                                {discountType === 'fixed' ? 'EUR' : '%'}
                            </Text>
                        }
                    />

                    <NumberInput
                        label="Gebruikslimiet"
                        name="usage_limit"
                        min={1}
                        allowDecimal={false}
                        placeholder="Onbeperkt"
                    />

                    <Box>
                        <input type="hidden" name="valid_from" value={validFrom ?? ''} />
                        <DateInput
                            label="Geldig Vanaf"
                            placeholder="Kies een datum"
                            value={validFrom}
                            onChange={setValidFrom}
                            valueFormat="DD-MM-YYYY"
                            clearable
                        />
                    </Box>

                    <Box>
                        <input type="hidden" name="valid_until" value={validUntil ?? ''} />
                        <DateInput
                            label="Geldig Tot"
                            placeholder="Kies een datum"
                            value={validUntil}
                            onChange={setValidUntil}
                            minDate={validFrom ?? undefined}
                            valueFormat="DD-MM-YYYY"
                            clearable
                        />
                    </Box>
                </SimpleGrid>

                <Checkbox
                    id="is_active"
                    name="is_active"
                    defaultChecked
                    label="Direct actief stellen"
                />

                <Divider />

                <Group justify="flex-end" gap="sm">
                    <Button
                        type="button"
                        onClick={onCancel}
                    >
                        Annuleren
                    </Button>
                    <Button
                        type="submit"
                        loading={isPending}
                        leftSection={<Save size={16} />}
                    >
                        {isPending ? 'Bezig...' : 'Coupon Aanmaken'}
                    </Button>
                </Group>
            </Stack>
        </form>
    );
}
