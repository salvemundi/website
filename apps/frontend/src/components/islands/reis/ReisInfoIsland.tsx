'use client';

import { Calendar, Info, ShieldCheck, Mail, ExternalLink } from 'lucide-react';
import { Anchor, Box, Card, Group, SimpleGrid, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import MediaAsset from '@/components/ui/media/MediaAsset';
import type { Trip } from '@salvemundi/validations/schema/beheer-trip.zod';
import { SafeMarkdown } from '@/components/ui/security/SafeMarkdown';
import { safeConsoleError } from '@/server/utils/logger';

interface ReisInfoIslandProps {
    nextTrip: Trip | null;
}

const formatFullDate = (d: Date) => {
    try {
        return new Intl.DateTimeFormat('nl-NL', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }).format(d);
    } catch (error) {
        safeConsoleError('[ReisInfoIsland.tsx][formatFullDate] ', error);
        return 'Onbekend';
    }
};

export function ReisInfoIsland({ nextTrip }: ReisInfoIslandProps) {
    const nextTripStartDate = nextTrip?.start_date ? new Date(nextTrip.start_date) : null;
    const nextTripEndDate = nextTrip?.end_date ? new Date(nextTrip.end_date) : null;

    const formattedFromDate = nextTripStartDate && !isNaN(nextTripStartDate.getTime())
        ? formatFullDate(nextTripStartDate)
        : null;

    const formattedUntilDate = nextTripEndDate && !isNaN(nextTripEndDate.getTime())
        ? formatFullDate(nextTripEndDate)
        : null;

    return (
        <Stack w={{ base: '100%', lg: '50%' }} gap="xl">
            {nextTrip && (
                <Card padding={0} shadow="xl" withBorder style={{ overflow: 'hidden' }}>
                    {nextTrip.image && (
                        <Box
                            pos="relative"
                            h={{ base: 300, sm: 420 }}
                            w="100%"
                            style={{ backgroundColor: 'var(--surface-subtle)' }}
                        >
                            <MediaAsset
                                asset={nextTrip.image}
                                alt={nextTrip.name ?? 'Reis'}
                                fill
                                objectFit="contain"
                            />
                        </Box>
                    )}

                    <Box p={{ base: 'lg', sm: 'xl' }}>
                        <Group gap="md" wrap="nowrap">
                            <ThemeIcon size="xl">
                                <Calendar size={28} />
                            </ThemeIcon>
                            <Text size="xl" fw={700} c="brand">
                                {formattedFromDate && formattedUntilDate ? (
                                    formattedFromDate === formattedUntilDate ? formattedFromDate : `${formattedFromDate} – ${formattedUntilDate}`
                                ) : (
                                    'Wordt aangekondigd'
                                )}
                            </Text>
                        </Group>
                    </Box>
                </Card>
            )}

            {nextTrip?.description && (
                <Card padding="xl" shadow="xl" withBorder>
                    <Stack gap="md">
                        <Title order={3} size="h3" c="brand">
                            Over de Reis
                        </Title>
                        <SafeMarkdown
                            content={nextTrip.description}
                        />
                    </Stack>
                </Card>
            )}

            <Card padding="xl" shadow="xl" withBorder>
                <Stack gap="lg">
                    <Title order={3} size="h3" c="brand">
                        Goed om te weten
                    </Title>

                    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
                        {[
                            { icon: <ShieldCheck size={20} />, title: 'Lidmaatschap', content: <>Je hoeft <Text span fw={700}>geen lid</Text> te zijn om mee te gaan.</> },
                            { icon: <Mail size={20} />, title: 'Bevestiging', content: <>Je krijgt direct een mail na je inschrijving.</> },
                            { icon: <Info size={20} />, title: 'Leeftijd', content: <>Minimumleeftijd voor deelname is 18 jaar.</> },
                            { icon: <ExternalLink size={20} />, title: 'Vragen?', content: <>Mail ons op <Anchor href="mailto:reis@salvemundi.nl" fw={700} c="brand">reis@salvemundi.nl</Anchor></> },
                        ].map((item, i) => (
                            <Group key={i} align="flex-start" wrap="nowrap" gap="md">
                                <ThemeIcon size="lg">
                                    {item.icon}
                                </ThemeIcon>
                                <Stack gap={2}>
                                    <Text size="xs" fw={700} c="dimmed">
                                        {item.title}
                                    </Text>
                                    <Text size="sm" fw={500}>
                                        {item.content}
                                    </Text>
                                </Stack>
                            </Group>
                        ))}
                    </SimpleGrid>
                </Stack>
            </Card>
        </Stack>
    );
}
