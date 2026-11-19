'use client';

import React, { useState } from 'react';
import { type PubCrawlTicket } from '@salvemundi/validations/schema/pub-crawl.zod';
import QRDisplay from '@/shared/ui/QRDisplay';
import { generateQRCode } from '@/lib/utils/qr-service';
import { Download, CheckCircle2 } from 'lucide-react';
import { Badge, Box, Button, Card, Divider, Group, Paper, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { useAdminToast } from '@/hooks/use-beheer-toast';
import { BRAND_COLORS } from '@/lib/config/theme';

interface KroegentochtTicketsIslandProps {
    initialTickets?: PubCrawlTicket[];
    userEmail?: string;
}

export default function KroegentochtTicketsIsland({ initialTickets = [], userEmail }: KroegentochtTicketsIslandProps) {
    const { showToast } = useAdminToast();
    const [tickets] = useState<PubCrawlTicket[]>(initialTickets);

    const downloadTicketAsImage = async (ticket: PubCrawlTicket, index: number) => {
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            const width = 600;
            const height = 800;
            canvas.width = width;
            canvas.height = height;

            ctx.fillStyle = BRAND_COLORS.lightSurface;
            ctx.fillRect(0, 0, width, height);

            ctx.fillStyle = BRAND_COLORS.purple;
            ctx.fillRect(0, 0, width, 120);

            ctx.fillStyle = BRAND_COLORS.lightSurface;
            ctx.font = 'bold 36px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`KROEGENTOCHT TICKET ${index + 1}`, width / 2, 75);

            ctx.fillStyle = BRAND_COLORS.darkBase;
            ctx.font = 'bold 48px Arial';
            ctx.fillText(`${ticket.name} ${ticket.initial}.`, width / 2, 220);

            ctx.strokeStyle = BRAND_COLORS.lightPurple;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(100, 280);
            ctx.lineTo(500, 280);
            ctx.stroke();

            const qrDataUrl = await generateQRCode(ticket.qr_token);
            const qrImg = new Image();
            qrImg.crossOrigin = 'anonymous';

            await new Promise((resolve, reject) => {
                qrImg.onload = () => {
                    const qrSize = 400;
                    ctx.drawImage(qrImg, (width - qrSize) / 2, 320, qrSize, qrSize);
                    resolve(true);
                };
                qrImg.onerror = reject;
                qrImg.src = qrDataUrl;
            });

            ctx.fillStyle = BRAND_COLORS.darkSurface;
            ctx.font = '20px Arial';
            ctx.fillText('Laat deze code scannen bij de ingang', width / 2, 750);

            const link = document.createElement('a');
            link.download = `Kroegentocht-Ticket-${ticket.name.replace(/\s+/g, '-')}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            showToast('Ticket succesvol gegenereerd', 'success');
        } catch {
            showToast('Er is een fout opgetreden bij het genereren van je ticket.', 'error');
        }
    };

    if (tickets.length === 0) return null;

    return (
        <Card padding="xl" radius="xl" shadow="xl" withBorder mb="xl">
            <Stack gap="lg">
                <Stack gap={4}>
                    <Group gap="xs">
                        <Text span c="success" lh={1}>
                            <CheckCircle2 size={24} />
                        </Text>
                        <Title order={2} size="h3" c="brand">
                            Jouw Tickets
                        </Title>
                    </Group>
                    <Text size="sm" c="dimmed">
                        {`Hieronder vind je de tickets voor ${userEmail || 'jouw account'}.`}
                    </Text>
                </Stack>

                <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="lg">
                    {tickets.map((ticket, i) => (
                        <Paper key={ticket.id} p="lg" radius="lg" withBorder>
                            <Stack align="center" gap="md">
                                <Box p="xs" bg="#FFFFFF" style={{ borderRadius: 'var(--mantine-radius-md)' }}>
                                    <QRDisplay qrToken={ticket.qr_token} size={180} />
                                </Box>

                                <Stack w="100%" gap="xs" mt="xs">
                                    <Group justify="space-between" align="flex-end">
                                        <Text size="xs" fw={700} tt="uppercase" c="dimmed">
                                            Deelnemer
                                        </Text>
                                        <Text size="sm" fw={900}>
                                            {ticket.name} {ticket.initial}.
                                        </Text>
                                    </Group>
                                    <Divider />
                                    <Group justify="space-between" align="center">
                                        <Text size="xs" fw={700} tt="uppercase" c="dimmed">
                                            Status
                                        </Text>
                                        <Badge
                                            size="sm"
                                            variant="light"
                                            color={ticket.checked_in ? 'success' : 'brand'}
                                        >
                                            {ticket.checked_in ? 'Ingecheckt' : 'Geldig'}
                                        </Badge>
                                    </Group>
                                </Stack>

                                <Button
                                    type="button"
                                    variant="default"
                                    fullWidth
                                    size="sm"
                                    mt="xs"
                                    leftSection={<Download size={16} />}
                                    onClick={() => { void downloadTicketAsImage(ticket, i); }}
                                >
                                    Download Ticket
                                </Button>
                            </Stack>
                        </Paper>
                    ))}
                </SimpleGrid>
            </Stack>
        </Card>
    );
}
