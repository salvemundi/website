import { connection } from 'next/server';
import Link from '@/components/ui/Link';
import { CalendarClock, ArrowRight, CheckCircle2 } from 'lucide-react';
import {
    Anchor,
    Card,
    Center,
    Container,
    Group,
    Paper,
    SimpleGrid,
    Stack,
    Text,
    ThemeIcon,
    Title,
    VisuallyHidden
} from '@mantine/core';
import { getEnrichedSession } from '@/server/auth/auth-utils';
import { hasParentSignup, getIntroSignupStatusPublic } from '@/server/actions/public/intro.actions';
import { IntroStudentIsland } from '@/components/islands/intro/IntroStudentIsland';
import { IntroParentIsland } from '@/components/islands/intro/IntroParentIsland';
import { IntroLightboxIsland } from '@/components/islands/intro/IntroLightboxIsland';
import PublicPageShell from '@/components/ui/layout/PublicPageShell';

export const metadata = {
    title: 'Introductie | Salve Mundi',
    description: 'Schrijf je in voor de gezelligste introductieweek bij Salve Mundi.'
};

const IntroInfoStudent = () => (
    <Stack gap="lg">
        <Title order={2} c="brand">
            Klaar om je studententijd met een knal te beginnen?
        </Title>
        <Text size="lg" c="dimmed">
            Voordat de boeken opengaan en de eerste regels code geschreven worden, is er maar één plek waar je moet zijn: de Salve Mundi Introductie!
        </Text>

        <Stack gap="sm">
            <Title order={3} size="sm" c="brand">
                Waarom je dit niet wilt missen
            </Title>
            <Stack gap="sm">
                <Group gap="sm" align="flex-start" wrap="nowrap">
                    <Text fw={900} c="brand">01</Text>
                    <Text c="dimmed">
                        <strong>Legendarische Feesten:</strong> Ontdek het Eindhovense nachtleven met mensen die dezelfde passie delen.
                    </Text>
                </Group>
                <Group gap="sm" align="flex-start" wrap="nowrap">
                    <Text fw={900} c="brand">02</Text>
                    <Text c="dimmed">
                        <strong>Connecties:</strong> Leer de ouderejaars kennen; zij weten precies hoe je die lastige vakken straks haalt.
                    </Text>
                </Group>
                <Group gap="sm" align="flex-start" wrap="nowrap">
                    <Text fw={900} c="brand">03</Text>
                    <Text c="dimmed">
                        <strong>Gezelligheid boven alles:</strong> Geen ontgroening, maar een warm welkom bij dè studievereniging van Fontys ICT.
                    </Text>
                </Group>
            </Stack>
        </Stack>

        <Paper p="lg" radius="lg" bg="var(--mantine-color-body)">
            <Text size="sm" fw={700} fs="italic" c="dimmed">
                Of je nu een hardcore gamer bent, een toekomstige developer of gewoon houdt van een goed feestje: bij Salve Mundi hoor je erbij.
            </Text>
        </Paper>
    </Stack>
);

