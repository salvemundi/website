'use client';

import { useTransition } from 'react';
import { Check } from 'lucide-react';
import { Alert, Badge, Button, Card, Group, Paper, Stack, Text } from '@mantine/core';
import DeletionTimer from '@/components/ui/account/DeletionTimer';
import { initiateMembershipPaymentAction } from '@/server/actions/profile/membership.actions';
import type { SignupFormData } from '@salvemundi/validations/schema/membership.zod';
import { useAdminToast } from '@/hooks/use-beheer-toast';
import { formatDate } from '@/shared/lib/utils/date';
import type { EnrichedUser } from '@/types/auth';

interface MembershipStatusIslandProps {
    user: EnrichedUser;
    baseAmount: number;
}

export default function MembershipStatusIsland({ user, baseAmount }: MembershipStatusIslandProps) {
    const { showToast } = useAdminToast();
    const [isPending, startTransition] = useTransition();
    const isExpired = user.membership_status !== 'active';

    const canRenew = !user.membership_expiry || (() => {
        const expiryDate = new Date(user.membership_expiry);
        const oneMonthFromNow = new Date();
        oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
        return expiryDate <= oneMonthFromNow;
    })();

    const handleRenewal = async () => {
        startTransition(async () => {
            const formData: SignupFormData = {
                voornaam: user.first_name || '',
                achternaam: user.last_name || '',
                email: user.email,
                telefoon: user.phone_number || '',
                geboortedatum: user.date_of_birth || '',
                coupon: ''
            };

            const result = await initiateMembershipPaymentAction(formData);

            if (result.success && result.checkoutUrl) {
                window.location.href = result.checkoutUrl;
            } else {
                showToast(result.error || 'Er ging iets mis bij het starten van de betaling', 'error');
            }
        });
    };

    const discountNotice = baseAmount === 10 && (
        <Paper
            p="sm"
            withBorder
            style={{
                backgroundColor: 'var(--surface-subtle)',
                borderColor: 'var(--surface-subtle-border)',
            }}
        >
            <Group justify="center" gap="sm" wrap="wrap">
                <Badge size="sm">Actief Lid</Badge>
                <Text size="xs" fw={700} c="brand">
                    Commissie-korting toegepast: Jouw verlenging kost slechts €10,00.
                </Text>
            </Group>
        </Paper>
    );

    if (!isExpired) {
        return (
            <Stack gap="lg">
                <Alert
                    icon={<Check size={18} strokeWidth={3} />}
                    title="Actief Lid"
                >
                    Je bent een lid van Salve Mundi.
                </Alert>

                <Text size="lg">
                    Welkom terug,{' '}
                    <Text span fw={700} c="brand">
                        {user.first_name}
                    </Text>
                    !
                </Text>

                <Card
                    padding="lg"
                    withBorder
                    style={{
                        backgroundColor: 'var(--surface-subtle)',
                        borderColor: 'var(--surface-subtle-border)',
                    }}
                >
                    <Stack gap="sm">
                        <Text size="xs" fw={700} tt="uppercase" c="brand">
                            Jouw gegevens
                        </Text>
                        <Text size="xl" fw={700}>
                            {user.first_name} {user.last_name}
                        </Text>
                        <Text size="sm" c="dimmed" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                            E-mailadres:{' '}
                            {user.email.split('').map((char, i) => (
                                <Text span inherit key={i}>
                                    {char}
                                    {(char === '@' || char === '.' || char === '-' || char === '_') && '\u200B'}
                                </Text>
                            ))}
                        </Text>
                        {user.membership_expiry && (
                            <Group
                                gap="xs"
                                pt="sm"
                                style={{ borderTop: '1px solid var(--surface-subtle-border)' }}
                            >
                                <Text size="sm" c="dimmed">
                                    Geldig tot:{' '}
                                    <Text span fw={700} c="var(--mantine-color-text)">
                                        {formatDate(user.membership_expiry)}
                                    </Text>
                                </Text>
                            </Group>
                        )}
                    </Stack>
                </Card>

                {canRenew && (
                    <Card padding="lg" ta="center">
                        <Stack gap="md" align="center">
                            <Text size="sm" fw={700} tt="uppercase" c="brand">
                                Lidmaatschap Verlengen
                            </Text>
                            <Text size="sm" c="dimmed">
                                Wil je je lidmaatschap alvast met een jaar verlengen?
                            </Text>
                            {discountNotice}
                            <Button
                                type="button"
                                size="md"
                                loading={isPending}
                                onClick={() => { void handleRenewal(); }}
                            >
                                {isPending ? 'Verwerken...' : `Nu Verlengen (€${baseAmount.toFixed(2).replace('.', ',')})`}
                            </Button>
                        </Stack>
                    </Card>
                )}
            </Stack>
        );
    }

    return (
        <Stack gap="lg">
            {user.membership_expiry && <DeletionTimer expiryDateStr={user.membership_expiry} />}

            <Stack gap="xs">
                <Text size="xl" fw={700} c="brand">
                    Welkom terug, {user.first_name}.
                </Text>
                <Text size="md" c="dimmed">
                    Je lidmaatschap is verlopen. Om weer toegang te krijgen tot alle activiteiten en je account te behouden, vragen we je de jaarlijkse contributie te voldoen.
                </Text>
                {discountNotice}
            </Stack>

            <Card padding="xl" ta="center">
                <Stack gap="md" align="center">
                    <Text size="sm" fw={700} tt="uppercase" c="brand">
                        Contributie Verlengen
                    </Text>
                    <Button
                        type="button"
                        size="md"
                        loading={isPending}
                        onClick={() => { void handleRenewal(); }}
                    >
                        {isPending ? 'Verwerken...' : `Nu Verlengen (€${baseAmount.toFixed(2).replace('.', ',')})`}
                    </Button>
                </Stack>
            </Card>
        </Stack>
    );
}
