export const dynamic = 'force-dynamic';

import { Info, MapPin, Calendar, Clock, Users, Mail } from 'lucide-react';
import { Card, Container, Grid, GridCol, Group, SimpleGrid, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { getKroegentochtEvent, getKroegentochtTickets } from '@/server/actions/events/kroegentocht/kroegentocht-public.actions';
import { type PubCrawlTicket } from '@salvemundi/validations/schema/pub-crawl.zod';
import { getEnrichedSession } from '@/server/auth/auth-utils';
import { ObfuscatedEmail } from '@/components/ui/security/ObfuscatedEmail';
import { formatDate } from '@/shared/lib/utils/date';
import PublicPageShell from '@/components/ui/layout/PublicPageShell';
import KroegentochtFormIsland from '@/components/islands/kroegentocht/KroegentochtFormIsland';
import KroegentochtTicketsIsland from '@/components/islands/kroegentocht/KroegentochtTicketsIsland';
import { KroegentochtMyTicketsCard } from '@/components/islands/kroegentocht/KroegentochtTicketLinks';
import { getMyKroegentochtTickets } from '@/server/actions/events/kroegentocht/kroegentocht-tickets.actions';

export const metadata = {
    title: 'Kroegentocht | Salve Mundi',
    description: 'Schrijf je in voor de gezelligste kroegentocht van Eindhoven!'
};

async function RegistrationSection() {
    const [event, session] = await Promise.all([
        getKroegentochtEvent(),
        getEnrichedSession()
    ]);

    if (!event) {
        return (
            <Card padding="xl">
                <Stack align="center" ta="center" gap="md">
                    <ThemeIcon size="xl">
                        <Calendar size={32} />
                    </ThemeIcon>
                    <Title order={2} size="h3" c="brand">
                        Geen actieve Kroegentocht
                    </Title>
                    <Text c="dimmed">
                        Er is momenteel geen kroegentocht gepland waarvoor je je kunt inschrijven.
                    </Text>
                </Stack>
            </Card>
        );
    }

    if (!event.show) {
        return (
            <Card padding="xl">
                <Stack align="center" ta="center" gap="sm">
                    <Title order={2} size="h3">{event.name}</Title>
                    <Text c="dimmed" fs="italic">
                        {event.disabled_message || 'De inschrijvingen voor de kroegentocht zijn momenteel gesloten.'}
                    </Text>
                </Stack>
            </Card>
        );
    }

    const formattedDate = formatDate(event.date);

    return (
        <Grid gap="xl" align="flex-start">
            <GridCol span={{ base: 12, lg: 6 }}>
                <KroegentochtFormIsland event={event} initialUser={session?.user} />
            </GridCol>

            <GridCol span={{ base: 12, lg: 6 }}>
                <Stack gap="lg">
                    <Card component="section" padding="xl">
                        <Stack gap="md">
                            <Group gap="sm">
                                <ThemeIcon size="lg">
                                    <Info size={20} />
                                </ThemeIcon>
                                <Title order={2} size="h3" c="brand">
                                    Over de Kroegentocht
                                </Title>
                            </Group>
                            <Stack gap="sm">
                                {event.description ? (
                                    event.description.split('\n').map((p: string, i: number) => (
                                        <Text key={i} c="dimmed">{p}</Text>
                                    ))
                                ) : (
                                    <>
                                        <Text c="dimmed">
                                            De jaarlijkse Kroegentocht is een van de grootste activiteiten die tweemaal per jaar wordt georganiseerd!
                                        </Text>
                                        <Text c="dimmed">
                                            Dit is een fantastische kans om verschillende kroegen te bezoeken, nieuwe mensen te ontmoeten en een onvergetelijke avond te beleven met andere studenten en verenigingen.
                                        </Text>
                                    </>
                                )}
                            </Stack>
                        </Stack>
                    </Card>

                    <Card component="section" padding="xl">
                        <Stack gap="lg">
                            <Group gap="sm">
                                <ThemeIcon size="lg">
                                    <Calendar size={20} />
                                </ThemeIcon>
                                <Title order={2} size="h3" c="brand">
                                    Activiteit Details
                                </Title>
                            </Group>

                            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
                                <Group align="flex-start" gap="sm" wrap="nowrap">
                                    <ThemeIcon size="md">
                                        <Clock size={16} />
                                    </ThemeIcon>
                                    <Stack gap={2}>
                                        <Text size="xs" fw={600} c="dimmed">Datum</Text>
                                        <Text fw={700}>{formattedDate}</Text>
                                    </Stack>
                                </Group>

                                <Group align="flex-start" gap="sm" wrap="nowrap">
                                    <ThemeIcon size="md">
                                        <MapPin size={16} />
                                    </ThemeIcon>
                                    <Stack gap={2}>
                                        <Text size="xs" fw={600} c="dimmed">Locatie</Text>
                                        <Text fw={700}>Stratumseind</Text>
                                    </Stack>
                                </Group>

                                <Group align="flex-start" gap="sm" wrap="nowrap">
                                    <ThemeIcon size="md">
                                        <Users size={16} />
                                    </ThemeIcon>
                                    <Stack gap={2}>
                                        <Text size="xs" fw={600} c="dimmed">Organisatie</Text>
                                        <Text fw={700}>Salve Mundi / FPSA</Text>
                                    </Stack>
                                </Group>

                                <Group align="flex-start" gap="sm" wrap="nowrap">
                                    <ThemeIcon size="md">
                                        <Mail size={16} />
                                    </ThemeIcon>
                                    <Stack gap={2} miw={0}>
                                        <Text size="xs" fw={600} c="dimmed">Contact</Text>
                                        <Text fw={700} c="brand">
                                            <ObfuscatedEmail email={event.email || 'ict@salvemundi.nl'} showIcon={false} />
                                        </Text>
                                    </Stack>
                                </Group>
                            </SimpleGrid>
                        </Stack>
                    </Card>

                    <Card component="section" padding="xl">
                        <Stack gap="lg">
                            <Title order={2} size="h3" c="brand">
                                Belangrijke Info
                            </Title>
                            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
                                <Stack gap={4}>
                                    <Text size="xs" fw={700} tt="uppercase" c="dimmed">Lidmaatschap</Text>
                                    <Text size="sm" fw={500}>
                                        Je hoeft <Text span fw={700}>geen lid</Text> te zijn om deel te nemen.
                                    </Text>
                                </Stack>
                                <Stack gap={4}>
                                    <Text size="xs" fw={700} tt="uppercase" c="dimmed">Bevestiging</Text>
                                    <Text size="sm" fw={500}>
                                        Je ontvangt een bevestigingsmail na inschrijving.
                                    </Text>
                                </Stack>
                                <Stack gap={4}>
                                    <Text size="xs" fw={700} tt="uppercase" c="dimmed">Leeftijd</Text>
                                    <Text size="sm" fw={500}>
                                        Minimumleeftijd voor deelname is 18 jaar.
                                    </Text>
                                </Stack>
                            </SimpleGrid>
                        </Stack>
                    </Card>
                </Stack>
            </GridCol>
        </Grid>
    );
}

export default async function KroegentochtPage() {
    const session = await getEnrichedSession();
    const user = session?.user;

    let tickets: PubCrawlTicket[] = [];
    if (user?.email) {
        tickets = await getKroegentochtTickets(user.email).catch(() => []);
    }
    // Gasten (zonder account) zien hun tickets terug via de cookie (14 dagen).
    const myTickets = await getMyKroegentochtTickets();

    return (
        <PublicPageShell
            title="Kroegentocht"
            backgroundImage="/img/backgrounds/Kroto2025.jpg"
            imageFilter="brightness(0.55)"
            description="DÉ activiteit van het jaar! Verken de beste kroegen van Eindhoven met je medestudenten."
        >
            <Container size="xl" py="xl">
                <Stack gap="xl">
                    {user?.email && tickets.length > 0 && (
                        <KroegentochtTicketsIsland initialTickets={tickets} userEmail={user.email} />
                    )}

                    <KroegentochtMyTicketsCard items={myTickets} />

                    <RegistrationSection />
                </Stack>
            </Container>
        </PublicPageShell>
    );
}
