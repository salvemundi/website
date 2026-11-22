'use client';

import Link from 'next/link';
import { Home, Search, ArrowLeft } from 'lucide-react';
import { Button, Center, Container, Group, Stack, Text, ThemeIcon, Title } from '@mantine/core';

export default function NotFound() {
    return (
        <Container size="sm" py="xl">
            <Center mih="70vh">
                <Stack align="center" ta="center" gap="lg">
                    <ThemeIcon size={72}>
                        <Search size={36} />
                    </ThemeIcon>

                    <Text size="sm" fw={900} c="brand" tt="uppercase" lts={2}>
                        404
                    </Text>

                    <Title order={1} fz={{ base: '2rem', sm: '2.5rem' }}>
                        Pagina niet gevonden
                    </Title>

                    <Text c="dimmed" maw={440}>
                        Oeps! De pagina die je zoekt lijkt te zijn verhuisd of bestaat niet meer. Geen probleem, we helpen je graag terug.
                    </Text>

                    <Group justify="center" gap="md">
                        <Button
                            component={Link}
                            href="/"
                            size="md"
                            leftSection={<Home size={16} />}
                        >
                            Terug naar Home
                        </Button>

                        <Button
                            type="button"
                            size="md"
                            onClick={() => window.history.back()}
                            leftSection={<ArrowLeft size={16} />}
                        >
                            Vorige Pagina
                        </Button>
                    </Group>
                </Stack>
            </Center>
        </Container>
    );
}
