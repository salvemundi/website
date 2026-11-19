'use client';

import { useState, useEffect } from 'react';
import {
    Calendar,
    Download,
    Check,
    Copy,
    Sparkles,
    ExternalLink,
    CalendarPlus
} from 'lucide-react';
import {
    Alert,
    Anchor,
    Button,
    Code,
    Divider,
    Group,
    Modal,
    Paper,
    SimpleGrid,
    Stack,
    Text,
    ThemeIcon,
    Title,
    UnstyledButton,
} from '@mantine/core';
import { safeConsoleError } from '@/server/utils/logger';

interface CalendarExportButtonProps {
    feedPath?: string;
    calendarName?: string;
    calendarToken?: string | null;
    isLoggedIn?: boolean;
    label?: string;
}

export default function CalendarExportButton({
    feedPath = '/api/activiteiten/ics',
    calendarName,
    calendarToken,
    isLoggedIn = false,
    label = 'Agenda koppelen',
}: CalendarExportButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const [googleCopied, setGoogleCopied] = useState(false);
    const [showGoogleInstructions, setShowGoogleInstructions] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    const resolvedCalendarName = calendarName || (isLoggedIn && calendarToken ? 'Salve Mundi Mijn Activiteiten' : 'Salve Mundi Activiteiten');

    useEffect(() => {
        setIsMobile(/Android|iPhone|iPad|iPod/i.test(navigator.userAgent));
    }, []);

    const getBaseFeedUrl = () => {
        if (typeof window === 'undefined') return '';
        const separator = feedPath.includes('?') ? '&' : '?';
        const path = calendarToken
            ? `${feedPath}${separator}token=${encodeURIComponent(calendarToken)}`
            : feedPath;
        return `${window.location.origin}${path}`;
    };

    const getWebcalUrl = () => {
        if (typeof window === 'undefined') return '';
        const separator = feedPath.includes('?') ? '&' : '?';
        const path = calendarToken
            ? `${feedPath}${separator}token=${encodeURIComponent(calendarToken)}`
            : feedPath;
        return `webcal://${window.location.host}${path}`;
    };

    const getDownloadUrl = () => {
        if (typeof window === 'undefined') return `${feedPath}?download=1`;
        const separator = feedPath.includes('?') ? '&' : '?';
        const tokenPart = calendarToken ? `token=${encodeURIComponent(calendarToken)}&` : '';
        return `${feedPath}${separator}${tokenPart}download=1`;
    };

    const handleAppleCalendar = async () => {
        const webcalUrl = getWebcalUrl();
        try {
            await navigator.clipboard.writeText(webcalUrl);
        } catch {
        }
        window.location.href = webcalUrl;
        setIsOpen(false);
    };

    const handleGoogleCalendar = async () => {
        const feedUrl = getBaseFeedUrl();
        try {
            await navigator.clipboard.writeText(feedUrl);
            setGoogleCopied(true);
        } catch {
            setGoogleCopied(false);
        }
        if (!isMobile) {
            window.open('https://calendar.google.com/calendar/r/settings/addbyurl', '_blank', 'noopener,noreferrer');
        }
        setShowGoogleInstructions(true);
    };

    const handleCopyGoogleUrl = async () => {
        const feedUrl = getBaseFeedUrl();
        try {
            await navigator.clipboard.writeText(feedUrl);
            setGoogleCopied(true);
            setTimeout(() => setGoogleCopied(false), 2500);
        } catch (error: unknown) {
            safeConsoleError('[CalendarExportButton.tsx] Kon link niet kopiëren', error);
        }
    };

    const handleOutlookCalendar = () => {
        const feedUrl = getBaseFeedUrl();
        const calName = resolvedCalendarName;
        const url = `https://outlook.live.com/calendar/0/addfromweb?url=${encodeURIComponent(feedUrl)}&name=${encodeURIComponent(calName)}`;
        window.open(url, '_blank', 'noopener,noreferrer');
        setIsOpen(false);
    };

    const handleCopyGeneralFeed = async () => {
        const feedUrl = getBaseFeedUrl();
        try {
            await navigator.clipboard.writeText(feedUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        } catch (error: unknown) {
            safeConsoleError('[CalendarExportButton.tsx] Kon link niet kopiëren', error);
        }
    };

    return (
        <>
            <Button
                type="button"
                variant="default"
                size="sm"
                onClick={() => setIsOpen(true)}
                leftSection={<Calendar size={16} />}
                aria-expanded={isOpen}
                aria-haspopup="dialog"
            >
                {label}
            </Button>

            <Modal
                opened={isOpen}
                onClose={() => setIsOpen(false)}
                centered
                radius="xl"
                size="lg"
                title={
                    <Group gap="xs">
                        <ThemeIcon size="md" radius="md" variant="light" color="brand">
                            <CalendarPlus size={16} />
                        </ThemeIcon>
                        <Title order={3} size="h4" c="brand">
                            Agenda Koppelen
                        </Title>
                    </Group>
                }
            >
                <Stack gap="md">
                    <Text size="xs" c="dimmed">
                        {isLoggedIn && calendarToken
                            ? 'met jouw inschrijfstatus (🟢 ingeschreven / 🔴 niet ingeschreven).'
                            : `Synchroniseer ${resolvedCalendarName.toLowerCase()} direct met jouw agenda.`}
                    </Text>

                    {showGoogleInstructions && (
                        <Alert
                            color="brand"
                            variant="light"
                            radius="lg"
                            withCloseButton
                            onClose={() => setShowGoogleInstructions(false)}
                            icon={<Sparkles size={16} />}
                            title={isMobile ? 'Google Agenda (via browser of PC)' : 'Google Agenda geopend'}
                        >
                            <Stack gap="xs">
                                <Text size="xs" c="dimmed">
                                    {isMobile ? (
                                        <>
                                            De Google Agenda mobiele app ondersteunt internetagenda&apos;s (URL) helaas niet rechtstreeks.
                                            Plak de link eenmalig op je computer in Google Agenda bij <strong>&quot;Andere agenda&apos;s &gt; Via URL&quot;</strong>.
                                            De agenda synchroniseert daarna vanzelf naar je telefoon!
                                        </>
                                    ) : (
                                        googleCopied
                                            ? 'De link is gekopieerd! Plak deze in Google Agenda in het veld "Van URL" en klik op Toevoegen.'
                                            : 'Kopieer de link hieronder en plak deze in het veld "Van URL".'
                                    )}
                                </Text>

                                <Group gap="xs" wrap="nowrap">
                                    <Code style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {getBaseFeedUrl()}
                                    </Code>
                                    <Button
                                        type="button"
                                        size="xs"
                                        onClick={() => { void handleCopyGoogleUrl(); }}
                                        leftSection={googleCopied ? <Check size={14} /> : <Copy size={14} />}
                                    >
                                        {googleCopied ? 'Gekopieerd' : 'Kopieer'}
                                    </Button>
                                </Group>

                                {isMobile && (
                                    <>
                                        <Divider />
                                        <Group justify="space-between" wrap="wrap" gap="xs">
                                            <Text size="xs" c="dimmed">
                                                Tip: Direct op je mobiel? Gebruik de Apple/Systeem knop hieronder.
                                            </Text>
                                            <Anchor
                                                href="https://calendar.google.com/calendar/r/settings/addbyurl"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                size="xs"
                                                fw={700}
                                                c="brand"
                                            >
                                                Toch openen in browser <ExternalLink size={12} style={{ display: 'inline' }} />
                                            </Anchor>
                                        </Group>
                                    </>
                                )}
                            </Stack>
                        </Alert>
                    )}

                    <Stack gap="xs">
                        <Text size="xs" fw={700} tt="uppercase" c="dimmed">
                            Kies jouw agenda
                        </Text>

                        <UnstyledButton type="button" onClick={() => { void handleGoogleCalendar(); }} w="100%">
                            <Paper p="sm" radius="lg" withBorder>
                                <Group justify="space-between" wrap="nowrap" gap="md">
                                    <Group gap="md" wrap="nowrap" style={{ minWidth: 0 }}>
                                        <ThemeIcon size={40} radius="md" variant="light" color="brand">
                                            <CalendarPlus size={20} />
                                        </ThemeIcon>
                                        <Stack gap={0} style={{ minWidth: 0 }}>
                                            <Text size="sm" fw={700}>Google Calendar</Text>
                                            <Text size="xs" c="dimmed" truncate>
                                                {isMobile ? 'Instellen via computer/browser' : 'Voor Google accounts'}
                                            </Text>
                                        </Stack>
                                    </Group>
                                    <Text span c="dimmed" lh={1}><ExternalLink size={16} /></Text>
                                </Group>
                            </Paper>
                        </UnstyledButton>

                        <UnstyledButton type="button" onClick={() => { void handleAppleCalendar(); }} w="100%">
                            <Paper p="sm" radius="lg" withBorder>
                                <Group justify="space-between" wrap="nowrap" gap="md">
                                    <Group gap="md" wrap="nowrap" style={{ minWidth: 0 }}>
                                        <ThemeIcon size={40} radius="md" variant="light" color="brand">
                                            <Calendar size={20} />
                                        </ThemeIcon>
                                        <Stack gap={0} style={{ minWidth: 0 }}>
                                            <Text size="sm" fw={700}>Apple &amp; Systeemagenda</Text>
                                            <Text size="xs" c="dimmed" truncate>
                                                Direct synchroniseren (iOS, macOS &amp; Android webcal)
                                            </Text>
                                        </Stack>
                                    </Group>
                                    <Text span c="dimmed" lh={1}><ExternalLink size={16} /></Text>
                                </Group>
                            </Paper>
                        </UnstyledButton>

                        <UnstyledButton type="button" onClick={handleOutlookCalendar} w="100%">
                            <Paper p="sm" radius="lg" withBorder>
                                <Group justify="space-between" wrap="nowrap" gap="md">
                                    <Group gap="md" wrap="nowrap" style={{ minWidth: 0 }}>
                                        <ThemeIcon size={40} radius="md" variant="light" color="brand">
                                            <Calendar size={20} />
                                        </ThemeIcon>
                                        <Stack gap={0} style={{ minWidth: 0 }}>
                                            <Text size="sm" fw={700}>Outlook / Office 365</Text>
                                            <Text size="xs" c="dimmed" truncate>
                                                Toevoegen aan je Microsoft school- of werkagenda
                                            </Text>
                                        </Stack>
                                    </Group>
                                    <Text span c="dimmed" lh={1}><ExternalLink size={16} /></Text>
                                </Group>
                            </Paper>
                        </UnstyledButton>
                    </Stack>

                    <Divider />

                    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs">
                        <Button
                            component="a"
                            href={getDownloadUrl()}
                            download={`${resolvedCalendarName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}.ics`}
                            onClick={() => setIsOpen(false)}
                            variant="default"
                            leftSection={<Download size={16} />}
                        >
                            Download .ics
                        </Button>

                        <Button
                            type="button"
                            variant="default"
                            onClick={() => { void handleCopyGeneralFeed(); }}
                            leftSection={copied ? <Check size={16} /> : <Copy size={16} />}
                        >
                            {copied ? 'Link gekopieerd!' : 'Kopieer URL'}
                        </Button>
                    </SimpleGrid>
                </Stack>
            </Modal>
        </>
    );
}
