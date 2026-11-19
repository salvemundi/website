'use client';

import Link from 'next/link';
import { RefreshCw, CreditCard } from 'lucide-react';
import { Button, Group, Loader, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { useAdminToast } from '@/hooks/use-beheer-toast';
import { type SignupData } from '../ConfirmationIsland';

interface StatusPendingProps {
    signupData: SignupData | null;
    initialId?: string;
    isLoggedIn: boolean;
}

export default function StatusPending({ signupData, initialId, isLoggedIn }: StatusPendingProps) {
    const isTimeout = signupData?.errorType === 'timeout';
    const { showToast } = useAdminToast();

    const handleRetry = async () => {
        try {
            const signupId = signupData?.id || initialId;
            if (!signupId) {
                showToast('Geen aanmeldings-ID gevonden.', 'error');
                return;
            }
            const { retryActivityPayment } = await import('@/server/actions/events/activiteiten/activiteiten-status.actions');
            const result = await retryActivityPayment(Number(signupId));
            if (result.success && result.checkoutUrl) {
                window.location.href = result.checkoutUrl;
            } else {
                showToast(result.error || 'Herbetaling mislukt.', 'error');
            }
        } catch {
            showToast('Er is een fout opgetreden bij het herstarten van de betaling.', 'error');
        }
    };

    return (
        <Stack align="center" gap="xl" py="xl" ta="center">
            <ThemeIcon size={96} radius="xl" variant="light" color="accent">
                {isTimeout ? <RefreshCw size={44} /> : <Loader size="lg" color="accent" />}
            </ThemeIcon>

            <Stack gap="xs" align="center">
                <Title order={2} fz={{ base: '2rem', md: '2.5rem' }}>
                    {isTimeout ? 'Status' : 'Betaling'} <Text span c="accent" inherit>{isTimeout ? 'onduidelijk' : 'open'}</Text>
                </Title>
                <Text size="lg" c="dimmed" maw={460}>
                    {isTimeout
                        ? 'Het duurt langer dan normaal om de status te verifiëren. Check je bank-app of wacht een momentje op de mail.'
                        : 'Je betaling staat nog op open. Zodra we de bevestiging van de bank hebben, sturen we je ticket per e-mail.'}
                </Text>
            </Stack>

            <Group justify="center" gap="md" wrap="wrap">
                <Button
                    type="button"
                    variant="default"
                    size="lg"
                    onClick={() => window.location.reload()}
                    leftSection={<RefreshCw size={16} />}
                >
                    Check opnieuw
                </Button>
                <Button
                    type="button"
                    size="lg"
                    onClick={() => { void handleRetry(); }}
                    leftSection={<CreditCard size={16} />}
                >
                    Betaal nu
                </Button>
                {isLoggedIn && (
                    <Button
                        component={Link}
                        href="/profiel/tickets"
                        variant="default"
                        size="lg"
                    >
                        Mijn tickets
                    </Button>
                )}
            </Group>
        </Stack>
    );
}
