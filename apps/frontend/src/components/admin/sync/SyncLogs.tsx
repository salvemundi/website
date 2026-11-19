'use client';

import React, { useState } from 'react';
import { CheckCircle, AlertTriangle, X, Info, Users, ChevronDown, ChevronRight } from 'lucide-react';
import {
    Badge,
    Box,
    Button,
    Center,
    Code,
    Collapse,
    Divider,
    Group,
    Paper,
    ScrollArea,
    Stack,
    Text,
    ThemeIcon,
    UnstyledButton,
} from '@mantine/core';
import { SyncStatus } from '@/components/islands/beheer/sync/SyncContext';

interface LogItem {
    email: string;
    message?: string;
    timestamp?: string;
    stack?: string;
    changes?: { field: string; old: unknown; new: unknown }[];
    reason?: string;
}

interface ResultRowProps {
    email: string;
    message?: string;
    type: 'success' | 'warning' | 'error' | 'info' | 'excluded';
    timestamp?: string;
    stack?: string;
    changes?: { field: string; old: unknown; new: unknown }[];
}

function getTypeIcon(type: ResultRowProps['type']): React.ReactNode {
    switch (type) {
        case 'success':
            return <ThemeIcon variant="light" color="success" radius="xl" size="md"><CheckCircle size={16} /></ThemeIcon>;
        case 'warning':
            return <ThemeIcon variant="light" color="accent" radius="xl" size="md"><AlertTriangle size={16} /></ThemeIcon>;
        case 'error':
            return <ThemeIcon variant="light" color="error" radius="xl" size="md"><X size={16} /></ThemeIcon>;
        case 'info':
            return <ThemeIcon variant="light" color="brand" radius="xl" size="md"><Info size={16} /></ThemeIcon>;
        case 'excluded':
            return <ThemeIcon variant="default" radius="xl" size="md"><Users size={16} /></ThemeIcon>;
    }
}

function getBadgeColor(type: ResultRowProps['type']): string | undefined {
    switch (type) {
        case 'success':
            return 'success';
        case 'warning':
            return 'accent';
        case 'error':
            return 'error';
        case 'info':
            return 'brand';
        default:
            return undefined;
    }
}

function ResultRow({ email, message, type, timestamp, stack, changes }: ResultRowProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const hasDetails = Boolean(timestamp || stack || (changes && changes.length > 0));
    const badgeColor = getBadgeColor(type);

    const rowHeader = (
        <Group align="flex-start" justify="space-between" wrap="nowrap" gap="md" p="md" w="100%">
            <Group align="flex-start" gap="md" wrap="nowrap" style={{ minWidth: 0, flex: 1 }}>
                {getTypeIcon(type)}
                <Stack gap={2} style={{ minWidth: 0, flex: 1 }}>
                    <Text size="sm" fw={600} style={{ wordBreak: 'break-all' }}>
                        {email}
                    </Text>
                    {message && (
                        <Text size="xs" c="dimmed">
                            {message}
                        </Text>
                    )}
                </Stack>
            </Group>
            <Group gap="xs" wrap="nowrap">
                <Badge
                    variant={badgeColor ? 'light' : 'default'}
                    color={badgeColor}
                    size="sm"
                    tt="capitalize"
                >
                    {type}
                </Badge>
                {hasDetails && (
                    <ChevronDown
                        size={16}
                        style={{
                            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 200ms ease',
                        }}
                    />
                )}
            </Group>
        </Group>
    );

    return (
        <Box>
            {hasDetails ? (
                <UnstyledButton type="button" w="100%" onClick={() => setIsExpanded(!isExpanded)}>
                    {rowHeader}
                </UnstyledButton>
            ) : (
                rowHeader
            )}

            {hasDetails && (
                <Collapse expanded={isExpanded}>
                    <Box px="lg" pb="md">
                        <Paper withBorder radius="md" p="md">
                            <Stack gap="sm">
                                {timestamp && (
                                    <Group gap="xs">
                                        <Text size="xs" fw={600} c="dimmed">Tijdstip:</Text>
                                        <Text size="sm" fw={600}>{new Date(timestamp).toLocaleString()}</Text>
                                    </Group>
                                )}
                                {stack && (
                                    <Stack gap={4}>
                                        <Text size="xs" fw={600} c="dimmed">Stack trace:</Text>
                                        <Code block c="error">
                                            {stack}
                                        </Code>
                                    </Stack>
                                )}
                                {changes && changes.length > 0 && (
                                    <Stack gap="xs">
                                        <Text size="xs" fw={600} c="dimmed">Wijzigingen:</Text>
                                        <Stack gap="xs">
                                            {changes.map((change, idx) => (
                                                <Paper key={idx} withBorder radius="sm" p="xs">
                                                    <Text size="xs" fw={700}>{change.field}</Text>
                                                    <Group gap="xs" wrap="wrap">
                                                        <Text size="xs" c="dimmed" style={{ wordBreak: 'break-all' }}>
                                                            {String(change.old ?? 'leeg')}
                                                        </Text>
                                                        <ChevronRight size={12} opacity={0.5} />
                                                        <Text size="xs" fw={600} c="success" style={{ wordBreak: 'break-all' }}>
                                                            {String(change.new ?? 'leeg')}
                                                        </Text>
                                                    </Group>
                                                </Paper>
                                            ))}
                                        </Stack>
                                    </Stack>
                                )}
                            </Stack>
                        </Paper>
                    </Box>
                </Collapse>
            )}
            <Divider />
        </Box>
    );
}

