import type { Metadata } from 'next';
import Link from '@/components/ui/Link';
import { connection } from 'next/server';
import { ChevronLeft, History } from 'lucide-react';
import { Box, Button, Container, Divider, Group, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import PublicPageShell from '@/components/ui/layout/PublicPageShell';
import BoardHistoryTimeline from '@/components/ui/commissies/BoardHistoryTimeline';
import { getBoardHistory } from '@/server/actions/beheer/beheer-board.actions';

export const metadata: Metadata = {
    title: 'Bestuursgeschiedenis | Salve Mundi',
    description: 'Ontdek de mensen die Salve Mundi door de jaren heen hebben gevormd en geleid.'
};

export default async function BoardHistoryPage() {
    await connection();

    const boards = await getBoardHistory();

    return (
        <PublicPageShell>
            <Container size="xl" py="xl">
                <Stack gap="xl">
                    <Group>
                        <Button
                            component={Link}
                            href="/commissies/bestuur"
                            title="Terug naar Huidig Bestuur"
                            size="sm"
                            leftSection={<ChevronLeft size={16} />}
                        >
                            Huidig Bestuur
                        </Button>
                    </Group>

                    <Box>
                        <Stack gap="xl">
                            <Stack align="center" ta="center" gap="md">
                                <ThemeIcon size="xl">
                                    <History size={32} />
                                </ThemeIcon>
                                <Title order={1} c="brand">
                                    Onze Geschiedenis
                                </Title>
                                <Text size="lg" c="dimmed" maw={680}>
                                    Sinds de oprichting van Salve Mundi hebben vele gedreven studenten zich ingezet om de vereniging te laten groeien.
                                    Hieronder vind je het overzicht van alle besturen die de basis hebben gelegd voor wat we vandaag zijn.
                                </Text>
                                <Divider w={96} size="md" color="brand" />
                            </Stack>

                            <BoardHistoryTimeline boards={boards} />
                        </Stack>
                    </Box>
                </Stack>
            </Container>
        </PublicPageShell>
    );
}
