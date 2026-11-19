import Link from '@/components/ui/Link';
import { ChevronLeft } from 'lucide-react';
import { Button, Container, Divider, Group, Paper, Stack, Text, Title } from '@mantine/core';
import SystemManagementIsland from '@/components/islands/beheer/SystemManagementIsland';
import { getServicesStatusAction } from '@/server/actions/infrastructure/services-status.actions';
import { getSystemAutomationSettings } from '@/server/actions/beheer/services/beheer-automation.actions';

export const metadata = {
    title: 'Systeem Beheer | SV Salve Mundi'
};

export default async function ServicesStatusPage() {
    const [initialStatuses, automationRes] = await Promise.all([
        getServicesStatusAction(),
        getSystemAutomationSettings()
    ]);

    const initialAutomationSettings = automationRes.success ? automationRes.settings || [] : [];

    const issuesCount = initialStatuses.filter(s => s.status !== 'online').length;
    const automationCount = initialAutomationSettings.filter(s => s.isActive).length;
    const mailCount = initialAutomationSettings.filter(s => s.id.startsWith('mail') && s.isActive).length;

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
                            Systeem &amp; Automatisering
                        </Title>
                    </Group>

                    <Paper withBorder px="md" py="xs" radius="lg">
                        <Group gap="md" wrap="nowrap">
                            <Stack gap={2} align="center" px={4}>
                                <Text size="xs" c="dimmed" fw={600} lh={1}>Systemen</Text>
                                <Text size="sm" fw={700} lh={1}>{initialStatuses.length}</Text>
                            </Stack>
                            <Divider orientation="vertical" />
                            <Stack gap={2} align="center" px={4}>
                                <Text size="xs" c="dimmed" fw={600} lh={1}>Automatisering</Text>
                                <Text size="sm" fw={700} lh={1}>{automationCount}</Text>
                            </Stack>
                            <Divider orientation="vertical" />
                            <Stack gap={2} align="center" px={4}>
                                <Text size="xs" c="dimmed" fw={600} lh={1}>Mail Flows</Text>
                                <Text size="sm" fw={700} lh={1}>{mailCount}</Text>
                            </Stack>
                            <Divider orientation="vertical" />
                            <Stack gap={2} align="center" px={4}>
                                <Text size="xs" c="dimmed" fw={600} lh={1}>Gezondheid</Text>
                                <Text size="sm" fw={700} lh={1} c={issuesCount === 0 ? 'success' : 'accent'}>
                                    {issuesCount === 0 ? '100%' : 'Check'}
                                </Text>
                            </Stack>
                        </Group>
                    </Paper>
                </Group>

                <SystemManagementIsland
                    initialStatuses={initialStatuses}
                    initialAutomationSettings={initialAutomationSettings}
                />
            </Stack>
        </Container>
    );
}
