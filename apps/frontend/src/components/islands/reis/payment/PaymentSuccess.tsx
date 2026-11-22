import React from 'react';
import Link from '@/components/ui/Link';
import { CheckCircle2, Home } from 'lucide-react';
import { Button, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { type Trip } from '@salvemundi/validations';

interface PaymentSuccessProps {
    trip: Trip;
}

export function PaymentSuccess({ trip }: PaymentSuccessProps) {
    return (
        <Stack align="center" gap="xl" py="xl" ta="center">
            <ThemeIcon size={96} color="success">
                <CheckCircle2 size={48} />
            </ThemeIcon>

            <Stack gap="sm" align="center">
                <Title order={2} size="h1">
                    Activiteiten Opgeslagen!
                </Title>
                <Text c="dimmed" maw={440}>
                    Je keuzes zijn succesvol verwerkt. Zodra de restbetaling voor <strong>{trip.name}</strong> wordt geopend, ontvang je van ons een e-mail om de betaling af te ronden.
                </Text>
            </Stack>

            <Button
                component={Link}
                href="/reis"
                size="lg"
                leftSection={<Home size={18} />}
            >
                Terug naar Dashboard
            </Button>
        </Stack>
    );
}
