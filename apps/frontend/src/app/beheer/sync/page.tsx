import { Metadata } from 'next';
import Link from '@/components/ui/Link';
import { ChevronLeft } from 'lucide-react';
import { Button, Container, Divider, Grid, GridCol, Group, Paper, Stack, Text, Title } from '@mantine/core';
import { getSyncStatusAction, type SyncStatus } from '@/server/actions/infrastructure/azure-sync/sync-monitoring.actions';
import SyncControlIsland from '@/components/islands/beheer/sync/SyncControlIsland';
import SyncMonitorIsland from '@/components/islands/beheer/sync/SyncMonitorIsland';
import { SyncProvider } from '@/components/islands/beheer/sync/SyncContext';

export const metadata: Metadata = {
    title: 'Beheer Sync | SV Salve Mundi'
};

export default async function AzureSyncPage() {
    const statusData = await getSyncStatusAction();
    const initialStatus = !('success' in statusData)
        ? (statusData as SyncStatus)
        : null;

    const issuesCount = (initialStatus?.errorCount || 0) + (initialStatus?.warningCount || 0) + (initialStatus?.missingDataCount || 0);
    const updatedCount = Math.max(0, (initialStatus?.successCount || 0) - (initialStatus?.createdCount || 0)) + (initialStatus?.movedExpiredCount || 0);

    return (
        <Container size="xl" py="lg">
            <Stack gap="lg">
                <Group justify="space-between" wrap="wrap" gap="md">
                    <Group gap="md" wrap="wrap">
                        <Button
                            component={Link}
                            href="/beheer"
                            variant="default"
                            size="sm"
                            leftSection={<ChevronLeft size={16} />}
                        >
                            Terug
                        </Button>
                        <Title order={1} size="h2" c="brand">
                            Azure Sync Monitor
                        </Title>
                    </Group>

                    <Paper withBorder px="md" py="xs" radius="lg">
                        <Group gap="md" wrap="nowrap">
                            <Stack gap={2} align="center" px={4}>
                                <Text size="xs" c="dimmed" fw={600} lh={1}>Status</Text>
                                <Text size="sm" fw={700} lh={1} c={initialStatus?.active ? 'success' : undefined}>
                                    {initialStatus?.status || 'Idle'}
                                </Text>
                            </Stack>
                            <Divider orientation="vertical" />
                            <Stack gap={2} align="center" px={4}>
                                <Text size="xs" c="dimmed" fw={600} lh={1}>Opgeslagen</Text>
                                <Text size="sm" fw={700} lh={1}>{updatedCount}</Text>
                            </Stack>
                            <Divider orientation="vertical" />
                            <Stack gap={2} align="center" px={4}>
                                <Text size="xs" c="dimmed" fw={600} lh={1}>Issues</Text>
                                <Text size="sm" fw={700} lh={1} c={issuesCount > 0 ? 'error' : undefined}>
                                    {issuesCount}
                                </Text>
                            </Stack>
                            <Divider orientation="vertical" />
                            <Stack gap={2} align="center" px={4}>
                                <Text size="xs" c="dimmed" fw={600} lh={1}>Nieuw</Text>
                                <Text size="sm" fw={700} lh={1}>{initialStatus?.createdCount || 0}</Text>
                            </Stack>
                        </Group>
                    </Paper>
                </Group>

                <SyncProvider initialStatus={initialStatus}>
                    <Grid gap="lg" align="flex-start">
                        <GridCol span={{ base: 12, lg: 4 }} pos={{ lg: 'sticky' }} top={{ lg: 32 }}>
                            <SyncControlIsland />
                        </GridCol>
                        <GridCol span={{ base: 12, lg: 8 }}>
                            <SyncMonitorIsland />
                        </GridCol>
                    </Grid>
                </SyncProvider>
            </Stack>
        </Container>
    );
}
