import Link from '@/components/ui/Link';
import { notFound } from 'next/navigation';
import { CheckCircle2, ChevronLeft } from 'lucide-react';
import { Button, Card, Center, Container, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import PaymentStatusIsland from '@/components/islands/activiteiten/PaymentStatusIsland';
import { getPaymentStatusAction } from '@/server/actions/events/reis/reis-payment.actions';
import { KroegentochtClaimTicketsPopup } from '@/components/islands/kroegentocht/KroegentochtTicketLinks';
import PublicPageShell from '@/components/ui/layout/PublicPageShell';

interface PageProps {
    searchParams: Promise<{ id?: string; transaction_id?: string; t?: string }>;
}

export default async function KroegentochtConfirmationPage({ searchParams }: PageProps) {
    const { id, transaction_id, t } = await searchParams;

    if (!id && !transaction_id && !t) notFound();

    const token = transaction_id || t;
    if (!token) {
        return (
            <PublicPageShell title="Bevestiging" hideHeader={true}>
                <Container size="xs" py="xl">
                    <Center mih="70vh">
                        <Card w="100%" padding="xl">
                            <Stack align="center" ta="center" gap="md">
                                <Title order={1} size="h2" c="brand">
                                    Ongeldige Status
                                </Title>
                                <Text c="dimmed">
                                    We kunnen de status van je betaling niet verifiëren zonder een geldige transactie.
                                </Text>
                                <Button
                                    component={Link}
                                    href="/kroegentocht"
                                    variant="default"
                                    size="sm"
                                    leftSection={<ChevronLeft size={16} />}
                                >
                                    Terug naar Kroegentocht
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
    const initialStatus = statusRes.success && 'payment_status' in statusRes ? statusRes.payment_status : 'loading';
    const isPaid = initialStatus === 'paid';

    return (
        <PublicPageShell
            title="Bevestiging Betaling"
            backgroundImage="/img/backgrounds/Kroto2025.jpg"
            imageFilter="brightness(0.55)"
        >
            <Container size="sm" py="xl">
                <Center mih="75vh">
                    {isPaid ? (
                        <Card w="100%" padding="xl">
                            <Stack align="center" ta="center" gap="lg">
                                <ThemeIcon size={80} radius="xl" variant="light" color="success">
                                    <CheckCircle2 size={44} />
                                </ThemeIcon>
                                <Title order={2} c="brand">
                                    Betaling Geslaagd!
                                </Title>
                                <Text c="dimmed" maw={380}>
                                    Je betaling voor de kroegentocht is succesvol verwerkt. Je ontvangt binnen enkele minuten een bevestiging en je tickets in je e-mail.
                                </Text>
                                <Button
                                    component={Link}
                                    href="/kroegentocht"
                                    variant="default"
                                    size="md"
                                    leftSection={<ChevronLeft size={16} />}
                                >
                                    Terug naar Kroegentocht
                                </Button>
                            </Stack>
                        </Card>
                    ) : (
                        <PaymentStatusIsland
                            mollieId={token}
                            returnUrl="/kroegentocht"
                            returnText="Terug naar Kroegentocht"
                            successText="Je betaling voor de kroegentocht is succesvol verwerkt. Je ontvangt binnen enkele minuten een bevestiging en je tickets in je e-mail."
                            initialStatus={initialStatus}
                        />
                    )}
                </Center>
            </Container>
            <KroegentochtClaimTicketsPopup signupId={id ? Number(id) : undefined} token={token} />
        </PublicPageShell>
    );
}
