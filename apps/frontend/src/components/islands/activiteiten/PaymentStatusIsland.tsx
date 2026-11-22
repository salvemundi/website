'use client';

import { useEffect, useState, useCallback } from 'react';
import { CheckCircle2, XCircle, RefreshCw, ChevronRight } from 'lucide-react';
import { Button, Card, Loader, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { getPaymentStatusAction } from '@/server/actions/events/reis/reis-payment.actions';

interface PaymentStatusProps {
    mollieId: string;
    onSuccess?: () => void;
    onExpire?: () => void;
    returnUrl?: string;
    returnText?: string;
    successText?: string;
}

export default function PaymentStatusIsland({
    mollieId,
    onSuccess,
    onExpire,
    returnUrl = '/reis',
    returnText = 'Terug naar Reizen',
    successText = 'Je aanbetaling is succesvol verwerkt. Je ontvangt binnen enkele minuten een bevestiging in je e-mail.',
    initialStatus = 'loading'
}: PaymentStatusProps & { initialStatus?: 'loading' | 'open' | 'paid' | 'expired' | 'failed' | 'canceled' }) {
    const [status, setStatus] = useState<'loading' | 'open' | 'paid' | 'expired' | 'failed' | 'canceled'>(initialStatus);
    const [attempts, setAttempts] = useState(0);

    const maxAttempts = 20;

    const checkStatus = useCallback(async () => {
        try {
            const res = await getPaymentStatusAction(mollieId);

            if (!res.success) {
                if (attempts < maxAttempts) {
                    setAttempts(prev => prev + 1);
                }
                return;
            }

            const currentStatus = res.payment_status;

            if (currentStatus === 'paid') {
                setStatus('paid');
                onSuccess?.();
            } else if (currentStatus === 'canceled') {
                setStatus('failed');
                setAttempts(999);
            } else if (['expired', 'failed'].includes(currentStatus)) {
                setStatus('failed');
                onExpire?.();
            } else {
                setStatus('open');
                if (attempts < maxAttempts) {
                    setAttempts(prev => prev + 1);
                } else {
                    setStatus('expired');
                }
            }
        } catch {
            if (attempts < maxAttempts) {
                setAttempts(prev => prev + 1);
            }
        }
    }, [attempts, mollieId, onExpire, onSuccess]);

    useEffect(() => {
        if (status === 'paid' || status === 'expired' || status === 'failed' || status === 'canceled') return;

        const timer = setTimeout(() => {
            void checkStatus();
        }, 3000);

        return () => clearTimeout(timer);
    }, [status, checkStatus]);

    return (
        <Card padding="xl" withBorder ta="center">
            <Stack align="center" gap="lg" py="md">
                {status === 'loading' || status === 'open' ? (
                    <>
                        <ThemeIcon size={80} color="accent">
                            <Loader size="lg" />
                        </ThemeIcon>
                        <Title order={2} size="h2">
                            Betaling Verwerken...
                        </Title>
                        <Text c="dimmed" maw={380}>
                            We wachten op bevestiging van Mollie. Dit duurt meestal enkele seconden.
                            Blijf nog even op deze pagina.
                        </Text>
                        <Text size="sm" fw={700} c="dimmed">
                            Poging {attempts} van {maxAttempts}
                        </Text>
                    </>
                ) : status === 'paid' ? (
                    <>
                        <ThemeIcon size={80} color="success">
                            <CheckCircle2 size={44} />
                        </ThemeIcon>
                        <Title order={2} size="h1">
                            Betaling Geslaagd!
                        </Title>
                        <Text c="dimmed" maw={380}>
                            {successText}
                        </Text>
                        <Button
                            type="button"
                            size="lg"
                            color="success"
                            rightSection={<ChevronRight size={18} />}
                            onClick={() => { window.location.href = returnUrl; }}
                        >
                            {returnText}
                        </Button>
                    </>
                ) : (
                    <>
                        <ThemeIcon size={80} color="error">
                            <XCircle size={44} />
                        </ThemeIcon>
                        <Title order={2} size="h2">
                            Status Onbekend
                        </Title>
                        <Text c="dimmed" maw={380}>
                            We kunnen de status op dit moment niet direct bevestigen.
                            Dit kan betekenen dat de betaling nog even nodig heeft of is afgebroken.
                        </Text>
                        <Stack gap="xs">
                            <Button
                                type="button"
                                size="lg"
                                leftSection={<RefreshCw size={18} />}
                                onClick={() => window.location.reload()}
                            >
                                Controleer Handmatig
                            </Button>
                            <Button
                                type="button"
                                onClick={() => { window.location.href = returnUrl; }}
                            >
                                Ik check het later wel
                            </Button>
                        </Stack>
                    </>
                )}
            </Stack>
        </Card>
    );
}
