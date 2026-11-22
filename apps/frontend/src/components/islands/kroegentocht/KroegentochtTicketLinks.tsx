'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, FileDown, MessageCircle, Ticket } from 'lucide-react';
import {
    Button,
    Card,
    Group,
    Modal,
    Paper,
    SimpleGrid,
    Stack,
    Text,
    ThemeIcon,
    Title,
} from '@mantine/core';
import {
    claimKroegentochtTickets,
    type MyKroegTickets,
} from '@/server/actions/events/kroegentocht/kroegentocht-tickets.actions';

export function KroegentochtTicketButtons({ tickets }: { tickets: MyKroegTickets }) {
    return (
        <Stack gap="sm">
            {tickets.whatsappUrl && (
                <Button
                    component="a"
                    href={tickets.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    fullWidth
                    size="md"
                    leftSection={<MessageCircle size={16} />}
                    rightSection={<ArrowRight size={16} />}
                >
                    Join de WhatsApp community
                </Button>
            )}
            <Button
                component="a"
                href={tickets.pdfUrl}
                download
                variant={tickets.whatsappUrl ? 'light' : 'filled'}
                fullWidth
                size="md"
                leftSection={<FileDown size={16} />}
            >
                Download tickets (PDF met QR-code{tickets.names.length === 1 ? '' : 's'})
            </Button>
        </Stack>
    );
}

export function KroegentochtMyTicketsCard({ items }: { items: MyKroegTickets[] }) {
    if (items.length === 0) return null;

    return (
        <Card component="section" padding="xl">
            <Stack gap="lg">
                <Stack gap={4}>
                    <Group gap="sm">
                        <ThemeIcon size="lg">
                            <Ticket size={20} />
                        </ThemeIcon>
                        <Title order={2} size="h3" c="brand">
                            Jouw kroegentocht-tickets
                        </Title>
                    </Group>
                    <Text size="sm" c="dimmed">
                        Je bent ingeschreven! Hier vind je de WhatsApp-community en je tickets terug.
                    </Text>
                </Stack>

                <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
                    {items.map((item) => (
                        <Paper key={item.signupId} withBorder p="md">
                            <Stack gap="md">
                                <Stack gap={2}>
                                    <Text size="xs" fw={700} tt="uppercase" c="dimmed">
                                        {item.eventName}
                                    </Text>
                                    <Text size="sm" fw={600}>
                                        {item.names.join(', ')}
                                    </Text>
                                </Stack>
                                <KroegentochtTicketButtons tickets={item} />
                            </Stack>
                        </Paper>
                    ))}
                </SimpleGrid>
            </Stack>
        </Card>
    );
}

export function KroegentochtClaimTicketsPopup({
    signupId,
    token,
}: {
    signupId?: number;
    token?: string;
}) {
    const [tickets, setTickets] = useState<MyKroegTickets | null>(null);
    const [isOpen, setIsOpen] = useState(true);

    useEffect(() => {
        if (!signupId || !token) return;
        let cancelled = false;
        let attempts = 0;
        const tryClaim = async () => {
            attempts += 1;
            const res = await claimKroegentochtTickets(signupId, token);
            if (cancelled) return;
            if (res.status === 'ok') {
                setTickets(res.tickets);
            } else if (res.status === 'pending' && attempts < 40) {
                setTimeout(() => {
                    void tryClaim();
                }, 3000);
            }
        };
        void tryClaim();
        return () => {
            cancelled = true;
        };
    }, [signupId, token]);

    if (!tickets || !isOpen) return null;

    return (
        <Modal
            opened={isOpen}
            onClose={() => setIsOpen(false)}
            centered
            size="sm"
            withCloseButton
            aria-label="Je bent ingeschreven!"
        >
            <Stack gap="md">
                <ThemeIcon size={48}>
                    <Ticket size={24} />
                </ThemeIcon>

                <Stack gap="xs">
                    <Title order={3} size="h4">
                        Je bent ingeschreven!
                    </Title>
                    <Text size="sm" c="dimmed">
                        Join de WhatsApp-community voor routes, tijden en groepsindelingen, en
                        download je tickets. Je kunt deze links de komende 14 dagen ook terugvinden
                        op de kroegentocht-pagina.
                    </Text>
                </Stack>

                <KroegentochtTicketButtons tickets={tickets} />
            </Stack>
        </Modal>
    );
}
