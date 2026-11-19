'use client';

import { useState, Fragment, useMemo, useEffect } from 'react';
import type { ReactNode } from 'react';
import { RefreshCw, Search } from 'lucide-react';
import {
    ActionIcon,
    Badge,
    Box,
    Button,
    Code,
    Divider,
    Group,
    Paper,
    Stack,
    Table,
    Text,
    TextInput,
    Title,
    Tooltip,
} from '@mantine/core';
import { formatDate } from '@/shared/lib/utils/date';
import { SystemLog } from '@salvemundi/validations';
import { acknowledgeSystemLogAction } from '@/server/actions/infrastructure/audit.actions';
import { useAdminToast } from '@/hooks/use-beheer-toast';
import { safeConsoleError } from '@/server/utils/logger';
import { getLookupPrefix } from '@/shared/audit.config';

const formatDuration = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    if (mins > 0) {
        return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
};

function getStatusBadgeColor(status: string): string {
    switch (status) {
        case 'SUCCESS':
            return 'success';
        case 'INFO':
            return 'brand';
        case 'WARNING':
            return 'accent';
        default:
            return 'error';
    }
}

function getEnvBadgeColor(env: string): string {
    if (env === 'productie') return 'error';
    if (env === 'acceptatie') return 'accent';
    return 'brand';
}

interface SyncSummaryPayload {
    processed?: number;
    duration_ms?: number;
    moved_active?: number;
    moved_expired?: number;
    errors?: number;
    moved_active_users?: { email: string; name?: string }[];
    moved_expired_users?: { email: string; name?: string }[];
}

interface LogsTabProps {
    logs: SystemLog[];
    totalCount: number;
    onRefresh: () => void;
    onLoadMore: () => void;
    onSearch: (query: string) => void;
    searchQuery: string;
    title?: string;
    actions?: ReactNode;
    idNameLookup?: Record<string, string>;
    defaultStatusFilter?: 'ALL' | 'SUCCESS' | 'ERROR' | 'WARNING' | 'INFO';
}

