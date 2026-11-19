'use client';

import Link from 'next/link';
import { CheckCircle2, Save, QrCode, ChevronLeft } from 'lucide-react';
import { ActionIcon, Box, Button, Card, Container, Group, SimpleGrid, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import QRDisplay from '@/shared/ui/QRDisplay';
import { type SignupData } from '../ConfirmationIsland';

interface StatusPaidActivityProps {
    signupData: SignupData | null;
    isLoggedIn: boolean;
    downloadTicket: (elementId: string, ticketName: string) => void;
}

export default function StatusPaidActivity({
    signupData,
    isLoggedIn,
    downloadTicket
}: StatusPaidActivityProps) {
    const amount = signupData?.amount_tickets || (signupData?.tickets?.length) || 1;
    const eventName = signupData?.event_id?.name || 'Activiteit';
    const redirectUrl = signupData?.event?.custom_url || signupData?.event_id?.custom_url || signupData?.custom_url;

    return (
        <Stack gap="xl">
            <Stack align="center" gap="md" ta="center">
                <ThemeIcon size={96} radius="xl" variant="light" color="success">
                    <CheckCircle2 size={48} />
                </ThemeIcon>
                <Title order={1} fz={{ base: '2.25rem', md: '3.75rem' }} lh={1}>
                    Aanmelding <Text span c="success" inherit>geslaagd!</Text>
                </Title>
                <Text size="lg" c="dimmed" maw={460}>
                    Bedankt! Je ticket{amount > 1 ? 's' : ''} {amount > 1 ? 'zijn' : 'is'} nu beschikbaar.
                </Text>
                {redirectUrl && (
                    <Text size="md" fw={600} c="brand">
                        Je wordt zo automatisch doorgestuurd...
                    </Text>
                )}
            </Stack>

            <Container size="lg" w="100%" p={0}>
                <SimpleGrid cols={{ base: 1, sm: Math.min(amount, 2), lg: Math.min(amount, 3) }} spacing="lg">
                    {Array.from({ length: amount }).map((_, i) => (
                        <Card
                            key={i}
                            id={`ticket-card-${i}`}
                            pos="relative"
                            padding="xl"
                            radius="xl"
                            withBorder
                            shadow="lg"
                        >
                            <ActionIcon
                                type="button"
                                onClick={() => downloadTicket(`ticket-card-${i}`, eventName)}
                                variant="default"
                                size="lg"
                                pos="absolute"
                                top={16}
                                right={16}
                                title="Download Ticket"
                                aria-label="Download Ticket"
                            >
                                <Save size={18} />
                            </ActionIcon>

                            <Stack align="center" gap="md" ta="center">
                                <Text size="md" fw={600} c="brand">
                                    Ticket {i + 1} / {amount}
                                </Text>
                                <Box p="md" bg="#FFFFFF" style={{ borderRadius: 'var(--mantine-radius-lg)', boxShadow: 'var(--mantine-shadow-md)' }}>
                                    <QRDisplay
                                        qrToken={(() => {
                                            const tickets = signupData?.tickets || [];
                                            const ticket = tickets.find((_, idx) => idx === i);
                                            return ticket?.qr_token || `${signupData?.qr_token || ''}${amount > 1 ? `#${i}` : ''}`;
                                        })()}
                                        size={180}
                                    />
                                </Box>
                                <Stack gap={2}>
                                    <Title order={3} size="h4">
                                        {eventName}
                                    </Title>
                                    <Text size="sm" fw={700} c="dimmed">
                                        #{signupData?.id}{amount > 1 ? `-${i + 1}` : ''}
                                    </Text>
                                </Stack>
                            </Stack>
                        </Card>
                    ))}
                </SimpleGrid>
            </Container>

            <Group justify="center" gap="md" wrap="wrap" pt="sm">
                <Button
                    component={Link}
                    href="/activiteiten"
                    size="lg"
                    leftSection={<ChevronLeft size={18} />}
                >
                    Terug naar overzicht
                </Button>
                {isLoggedIn && (
                    <Button
                        component={Link}
                        href="/profiel/tickets"
                        variant="default"
                        size="lg"
                        leftSection={<QrCode size={18} />}
                    >
                        Alle tickets
                    </Button>
                )}
            </Group>
        </Stack>
    );
}
