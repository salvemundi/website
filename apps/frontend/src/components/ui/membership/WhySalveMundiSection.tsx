import { Card, Container, Group, SimpleGrid, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { Flame, BookOpen, CheckCircle } from 'lucide-react';

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
        icon: <Flame size={22} aria-hidden="true" />,
    },
    {
        name: 'Studie',
        description:
            'Samen sta je sterker. We organiseren bijlessen, workshops en bedrijfsbezoeken om jou te helpen excelleren in je studie en carrière.',
        color: 'lightPurple',
        icon: <BookOpen size={22} aria-hidden="true" />,
    },
    {
        name: 'Ontwikkeling',
        description:
            'Boost je CV door actief te worden in een van onze commissies. Leer organiseren, besturen en samenwerken in een professionele omgeving.',
        color: 'success',
        icon: <CheckCircle size={22} aria-hidden="true" />,
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
