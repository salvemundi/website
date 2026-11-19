import React from 'react';
import Link from '@/components/ui/Link';
import { Search, Home, CheckCircle2 } from 'lucide-react';
import { Button, Center, Container, Group, Stack, Text, ThemeIcon, Title } from '@mantine/core';

export function TripAccessDenied({ error }: { error?: string }) {
    return (
        <Container size="sm">
            <Center mih="70vh">
                <Stack align="center" gap="lg" ta="center">
                    <ThemeIcon size={80} radius="lg" variant="light" color="brand">
                        <Search size={40} />
                    </ThemeIcon>

                    <Title order={2} fz={{ base: '2rem', sm: '2.5rem' }} tt="uppercase" fs="italic">
                        Toegang Geweigerd
                    </Title>

                    <Text c="dimmed" maw={420} fw={500}>
                        {error || 'Deze link is ongeldig of verlopen. Gebruik de link uit de e-mail of log in op je account.'}
                    </Text>

                    <Button
                        component={Link}
                        href="/reis"
                        variant="default"
                        size="md"
                        leftSection={<Home size={16} />}
                    >
                        Terug naar Reizen
                    </Button>
                </Stack>
            </Center>
        </Container>
    );
}

export function TripWaitlisted() {
    return (
        <Container size="sm">
            <Center mih="70vh">
                <Stack align="center" gap="lg" ta="center">
                    <ThemeIcon size={80} radius="lg" variant="light" color="accent">
                        <Search size={40} />
                    </ThemeIcon>

                    <Title order={2} fz={{ base: '2rem', sm: '2.5rem' }} tt="uppercase" fs="italic">
                        Wachtlijst
                    </Title>

                    <Text c="dimmed" maw={420} fw={500}>
                        Je staat momenteel op de wachtlijst voor deze reis. Je kunt pas betalen zodra er een plek vrijkomt en je status is aangepast naar &apos;Geregistreerd&apos;.
                    </Text>

                    <Button
                        component={Link}
                        href="/reis"
                        variant="default"
                        size="md"
                        leftSection={<Home size={16} />}
                    >
                        Terug naar Reizen
                    </Button>
                </Stack>
            </Center>
        </Container>
    );
}

export function TripAlreadyPaid({ tripName }: { tripName: string }) {
    return (
        <Container size="sm">
            <Center mih="70vh">
                <Stack align="center" gap="lg" ta="center">
                    <ThemeIcon size={80} radius="xl" variant="light" color="success">
                        <CheckCircle2 size={40} />
                    </ThemeIcon>

                    <Title order={1} fz={{ base: '2rem', sm: '2.5rem' }} tt="uppercase" fs="italic">
                        Betaling voltooid
                    </Title>

                    <Text c="dimmed" maw={460}>
                        Je hebt de volledige betaling voor de reis naar <Text span fw={700} c="var(--mantine-color-text)">{tripName}</Text> al voldaan.
                        Je hoeft verder niets te doen! Je hoort binnenkort meer van ons.
                    </Text>

                    <Group justify="center" gap="md">
                        <Button
                            component={Link}
                            href="/reis"
                            variant="default"
                            size="md"
                            leftSection={<Home size={16} />}
                        >
                            Terug naar Reizen
                        </Button>
                        <Button
                            component={Link}
                            href="/lidmaatschap"
                            color="accent"
                            size="md"
                        >
                            Bekijk je lidmaatschap
                        </Button>
                    </Group>
                </Stack>
            </Center>
        </Container>
    );
}
