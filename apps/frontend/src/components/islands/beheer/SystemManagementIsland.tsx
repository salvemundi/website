'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Activity,
    CheckCircle2,
    AlertCircle,
    Zap,
    RefreshCw,
    ShieldCheck,
    Clock,
    XCircle,
    CalendarClock,
    BellRing,
    Settings2,
    Database,
    RefreshCcw
} from 'lucide-react';
import {
    Alert,
    Badge,
    Button,
    Card,
    Divider,
    Group,
    Paper,
    SimpleGrid,
    Stack,
    Tabs,
    Text,
    ThemeIcon,
    Title,
} from '@mantine/core';
import { getServicesStatusAction, type ServiceStatus } from '@/server/actions/infrastructure/services-status.actions';
import { toggleAutomationSetting, type AutomationSetting } from '@/server/actions/beheer/services/beheer-automation.actions';
import BeheerVisibilityToggle from '@/components/ui/beheer/BeheerVisibilityToggle';
import { useAdminToast } from '@/hooks/use-beheer-toast';
import { safeConsoleError } from '@/server/utils/logger';

interface Props {
    initialStatuses?: ServiceStatus[];
    initialAutomationSettings?: AutomationSetting[];
}

const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat('nl-NL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
};

export default function SystemManagementIsland({
    initialStatuses = [],
    initialAutomationSettings = []
}: Props) {
    const { showToast } = useAdminToast();
    const [statuses, setStatuses] = useState<ServiceStatus[]>(initialStatuses);
    const [automationSettings, setAutomationSettings] = useState<AutomationSetting[]>(initialAutomationSettings);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(initialStatuses.length > 0 ? new Date() : null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [togglingId, setTogglingId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'status' | 'automation'>('status');

    const fetchStatus = useCallback(async () => {
        setIsRefreshing(true);
        try {
            const data = await getServicesStatusAction();
            setStatuses(data);
            setLastUpdated(new Date());
        } catch (error) {
            safeConsoleError('[SystemManagementIsland.tsx][SystemManagementIsland] ', error);
        } finally {
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            void fetchStatus();
        }, 30000);
        return () => clearInterval(interval);
    }, [fetchStatus]);

    const handleToggleAutomation = async (key: string) => {
        setTogglingId(key);
        try {
            const res = await toggleAutomationSetting(key);
            if (res.success) {
                setAutomationSettings(prev => prev.map(s =>
                    s.id === key ? { ...s, isActive: !s.isActive } : s
                ));
                const setting = automationSettings.find(s => s.id === key);
                showToast(`${setting?.name} is nu ${!setting?.isActive ? 'ingeschakeld' : 'uitgeschakeld'}`, 'success');
            } else {
                showToast(res.error || 'Bijwerken mislukt', 'error');
            }
        } catch (error) {
            safeConsoleError('[SystemManagementIsland.tsx][SystemManagementIsland] ', error);
            showToast('Er is een onverwachte fout opgetreden', 'error');
        } finally {
            setTogglingId(null);
        }
    };

    const getStatusColor = (status: string): 'success' | 'accent' | 'error' => {
        if (status === 'online') return 'success';
        if (status === 'degraded') return 'accent';
        return 'error';
    };

    const getStatusIcon = (status: string) => {
        if (status === 'online') return <CheckCircle2 size={14} />;
        if (status === 'degraded') return <AlertCircle size={14} />;
        return <XCircle size={14} />;
    };

    return (
        <Stack gap="lg" w="100%">
            <Group justify="space-between" align="center" wrap="wrap" gap="md">
                <Tabs
                    value={activeTab}
                    onChange={(val) => {
                        if (val === 'status' || val === 'automation') {
                            setActiveTab(val);
                        }
                    }}
                >
                    <Tabs.List>
                        <Tabs.Tab value="status" leftSection={<Activity size={14} />}>
                            Status
                        </Tabs.Tab>
                        <Tabs.Tab value="automation" leftSection={<Settings2 size={14} />}>
                            Automatisering
                        </Tabs.Tab>
                    </Tabs.List>
                </Tabs>

                <Button
                    type="button"
                    onClick={() => { void fetchStatus(); }}
                    loading={isRefreshing}
                    leftSection={<RefreshCw size={16} />}
                >
                    Update Status
                </Button>
            </Group>

            {activeTab === 'status' ? (
                <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
                    {statuses.length === 0 ? (
                        <Paper withBorder p="xl" ta="center" style={{ borderStyle: 'dashed', gridColumn: '1 / -1' }}>
                            <Stack align="center" gap="xs" py="xl">
                                <AlertCircle size={40} opacity={0.25} />
                                <Text size="sm" fw={600} c="dimmed">Geen status data beschikbaar</Text>
                            </Stack>
                        </Paper>
                    ) : (
                        statuses.map((service) => {
                            const statusColor = getStatusColor(service.status);
                            return (
                                <Card key={service.name} withBorder padding="lg">
                                    <Stack gap="md">
                                        <Group justify="space-between" align="flex-start">
                                            <ThemeIcon size="xl" color="accent">
                                                {service.name.toLowerCase().includes('database') ? <Database size={22} /> : <Zap size={22} />}
                                            </ThemeIcon>
                                            <Badge
                                                color={statusColor}
                                                size="lg"
                                                leftSection={getStatusIcon(service.status)}
                                            >
                                                {service.status}
                                            </Badge>
                                        </Group>

                                        <Stack gap="xs">
                                            <Title order={3} size="h4">{service.name}</Title>
                                            <Group gap="md" wrap="wrap">
                                                <Group gap={6}>
                                                    <Text span c="accent" lh={1}><Clock size={14} /></Text>
                                                    <Text size="xs" fw={600} c="dimmed">
                                                        Latency: {service.latency ? `${service.latency}ms` : 'N/A'}
                                                    </Text>
                                                </Group>

                                                {service.status !== 'online' && service.outageStart && (
                                                    <Text size="xs" fw={600} c="error">
                                                        Offline sinds: {formatDateTime(new Date(service.outageStart))}
                                                    </Text>
                                                )}

                                                {service.status === 'online' && service.lastOffline && (
                                                    <Text size="xs" fw={600} c="dimmed">
                                                        Laatst offline: {formatDateTime(new Date(service.lastOffline))}
                                                    </Text>
                                                )}

                                                {service.status === 'online' && !service.lastOffline && (
                                                    <Text size="xs" fw={600} c="success">
                                                        Geen downtime geregistreerd
                                                    </Text>
                                                )}
                                            </Group>
                                        </Stack>

                                        {service.error && (
                                            <Alert
                                                color={service.status === 'online' ? 'brand' : 'error'}
                                                title={service.status === 'online' ? 'Laatste Foutmelding' : 'Foutmelding Detail'}
                                            >
                                                <Text size="xs">{service.error}</Text>
                                            </Alert>
                                        )}
                                    </Stack>
                                </Card>
                            );
                        })
                    )}
                </SimpleGrid>
            ) : (
                <Stack gap="lg">
                    <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
                        {automationSettings.map((setting) => (
                            <Card key={setting.id} withBorder padding="lg">
                                <Stack justify="space-between" h="100%" gap="md">
                                    <Stack gap="sm">
                                        <Group gap="md">
                                            <ThemeIcon
                                                size="xl"
                                                color={setting.isActive ? 'success' : 'error'}
                                            >
                                                {setting.id === 'mail_expiry_check' ? <CalendarClock size={22} /> :
                                                    setting.id === 'auto_sync_nightly' ? <RefreshCcw size={22} /> :
                                                        <BellRing size={22} />}
                                            </ThemeIcon>
                                            <Title order={3} size="h5">{setting.name}</Title>
                                        </Group>
                                        <Text size="xs" c="dimmed" lh={1.6}>
                                            {setting.description}
                                        </Text>
                                    </Stack>

                                    <Stack gap="sm">
                                        <Divider />
                                        <Group justify="space-between" align="center" wrap="wrap" gap="sm">
                                            <Badge
                                                color={setting.isActive ? 'success' : 'error'}
                                                variant="dot"
                                                size="md"
                                            >
                                                {setting.isActive ? 'Actief' : 'Gepauzeerd'}
                                            </Badge>
                                            <BeheerVisibilityToggle
                                                label="System Toggle"
                                                isVisible={setting.isActive}
                                                onToggle={() => {
                                                    void handleToggleAutomation(setting.id);
                                                }}
                                                isPending={togglingId === setting.id}
                                            />
                                        </Group>
                                    </Stack>
                                </Stack>
                            </Card>
                        ))}
                    </SimpleGrid>

                    <Alert
                        color="accent"
                        icon={<ShieldCheck size={24} />}
                        title="Systeem Veiligheids Protocol"
                    >
                        <Text size="xs" lh={1.6}>
                            Deze toggles beheren kritieke achtergrondprocessen. Wijzigingen treden onmiddellijk in werking.
                            De <strong>Nachtelijke Sync</strong> draait dagelijks om 03:00 en zorgt dat alle Azure-rechten in de cockpit up-to-date zijn.
                            Schakel processen alleen uit bij onderhoud of debugging om data-inconsistentie te voorkomen.
                        </Text>
                    </Alert>
                </Stack>
            )}

            {lastUpdated && (
                <Stack align="center" gap={2} mt="md">
                    <Text size="xs" c="dimmed">System Monitoring Active</Text>
                    <Text size="xs" c="dimmed">{`Last Sync: ${formatDateTime(lastUpdated)}`}</Text>
                </Stack>
            )}
        </Stack>
    );
}
