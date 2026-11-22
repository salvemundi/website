import { Card, Container, Group, SimpleGrid, Stack, Text, ThemeIcon, Title } from '@mantine/core';

interface Pijler {
    name: string;
    description: string;
    color: string;
    icon: React.ReactNode;
}

const pijlers: Pijler[] = [
    {
        name: 'Gezelligheid',
        description:
            'Van gezellig chillen in onze eigen ruimte tot onvergetelijke feesten en weekendjes weg bij Salve Mundi. Bouw vriendschappen die een leven lang meegaan.',
        color: 'accent',
        icon: (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
            >
                <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
            </svg>
        )
    },
    {
        name: 'Studie',
        description:
            'Samen sta je sterker. We organiseren bijlessen, workshops en bedrijfsbezoeken om jou te helpen excelleren in je studie en carrière.',
        color: 'lightPurple',
        icon: (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
            >
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
        )
    },
    {
        name: 'Ontwikkeling',
        description:
            'Boost je CV door actief te worden in een van onze commissies. Leer organiseren, besturen en samenwerken in een professionele omgeving.',
        color: 'success',
        icon: (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
            >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
        )
    },
];

export function WhySalveMundiSection() {
    return (
        <Container component="section">
            <Stack gap="xl">
                <Title order={2} ta="center" fz={{ base: '2rem', md: '3rem' }}>
                    Waarom Salve Mundi?
                </Title>

                <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
                    {pijlers.map((pijler) => (
                        <Card key={pijler.name}>
                            <Stack gap="md">
                                <Group gap="sm">
                                    <ThemeIcon size="lg" color={pijler.color}>
                                        {pijler.icon}
                                    </ThemeIcon>
                                    <Title order={3} size="h4">
                                        {pijler.name}
                                    </Title>
                                </Group>
                                <Text c="dimmed">
                                    {pijler.description}
                                </Text>
                            </Stack>
                        </Card>
                    ))}
                </SimpleGrid>
            </Stack>
        </Container>
    );
}
