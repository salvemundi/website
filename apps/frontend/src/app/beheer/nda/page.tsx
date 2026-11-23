import type { Metadata } from 'next';
import Link from '@/components/ui/Link';
import { ChevronLeft } from 'lucide-react';
import { Button, Container, Group, Stack, Text, Title } from '@mantine/core';
import NdaOverviewIsland from '@/components/islands/beheer/nda/NdaOverviewIsland';
import { getNdaOverview } from '@/server/actions/beheer/nda/beheer-nda-templates.actions';
import { getNdaSettings, getBestuurMembersForSecretaryPicker } from '@/server/actions/beheer/nda/beheer-nda-settings.actions';

export const metadata: Metadata = {
    title: 'NDA Beheer | SV Salve Mundi'
};

export default async function BeheerNdaPage() {
    const [overview, settings, bestuurMembers] = await Promise.all([
        getNdaOverview(),
        getNdaSettings(),
        getBestuurMembersForSecretaryPicker(),
    ]);

    return (
        <Container size="xl" py="lg">
            <Stack gap="lg">
                <Group justify="space-between" wrap="wrap" gap="md">
                    <Group gap="md" wrap="wrap">
                        <Button
                            component={Link}
                            href="/beheer"
                            size="sm"
                            leftSection={<ChevronLeft size={16} />}
                        >
                            Terug
                        </Button>
                        <Stack gap={2}>
                            <Title order={1} size="h2" c="brand">
                                NDA Beheer
                            </Title>
                            <Text size="sm" c="dimmed">
                                Geheimhoudingsverklaringen per commissie
                            </Text>
                        </Stack>
                    </Group>
                </Group>

                <NdaOverviewIsland
                    initialOverview={overview}
                    bestuurMembers={bestuurMembers}
                    initialSecretaryUserId={settings.secretaryUserId}
                    initialIsActive={settings.isActive}
                />
            </Stack>
        </Container>
    );
}
