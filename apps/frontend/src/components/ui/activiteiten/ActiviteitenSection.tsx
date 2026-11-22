import Link from '@/components/ui/Link';
import { ChevronRight, Calendar } from 'lucide-react';
import { Button, Card, Center, Container, SimpleGrid, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import type { Activiteit } from '@salvemundi/validations/schema/activity.zod';
import { ActiviteitCard } from './ActiviteitCard';
import { getActivityUrl } from '@/shared/lib/utils/activity';

interface ActiviteitenSectionProps {
    activities?: Activiteit[];
    count?: number;
}

export function ActiviteitenSection({ activities = [], count = 4 }: ActiviteitenSectionProps) {
    const displayActivities = activities.slice(0, count);
    const hasActivities = displayActivities.length > 0;

    return (
        <Container component="section" id="kalender">
            <Stack gap="xl">
                <Stack gap="xs" align="center">
                    <Title order={2} ta="center" fz={{ base: '2rem', md: '3rem' }}>
                        Aankomende activiteiten
                    </Title>
                    <Text c="dimmed" ta="center" maw={560}>
                        Van legendarische borrels tot verrijkende workshops en onvergetelijke studiereizen. Er is altijd een plek voor jou!
                    </Text>
                </Stack>

                {!hasActivities ? (
                    <Card p="xl">
                        <Stack align="center" gap="md" py="xl">
                            <ThemeIcon size={64}>
                                <Calendar size={32} />
                            </ThemeIcon>
                            <Text size="lg" fw={700} fs="italic">
                                Geen activiteiten gevonden.
                            </Text>
                        </Stack>
                    </Card>
                ) : (
                    <SimpleGrid cols={{ base: 1, sm: 2, lg: Math.min(displayActivities.length, 4) }} spacing="lg">
                        {displayActivities.map((activity) => (
                            <ActiviteitCard
                                key={activity.id}
                                activity={activity}
                                href={getActivityUrl({ name: activity.name || '', custom_url: activity.custom_url })}
                            />
                        ))}
                    </SimpleGrid>
                )}

                {hasActivities && (
                    <Center>
                        <Button component={Link} href="/activiteiten" size="lg" rightSection={<ChevronRight size={18} />}>
                            Alle activiteiten
                        </Button>
                    </Center>
                )}
            </Stack>
        </Container>
    );
}
