import * as nextServer from 'next/server';
import { ShieldCheck, MessageCircle, BookOpen } from 'lucide-react';
import { Card, Container, Group, Paper, SimpleGrid, Stack, Text, ThemeIcon, Title } from '@mantine/core';

import PublicPageShell from '@/components/ui/layout/PublicPageShell';
import IntroConfidantCard from '@/components/ui/social/IntroConfidantCard';
import IntroGroupsAppButtons from '@/components/ui/social/IntroGroupsAppButtons';
import IntroPlanningLiveIsland from '@/components/islands/intro/IntroPlanningLiveIsland';
import DocumentAsset from '@/components/ui/media/DocumentAsset';
import { getImageUrl } from '@/lib/utils/image-utils';
import {
    getIntroPlanningPublic,
    getIntroConfidantsPublic,
    getIntroGroupsAppLinks,
    getIntroPlanningImagePublic,
    getIntroInfoBookletPublic,
    incrementIntroQrScanCount
} from '@/server/actions/public/intro.actions';

export const metadata = {
    title: 'QR Code | Salve Mundi Introductie',
    description: 'Hier vind je handige informatie tijdens de introductieweek.'
};

export default async function QRCodePage() {
    await nextServer.connection();

    const [planning, confidants, groups, planningImage, infoBooklet, scanCount] = await Promise.all([
        getIntroPlanningPublic(),
        getIntroConfidantsPublic(),
        getIntroGroupsAppLinks(),
        getIntroPlanningImagePublic(),
        getIntroInfoBookletPublic(),
        incrementIntroQrScanCount()
    ]);

    const planningImageUrl = planningImage ? getImageUrl(planningImage, { width: 1600, fit: 'inside' }) : null;

    return (
        <PublicPageShell>
            <Container size="xl" py="xl">
                <Stack gap="xl">
                    <Stack component="header" align="center" ta="center" gap="sm" maw={672} mx="auto">
                        <Text size="sm" fw={900} tt="uppercase" c="brand" lts={2}>
                            Salve Mundi Introductie
                        </Text>
                        <Title order={1} fz={{ base: '2rem', sm: '2.5rem', lg: '3rem' }}>
                            Welkom bij de introweek!
                        </Title>
                        <Text size="lg" c="dimmed">
                            Alles wat je nodig hebt tijdens de introweek: de planning, wie je kan aanspreken als er iets is,
                            en hoe je bij de groepsapp komt.
                        </Text>
                    </Stack>

                    <IntroPlanningLiveIsland planning={planning} planningImageUrl={planningImageUrl} />

                    {infoBooklet && (
                        <Card component="section" padding="xl">
                            <Group justify="space-between" align="center" gap="lg" wrap="wrap">
                                <Group gap="lg" wrap="nowrap" style={{ flex: 1, minWidth: 240 }}>
                                    <ThemeIcon size={56} radius="lg" variant="light" color="brand">
                                        <BookOpen size={26} />
                                    </ThemeIcon>
                                    <Stack gap={4}>
                                        <Title order={2} size="h3" c="brand">
                                            Infoboekje
                                        </Title>
                                        <Text size="sm" c="dimmed">
                                            Alle praktische info voor de introweek op een rijtje.
                                        </Text>
                                    </Stack>
                                </Group>
                                <DocumentAsset id={infoBooklet} label="Download infoboekje" />
                            </Group>
                        </Card>
                    )}

                    <Card component="section" padding="xl">
                        <Stack gap="lg">
                            <Group align="flex-start" gap="lg" wrap="nowrap">
                                <ThemeIcon size={56} radius="lg" variant="light" color="brand">
                                    <MessageCircle size={26} />
                                </ThemeIcon>
                                <Stack gap={4}>
                                    <Title order={2} c="brand">
                                        Groepsapp
                                    </Title>
                                    <Text c="dimmed">
                                        Sluit je aan bij de groepsapp om op de hoogte te blijven en contact te leggen met je mede-introducees.
                                    </Text>
                                </Stack>
                            </Group>

                            <IntroGroupsAppButtons groups={groups} />
                        </Stack>
                    </Card>

                    <Card component="section" padding="xl">
                        <Stack gap="lg">
                            <Group align="flex-start" gap="lg" wrap="nowrap">
                                <ThemeIcon size={56} radius="lg" variant="light" color="brand">
                                    <ShieldCheck size={26} />
                                </ThemeIcon>
                                <Stack gap={4}>
                                    <Title order={2} c="brand">
                                        Vertrouwenscontactpersonen
                                    </Title>
                                    <Text c="dimmed">
                                        Loopt iets niet lekker tijdens de introweek? Deze mensen staan voor je klaar en denken met je mee.
                                    </Text>
                                </Stack>
                            </Group>

                            {confidants.length > 0 ? (
                                <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
                                    {confidants.map(confidant => (
                                        <IntroConfidantCard key={confidant.id} confidant={confidant} />
                                    ))}
                                </SimpleGrid>
                            ) : (
                                <Paper p="xl" radius="lg" bg="var(--mantine-color-body)">
                                    <Stack align="center" ta="center" gap="sm">
                                        <ThemeIcon size={48} radius="xl" variant="light" color="brand">
                                            <ShieldCheck size={24} />
                                        </ThemeIcon>
                                        <Text size="lg" fw={700} c="dimmed">
                                            Wordt binnenkort aangevuld
                                        </Text>
                                    </Stack>
                                </Paper>
                            )}
                        </Stack>
                    </Card>

                    <Text size="xs" c="dimmed" ta="center">
                        {scanCount.toLocaleString('nl-NL')} keer bekeken
                    </Text>
                </Stack>
            </Container>
        </PublicPageShell>
    );
}
