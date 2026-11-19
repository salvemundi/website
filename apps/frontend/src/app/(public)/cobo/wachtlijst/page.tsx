export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import Link from '@/components/ui/Link';
import { connection } from 'next/server';
import { Wine, Calendar, ChevronLeft } from 'lucide-react';
import { Button, Card, Container, Group, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import PublicPageShell from '@/components/ui/layout/PublicPageShell';
import { getFeatureFlagSettings } from '@/server/actions/beheer/beheer-utils.actions';
import {
    getLatestActiveCoboDb,
    getCoboGuestBoardsDb
} from '@/server/queries/cobo/beheer-cobo.queries';
import CoboPublicQueueIsland from '@/components/islands/cobo/CoboPublicQueueIsland';

export const metadata: Metadata = {
    title: 'Wachtlijst | Constitutieborrel (CoBo) | Salve Mundi',
    description: 'Bekijk de volledige wachtlijst voor de Constitutieborrel van Salve Mundi.'
};

export default async function CoboWachtlijstPage() {
    await connection();

    const [featureFlag, activeCobo] = await Promise.all([
        getFeatureFlagSettings('/cobo').catch(() => ({
            show: true,
            disabled_message: null,
            canToggleVisibility: false
        })),
        getLatestActiveCoboDb()
    ]);

    const isEnabled = featureFlag.show;

    if (!isEnabled) {
        return (
            <PublicPageShell
                title="Wachtlijst CoBo"
                description="Wachtlijst van besturen/gasten."
            >
                <Container size="sm" py="xl">
                    <Card padding="xl">
                        <Stack align="center" ta="center" gap="md">
                            <ThemeIcon size={64} radius="xl" variant="light" color="brand">
                                <Wine size={32} />
                            </ThemeIcon>
                            <Title order={2} c="brand">
                                CoBo Gesloten
                            </Title>
                            <Text size="sm" c="dimmed">
                                {featureFlag.disabled_message || 'De CoBo module is momenteel gesloten.'}
                            </Text>
                        </Stack>
                    </Card>
                </Container>
            </PublicPageShell>
        );
    }

    if (!activeCobo) {
        return (
            <PublicPageShell
                title="Wachtlijst CoBo"
                description="Wachtlijst van besturen/gasten."
            >
                <Container size="sm" py="xl">
                    <Card padding="xl">
                        <Stack align="center" ta="center" gap="md">
                            <ThemeIcon size={64} radius="xl" variant="light" color="brand">
                                <Calendar size={32} />
                            </ThemeIcon>
                            <Title order={2} c="brand">
                                Geen actieve CoBo gevonden
                            </Title>
                            <Text size="sm" c="dimmed">
                                Er is momenteel geen actieve Constitutieborrel gepland.
                            </Text>
                        </Stack>
                    </Card>
                </Container>
            </PublicPageShell>
        );
    }

    const guestBoards = await getCoboGuestBoardsDb(activeCobo.id);

    return (
        <PublicPageShell
            title={`Live Wachtlijst: ${activeCobo.title || 'CoBo'}`}
            description="Realtime live volgorde van feliciterende besturen en verenigingen."
        >
            <Container size="md" py="xl">
                <Stack gap="lg">
                    <Group>
                        <Button
                            component={Link}
                            href="/cobo"
                            title="Terug naar CoBo overzicht"
                            variant="default"
                            size="sm"
                            leftSection={<ChevronLeft size={16} />}
                        >
                            Terug
                        </Button>
                    </Group>

                    <CoboPublicQueueIsland
                        coboId={activeCobo.id}
                        initialGuestBoards={guestBoards}
                    />
                </Stack>
            </Container>
        </PublicPageShell>
    );
}
