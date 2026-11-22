'use client';

import Link from 'next/link';
import { XCircle, RefreshCw, Home } from 'lucide-react';
import { Button, Group, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { slugify } from '@/shared/lib/utils/slug';
import { type SignupData } from '../ConfirmationIsland';

interface StatusFailedProps {
    signupData: SignupData | null;
    isMembership: boolean;
    isTrip: boolean;
}

export default function StatusFailed({ signupData, isMembership, isTrip }: StatusFailedProps) {
    const isCanceled = signupData?.errorType === 'canceled';
    const isExpired = signupData?.errorType === 'expired';

    const retryHref = isMembership
        ? '/lidmaatschap'
        : isTrip
            ? '/reis'
            : (signupData?.event_id?.name ? `/activiteiten/${slugify(signupData.event_id.name)}` : '/activiteiten');

    return (
        <Stack align="center" gap="xl" py="xl" ta="center">
            <ThemeIcon size={96} color="error">
                <XCircle size={48} />
            </ThemeIcon>

            <Stack gap="xs" align="center">
                <Title order={2} fz={{ base: '2rem', md: '2.5rem' }}>
                    Betaling <Text span c="error" inherit>{isCanceled ? 'gecanceld' : isExpired ? 'verlopen' : 'mislukt'}</Text>
                </Title>
                <Text size="lg" c="dimmed" maw={460}>
                    {isCanceled
                        ? 'Je hebt de betaling afgebroken. Geen zorgen, je gegevens zijn nog niet verwerkt.'
                        : isExpired
                            ? 'De betaalsessie is verlopen. Probeer het opnieuw om je aanmelding te voltooien.'
                            : 'Helaas is je betaling niet gelukt. Probeer het opnieuw of neem contact op als dit probleem blijft optreden.'}
                </Text>
            </Stack>

            <Group justify="center" gap="md" wrap="wrap">
                <Button
                    component={Link}
                    href={retryHref}
                    size="lg"
                    leftSection={<RefreshCw size={18} />}
                >
                    Opnieuw proberen
                </Button>
                <Button
                    component={Link}
                    href="/"
                    size="lg"
                    leftSection={<Home size={18} />}
                >
                    Terug naar home
                </Button>
            </Group>
        </Stack>
    );
}
