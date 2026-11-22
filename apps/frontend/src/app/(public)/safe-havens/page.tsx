import type { Metadata } from 'next';
import { connection } from 'next/server';
import {
    Shield,
    Lock,
    AlertTriangle,
    UserX,
    Users,
    MessageSquare,
    MapPin,
    ExternalLink,
    Heart,
    Phone
} from 'lucide-react';
import { Alert, Button, Card, Container, Grid, GridCol, Group, Paper, SimpleGrid, Stack, Text, ThemeIcon, Title } from '@mantine/core';

import { getSafeHavens } from '@/server/actions/public/safe-haven.actions';
import SafeHavenCard from '@/components/ui/social/SafeHavenCard';
import PublicPageShell from '@/components/ui/layout/PublicPageShell';
import { ObfuscatedEmail } from '@/components/ui/security/ObfuscatedEmail';

export const metadata: Metadata = {
    title: 'Safe Havens',
    description: 'Een veilig aanspreekpunt waar je terechtkunt met zorgen, vragen of problemen. Wij luisteren zonder te oordelen.'
};

export default async function SafeHavensPage() {
    return (
        <PublicPageShell>
            <SafeHavensContent />
        </PublicPageShell>
    );
}

async function SafeHavensContent() {
    await connection();
    const topics = [
        { Icon: AlertTriangle, text: 'Agressie & geweld' },
        { Icon: Heart, text: 'Seksuele intimidatie' },
        { Icon: UserX, text: 'Pesten & uitsluiting' },
        { Icon: Users, text: 'Discriminatie' },
        { Icon: Shield, text: 'Grensoverschrijdend gedrag' },
        { Icon: MessageSquare, text: 'Persoonlijke situaties' },
    ];

    // NUCLEAR SSR: Fetch all data at the page level for zero-drift hydration
    const safeHavens = await getSafeHavens();

    return (
        <Container size="xl" py="xl">
            <Grid gap="lg" align="flex-start">
                <GridCol span={{ base: 12, lg: 8 }}>
                    <Stack gap="lg">
                        <Card component="section" padding="xl">
                            <Stack gap="lg">
                                <Group align="flex-start" gap="lg" wrap="nowrap">
                                    <ThemeIcon size={56}>
                                        <Shield size={28} />
                                    </ThemeIcon>

                                    <Stack gap="xs" style={{ flex: 1 }}>
                                        <Title order={1} size="h2" c="brand">
                                            Wat zijn Safe Havens?
                                        </Title>
                                        <Text size="lg" c="dimmed">
                                            Binnen Salve Mundi vinden wij een veilige en respectvolle omgeving essentieel.
                                            Safe Havens zijn zorgvuldig geselecteerde personen die voor jou klaarstaan:
                                            ze luisteren zonder te oordelen, denken met je mee en helpen je een passende vervolgstap te vinden.
                                        </Text>
                                    </Stack>
                                </Group>

                                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                                    <Paper p="lg" bg="var(--mantine-color-body)">
                                        <Group align="flex-start" gap="sm" wrap="nowrap">
                                            <ThemeIcon size="md">
                                                <Lock size={16} />
                                            </ThemeIcon>
                                            <Stack gap={4}>
                                                <Text fw={700}>Volledige vertrouwelijkheid</Text>
                                                <Text size="sm" c="dimmed">
                                                    Safe Havens hebben geheimhoudingsplicht. Wat je deelt blijft tussen jullie,
                                                    tenzij jij expliciet toestemming geeft om informatie te delen.
                                                </Text>
                                            </Stack>
                                        </Group>
                                    </Paper>

                                    <Paper p="lg" bg="var(--mantine-color-body)">
                                        <Group align="flex-start" gap="sm" wrap="nowrap">
                                            <ThemeIcon size="md">
                                                <Users size={16} />
                                            </ThemeIcon>
                                            <Stack gap={4}>
                                                <Text fw={700}>Diverse achtergronden</Text>
                                                <Text size="sm" c="dimmed">
                                                    We streven naar Safe Havens met verschillende achtergronden,
                                                    zodat er sneller iemand is waarbij jij je comfortabel voelt.
                                                </Text>
                                            </Stack>
                                        </Group>
                                    </Paper>
                                </SimpleGrid>
                            </Stack>
                        </Card>

                        <Card component="section" padding="xl">
                            <Stack gap="lg">
                                <Stack gap={4}>
                                    <Title order={2} c="brand">
                                        Onze Safe Havens
                                    </Title>
                                    <Text c="dimmed">
                                        Kies een persoon waarbij jij je het meest comfortabel voelt.
                                    </Text>
                                </Stack>

                                {safeHavens.length > 0 ? (
                                    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                                        {safeHavens.map((safeHaven) => (
                                            <SafeHavenCard key={safeHaven.id} safeHaven={safeHaven} />
                                        ))}
                                    </SimpleGrid>
                                ) : (
                                    <Paper p="xl" bg="var(--mantine-color-body)">
                                        <Stack align="center" ta="center" gap="sm">
                                            <ThemeIcon size={48}>
                                                <Shield size={24} />
                                            </ThemeIcon>
                                            <Text size="lg" fw={700} c="dimmed">
                                                Wordt binnenkort aangevuld
                                            </Text>
                                        </Stack>
                                    </Paper>
                                )}
                            </Stack>
                        </Card>
                    </Stack>
                </GridCol>

                <GridCol span={{ base: 12, lg: 4 }}>
                    <Stack gap="lg">
                        <Card component="section" padding="xl">
                            <Stack gap="md">
                                <Stack gap={4}>
                                    <Title order={2} size="h3" c="brand">
                                        Onderwerpen
                                    </Title>
                                    <Text size="sm" c="dimmed">
                                        Onder andere bij de volgende thema&apos;s:
                                    </Text>
                                </Stack>

                                <Stack gap="xs">
                                    {topics.map((topic) => (
                                        <Paper key={topic.text} p="sm" bg="var(--mantine-color-body)">
                                            <Group gap="sm" wrap="nowrap">
                                                <ThemeIcon size="md">
                                                    <topic.Icon size={16} />
                                                </ThemeIcon>
                                                <Text size="sm" fw={500}>
                                                    {topic.text}
                                                </Text>
                                            </Group>
                                        </Paper>
                                    ))}
                                </Stack>
                            </Stack>
                        </Card>

                        <Card component="section" padding="xl">
                            <Stack gap="lg">
                                <Stack align="center" ta="center" gap="sm">
                                    <ThemeIcon size={56}>
                                        <MapPin size={28} />
                                    </ThemeIcon>
                                    <Title order={2} size="h3" c="brand">
                                        Externe hulp
                                    </Title>
                                    <Text size="sm" c="dimmed">
                                        Hulp buiten onze vereniging nodig? Hier vind je belangrijke contactgegevens.
                                    </Text>
                                </Stack>

                                <Stack gap="sm">
                                    <Button
                                        component="a"
                                        href="https://www.fontys.nl/fontyshelpt.htm"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        fullWidth
                                        size="md"
                                        leftSection={<Shield size={18} />}
                                        rightSection={<ExternalLink size={16} />}
                                    >
                                        Fontys Safe Haven
                                    </Button>

                                    <Paper p="md" bg="var(--mantine-color-body)" ta="center">
                                        <ObfuscatedEmail
                                            email="bestuur@salvemundi.nl"
                                            showIcon={false}
                                        />
                                    </Paper>

                                    <Alert color="error" icon={<Phone size={16} />}>
                                        <Text size="sm" fw={700}>Noodgeval? Bel 112</Text>
                                    </Alert>
                                </Stack>
                            </Stack>
                        </Card>
                    </Stack>
                </GridCol>
            </Grid>
        </Container>
    );
}
