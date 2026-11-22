'use client';

import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import Link from 'next/link';
import { Button, Center, Container, Group, Stack, Text, ThemeIcon, Title } from '@mantine/core';

interface AdminUnauthorizedProps {
    title?: string;
    description?: string;
    backHref?: string;
}

export default function BeheerUnauthorized({
    title = 'Geen toegang',
    description = 'Je hebt geen rechten om deze sectie te bekijken. Neem contact op met de ICT-commissie als je denkt dat dit een fout is.',
    backHref,
}: AdminUnauthorizedProps) {
    return (
        <Container size="sm" py="xl">
            <Center mih="70vh">
                <Stack align="center" ta="center" gap="lg">
                    <ThemeIcon size="xl">
                        <ShieldAlert size={36} />
                    </ThemeIcon>

                    <Text size="sm" fw={900} c="brand" tt="uppercase" lts={2}>
                        403
                    </Text>

                    <Title order={2} fz={{ base: '2rem', sm: '2.5rem' }}>
                        {title}
                    </Title>

                    <Text c="dimmed" maw={440}>
                        {description}
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

                        {backHref ? (
                            <Button
                                component={Link}
                                href={backHref}
                                size="md"
                                leftSection={<ArrowLeft size={16} />}
                            >
                                Vorige Pagina
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                size="md"
                                onClick={() => window.history.back()}
                                leftSection={<ArrowLeft size={16} />}
                            >
                                Vorige Pagina
                            </Button>
                        )}
                    </Group>
                </Stack>
            </Center>
        </Container>
    );
}