interface SyncLogsProps {
    resultFilter: string;
    setResultFilter: (value: string) => void;
    status: SyncStatus & {
        errors?: LogItem[];
        createdUsers?: LogItem[];
        successfulUsers?: LogItem[];
        warnings?: LogItem[];
        missingData?: LogItem[];
        excludedUsers?: LogItem[];
    };
}

export default function SyncLogs({ resultFilter, status }: SyncLogsProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 50;

    React.useEffect(() => {
        setCurrentPage(1);
    }, [resultFilter]);

    const itemMap = new Map<string, React.ReactNode>();

    const addItem = (email: string, node: React.ReactNode, type: string) => {
        const key = `${email}-${type}`;
        if (resultFilter !== 'all') {
            itemMap.set(key, node);
        } else {
            itemMap.set(email, node);
        }
    };

    if (resultFilter === 'all' || resultFilter === 'errors') {
        (status.errors || []).forEach((e, i) => {
            addItem(e.email, (
                <ResultRow
                    key={`e-${i}`}
                    email={e.email}
                    message={e.message}
                    type="error"
                    timestamp={e.timestamp}
                    stack={e.stack}
                />
            ), 'errors');
        });
    }

    if (resultFilter === 'all' || resultFilter === 'created') {
        (status.createdUsers || []).forEach((u, i) => {
            addItem(u.email, (
                <ResultRow
                    key={`c-${i}`}
                    email={u.email}
                    type="success"
                    message="Nieuw lid aangemaakt"
                    changes={u.changes}
                />
            ), 'created');
        });
    }

    if (resultFilter === 'all' || resultFilter === 'success') {
        (status.successfulUsers || []).forEach((u, i) => {
            if (resultFilter === 'all' && itemMap.has(u.email)) return;

            addItem(u.email, (
                <ResultRow
                    key={`s-${i}`}
                    email={u.email}
                    type="success"
                    changes={u.changes}
                />
            ), 'success');
        });
    }

    if (resultFilter === 'all' || resultFilter === 'warnings') {
        (status.warnings || []).forEach((w, i) => {
            if (resultFilter === 'all' && itemMap.has(w.email)) return;
            addItem(w.email, <ResultRow key={`w-${i}`} email={w.email} message={w.message} type="warning" />, 'warnings');
        });
    }

    if (resultFilter === 'all' || resultFilter === 'missing') {
        (status.missingData || []).forEach((m, i) => {
            if (resultFilter === 'all' && itemMap.has(m.email)) return;
            addItem(m.email, <ResultRow key={`m-${i}`} email={m.email} message={m.reason} type="info" />, 'missing');
        });
    }

    if (resultFilter === 'all' || resultFilter === 'excluded') {
        (status.excludedUsers || []).forEach((u, i) => {
            if (resultFilter === 'all' && itemMap.has(u.email)) return;
            addItem(u.email, <ResultRow key={`ex-${i}`} email={u.email} type="excluded" />, 'excluded');
        });
    }

    const items = Array.from(itemMap.values());
    const totalItems = items.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedItems = items.slice(startIndex, startIndex + itemsPerPage);

    return (
        <Paper withBorder radius="lg" style={{ overflow: 'hidden' }}>
            <ScrollArea.Autosize mah={480}>
                {paginatedItems.length === 0 ? (
                    <Center py={64}>
                        <Stack align="center" gap="sm">
                            <Users size={48} opacity={0.25} />
                            <Text size="sm" fw={600} c="dimmed" ta="center">
                                Geen resultaten gevonden voor dit filter.
                            </Text>
                        </Stack>
                    </Center>
                ) : (
                    <Stack gap={0}>{paginatedItems}</Stack>
                )}
            </ScrollArea.Autosize>

            {totalPages > 1 && (
                <>
                    <Divider />
                    <Group justify="space-between" px="lg" py="md">
                        <Text size="xs" fw={600} c="dimmed">
                            Rij {startIndex + 1} t/m {Math.min(startIndex + itemsPerPage, totalItems)} van {totalItems}
                        </Text>
                        <Group gap="xs">
                            <Button
                                type="button"
                                variant="default"
                                size="xs"
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            >
                                Vorige
                            </Button>
                            <Text size="xs" fw={700} px="xs">
                                {currentPage} / {totalPages}
                            </Text>
                            <Button
                                type="button"
                                variant="default"
                                size="xs"
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            >
                                Volgende
                            </Button>
                        </Group>
                    </Group>
                </>
            )}
        </Paper>
    );
}
