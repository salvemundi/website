import type { Metadata } from 'next';
import Link from '@/components/ui/Link';
import { CheckCircle2, ChevronLeft, Clock, XCircle } from 'lucide-react';
import { Button, Card, Center, Container, Divider, Group, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import PublicPageShell from '@/components/ui/layout/PublicPageShell';
import { getPreorderStatus, syncPreorderPaymentStatus } from '@/server/actions/public/webshop.actions';

export const metadata: Metadata = {
    title: 'Bestelstatus | Webshop | Salve Mundi'
};

interface PageProps {
    searchParams: Promise<{ preorder?: string; token?: string; t?: string }>;
}

function ErrorCard({ title, message }: { title: string; message: string }) {
    return (
        <Center mih="70vh">
            <Card w="100%" maw={440} padding="xl">
                <Stack align="center" ta="center" gap="lg">
                    <ThemeIcon size={64} radius="xl" variant="light" color="error">
                        <XCircle size={32} />
                    </ThemeIcon>
                    <Title order={1} size="h2" c="brand">
                        {title}
                    </Title>
                    <Text c="dimmed">{message}</Text>
                    <Button
                        component={Link}
                        href="/merch"
                        variant="default"
                        size="sm"
                        leftSection={<ChevronLeft size={16} />}
                    >
                        Terug naar merch
                    </Button>
                </Stack>
            </Card>
        </Center>
    );
}

function getStatusLabel(status: string | null | undefined): string {
    switch (status) {
        case 'awaiting_deposit':
            return 'Wacht op betaling';
        case 'completed':
            return 'Betaald';
        case 'cancelled':
            return 'Geannuleerd';
        default:
            return status || 'Onbekend';
    }
}

export default async function WebshopBevestigingPage({ searchParams }: PageProps) {
    const params = await searchParams;
    const preorderId = params.preorder ? Number(params.preorder) : NaN;

    if (!params.preorder || Number.isNaN(preorderId)) {
        return (
            <PublicPageShell>
                <Container size="sm" py="xl">
                    <ErrorCard
                        title="Ongeldige bestelling"
                        message="We kunnen de status van je bestelling niet verifiëren zonder een geldig bestelnummer."
                    />
                </Container>
            </PublicPageShell>
        );
    }

    if (params.t) {
        await syncPreorderPaymentStatus(params.t);
    }

    const result = await getPreorderStatus(preorderId, params.token);

    if (result.status === 'not_found') {
        return (
            <PublicPageShell>
                <Container size="sm" py="xl">
                    <ErrorCard title="Bestelling niet gevonden" message="Deze bestelling bestaat niet (meer)." />
                </Container>
            </PublicPageShell>
        );
    }

    if (result.status === 'unauthorized') {
        return (
            <PublicPageShell>
                <Container size="sm" py="xl">
                    <ErrorCard title="Geen toegang" message="Je hebt geen toegang tot deze bestelling. Log in met het account waarmee je hebt besteld." />
                </Container>
            </PublicPageShell>
        );
    }

    if (result.status === 'error') {
        return (
            <PublicPageShell>
                <Container size="sm" py="xl">
                    <ErrorCard title="Er ging iets mis" message="We konden de status van je bestelling niet ophalen. Probeer het later opnieuw." />
                </Container>
            </PublicPageShell>
        );
    }

    const { preorder } = result;
    const isCompleted = preorder.status === 'completed';
    const isCancelled = preorder.status === 'cancelled';
    const statusLabel = getStatusLabel(preorder.status);

    return (
        <PublicPageShell>
            <Container size="sm" py="xl">
                <Card padding="xl">
                    <Stack gap="xl">
                        <Stack align="center" ta="center" gap="sm">
                            <ThemeIcon
                                size={64}
                                radius="xl"
                                variant="light"
                                color={isCancelled ? 'error' : isCompleted ? 'success' : 'brand'}
                            >
                                {isCancelled ? (
                                    <XCircle size={32} />
                                ) : isCompleted ? (
                                    <CheckCircle2 size={32} />
                                ) : (
                                    <Clock size={32} />
                                )}
                            </ThemeIcon>
                            <Title order={1} size="h2" c="brand">
                                Bestelling #{preorder.id}
                            </Title>
                            <Text c="dimmed">{statusLabel}</Text>
                        </Stack>

                        <Stack gap="sm">
                            {preorder.lines.map((line) => (
                                <Stack key={line.id} gap="xs">
                                    <Group justify="space-between" align="flex-start" wrap="nowrap">
                                        <Stack gap={2}>
                                            <Text fw={700} c="brand">{line.product_name_snapshot}</Text>
                                            {line.variant_label_snapshot && (
                                                <Text size="sm" c="dimmed">{line.variant_label_snapshot} &middot; {line.quantity}x</Text>
                                            )}
                                            {Array.isArray(line.custom_field_values) && (line.custom_field_values as { label: string; value: string }[]).map((f) => (
                                                <Text key={f.label} size="sm" c="dimmed">{f.label}: {f.value}</Text>
                                            ))}
                                        </Stack>
                                        <Text fw={700} c="brand">
                                            €{(Number(line.unit_price) * line.quantity).toFixed(2)}
                                        </Text>
                                    </Group>
                                    <Divider />
                                </Stack>
                            ))}
                        </Stack>

                        <Group justify="space-between">
                            <Text c="dimmed">
                                Totaalprijs {preorder.deposit_paid ? '(betaald)' : '(nog niet betaald)'}
                            </Text>
                            <Text fw={700} c="dimmed">
                                €{Number(preorder.subtotal_amount).toFixed(2)}
                            </Text>
                        </Group>

                        <Text size="sm" c="dimmed" ta="center">
                            Je ontvangt per e-mail bericht zodra je bestelling klaarstaat om af te halen.
                        </Text>

                        <Center>
                            <Button
                                component={Link}
                                href="/merch"
                                variant="default"
                                size="sm"
                                leftSection={<ChevronLeft size={16} />}
                            >
                                Terug naar merch
                            </Button>
                        </Center>
                    </Stack>
                </Card>
            </Container>
        </PublicPageShell>
    );
}
