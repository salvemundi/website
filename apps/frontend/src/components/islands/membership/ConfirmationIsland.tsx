'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, Home, User, XCircle, AlertTriangle } from 'lucide-react';
import { Button, Card, Group, Loader, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { getTransactionStatusAction } from '@/server/actions/profile/membership.actions';

interface ConfirmationIslandProps {
    transactionId: string | null;
    type: string | null;
    initialStatus?: 'loading' | 'paid' | 'open' | 'failed' | 'error';
    initialUserId?: string | null;
}

export default function ConfirmationIsland({ transactionId, type, initialStatus }: ConfirmationIslandProps) {
    const router = useRouter();
    const [status, setStatus] = useState<'loading' | 'paid' | 'open' | 'failed' | 'error'>(initialStatus || (transactionId ? 'loading' : 'paid'));
    const [retryCount, setRetryCount] = useState(0);

    useEffect(() => {
        if (!transactionId) return;

        const checkStatus = async () => {
            const result = await getTransactionStatusAction(transactionId);

            if (result.status === 'paid') {
                setStatus('paid');
            } else if (result.status === 'failed') {
                setStatus('failed');
            } else if (result.status === 'open' && retryCount < 5) {
                setTimeout(() => setRetryCount(prev => prev + 1), 2000);
            } else if (result.status === 'open') {
                setStatus('open');
            } else {
                setStatus('error');
            }
        };

        void checkStatus();
    }, [transactionId, retryCount]);

    const renderContent = () => {
        switch (status) {
            case 'loading':
                return (
                    <Stack align="center" gap="lg" py="xl">
                        <Loader size="xl" />
                        <Title order={1} size="h2">
                            Status controleren...
                        </Title>
                    </Stack>
                );
            case 'paid':
                return (
                    <Stack align="center" gap="md">
                        <ThemeIcon size="xl" color="success">
                            <CheckCircle size={56} />
                        </ThemeIcon>
                        <Title order={1} size="h1" c="brand">
                            GESLAAGD!
                        </Title>
                        <Text size="lg" c="dimmed" maw={500}>
                            {type === 'renewal'
                                ? 'Welkom terug! Je lidmaatschap is succesvol verlengd. Je hebt weer volledige toegang tot alle activiteiten.'
                                : 'Bedankt voor je inschrijving! Je bent nu officieel lid van Salve Mundi. We hebben een bevestigingsmail naar je gestuurd.'}
                        </Text>
                    </Stack>
                );
            case 'failed':
                return (
                    <Stack align="center" gap="md">
                        <ThemeIcon size="xl" color="error">
                            <XCircle size={56} />
                        </ThemeIcon>
                        <Title order={1} size="h2" c="error">
                            Betaling Mislukt
                        </Title>
                        <Text size="lg" c="dimmed" maw={500}>
                            Helaas is de betaling niet gelukt. Je kunt het opnieuw proberen om je lidmaatschap te activeren.
                        </Text>
                        <Button type="button" size="lg" onClick={() => router.push('/lidmaatschap')}>
                            Opnieuw proberen
                        </Button>
                    </Stack>
                );
            default:
                return (
                    <Stack align="center" gap="md">
                        <ThemeIcon size="xl" color="accent">
                            <AlertTriangle size={56} />
                        </ThemeIcon>
                        <Title order={1} size="h2">
                            Verwerking...
                        </Title>
                        <Text size="lg" c="dimmed" maw={500}>
                            We wachten nog op bevestiging van de betaling. Dit kan een ogenblik duren.
                        </Text>
                    </Stack>
                );
        }
    };

    return (
        <Card padding="xl" shadow="xl" maw={672} w="100%" ta="center">
            <Stack gap="xl" align="center">
                {renderContent()}

                <Group justify="center" gap="md" wrap="wrap">
                    {status === 'paid' && (
                        <Button
                            type="button"
                            size="lg"
                            leftSection={<User size={20} />}
                            onClick={() => router.push('/profiel')}
                        >
                            Naar mijn account
                        </Button>
                    )}
                    <Button
                        type="button"
                        size="lg"
                        leftSection={<Home size={20} />}
                        onClick={() => router.push('/')}
                    >
                        Terug naar Home
                    </Button>
                </Group>
            </Stack>
        </Card>
    );
}
