import type { Metadata } from 'next';
import Link from '@/components/ui/Link';
import { CheckCircle2, ChevronLeft, XCircle } from 'lucide-react';
import { Button, Card, Center, Container, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import PaymentStatusIsland from '@/components/islands/activiteiten/PaymentStatusIsland';
import { getPaymentStatusAction } from '@/server/actions/events/reis/reis-payment.actions';
import PublicPageShell from '@/components/ui/layout/PublicPageShell';

export const metadata: Metadata = {
    title: 'Bevestiging Betaling | Salve Mundi'
};

interface PageProps {
    searchParams: Promise<{ id?: string; t?: string; tr?: string }>;
}

export default async function TripConfirmationPage({ searchParams }: PageProps) {
    const params = await searchParams;
    const token = params.tr || params.t;

    if (!token) {
        return (
            <PublicPageShell title="Bevestiging" hideHeader={true}>
                <Container size="xs" py="xl">
                    <Center mih="70vh">
                        <Card w="100%" padding="xl">
                            <Stack align="center" ta="center" gap="md">
                                <ThemeIcon size="xl" color="error">
                                    <XCircle size={32} />
                                </ThemeIcon>
                                <Title order={1} size="h2" c="brand">
                                    Ongeldige Status
                                </Title>
                                <Text c="dimmed">
                                    We kunnen de status van je betaling niet verifiëren zonder een geldige transactie- of token-ID.
                                </Text>
                                <Button
                                    component={Link}
                                    href="/reis"
                                    size="sm"
                                    leftSection={<ChevronLeft size={16} />}
                                >
                                    Terug naar Reizen
                                </Button>
                            </Stack>
                        </Card>
                    </Center>
                </Container>
            </PublicPageShell>
        );
    }

    // NUCLEAR SSR: Fetch initial status server-side
    const statusRes = await getPaymentStatusAction(token);
    const initialStatus = statusRes.success ? (statusRes.payment_status as 'loading' | 'open' | 'paid' | 'expired' | 'failed' | 'canceled') : 'loading';
    const isPaid = initialStatus === 'paid';

    return (
        <PublicPageShell title="Betaling Status" hideHeader={true}>
            <Container size="sm" py="xl">
                <Center mih="75vh">
                    {isPaid ? (
                        <Card w="100%" padding="xl">
                            <Stack align="center" ta="center" gap="lg">
                                <ThemeIcon size="xl" color="success">
                                    <CheckCircle2 size={44} />
                                </ThemeIcon>
                                <Title order={2} c="brand">
                                    Betaling Geslaagd!
                                </Title>
                                <Text c="dimmed" maw={380}>
                                    Je betaling is succesvol verwerkt. Je ontvangt binnen enkele minuten een bevestiging in je e-mail.
                                </Text>
                                <Button
                                    component={Link}
                                    href="/reis"
                                    size="md"
                                    leftSection={<ChevronLeft size={16} />}
                                >
                                    Terug naar Reizen
                                </Button>
                            </Stack>
                        </Card>
                    ) : (
                        <PaymentStatusIsland mollieId={token} initialStatus={initialStatus} />
                    )}
                </Center>
            </Container>
        </PublicPageShell>
    );
}