const IntroInfoParent = () => (
    <Stack gap="lg">
        <Stack gap={4}>
            <Title order={2} c="brand">
                Wat zijn Intro Ouders?
            </Title>
            <Text size="xl" fw={600} c="dimmed">
                Begeleid de nieuwe lichting
            </Text>
        </Stack>
        <Text size="lg" c="dimmed">
            Als ervaren Salve Mundi-lid kun je tijdens de Introweek het verschil maken. Als Intro Ouder begeleid je eerstejaars,
            help je ze wegwijs te worden in studie en stad, en zorg je dat ze zich welkom voelen.
        </Text>

        <Stack gap="sm">
            <Title order={3} size="sm" c="brand">
                Wat doet een Intro Ouder?
            </Title>
            <Stack gap="sm">
                <Group gap="sm" align="flex-start" wrap="nowrap">
                    <Text fw={900} c="brand">★</Text>
                    <Text c="dimmed">
                        <strong>Begeleiden:</strong> Help kleine groepjes nieuwe leden tijdens activiteiten en zorg voor een veilige sfeer.
                    </Text>
                </Group>
                <Group gap="sm" align="flex-start" wrap="nowrap">
                    <Text fw={900} c="brand">★</Text>
                    <Text c="dimmed">
                        <strong>Mentorschap:</strong> Geef tips over studie, rooster en het vinden van de weg in Eindhoven.
                    </Text>
                </Group>
                <Group gap="sm" align="flex-start" wrap="nowrap">
                    <Text fw={900} c="brand">★</Text>
                    <Text c="dimmed">
                        <strong>Gezelligheid:</strong> Organiseer leuke momenten binnen je groep – simpele spellen en samen eten doen wonderen.
                    </Text>
                </Group>
            </Stack>
        </Stack>

        <Paper p="lg" radius="lg" bg="var(--mantine-color-body)">
            <Text size="sm" fw={700} fs="italic" c="dimmed">
                Heb je vragen? Neem contact op met de introcommissie.
            </Text>
        </Paper>
    </Stack>
);

export default async function IntroPage() {
    await connection();

    const session = await getEnrichedSession();
    const user = session?.user;
    const [isAlreadyParent, signupStatus] = await Promise.all([
        user ? hasParentSignup() : Promise.resolve(false),
        getIntroSignupStatusPublic()
    ]);

    return (
        <PublicPageShell>
            <VisuallyHidden component="h1">Introductie</VisuallyHidden>

            <Container component="section" size="xl" py="xl">
                <Stack gap="xl">
                    <Anchor component={Link} href="/qr-code" underline="never">
                        <Card>
                            <Group justify="space-between" wrap="nowrap" gap="md">
                                <Group gap="md" wrap="nowrap">
                                    <ThemeIcon size={48} radius="lg" variant="light" color="brand">
                                        <CalendarClock size={22} />
                                    </ThemeIcon>
                                    <Stack gap={2}>
                                        <Text fw={900} size="lg">
                                            Bekijk de planning van de introweek
                                        </Text>
                                        <Text size="sm" c="dimmed">
                                            Live schema, contact en meer
                                        </Text>
                                    </Stack>
                                </Group>
                                <ThemeIcon size="lg" radius="xl" variant="light" color="brand">
                                    <ArrowRight size={18} />
                                </ThemeIcon>
                            </Group>
                        </Card>
                    </Anchor>

                    <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="xl">
                        <Stack gap="lg">
                            <Card padding="xl" style={{ flex: 1 }}>
                                {user ? <IntroInfoParent /> : <IntroInfoStudent />}
                            </Card>
                            {!user && <IntroLightboxIsland />}
                        </Stack>

                        <Stack gap="lg">
                            {user ? (
                                isAlreadyParent ? (
                                    <Card padding="xl" mih={300} style={{ flex: 1 }}>
                                        <Center h="100%">
                                            <Stack align="center" ta="center" gap="md">
                                                <ThemeIcon size={72} radius="xl" variant="light" color="success">
                                                    <CheckCircle2 size={36} />
                                                </ThemeIcon>
                                                <Title order={3}>Aangemeld!</Title>
                                                <Text c="dimmed" maw={360}>
                                                    Bedankt! Je inschrijving als Intro Ouder is ontvangen. We nemen snel contact met je op.
                                                </Text>
                                            </Stack>
                                        </Center>
                                    </Card>
                                ) : (
                                    <IntroParentIsland
                                        isOpen={signupStatus.parentSignupsOpen}
                                        initialPhone={user.phone_number || ''}
                                    />
                                )
                            ) : (
                                <IntroStudentIsland
                                    isOpen={signupStatus.studentSignupsOpen}
                                />
                            )}
                        </Stack>
                    </SimpleGrid>
                </Stack>
            </Container>
        </PublicPageShell>
    );
}
