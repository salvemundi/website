import Link from '@/components/ui/Link';
import { ChevronLeft } from 'lucide-react';
import { Button, Container, Divider, Group, Paper, Stack, Text, Title } from '@mantine/core';
import AuditLogIsland from '@/components/islands/beheer/AuditLogIsland';
import {
    getPendingSignupsAction,
    getAuditSettingsAction,
    getSystemLogsAction
} from '@/server/actions/infrastructure/audit.actions';

export default async function AuditLoggingPage() {
    const [
        signupsRes,
        settingsRes,
        adminLogsRes,
        systemLogsRes
    ] = await Promise.all([
        getPendingSignupsAction(),
        getAuditSettingsAction(),
        getSystemLogsAction(50, 'admin'),
        getSystemLogsAction(50, 'system')
    ]);

    const combinedResolvedNames = {
        ...(adminLogsRes.success ? adminLogsRes.resolvedNames || {} : {}),
        ...(systemLogsRes.success ? systemLogsRes.resolvedNames || {} : {})
    };

    const initialData = {
        signups: signupsRes.success ? signupsRes.data : [],
        manualApproval: settingsRes.success ? settingsRes.data.manual_approval : false,
        adminLogs: adminLogsRes.success ? adminLogsRes.data : [],
        adminLogsTotal: adminLogsRes.success ? adminLogsRes.totalCount : 0,
        systemLogs: systemLogsRes.success ? systemLogsRes.data : [],
        systemLogsTotal: systemLogsRes.success ? systemLogsRes.totalCount : 0,
        idNameLookup: combinedResolvedNames
    };

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
                        <Title order={1} size="h2" c="brand">
                            Audit &amp; Logboek
                        </Title>
                    </Group>

                    <Paper withBorder px="md" py="xs">
                        <Group gap="md" wrap="nowrap">
                            <Stack gap={2} align="center" px={4}>
                                <Text size="xs" c="dimmed" fw={600} lh={1}>Wachtrij</Text>
                                <Text size="sm" fw={700} lh={1}>{initialData.signups.length}</Text>
                            </Stack>
                            <Divider orientation="vertical" />
                            <Stack gap={2} align="center" px={4}>
                                <Text size="xs" c="dimmed" fw={600} lh={1}>Commissie</Text>
                                <Text size="sm" fw={700} lh={1}>{initialData.adminLogsTotal}</Text>
                            </Stack>
                            <Divider orientation="vertical" />
                            <Stack gap={2} align="center" px={4}>
                                <Text size="xs" c="dimmed" fw={600} lh={1}>Systeem</Text>
                                <Text size="sm" fw={700} lh={1}>{initialData.systemLogsTotal}</Text>
                            </Stack>
                        </Group>
                    </Paper>
                </Group>

                <AuditLogIsland initialData={initialData} />
            </Stack>
        </Container>
    );
}
