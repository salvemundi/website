import React from 'react';
import Link from '@/components/ui/Link';
import { ChevronRight } from 'lucide-react';
import dynamic from 'next/dynamic';
import {
    Anchor,
    AspectRatio,
    Card,
    Container,
    Grid,
    GridCol,
    Group,
    Stack,
    Text,
    ThemeIcon,
    Title,
} from '@mantine/core';
import type { HeroBanner } from '@salvemundi/validations/schema/home.zod';
import type { Activiteit } from '@salvemundi/validations/schema/activity.zod';
import { getImageUrl } from '@/lib/utils/image-utils';
import { toLocalISOString } from '@/lib/utils/date-utils';
import { formatDateRange } from '@/shared/lib/utils/date';
import { getActivityUrl } from '@/shared/lib/utils/activity';
import { type ExtendedSession } from '@/types/auth';

const HeroCarousel = dynamic(() => import('./HeroCarousel').then(mod => mod.HeroCarousel));

interface HeroIslandProps {
    banners?: HeroBanner[];
    activiteiten?: Activiteit[];
    initialSession?: ExtendedSession | null;
}

export function HeroIsland({ banners = [], activiteiten = [], initialSession }: HeroIslandProps) {
    const isAuthenticated = !!initialSession?.user;

    const slideUrls = banners.length
        ? [...banners]
            .sort((a, b) => a.display_order - b.display_order)
            .map((b) => getImageUrl(b.afbeelding_id, {
                width: 1200,
                height: 800,
                fit: 'cover',
                quality: 90
            }))
        : [getImageUrl(null, { width: 1200, height: 800, quality: 90 })];

    const today = toLocalISOString(new Date()) ?? new Date().toISOString().slice(0, 10);
    const nextEvent: Activiteit | null = activiteiten
        .filter((a) => (a.event_date_end || a.event_date).slice(0, 10) >= today)
        .sort((a, b) => a.event_date.localeCompare(b.event_date))
        .at(0) ?? null;

    const showMembershipLink = !isAuthenticated;

    return (
        <Container component="section" id="home">
            <Grid gap="xl" align="center">
                <GridCol span={{ base: 12, md: 7 }}>
                    <Stack gap="xl">
                        <Stack gap="md">
                            <Title order={1} fz={{ base: '2.5rem', md: '4rem' }} lh={1.1}>
                                Studievereniging
                                <br />
                                <Text span inherit c="brand">Salve Mundi</Text>
                            </Title>
                            <Text size="lg" c="dimmed" maw={560}>
                                Dè studievereniging voor HBO-studenten in Eindhoven. Ontmoet nieuwe mensen, bouw aan je netwerk en maak het meeste van je studententijd.
                            </Text>
                        </Stack>

                        {showMembershipLink ? (
                            <Anchor component={Link} href="/lidmaatschap" underline="never">
                                <Card>
                                    <Group justify="space-between" wrap="nowrap" gap="md">
                                        <Stack gap={4}>
                                            <Text size="xs" fw={700} c="brand" tt="uppercase">Word lid</Text>
                                            <Text size="lg" fw={700} truncate>Sluit je aan bij Salve Mundi</Text>
                                            <Text size="sm" c="dimmed" lineClamp={2}>Ontdek alle voordelen van een lidmaatschap!</Text>
                                        </Stack>
                                        <ThemeIcon size="lg">
                                            <ChevronRight size={20} />
                                        </ThemeIcon>
                                    </Group>
                                </Card>
                            </Anchor>
                        ) : nextEvent ? (
                            <Anchor
                                component={Link}
                                href={getActivityUrl({ name: nextEvent.name || '', custom_url: nextEvent.custom_url })}
                                underline="never"
                            >
                                <Card>
                                    <Group justify="space-between" wrap="nowrap" gap="md">
                                        <Stack gap={4}>
                                            <Text size="xs" fw={700} c="brand" tt="uppercase">Volgende activiteit</Text>
                                            <Text size="lg" fw={700} truncate>
                                                {nextEvent.name} • {formatDateRange(nextEvent.event_date, nextEvent.event_date_end)}
                                            </Text>
                                            <Text size="sm" c="dimmed" lineClamp={2}>
                                                {nextEvent.description ?? 'Kom gezellig langs!'}
                                            </Text>
                                        </Stack>
                                        <ThemeIcon size="lg">
                                            <ChevronRight size={20} />
                                        </ThemeIcon>
                                    </Group>
                                </Card>
                            </Anchor>
                        ) : (
                            <Card>
                                <Stack gap={4}>
                                    <Text size="xs" fw={700} c="brand" tt="uppercase">Volgende activiteit</Text>
                                    <Text size="lg" fw={700}>Binnenkort meer activiteiten</Text>
                                    <Text size="sm" c="dimmed">Check regelmatig onze agenda.</Text>
                                </Stack>
                            </Card>
                        )}
                    </Stack>
                </GridCol>

                <GridCol span={{ base: 12, md: 5 }}>
                    <Card p={0} style={{ overflow: 'hidden' }}>
                        <AspectRatio ratio={3 / 2}>
                            <HeroCarousel slideUrls={slideUrls} />
                        </AspectRatio>
                    </Card>
                </GridCol>
            </Grid>
        </Container>
    );
}
