'use client';

import { useState } from 'react';
import { Ticket, Calendar, MapPin, QrCode, Search } from 'lucide-react';
import { Box, Card, Divider, Group, Modal, Paper, SimpleGrid, Stack, Text, TextInput, ThemeIcon, Title, UnstyledButton } from '@mantine/core';
import QRDisplay from '@/shared/ui/QRDisplay';
import { formatDate } from '@/shared/lib/utils/date';

interface TicketData {
    id: number | string;
    qr_token: string;
    participant_name?: string;
    date_created?: string | Date;
    event_id?: {
        name?: string;
        event_date?: string | Date;
        location?: string;
    };
}

interface TicketListIslandProps {
    tickets: TicketData[];
}

export default function TicketListIsland({ tickets }: TicketListIslandProps) {
    const [selectedTicket, setSelectedTicket] = useState<TicketData | null>(null);
    const [search, setSearch] = useState('');

    const handleTicketSelect = (ticket: TicketData) => setSelectedTicket(ticket);
    const handleCloseModal = () => setSelectedTicket(null);

    const filteredTickets = tickets.filter(ticket =>
        (ticket.event_id?.name || 'Activiteit').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <Stack gap="xl">
            <Group justify="space-between" align="center" wrap="wrap" gap="md">
                <TextInput
                    placeholder="Tickets zoeken..."
                    value={search}
                    onChange={(e) => setSearch(e.currentTarget.value)}
                    leftSection={<Search size={18} />}
                    size="md"
                    w={{ base: '100%', md: 384 }}
                />

                <Paper p="sm" px="lg" withBorder>
                    <Group gap="sm">
                        <ThemeIcon size="md">
                            <Ticket size={16} />
                        </ThemeIcon>
                        <Stack gap={0}>
                            <Text size="xs" fw={900} tt="uppercase" c="dimmed">
                                Totaal aantal tickets
                            </Text>
                            <Text size="sm" fw={900}>
                                {tickets.length}
                            </Text>
                        </Stack>
                    </Group>
                </Paper>
            </Group>

            {filteredTickets.length === 0 ? (
                <Paper p="xl" withBorder ta="center" style={{ borderStyle: 'dashed' }}>
                    <Stack align="center" gap="sm" py="xl">
                        <Text span c="dimmed" opacity={0.3} lh={1}>
                            <Ticket size={64} />
                        </Text>
                        <Title order={3} size="h4" tt="uppercase">
                            Geen tickets <Text span c="brand" inherit>gevonden</Text>
                        </Title>
                        <Text c="dimmed" fw={500}>
                            Je hebt nog geen tickets voor aankomende activiteiten.
                        </Text>
                    </Stack>
                </Paper>
            ) : (
                <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="lg">
                    {filteredTickets.map((ticket) => (
                        <UnstyledButton
                            key={ticket.id}
                            type="button"
                            onClick={() => handleTicketSelect(ticket)}
                            w="100%"
                        >
                            <Card padding="lg" withBorder shadow="sm" h="100%">
                                <Stack gap="md" justify="space-between" h="100%">
                                    <Group justify="space-between" align="flex-start">
                                        <ThemeIcon size="lg">
                                            <QrCode size={24} />
                                        </ThemeIcon>
                                        <Stack gap={0} ta="right">
                                            <Text size="xs" fw={900} tt="uppercase" c="dimmed">
                                                {formatDate(ticket.date_created)}
                                            </Text>
                                            <Text size="xs" fw={900} tt="uppercase" c="brand">
                                                #{ticket.id}
                                            </Text>
                                        </Stack>
                                    </Group>

                                    <Title order={3} size="h4" tt="uppercase" lineClamp={1}>
                                        {ticket.event_id?.name || 'Activiteit'}
                                    </Title>

                                    <Stack gap={6}>
                                        <Divider />
                                        <Group gap={6} c="dimmed">
                                            <Calendar size={12} />
                                            <Text size="xs" fw={700} tt="uppercase">
                                                {formatDate(ticket.event_id?.event_date)}
                                            </Text>
                                        </Group>
                                        <Group gap={6} c="dimmed" wrap="nowrap">
                                            <MapPin size={12} style={{ flexShrink: 0 }} />
                                            <Text size="xs" fw={700} tt="uppercase" truncate>
                                                {ticket.event_id?.location || 'Strijp-S'}
                                            </Text>
                                        </Group>
                                    </Stack>
                                </Stack>
                            </Card>
                        </UnstyledButton>
                    ))}
                </SimpleGrid>
            )}

            <Modal
                opened={Boolean(selectedTicket)}
                onClose={handleCloseModal}
                centered
                size="md"
                aria-label="Digitaal ticket"
            >
                {selectedTicket && (
                    <Stack align="center" gap="lg" p="md" ta="center">
                        <Stack gap={4}>
                            <Text size="xs" fw={900} tt="uppercase" c="brand">
                                Jouw Digitale Ticket
                            </Text>
                            <Title order={2} size="h2" tt="uppercase">
                                {selectedTicket.event_id?.name || 'Activiteit'}
                            </Title>
                        </Stack>

                        <Box p="lg" bg="var(--mantine-color-white)" style={{ borderRadius: 'var(--mantine-radius-lg)', boxShadow: 'var(--mantine-shadow-lg)' }}>
                            <QRDisplay qrToken={selectedTicket.qr_token} size={240} />
                        </Box>

                        <Stack gap={4}>
                            <Text size="lg" fw={900} tt="uppercase">
                                {selectedTicket.participant_name}
                            </Text>
                            <Text size="xs" fw={700} tt="uppercase" c="dimmed">
                                Toon deze code bij de entree
                            </Text>
                        </Stack>

                        <Divider w="100%" />

                        <Stack gap={2} w="100%" ta="left">
                            <Text size="xs" fw={900} tt="uppercase" c="dimmed">
                                Inschrijfdatum
                            </Text>
                            <Text size="sm" fw={700} tt="uppercase">
                                {formatDate(selectedTicket.date_created)}
                            </Text>
                        </Stack>
                    </Stack>
                )}
            </Modal>
        </Stack>
    );
}
