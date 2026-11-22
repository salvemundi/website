export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { connection } from 'next/server';
import { Wine, Calendar, Clock, MapPin, Mail, ScrollText } from 'lucide-react';
import { Card, Container, Grid, GridCol, Group, List, ListItem, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import PublicPageShell from '@/components/ui/layout/PublicPageShell';
import { getFeatureFlagSettings } from '@/server/actions/beheer/beheer-utils.actions';
import {
    getLatestActiveCoboDb,
    getActiveBoardMembersDb,
    getCoboGuestBoardsDb
} from '@/server/queries/cobo/beheer-cobo.queries';
import CoboPublicQueueIsland from '@/components/islands/cobo/CoboPublicQueueIsland';
import CoboBoardMembersGrid from '@/components/islands/cobo/CoboBoardMembersGrid';
import { formatDate } from '@/shared/lib/utils/date';

export const metadata: Metadata = {
    title: 'Constitutieborrel (CoBo) | Salve Mundi',
    description: 'Bekijk de live wachtrij, bestuursvoorkeuren en informatie voor de Constitutieborrel (CoBo) van Salve Mundi.'
};

export default async function CoboPage() {
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
                title="Constitutieborrel"
                description="Vier de constitutie van het nieuwe bestuur samen met Salve Mundi en zusterverenigingen."
            >
                <Container size="sm" py="xl">
                    <Card padding="xl">
                        <Stack align="center" ta="center" gap="md">
                            <ThemeIcon size={64}>
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
                title="Constitutieborrel"
                description="Vier de constitutie van het nieuwe bestuur samen met Salve Mundi en zusterverenigingen."
            >
                <Container size="sm" py="xl">
                    <Card padding="xl">
                        <Stack align="center" ta="center" gap="md">
                            <ThemeIcon size={64}>
                                <Calendar size={32} />
                            </ThemeIcon>
                            <Title order={2} c="brand">
                                Geen actieve CoBo gevonden
                            </Title>
                            <Text size="sm" c="dimmed">
                                Er is momenteel geen actieve Constitutieborrel gepland. Houd de agenda in de gaten!
                            </Text>
                        </Stack>
                    </Card>
                </Container>
            </PublicPageShell>
        );
    }

    const [boardMembers, guestBoards] = await Promise.all([
        getActiveBoardMembersDb(activeCobo.id),
        getCoboGuestBoardsDb(activeCobo.id)
    ]);

    const formattedDate = activeCobo.date ? formatDate(activeCobo.date, 'd MMMM yyyy HH:mm') : 'Datum volgt';

    return (
        <PublicPageShell
            title={activeCobo.title || 'Constitutieborrel'}
            description={activeCobo.description || 'Vier de constitutie van het nieuwe bestuur samen met Salve Mundi en zusterverenigingen.'}
        >
            <Container size="xl" py="xl">
                <Stack gap="xl">
                    <Grid gap="xl" align="flex-start">
                        <GridCol span={{ base: 12, lg: 7 }}>
                            <CoboPublicQueueIsland
                                coboId={activeCobo.id}
                                initialGuestBoards={guestBoards}
                                limit={3}
                            />
                        </GridCol>

                        <GridCol span={{ base: 12, lg: 5 }}>
                            <Stack component="aside" gap="lg">
                                <Card padding="xl">
                                    <Stack gap="lg">
                                        <Title order={2} size="h3" c="brand">
                                            Evenement Details
                                        </Title>

                                        <Stack gap="md">
                                            <Group gap="md" wrap="nowrap">
                                                <ThemeIcon size={40}>
                                                    <Clock size={20} />
                                                </ThemeIcon>
                                                <Stack gap={2}>
                                                    <Text size="xs" fw={700} tt="uppercase" c="dimmed">
                                                        Datum &amp; Tijd
                                                    </Text>
                                                    <Text size="sm" fw={500}>
                                                        {formattedDate}
                                                    </Text>
                                                </Stack>
                                            </Group>

                                            <Group gap="md" wrap="nowrap">
                                                <ThemeIcon size={40}>
                                                    <MapPin size={20} />
                                                </ThemeIcon>
                                                <Stack gap={2}>
                                                    <Text size="xs" fw={700} tt="uppercase" c="dimmed">
                                                        Locatie
                                                    </Text>
                                                    <Text size="sm" fw={500}>
                                                        {activeCobo.location || 'Borrelbar Eindhoven'}
                                                    </Text>
                                                </Stack>
                                            </Group>

                                            <Group gap="md" wrap="nowrap">
                                                <ThemeIcon size={40}>
                                                    <Mail size={20} />
                                                </ThemeIcon>
                                                <Stack gap={2}>
                                                    <Text size="xs" fw={700} tt="uppercase" c="dimmed">
                                                        Contact
                                                    </Text>
                                                    <Text size="sm" fw={500}>
                                                        cobo@salvemundi.nl
                                                    </Text>
                                                </Stack>
                                            </Group>
                                        </Stack>
                                    </Stack>
                                </Card>

                                <Card padding="xl">
                                    <Stack gap="md">
                                        <Group gap="sm">
                                            <ThemeIcon size="lg">
                                                <ScrollText size={20} />
                                            </ThemeIcon>
                                            <Title order={2} size="h3" c="brand">
                                                CoBo Etiquette
                                            </Title>
                                        </Group>
                                        <Text size="sm" c="dimmed">
                                            Kom je het bestuur feliciteren? Meld je bij binnenkomst aan bij de <strong>pedel</strong> om op de wachtlijst te worden geplaatst.
                                        </Text>
                                        <List size="xs" c="dimmed" spacing="xs">
                                            <ListItem>Zorg dat je klaarstaat wanneer je bestuur bijna aan de beurt is.</ListItem>
                                            <ListItem>Houd rekening met de alcohol- en veto-wensen van de bestuursleden hieronder.</ListItem>
                                            <ListItem>Geniet van een gezellige avond samen met Salve Mundi!</ListItem>
                                        </List>
                                    </Stack>
                                </Card>
                            </Stack>
                        </GridCol>
                    </Grid>

                    <CoboBoardMembersGrid
                        boardMembers={boardMembers}
                        coboId={activeCobo.id}
                    />
                </Stack>
            </Container>
        </PublicPageShell>
    );
}
