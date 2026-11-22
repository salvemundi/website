'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getActivitySignups } from '@/server/actions/beheer/activiteiten/beheer-activiteiten-core.actions';
import { toggleCheckInAction } from '@/server/actions/beheer/activiteiten/beheer-activiteiten-signups.actions';
import { Search, UserCheck, UserX, QrCode, RefreshCw } from 'lucide-react';
import {
    Alert,
    Badge,
    Box,
    Button,
    Card,
    Center,
    Loader,
    Modal,
    ScrollArea,
    SimpleGrid,
    Stack,
    Table,
    Text,
    TextInput,
} from '@mantine/core';
import { safeConsoleError } from '@/server/utils/logger';

interface AttendanceSignup {
    id: number;
    participant_name: string;
    participant_email: string;
    checked_in: boolean;
    qr_token?: string;
    checked_in_at?: string | null;
}

interface AttendanceIslandProps {
    eventId: string;
    eventName: string;
    initialSignups?: AttendanceSignup[];
}

export default function AttendanceIsland({ eventId, initialSignups = [] }: AttendanceIslandProps) {
    const [signups, setSignups] = useState<AttendanceSignup[]>(initialSignups);
    const [loading, setLoading] = useState(initialSignups.length === 0);
    const [search, setSearch] = useState('');
    const [scanning, setScanning] = useState(false);
    const [scanResult, setScanResult] = useState<{ success: boolean; message: string } | null>(null);
    const scannerRef = useRef<{ clear: () => Promise<void> } | null>(null);
    const scannerBootingRef = useRef(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getActivitySignups(eventId);
            const mapped = data.map(s => ({
                id: s.id || 0,
                participant_name: s.participant_name || 'Onbekend',
                participant_email: s.participant_email || 'Geen e-mail',
                checked_in: !!s.checked_in,
                qr_token: s.qr_token || undefined,
                checked_in_at: s.checked_in_at || null
            }));
            setSignups(mapped);
        } catch (error) {
            safeConsoleError('[AttendanceIsland.tsx][AttendanceIsland] ', error);
        } finally {
            setLoading(false);
        }
    }, [eventId]);

    useEffect(() => {
        if (initialSignups.length === 0) {
            void fetchData();
        }
    }, [fetchData, initialSignups.length]);

    const handleToggleCheckIn = useCallback(async (signupId: number, currentStatus: boolean) => {
        try {
            const result = await toggleCheckInAction(signupId, Number(eventId), !currentStatus);
            if (result.success) {
                setSignups(prev => prev.map(s =>
                    s.id === signupId ? { ...s, checked_in: !currentStatus, checked_in_at: !currentStatus ? new Date().toISOString() : null } : s
                ));
            }
        } catch (error) {
            safeConsoleError('[AttendanceIsland.tsx][AttendanceIsland] ', error);
        }
    }, [eventId]);

    const handleScan = useCallback(async (qrToken: string) => {
        const signup = signups.find(s => s.qr_token === qrToken);
        if (signup) {
            if (signup.checked_in) {
                setScanResult({ success: false, message: `${signup.participant_name} is al ingecheckt!` });
            } else {
                await handleToggleCheckIn(signup.id, false);
                setScanResult({ success: true, message: `${signup.participant_name} succesvol ingecheckt!` });
            }
        } else {
            setScanResult({ success: false, message: 'Ongeldige QR code / Deelnemer niet gevonden' });
        }
    }, [signups, handleToggleCheckIn]);

    const cleanupScanner = useCallback(async () => {
        scannerBootingRef.current = false;

        const scanner = scannerRef.current;
        scannerRef.current = null;

        if (!scanner) return;

        try {
            await scanner.clear();
        } catch (error) {
            safeConsoleError('[AttendanceIsland.tsx][AttendanceIsland] cleanupScanner', error);
        }
    }, []);

    useEffect(() => { return () => void cleanupScanner(); }, [cleanupScanner]);

    const handleCancelScanner = useCallback(() => {
        setScanning(false);
        void cleanupScanner();
    }, [cleanupScanner]);

    const startScanner = () => {
        if (scannerRef.current || scannerBootingRef.current) return;

        scannerBootingRef.current = true;
        setScanning(true);
        setScanResult(null);

        void (async () => {
            try {
                const { Html5QrcodeScanner } = await import('html5-qrcode');

                setTimeout(() => {
                    const scanner = new Html5QrcodeScanner('reader', { fps: 10, qrbox: { width: 250, height: 250 } }, false);
                    scannerRef.current = scanner;
                    scannerBootingRef.current = false;

                    scanner.render((decodedText) => {
                        void (async () => {
                            try {
                                await cleanupScanner();
                                setScanning(false);
                                await handleScan(decodedText);
                            } catch (error) {
                                safeConsoleError('[AttendanceIsland.tsx][AttendanceIsland] 1', error);
                            }
                        })();
                    }, (errorMessage) => {
                        if (!errorMessage.includes('NotFoundException')) {
                            safeConsoleError('[AttendanceIsland.tsx][AttendanceIsland] 2', errorMessage);
                        }
                    });
                }, 200);
            } catch (error) {
                scannerBootingRef.current = false;
                setScanning(false);
                safeConsoleError('[AttendanceIsland.tsx][AttendanceIsland] 3', error);
            }
        })();
    };

    const filteredSignups = signups.filter(s =>
        s.participant_name.toLowerCase().includes(search.toLowerCase()) ||
        s.participant_email.toLowerCase().includes(search.toLowerCase())
    );

    const stats = {
        total: signups.length,
        checkedIn: signups.filter(s => s.checked_in).length
    };

    return (
        <Stack gap="lg">
            <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
                <Card padding="lg" withBorder shadow="xs">
                    <Text size="sm" fw={700} c="dimmed">Totaal inschrijvingen</Text>
                    <Text size="2rem" fw={900} c="brand">{stats.total}</Text>
                </Card>
                <Card padding="lg" withBorder shadow="xs">
                    <Text size="sm" fw={700} c="dimmed">Aanwezig</Text>
                    <Text size="2rem" fw={900} c="success">{stats.checkedIn}</Text>
                </Card>
                <Card padding="lg" withBorder shadow="xs">
                    <Text size="sm" fw={700} c="dimmed">Nog verwacht</Text>
                    <Text size="2rem" fw={900} c="lightPurple">{stats.total - stats.checkedIn}</Text>
                </Card>
            </SimpleGrid>

            <Stack gap="sm">
                <TextInput
                    placeholder="Zoek deelnemers..."
                    leftSection={<Search size={18} />}
                    size="md"
                    value={search}
                    onChange={(e) => setSearch(e.currentTarget.value)}
                />
                <Box>
                    <Button
                        type="button"
                        onClick={startScanner}
                        size="md"
                        w={{ base: '100%', sm: 'auto' }}
                        leftSection={<QrCode size={18} />}
                    >
                        Scan QR
                    </Button>
                </Box>
            </Stack>

            <Modal
                opened={scanning}
                onClose={handleCancelScanner}
                title="QR-code scannen"
                centered
                size="md"
            >
                <Stack gap="md" align="center">
                    <Box id="reader" w="100%" style={{ overflow: 'hidden', borderRadius: 'var(--mantine-radius-md)' }} />
                    <Button type="button" fullWidth onClick={handleCancelScanner}>
                        Annuleren
                    </Button>
                    <style jsx global>{`
                        #reader { color: var(--mantine-color-text); }
                        #reader :is(p, span, label, small, h1, h2, h3, h4, h5, h6) { color: var(--mantine-color-text) !important; }
                        #reader :is(button, select, input) { color: var(--mantine-color-text) !important; background: var(--mantine-color-default) !important; border-color: var(--mantine-color-default-border) !important; }
                        #reader button:hover, #reader button:focus-visible { background: var(--mantine-color-default-hover) !important; }
                        #reader #reader__dashboard, #reader #reader__dashboard_section { color: var(--mantine-color-text) !important; }
                        #reader #reader__dashboard_section_csr, #reader #reader__dashboard_section_swaplink, #reader #reader__status_span { color: var(--mantine-color-text) !important; }
                        #reader #reader__dashboard_section_csr select, #reader #reader__dashboard_section_csr button, #reader #reader__dashboard_section_swaplink { background: var(--mantine-color-default) !important; color: var(--mantine-color-text) !important; border: 1px solid var(--mantine-color-default-border) !important; }
                        #reader #reader__scan_region { border-color: var(--mantine-color-default-border) !important; }
                    `}</style>
                </Stack>
            </Modal>

            {scanResult && (
                <Alert
                    color={scanResult.success ? 'success' : 'error'}
                    icon={scanResult.success ? <UserCheck size={20} /> : <UserX size={20} />}
                    withCloseButton
                    onClose={() => setScanResult(null)}
                >
                    <Text fw={700}>{scanResult.message}</Text>
                </Alert>
            )}

            <Card padding={0} withBorder shadow="lg" style={{ overflow: 'hidden' }}>
                <ScrollArea>
                    <Table verticalSpacing="md" horizontalSpacing="lg" highlightOnHover>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>
                                    <Text size="sm" fw={900} c="dimmed">Deelnemer</Text>
                                </Table.Th>
                                <Table.Th visibleFrom="md">
                                    <Text size="sm" fw={900} c="dimmed">E-mail</Text>
                                </Table.Th>
                                <Table.Th>
                                    <Text size="sm" fw={900} c="dimmed">Status</Text>
                                </Table.Th>
                                <Table.Th ta="right">
                                    <Text size="sm" fw={900} c="dimmed">Actie</Text>
                                </Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {loading ? (
                                <Table.Tr>
                                    <Table.Td colSpan={4}>
                                        <Center py="xl">
                                            <Stack align="center" gap="xs">
                                                <Loader size="md" />
                                                <Text size="sm" c="dimmed">Laden...</Text>
                                            </Stack>
                                        </Center>
                                    </Table.Td>
                                </Table.Tr>
                            ) : filteredSignups.length === 0 ? (
                                <Table.Tr>
                                    <Table.Td colSpan={4}>
                                        <Center py="xl">
                                            <Text size="sm" c="dimmed" fs="italic">
                                                Geen deelnemers gevonden
                                            </Text>
                                        </Center>
                                    </Table.Td>
                                </Table.Tr>
                            ) : filteredSignups.map((s) => (
                                <Table.Tr key={s.id}>
                                    <Table.Td>
                                        <Text size="sm" fw={700} c="brand">{s.participant_name}</Text>
                                        <Text size="xs" c="dimmed" hiddenFrom="md">{s.participant_email}</Text>
                                    </Table.Td>
                                    <Table.Td visibleFrom="md">
                                        <Text size="sm" fw={500} c="dimmed">{s.participant_email}</Text>
                                    </Table.Td>
                                    <Table.Td>
                                        {s.checked_in ? (
                                            <Badge color="success" leftSection={<UserCheck size={12} />}>
                                                Aanwezig
                                            </Badge>
                                        ) : (
                                            <Badge>
                                                Niet ingecheckt
                                            </Badge>
                                        )}
                                    </Table.Td>
                                    <Table.Td ta="right">
                                        <Button
                                            type="button"
                                            size="xs"
                                            color={s.checked_in ? 'error' : 'success'}
                                            onClick={() => void handleToggleCheckIn(s.id, s.checked_in)}
                                        >
                                            {s.checked_in ? 'Afmelden' : 'Inchecken'}
                                        </Button>
                                    </Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                </ScrollArea>
            </Card>

            <Center>
                <Button
                    type="button"
                    onClick={() => void fetchData()}
                    loading={loading}
                    leftSection={<RefreshCw size={16} />}
                >
                    Lijst vernieuwen
                </Button>
            </Center>
        </Stack>
    );
}
