'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, CheckCircle2, FlipHorizontal2, ScanLine, Square, TriangleAlert } from 'lucide-react';
import { ActionIcon, Box, Button, Center, Group, NativeSelect, Stack, Text, Title } from '@mantine/core';
import type { Html5Qrcode } from 'html5-qrcode';
import { scanPubCrawlTicket } from '@/server/actions/events/kroegentocht/kroegentocht-scanner.actions';

type Result = Awaited<ReturnType<typeof scanPubCrawlTicket>>;

function cameraError(error: unknown): string {
    const name = error instanceof Error ? error.name : String(error);
    if (/NotAllowed|Permission|permission/i.test(name)) return 'Geef je browser toegang tot de camera en probeer opnieuw.';
    if (/NotFound|DevicesNotFound/i.test(name)) return 'Geen camera gevonden. Probeer een ander apparaat.';
    if (/NotReadable|TrackStart/i.test(name)) return 'De camera is al in gebruik. Sluit andere camera-apps en probeer opnieuw.';
    return 'De camera kon niet starten. Controleer de cameratoestemming of probeer de andere camera.';
}

export default function KroegentochtScannerIsland({ eventId, eventName, groups }: { eventId: number; eventName: string; groups: string[] }) {
    const [group, setGroup] = useState('');
    const [running, setRunning] = useState(false);
    const [ready, setReady] = useState(false);
    const [facing, setFacing] = useState<'environment' | 'user'>('environment');
    const [result, setResult] = useState<Result | null>(null);
    const [error, setError] = useState('');
    const cameraQueue = useRef<Promise<void>>(Promise.resolve());

    useEffect(() => {
        const bodyStyle = document.body.style.cssText;
        const overflow = document.documentElement.style.overflow;
        const scrollY = window.scrollY;
        document.documentElement.style.overflow = 'hidden';
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollY}px`;
        document.body.style.width = '100%';
        const onVisibilityChange = () => {
            if (document.hidden) { setRunning(false); setReady(false); setResult(null); }
        };
        document.addEventListener('visibilitychange', onVisibilityChange);
        return () => {
            document.body.style.cssText = bodyStyle;
            document.documentElement.style.overflow = overflow;
            window.scrollTo(0, scrollY);
            document.removeEventListener('visibilitychange', onVisibilityChange);
        };
    }, []);

    useEffect(() => {
        if (!running) return;
        let disposed = false;
        const isDisposed = () => disposed;
        let scanner: Html5Qrcode | undefined;
        let busy = false;
        let lastToken = '';
        let lastSeen = 0;
        const boot = cameraQueue.current.then(async () => {
            if (isDisposed()) return;
            if (!window.isSecureContext || typeof navigator.mediaDevices === 'undefined' || typeof navigator.mediaDevices.getUserMedia !== 'function') {
                throw new Error('Gebruik een beveiligde HTTPS-verbinding om de camera te openen.');
            }
            const { Html5Qrcode: Scanner, Html5QrcodeSupportedFormats } = await import('html5-qrcode');
            if (isDisposed()) return;
            scanner = new Scanner('pub-crawl-reader', { formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE], verbose: false });
            await scanner.start({ facingMode: facing }, {
                fps: 10,
                aspectRatio: 1,
                qrbox: (width, height) => {
                    const size = Math.floor(Math.min(width, height) * 0.7);
                    return { width: size, height: size };
                }
            }, token => {
                const now = Date.now();
                if (isDisposed()) return;
                if (token === lastToken && now - lastSeen < 3000) { lastSeen = now; return; }
                if (busy) return;
                lastToken = token;
                lastSeen = now;
                busy = true;
                void scanPubCrawlTicket(eventId, group, token).then(response => {
                    if (isDisposed()) return;
                    setResult(response);
                    if (response.status === 'inactive') { setRunning(false); setReady(false); }
                }).catch(() => {
                    if (!isDisposed()) setResult({ status: 'error', message: 'Scannen mislukt. Controleer je verbinding en probeer de code opnieuw.' });
                }).finally(() => {
                    if (isDisposed()) return;
                    busy = false;
                });
            }, () => { });
            if (!isDisposed()) setReady(true);
        });
        const handledBoot = boot.catch((reason: unknown) => {
            if (isDisposed()) return;
            setError(!window.isSecureContext ? 'Open deze pagina via HTTPS om de camera te gebruiken.' : cameraError(reason));
            setRunning(false);
            setReady(false);
        });
        cameraQueue.current = handledBoot;
        return () => {
            disposed = true;
            cameraQueue.current = handledBoot.then(async () => {
                if (!scanner) return;
                if (scanner.isScanning) await scanner.stop();
                scanner.clear();
            }).catch(() => { });
        };
    }, [running, eventId, group, facing]);

    const stop = () => { setRunning(false); setReady(false); setResult(null); };
    const switchCamera = () => {
        setReady(false);
        setError('');
        setResult(null);
        setFacing(value => value === 'environment' ? 'user' : 'environment');
        setRunning(true);
    };
    const successful = result?.status === 'success';
    const warning = result?.status === 'duplicate' || result?.status === 'wrong-group';

    const statusStyle = result
        ? successful
            ? { borderColor: 'var(--mantine-color-success-filled)', backgroundColor: 'color-mix(in srgb, var(--mantine-color-success-filled) 25%, var(--mantine-color-darkBase-filled))' }
            : warning
                ? { borderColor: 'var(--mantine-color-accent-filled)', backgroundColor: 'color-mix(in srgb, var(--mantine-color-accent-filled) 20%, var(--mantine-color-darkBase-filled))' }
                : { borderColor: 'var(--mantine-color-error-filled)', backgroundColor: 'color-mix(in srgb, var(--mantine-color-error-filled) 25%, var(--mantine-color-darkBase-filled))' }
        : { borderColor: 'rgba(255, 255, 255, 0.15)', backgroundColor: 'rgba(255, 255, 255, 0.06)' };

    return (
        <Box component="section" mod={{ 'scanner-screen': true }} aria-label="Kroegentocht ticketscanner">
            <Box component="header" px="lg" pt="sm" pb="md" style={{ flexShrink: 0 }}>
                <Stack gap="sm">
                    <Group gap="sm" wrap="nowrap">
                        <Text span c="lightPurple" lh={1}>
                            <ScanLine size={28} aria-hidden="true" />
                        </Text>
                        <Box style={{ minWidth: 0 }}>
                            <Title order={1} size="h4" c="white">
                                Tickets scannen
                            </Title>
                            <Text size="sm" truncate style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                                {eventName}
                            </Text>
                        </Box>
                    </Group>

                    <NativeSelect
                        id="scanner-group"
                        label="Jouw groep"
                        value={group}
                        disabled={running}
                        onChange={event => setGroup(event.currentTarget.value)}
                        size="md"
                        data={[
                            { value: '', label: 'Kies je groep' },
                            ...groups.map(name => ({ value: name, label: name })),
                        ]}
                        styles={{
                            label: { color: 'var(--mantine-color-white)' },
                            input: {
                                backgroundColor: 'var(--mantine-color-darkBase-filled)',
                                color: 'var(--mantine-color-white)',
                                borderColor: 'rgba(255, 255, 255, 0.25)',
                            },
                        }}
                    />
                </Stack>
            </Box>

            <Center mod={{ 'scanner-camera': true }}>
                <Box
                    id="pub-crawl-reader"
                    mod={{ 'scanner-reader': true }}
                    style={{ visibility: ready ? 'visible' : 'hidden' }}
                />
                {!ready && (
                    <Stack
                        pos="absolute"
                        inset={0}
                        align="center"
                        justify="center"
                        gap="md"
                        px="lg"
                        ta="center"
                    >
                        <Text span c="lightPurple" lh={1}>
                            <Camera size={48} aria-hidden="true" />
                        </Text>
                        <Text size="md" maw={360} style={{ color: 'rgba(255, 255, 255, 0.85)' }}>
                            {error || (running ? 'Camera openen…' : !groups.length ? 'Er zijn nog geen groepen ingesteld. Vraag de organisatie om groepen toe te voegen.' : !group ? 'Kies hierboven je groep om te beginnen.' : 'Klaar om te scannen. De achtercamera opent automatisch.')}
                        </Text>
                        {error && (
                            <Button type="button" size="md" onClick={switchCamera}>
                                Andere camera proberen
                            </Button>
                        )}
                    </Stack>
                )}
            </Center>

            <Box component="footer" px="lg" py="md" style={{ flexShrink: 0 }}>
                <Stack gap="sm">
                    <Box
                        mod={{ 'scanner-status': true }}
                        style={statusStyle}
                        role="status"
                        aria-live="polite"
                        aria-atomic="true"
                    >
                        {result ? (
                            <>
                                {successful ? (
                                    <Text span c="success" lh={1} style={{ flexShrink: 0 }}>
                                        <CheckCircle2 size={28} aria-hidden="true" />
                                    </Text>
                                ) : (
                                    <Text span c={warning ? 'accent' : 'error'} lh={1} style={{ flexShrink: 0 }}>
                                        <TriangleAlert size={28} aria-hidden="true" />
                                    </Text>
                                )}
                                <Box style={{ minWidth: 0 }}>
                                    <Title order={2} size="h5" c="white">
                                        {successful ? 'Welkom!' : result.status === 'wrong-group' ? 'Andere groep' : result.status === 'duplicate' ? 'Al ingecheckt' : 'Niet toegelaten'}
                                    </Title>
                                    <Text size="sm" lineClamp={3} c="white" style={{ wordBreak: 'break-word' }}>
                                        {result.message}
                                    </Text>
                                </Box>
                            </>
                        ) : (
                            <Text size="sm" style={{ color: 'rgba(255, 255, 255, 0.75)' }}>
                                {ready ? 'Houd een QR-code in het kader. De uitslag verschijnt hier; je kunt direct verder scannen.' : running ? 'Geef toestemming om je camera te gebruiken.' : 'Alleen tickets van jouw groep worden ingecheckt.'}
                            </Text>
                        )}
                    </Box>

                    <Group gap="sm" wrap="nowrap">
                        <Button
                            type="button"
                            disabled={!group}
                            size="lg"
                            h={56}
                            style={{ flex: 1 }}
                            leftSection={running ? <Square size={20} aria-hidden="true" /> : <Camera size={20} aria-hidden="true" />}
                            onClick={() => {
                                if (running) { stop(); return; }
                                setError(''); setResult(null); setReady(false); setRunning(true);
                            }}
                        >
                            {running ? 'Stoppen / groep wijzigen' : error ? 'Opnieuw proberen' : 'Camera starten'}
                        </Button>

                        {running && (
                            <ActionIcon
                                type="button"
                                size={56}
                                disabled={!ready}
                                onClick={switchCamera}
                                aria-label="Wissel tussen voor- en achtercamera"
                                title="Camera wisselen"
                            >
                                <FlipHorizontal2 size={24} aria-hidden="true" />
                            </ActionIcon>
                        )}
                    </Group>
                </Stack>
            </Box>
        </Box>
    );
}