export default function LogsTab({
    logs,
    totalCount,
    onRefresh,
    onLoadMore,
    onSearch,
    searchQuery,
    title = "Activiteitslogboek",
    actions,
    idNameLookup = {},
    defaultStatusFilter = 'ALL'
}: LogsTabProps) {
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'SUCCESS' | 'ERROR' | 'WARNING' | 'INFO'>(defaultStatusFilter);
    const [localQuery, setLocalQuery] = useState(searchQuery);
    const [acknowledging, setAcknowledging] = useState<string | null>(null);
    const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
    const { showToast } = useAdminToast();

    useEffect(() => {
        setLocalQuery(searchQuery);
    }, [searchQuery]);

    const lookupMap = useMemo(() => new Map(Object.entries(idNameLookup)), [idNameLookup]);

    const filteredLogs = logs.filter(log => {
        if (statusFilter === 'ALL') return true;
        if (statusFilter === 'ERROR') return log.status === 'ERROR' && !log.acknowledged_at;
        return (log.status as string) === statusFilter;
    });

    const toggleExpand = (id: string) => {
        setExpandedLogs(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const handleAcknowledge = async (id: string) => {
        setAcknowledging(id);
        try {
            const res = await acknowledgeSystemLogAction(id);
            if (res.success) {
                showToast('Markeren als gezien gelukt', 'success');
                onRefresh();
            } else {
                showToast(res.error || 'Mislukt', 'error');
            }
        } catch (error) {
            safeConsoleError('[LogsTab.tsx][LogsTab] ', error);
            showToast('Er is een fout opgetreden', 'error');
        } finally {
            setAcknowledging(null);
        }
    };

    const resolveIdToName = (key: string, val: unknown, context?: string, logType?: string) => {
        const valStr = String(val);
        if (!valStr || valStr === 'null' || valStr === 'undefined') return valStr;

        const prefix = getLookupPrefix(key, context, logType);
        const lookupKey = prefix ? `${prefix}${valStr}` : '';
        const mappedName = lookupMap.get(lookupKey);
        if (lookupKey && mappedName) {
            return `${mappedName} (ID: ${valStr})`;
        }
        return valStr;
    };

    const hasMore = logs.length < totalCount;

    return (
        <Paper withBorder radius="lg" style={{ overflow: 'hidden' }}>
            <Group justify="space-between" align="flex-end" p="lg" wrap="wrap" gap="md">
                <Stack gap="sm">
                    <Title order={4}>{title}</Title>
                    <Group gap="sm" wrap="wrap">
                        <Group gap={6} wrap="wrap">
                            {[
                                { id: 'ALL', label: 'Alles' },
                                { id: 'SUCCESS', label: 'Succes' },
                                { id: 'ERROR', label: 'Fouten' },
                                { id: 'WARNING', label: 'Waarschuwingen' },
                                { id: 'INFO', label: 'Info' }
                            ].map(f => (
                                <Button
                                    key={f.id}
                                    type="button"
                                    size="xs"
                                    variant={statusFilter === f.id ? 'light' : 'subtle'}
                                    color={statusFilter === f.id ? 'brand' : undefined}
                                    onClick={() => setStatusFilter(f.id as typeof statusFilter)}
                                >
                                    {f.label}
                                </Button>
                            ))}
                        </Group>
                        <TextInput
                            size="xs"
                            placeholder="Zoeken..."
                            value={localQuery}
                            onChange={(e) => setLocalQuery(e.currentTarget.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    onSearch(localQuery);
                                }
                            }}
                            leftSection={<Search size={14} />}
                            w={{ base: 192, md: 256 }}
                        />
                    </Group>
                </Stack>

                <Group gap="xs">
                    {actions}
                    <Text size="xs" fw={600} c="dimmed">
                        {logs.length} / {totalCount}
                    </Text>
                    <Tooltip label="Vernieuwen">
                        <ActionIcon
                            type="button"
                            variant="default"
                            size="lg"
                            onClick={onRefresh}
                            aria-label="Vernieuwen"
                        >
                            <RefreshCw size={18} />
                        </ActionIcon>
                    </Tooltip>
                </Group>
            </Group>

            <Divider />

            <Table.ScrollContainer minWidth={820}>
                <Table highlightOnHover verticalSpacing="md" horizontalSpacing="lg">
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Datum</Table.Th>
                            <Table.Th>Type</Table.Th>
                            <Table.Th>Context</Table.Th>
                            <Table.Th>Uitgevoerd door</Table.Th>
                            <Table.Th>Details</Table.Th>
                            <Table.Th ta="center">Status</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {filteredLogs.map((log) => {
                            const isAcknowledged = !!log.acknowledged_at;
                            return (
                                <Fragment key={log.id}>
                                    <Table.Tr
                                        onClick={() => toggleExpand(log.id)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <Table.Td>
                                            <Text size="xs" c="dimmed" fw={500} style={{ whiteSpace: 'nowrap' }}>
                                                {formatDate(log.created_at, 'dd-MM-yyyy HH:mm')}
                                            </Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Stack gap={4} align="flex-start">
                                                <Text size="xs" fw={600} tt="capitalize">
                                                    {log.type}
                                                </Text>
                                                {log.payload && typeof log.payload === 'object' && 'environment' in log.payload && (
                                                    <Badge
                                                        color={getEnvBadgeColor(String(log.payload.environment))}
                                                        variant="light"
                                                        size="xs"
                                                    >
                                                        {String(log.payload.environment)}
                                                    </Badge>
                                                )}
                                            </Stack>
                                        </Table.Td>
                                        <Table.Td>
                                            {(() => {
                                                let context = '';
                                                let contextName = '';

                                                if (log.payload && typeof log.payload === 'object') {
                                                    if ('context' in log.payload && log.payload.context) {
                                                        context = String(log.payload.context);
                                                    }
                                                    if ('context_name' in log.payload && log.payload.context_name) {
                                                        contextName = String(log.payload.context_name);
                                                    } else {
                                                        if (context === 'reis') {
                                                            if ('trip_id' in log.payload && log.payload.trip_id) {
                                                                const resolved = lookupMap.get(`trip_${String(log.payload.trip_id)}`);
                                                                if (resolved) contextName = resolved;
                                                            } else if ('signup_id' in log.payload && log.payload.signup_id) {
                                                                const resolved = lookupMap.get(`signup_${String(log.payload.signup_id)}`);
                                                                if (resolved) contextName = resolved;
                                                            }
                                                        } else if (context === 'activiteit') {
                                                            if ('event_id' in log.payload && log.payload.event_id) {
                                                                const resolved = lookupMap.get(`event_${String(log.payload.event_id)}`);
                                                                if (resolved) contextName = resolved;
                                                            } else if ('id' in log.payload && log.payload.id) {
                                                                const isSignupLog = ['admin_event_signup_checked_in', 'admin_event_signup_checked_out', 'admin_event_signup_deleted', 'admin_event_signup_manual_created', 'system_event_signup_checkin_rollback', 'system_event_signup_delete_failed'].includes(log.type);
                                                                const prefix = isSignupLog ? 'event_signup_' : 'event_';
                                                                const resolved = lookupMap.get(`${prefix}${String(log.payload.id)}`);
                                                                if (resolved) contextName = resolved;
                                                            }
                                                        } else if (context === 'sticker') {
                                                            if ('sticker_id' in log.payload && log.payload.sticker_id) {
                                                                const resolved = lookupMap.get(`sticker_${String(log.payload.sticker_id)}`);
                                                                if (resolved) contextName = resolved;
                                                            }
                                                        } else if (context === 'webshop') {
                                                            if ('product_id' in log.payload && log.payload.product_id) {
                                                                const resolved = lookupMap.get(`product_${String(log.payload.product_id)}`);
                                                                if (resolved) contextName = resolved;
                                                            } else if ('preorder_id' in log.payload && log.payload.preorder_id) {
                                                                const resolved = lookupMap.get(`preorder_${String(log.payload.preorder_id)}`);
                                                                if (resolved) contextName = resolved;
                                                            } else if ('drop_window_id' in log.payload && log.payload.drop_window_id) {
                                                                const resolved = lookupMap.get(`drop_window_${String(log.payload.drop_window_id)}`);
                                                                if (resolved) contextName = resolved;
                                                            }
                                                        } else if (context === 'lidmaatschap') {
                                                            if ('member_id' in log.payload && log.payload.member_id) {
                                                                const resolved = lookupMap.get(`user_${String(log.payload.member_id)}`);
                                                                if (resolved) contextName = resolved;
                                                            }
                                                        }
                                                    }
                                                }

                                                if (!context && (log.type === 'impersonation_active' || log.type === 'admin_impersonation_started' || log.type === 'admin_impersonation_ended')) {
                                                    context = 'impersonatie';
                                                    if (log.payload && typeof log.payload === 'object' && 'target_id' in log.payload) {
                                                        const resolved = lookupMap.get(`user_${String(log.payload.target_id)}`);
                                                        if (resolved) {
                                                            contextName = resolved;
                                                        }
                                                    }
                                                }

                                                if (context) {
                                                    return (
                                                        <Stack gap={0}>
                                                            <Text size="xs" fw={600} tt="capitalize">
                                                                {context}
                                                            </Text>
                                                            {contextName && (
                                                                <Text size="xs" c="dimmed" maw={140} truncate title={contextName}>
                                                                    {contextName}
                                                                </Text>
                                                            )}
                                                        </Stack>
                                                    );
                                                }

                                                return <Text size="xs" c="dimmed">-</Text>;
                                            })()}
                                        </Table.Td>
                                        <Table.Td>
                                            <Text size="xs" fw={600} c="dimmed">
                                                {(() => {
                                                    if (log.payload && typeof log.payload === 'object') {
                                                        if ('admin_id' in log.payload && log.payload.admin_id) {
                                                            const resolved = lookupMap.get(`user_${String(log.payload.admin_id)}`);
                                                            if (resolved) return resolved;
                                                        }
                                                        if ('admin_name' in log.payload && log.payload.admin_name) {
                                                            return String(log.payload.admin_name);
                                                        }
                                                    }
                                                    return 'Systeem';
                                                })()}
                                            </Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Box maw={320}>
                                                {log.payload && typeof log.payload === 'object' ? (
                                                    log.type === 'system_sync_summary' ? (
                                                        <Stack gap={4}>
                                                            {(() => {
                                                                const p = log.payload as unknown as SyncSummaryPayload;
                                                                return (
                                                                    <>
                                                                        <Text size="xs" fw={600}>
                                                                            Sync voltooid
                                                                        </Text>
                                                                        <Text size="xs" c="dimmed">
                                                                            {String(p.processed || 0)} leden verwerkt in {p.duration_ms ? formatDuration(Number(p.duration_ms)) : 'onbekende tijd'}.
                                                                        </Text>
                                                                        <Group gap={6} wrap="wrap">
                                                                            <Badge color="success" variant="light" size="xs">
                                                                                +{p.moved_active || 0} actief
                                                                            </Badge>
                                                                            <Badge color="accent" variant="light" size="xs">
                                                                                -{p.moved_expired || 0} verlopen
                                                                            </Badge>
                                                                            {Number(p.errors || 0) > 0 && (
                                                                                <Badge color="error" variant="light" size="xs">
                                                                                    {p.errors} fouten
                                                                                </Badge>
                                                                            )}
                                                                        </Group>
                                                                        {Array.isArray(p.moved_active_users) && p.moved_active_users.length > 0 && (
                                                                            <Stack gap={2} mt={4}>
                                                                                <Text size="xs" fw={700} c="success" tt="uppercase">
                                                                                    Actief geworden
                                                                                </Text>
                                                                                {p.moved_active_users.map((u, i) => (
                                                                                    <Text key={u.email || i} size="xs" truncate title={u.email}>
                                                                                        {u.name ? String(u.name) : u.email}
                                                                                    </Text>
                                                                                ))}
                                                                            </Stack>
                                                                        )}
                                                                        {Array.isArray(p.moved_expired_users) && p.moved_expired_users.length > 0 && (
                                                                            <Stack gap={2} mt={4}>
                                                                                <Text size="xs" fw={700} c="accent" tt="uppercase">
                                                                                    Verlopen geworden
                                                                                </Text>
                                                                                {p.moved_expired_users.map((u, i) => (
                                                                                    <Text key={u.email || i} size="xs" truncate title={u.email}>
                                                                                        {u.name ? String(u.name) : u.email}
                                                                                    </Text>
                                                                                ))}
                                                                            </Stack>
                                                                        )}
                                                                    </>
                                                                );
                                                            })()}
                                                        </Stack>
                                                    ) : (
                                                        <Stack gap={4}>
                                                            {Object.entries(log.payload)
                                                                .filter(([key]) => !['admin_id', 'admin_name', 'timestamp', 'context', 'context_name', 'impersonated_by_id', 'impersonated_by_name', 'impersonated_target_id', 'impersonated_target_name'].includes(key))
                                                                .map(([key, val]) => {
                                                                    const isArray = Array.isArray(val);
                                                                    const isComplex = typeof val === 'object' && val !== null && !isArray;
                                                                    const resolvedArray = isArray ? (val as unknown[]).map(item => {
                                                                        const itemStr = String(item);
                                                                        let lookupKey = '';
                                                                        if (key === 'activity_ids' || key === 'trip_activity_id') {
                                                                            lookupKey = `trip_activity_${itemStr}`;
                                                                        }
                                                                        const mappedName = lookupKey ? lookupMap.get(lookupKey) : null;
                                                                        return mappedName ? `${mappedName} (ID: ${itemStr})` : itemStr;
                                                                    }) : [];
                                                                    return (
                                                                        <Group key={key} gap={4} wrap="wrap">
                                                                            <Text span size="xs" fw={600} c="dimmed">
                                                                                {key}:
                                                                            </Text>
                                                                            {isComplex ? (
                                                                                <Button
                                                                                    type="button"
                                                                                    variant="light"
                                                                                    color="brand"
                                                                                    size="compact-xs"
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        toggleExpand(log.id);
                                                                                    }}
                                                                                >
                                                                                    {expandedLogs.has(log.id) ? 'Verberg details' : 'Toon details'}
                                                                                </Button>
                                                                            ) : isArray ? (
                                                                                <Text span size="xs" style={{ wordBreak: 'break-all' }}>
                                                                                    {resolvedArray.length > 0 ? resolvedArray.join(', ') : 'Geen'}
                                                                                </Text>
                                                                            ) : (
                                                                                <Text span size="xs" style={{ wordBreak: 'break-all' }}>
                                                                                    {resolveIdToName(
                                                                                        key,
                                                                                        val,
                                                                                        (log.payload && typeof log.payload === 'object' && 'context' in log.payload)
                                                                                            ? String(log.payload.context)
                                                                                            : undefined,
                                                                                        log.type
                                                                                    )}
                                                                                </Text>
                                                                            )}
                                                                        </Group>
                                                                    );
                                                                })}
                                                        </Stack>
                                                    )
                                                ) : (
                                                    <Text size="xs" c="dimmed">-</Text>
                                                )}
                                            </Box>
                                        </Table.Td>
                                        <Table.Td ta="center">
                                            <Stack
                                                gap={6}
                                                align="center"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <Badge
                                                    color={getStatusBadgeColor(String(log.status))}
                                                    variant="light"
                                                    size="sm"
                                                >
                                                    {log.status}
                                                </Badge>
                                                {log.status === 'ERROR' && !isAcknowledged && (
                                                    <Button
                                                        type="button"
                                                        variant="subtle"
                                                        color="brand"
                                                        size="compact-xs"
                                                        loading={acknowledging === log.id}
                                                        onClick={() => { void handleAcknowledge(log.id); }}
                                                    >
                                                        {acknowledging === log.id ? 'Bezig...' : 'Markeer als gezien'}
                                                    </Button>
                                                )}
                                                {log.status === 'ERROR' && isAcknowledged && (
                                                    <Text size="xs" c="dimmed">
                                                        Gezien
                                                    </Text>
                                                )}
                                            </Stack>
                                        </Table.Td>
                                    </Table.Tr>
                                    {expandedLogs.has(log.id) && (
                                        <Table.Tr>
                                            <Table.Td colSpan={6} p="md">
                                                <Paper
                                                    withBorder
                                                    p="md"
                                                    radius="md"
                                                    maw={900}
                                                    mx="auto"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <Stack gap="sm">
                                                        <Group justify="space-between" align="center">
                                                            <Text size="xs" fw={600} c="dimmed">
                                                                Volledige Payload Details
                                                            </Text>
                                                            <Button
                                                                type="button"
                                                                variant="default"
                                                                size="xs"
                                                                onClick={() => {
                                                                    void navigator.clipboard.writeText(JSON.stringify(log.payload, null, 2));
                                                                    showToast('Gekopieerd naar klembord', 'success');
                                                                }}
                                                            >
                                                                Kopieer JSON
                                                            </Button>
                                                        </Group>
                                                        <Code
                                                            block
                                                            style={{ maxHeight: 350, overflow: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                                                        >
                                                            {JSON.stringify(log.payload, null, 2)}
                                                        </Code>
                                                    </Stack>
                                                </Paper>
                                            </Table.Td>
                                        </Table.Tr>
                                    )}
                                </Fragment>
                            );
                        })}
                        {filteredLogs.length === 0 && (
                            <Table.Tr>
                                <Table.Td colSpan={6}>
                                    <Text py="xl" ta="center" size="sm" c="dimmed" fs="italic">
                                        Geen logboekvermeldingen gevonden.
                                    </Text>
                                </Table.Td>
                            </Table.Tr>
                        )}
                    </Table.Tbody>
                </Table>
            </Table.ScrollContainer>

            {hasMore && (
                <>
                    <Divider />
                    <Group justify="center" p="md">
                        <Button
                            type="button"
                            variant="light"
                            color="brand"
                            size="xs"
                            onClick={onLoadMore}
                        >
                            Meer laden
                        </Button>
                    </Group>
                </>
            )}
        </Paper>
    );
}
