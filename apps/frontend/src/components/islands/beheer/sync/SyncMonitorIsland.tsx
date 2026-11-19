'use client';

import React, { useState, useEffect } from 'react';
import SyncLogs from '@/components/admin/sync/SyncLogs';
import { Activity, AlertCircle } from 'lucide-react';
import {
    Alert,
    Badge,
    Box,
    Button,
    Card,
    Code,
    Divider,
    Group,
    Progress,
    SimpleGrid,
    Stack,
    Text,
    ThemeIcon,
    Title,
} from '@mantine/core';
import { useSync } from './SyncContext';

interface FilterTabProps {
    active: boolean;
    label: string;
    count: number;
    onClick: () => void;
    color?: 'brand' | 'success' | 'accent' | 'error';
}

function FilterTab({ active, label, count, onClick, color = 'brand' }: FilterTabProps) {
    return (
        <Button
            type="button"
            fullWidth
            size="xs"
            variant={active ? 'filled' : 'default'}
            color={active ? color : undefined}
            onClick={onClick}
            justify="space-between"
            rightSection={
                <Badge
                    size="xs"
                    radius="xl"
                    variant={active ? 'white' : 'light'}
                    color={color}
                >
                    {count}
                </Badge>
            }
        >
            {label}
        </Button>
    );
}

export default function SyncMonitorIsland() {
    const { status, resultFilter, setResultFilter, lastUpdated } = useSync();

    const [mounted, setMounted] = useState(false);
    const [showStack, setShowStack] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const processed = status?.processed ?? 0;
    const total = status?.total ?? 0;
    const progress = total > 0 ? (processed / total) * 100 : 0;

    return (
        <Card p="lg" shadow="sm">
            <Stack gap="lg">
                <Group gap="md">
                    <ThemeIcon size="lg" variant="light" color="brand" radius="md">
                        <Activity size={20} />
                    </ThemeIcon>
                    <Box>
                        <Title order={3} size="h4">
                            Sync Monitor
                        </Title>
                        <Text size="xs" c="dimmed">
                            {lastUpdated && mounted
                                ? `Laatste update: ${lastUpdated.toLocaleTimeString()}`
                                : 'Real-time status & logs'}
                        </Text>
                    </Box>
                </Group>

                {status?.error && (
                    <Alert
                        color="error"
                        variant="light"
                        icon={<AlertCircle size={18} />}
                        title="Verbindingsfout met Sync Service"
                    >
                        {status.error} (Controleer of de service en de Netbird VPN verbinding actief zijn.)
                    </Alert>
                )}

                {status?.fatalError && (
                    <Alert
                        color="error"
                        variant="light"
                        icon={<AlertCircle size={18} />}
                        title="Kritieke Fout Gedetecteerd"
                    >
                        <Stack gap="xs">
                            <Text size="xs">{status.fatalError.message}</Text>
                            {status.fatalError.stack && (
                                <>
                                    <Button
                                        type="button"
                                        variant="subtle"
                                        color="error"
                                        size="xs"
                                        w="fit-content"
                                        px={0}
                                        onClick={() => setShowStack(!showStack)}
                                    >
                                        {showStack ? 'Verberg details' : 'Bekijk technische details (Stack Trace)'}
                                    </Button>
                                    {showStack && <Code block>{status.fatalError.stack}</Code>}
                                </>
                            )}
                        </Stack>
                    </Alert>
                )}

                <Stack gap="xs">
                    <Group justify="space-between">
                        <Text size="xs" fw={600} c="dimmed">
                            Voortgang ({processed} / {total})
                        </Text>
                        <Text size="xs" fw={700} c="brand">
                            {Math.round(progress)}%
                        </Text>
                    </Group>
                    <Progress value={progress} color="brand" size="md" radius="xl" />
                </Stack>

                <SimpleGrid cols={{ base: 2, sm: 3, md: 4, xl: 7 }} spacing="xs">
                    <FilterTab
                        active={resultFilter === 'all'}
                        label="Alles"
                        count={status?.processed || 0}
                        onClick={() => setResultFilter('all')}
                        color="brand"
                    />
                    <FilterTab
                        active={resultFilter === 'success'}
                        label="Success"
                        count={status?.successCount || 0}
                        onClick={() => setResultFilter('success')}
                        color="success"
                    />
                    <FilterTab
                        active={resultFilter === 'created'}
                        label="Nieuw"
                        count={status?.createdCount || 0}
                        onClick={() => setResultFilter('created')}
                        color="brand"
                    />
                    <FilterTab
                        active={resultFilter === 'warnings'}
                        label="Warnings"
                        count={status?.warningCount || 0}
                        onClick={() => setResultFilter('warnings')}
                        color="accent"
                    />
                    <FilterTab
                        active={resultFilter === 'missing'}
                        label="Missend"
                        count={status?.missingDataCount || 0}
                        onClick={() => setResultFilter('missing')}
                        color="brand"
                    />
                    <FilterTab
                        active={resultFilter === 'errors'}
                        label="Errors"
                        count={status?.errorCount || 0}
                        onClick={() => setResultFilter('errors')}
                        color="error"
                    />
                    <FilterTab
                        active={resultFilter === 'excluded'}
                        label="Excluded"
                        count={status?.excludedCount || 0}
                        onClick={() => setResultFilter('excluded')}
                        color="brand"
                    />
                </SimpleGrid>

                <Divider />

                <Box mih={300}>
                    <SyncLogs
                        status={
                            status || {
                                successfulUsers: [],
                                createdUsers: [],
                                warnings: [],
                                missingData: [],
                                errors: [],
                                excludedUsers: [],
                                processed: 0,
                                total: 0,
                                successCount: 0,
                                errorCount: 0,
                                warningCount: 0,
                                missingDataCount: 0,
                                excludedCount: 0,
                            }
                        }
                        resultFilter={resultFilter || 'all'}
                        setResultFilter={setResultFilter}
                    />
                </Box>
            </Stack>
        </Card>
    );
}
