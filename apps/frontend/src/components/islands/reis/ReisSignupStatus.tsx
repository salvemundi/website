'use client';

import React from 'react';
import Link from 'next/link';
import { CheckCircle2, CreditCard, Utensils } from 'lucide-react';
import { Alert, Button, Card, Divider, Group, Paper, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import type { Trip } from '@salvemundi/validations/schema/beheer-trip.zod';
import type { TripSignup } from '@salvemundi/validations/schema/trip.zod';

interface ReisSignupStatusProps {
    userSignup: TripSignup;
    nextTrip: Trip | null;
    error: string | null;
}

export function ReisSignupStatus({ userSignup, nextTrip, error }: ReisSignupStatusProps) {
    const getSignupStatusDisplay = (signup: TripSignup) => {
        if (signup.status === 'waitlist') return 'Wachtrij';
        if (signup.status === 'cancelled') return 'Geannuleerd';
        if (signup.status === 'registered') return 'Geregistreerd';

        if (signup.full_payment_paid) return 'Geregistreerd (Betaald)';
        if (!signup.deposit_paid) {
            return nextTrip?.allow_deposit_payments ? 'Aanbetaling verwacht' : 'Aanbetaling nog niet geopend';
        }
        if (!nextTrip?.allow_final_payments) return 'Aanbetaling voldaan';
        return 'Restbetaling verwacht';
    };

    return (
        <Card
            padding="lg"
            withBorder
            style={{
                backgroundColor: 'var(--surface-subtle)',
                borderColor: 'var(--surface-subtle-border)',
            }}
        >
            <Stack gap="lg">
                {error && (
                    <Alert color="error">
                        {error}
                    </Alert>
                )}

                <Group gap="md">
                    <ThemeIcon size={56}>
                        <CheckCircle2 size={30} />
                    </ThemeIcon>
                    <Title order={3} size="h4" c="brand">
                        Huidige status
                    </Title>
                </Group>

                <Paper p="lg" withBorder>
                    <Stack gap={4}>
                        <Title order={4} fz={{ base: '1.5rem', sm: '1.875rem' }} c="brand" style={{ wordBreak: 'break-word' }}>
                            {getSignupStatusDisplay(userSignup)}
                        </Title>
                        {userSignup.status === 'registered' && (
                            <Text size="xs" c="dimmed" fs="italic">
                                Je aanmelding wordt momenteel beoordeeld door de commissie.
                            </Text>
                        )}
                    </Stack>
                </Paper>

                {userSignup.status === 'confirmed' && !userSignup.full_payment_paid && (
                    <>
                        <Divider />
                        <Stack gap="sm" align="flex-start">
                            {!userSignup.deposit_paid ? (
                                nextTrip?.allow_deposit_payments ? (
                                    <Button
                                        component={Link}
                                        href={`/reis/betalen/aanbetaling?id=${userSignup.id}`}
                                        leftSection={<CreditCard size={18} />}
                                    >
                                        Ga naar aanbetaling
                                    </Button>
                                ) : (
                                    <Text size="xs" c="dimmed" fs="italic">
                                        De aanbetalingen zijn momenteel nog niet geopend voor deze reis. Je ontvangt een e-mail zodra je kunt betalen.
                                    </Text>
                                )
                            ) : nextTrip?.allow_final_payments ? (
                                <Button
                                    component={Link}
                                    href={`/reis/betalen/restbetaling?id=${userSignup.id}`}
                                    leftSection={<CreditCard size={18} />}
                                >
                                    Afronden &amp; Betalen
                                </Button>
                            ) : (
                                <>
                                    <Button
                                        component={Link}
                                        href={`/reis/betalen/restbetaling?id=${userSignup.id}`}
                                        leftSection={<Utensils size={18} />}
                                    >
                                        Activiteiten beheren
                                    </Button>
                                    <Text size="xs" c="dimmed" fs="italic">
                                        De restbetaling is momenteel nog niet geopend. Je kunt wel alvast je activiteiten doorgeven of wijzigen.
                                    </Text>
                                </>
                            )}
                        </Stack>
                    </>
                )}
            </Stack>
        </Card>
    );
}
