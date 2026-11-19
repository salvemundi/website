'use client';

import { useState, useTransition, useEffect, useCallback } from 'react';
import {
    Plus,
    Settings,
    AlertCircle,
    RefreshCw,
    ChevronLeft,
} from 'lucide-react';
import {
    ActionIcon,
    Alert,
    Box,
    Button,
    Container,
    Group,
    Paper,
    Stack,
    Text,
    Title,
} from '@mantine/core';
import BeheerVisibilityToggle from '@/components/ui/beheer/BeheerVisibilityToggle';
import { useAdminToast } from '@/hooks/use-beheer-toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    deletePubCrawlSignup,
    toggleKroegentochtVisibility,
    getPubCrawlSignups,
    updatePubCrawlSignup
} from '@/server/actions/beheer/kroegentocht/beheer-kroegentocht-core.actions';
import KroegentochtEventDropdown from '@/components/islands/beheer/kroegentocht/KroegentochtEventDropdown';
import KroegentochtScannerSettings from '@/components/islands/beheer/kroegentocht/KroegentochtScannerSettings';
import SignupList from '@/components/islands/beheer/kroegentocht/SignupList';
import { type PubCrawlEvent, type PubCrawlSignup } from '@salvemundi/validations/schema/pub-crawl.zod';
import { safeConsoleError } from '@/server/utils/logger';
import { selectPubCrawlEvent } from '@/lib/utils/pub-crawl-event';

interface ExtendedSignup extends PubCrawlSignup {
    participants?: { name: string; initial: string }[];
    created_at: string;
}

interface KroegentochtManagementIslandProps {
    initialEvents?: PubCrawlEvent[];
    initialSettings?: { show: boolean };
    initialSignups?: ExtendedSignup[];
}

export default function KroegentochtManagementIsland({
    initialEvents = [],
    initialSettings = { show: false },
    initialSignups = []
}: KroegentochtManagementIslandProps) {
    const router = useRouter();
    const { showToast } = useAdminToast();
    const events = initialEvents;
    const [selectedEvent, setSelectedEvent] = useState<PubCrawlEvent | null>(
        selectPubCrawlEvent(initialEvents)
    );
    const [signups, setSignups] = useState<ExtendedSignup[]>(initialSignups);

    useEffect(() => {
        if (selectedEvent) {
            const updated = initialEvents.find(e => Number(e.id) === Number(selectedEvent.id));
            if (updated && updated !== selectedEvent) {
                setSelectedEvent(updated);
            }
        }
    }, [initialEvents, selectedEvent]);
    const [settings, setSettings] = useState(initialSettings);
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const loadSignups = useCallback((eventId: number | string) => {
        setError(null);
        startTransition(() => {
            void (async () => {
                try {
                    const data = await getPubCrawlSignups(Number(eventId));
                    setSignups(data);
                } catch (error) {
                    safeConsoleError('[KroegentochtManagementIsland.tsx][KroegentochtManagementIsland] ', error);
                    showToast('Fout bij het laden van aanmeldingen. Probeer het opnieuw.', 'error');
                    setError('Kon gegevens niet ophalen van de server.');
                }
            })();
        });
    }, [showToast]);

    const handleRefresh = () => {
        if (selectedEvent) {
            loadSignups(selectedEvent.id);
            showToast('Gegevens worden ververst...', 'success');
        }
    };

    useEffect(() => {
        if (selectedEvent && signups.length === 0 && initialSignups.length === 0) {
            loadSignups(selectedEvent.id);
        }
    }, [selectedEvent, signups.length, initialSignups.length, loadSignups]);

    useEffect(() => {
        setSignups(initialSignups);
    }, [initialSignups]);

    const handleEventSelect = (event: PubCrawlEvent) => {
        setSelectedEvent(event);
        loadSignups(event.id);
    };

    const handleToggleVisibility = () => {
        startTransition(() => {
            void (async () => {
                try {
                    const result = await toggleKroegentochtVisibility();
                    if (result.success) {
                        setSettings({ show: result.show ?? false });
                        showToast(`Kroegentocht is nu ${result.show ? 'zichtbaar' : 'verborgen'}`, 'success');
                        router.refresh();
                    }
                } catch (error) {
                    safeConsoleError('[KroegentochtManagementIsland.tsx][KroegentochtManagementIsland] ', error);
                    showToast('Fout bij bijwerken zichtbaarheid', 'error');
                }
            })();
        });
    };

    const handleDeleteSignup = async (id: number | string) => {
        if (!selectedEvent) return;
        if (!confirm('Weet je zeker dat je deze inschrijving wilt verwijderen?')) return;

        try {
            await deletePubCrawlSignup(Number(id), Number(selectedEvent.id));
            setSignups(prev => prev.filter(s => s.id !== id));
            showToast('Inschrijving succesvol verwijderd', 'success');
        } catch (error) {
            safeConsoleError('[KroegentochtManagementIsland.tsx][KroegentochtManagementIsland] ', error);
            showToast('Fout bij verwijderen: ' + String(error), 'error');
        }
    };

    const handleUpdateGroup = async (signupId: number, newGroupName: string | null) => {
        try {
            await updatePubCrawlSignup(signupId, Number(selectedEvent?.id), { group_name: newGroupName });
            setSignups(prev => prev.map(s => s.id === signupId ? { ...s, group_name: newGroupName } : s));
            showToast('Groep succesvol bijgewerkt', 'success');
        } catch (error) {
            showToast('Fout bij bijwerken groep: ' + String(error), 'error');
        }
    };

    return (
        <Container size="xl" py="xl">
            <Stack gap="xl">
                <Group justify="space-between" align="flex-start" wrap="wrap" gap="md">
                    <Group gap="md" align="center">
                        <ActionIcon
                            component={Link}
                            href="/beheer"
                            variant="default"
                            size="lg"
                            aria-label="Terug"
                        >
                            <ChevronLeft size={18} />
                        </ActionIcon>
                        <Stack gap={2}>
                            <Title order={1} size="h2" c="brand">
                                Kroegentocht
                            </Title>
                            <Text size="sm" c="dimmed">
                                {selectedEvent ? `Beheer: ${selectedEvent.name}` : 'Aanmeldingen, tickets & event instellingen'}
                            </Text>
                        </Stack>
                    </Group>

                    <Group gap="sm" wrap="wrap">
                        <KroegentochtEventDropdown
                            events={events}
                            selectedEventId={selectedEvent?.id || null}
                            onSelect={handleEventSelect}
                        />

                        {selectedEvent && (
                            <Button
                                component={Link}
                                href={`/beheer/kroegentocht/bewerk/${selectedEvent.id}`}
                                variant="default"
                                leftSection={<Settings size={16} />}
                                title="Event Details"
                            >
                                Details
                            </Button>
                        )}

                        <ActionIcon
                            type="button"
                            variant="default"
                            size="lg"
                            onClick={handleRefresh}
                            disabled={isPending}
                            aria-label="Vernieuwen"
                            title="Vernieuwen"
                        >
                            <RefreshCw size={16} className={isPending ? 'animate-spin' : undefined} />
                        </ActionIcon>

                        <BeheerVisibilityToggle
                            isVisible={settings.show}
                            onToggle={handleToggleVisibility}
                            isPending={isPending}
                        />

                        <Button
                            component={Link}
                            href="/beheer/kroegentocht/nieuw"
                            color="accent"
                            leftSection={<Plus size={16} />}
                        >
                            Nieuw Event
                        </Button>
                    </Group>
                </Group>

                {error && (
                    <Alert color="error" icon={<AlertCircle size={18} />}>
                        <Group justify="space-between" wrap="wrap" gap="sm">
                            <Text size="sm" fw={600}>{error}</Text>
                            <Button
                                type="button"
                                variant="subtle"
                                color="error"
                                size="xs"
                                onClick={handleRefresh}
                            >
                                Probeer opnieuw
                            </Button>
                        </Group>
                    </Alert>
                )}

                {selectedEvent ? (
                    <Stack gap="lg">
                        <KroegentochtScannerSettings key={String(selectedEvent.id)} eventId={Number(selectedEvent.id)} />
                        <Box
                            style={{
                                opacity: isPending ? 0.5 : 1,
                                pointerEvents: isPending ? 'none' : 'auto',
                                transition: 'opacity 300ms ease',
                            }}
                        >
                            <SignupList
                                signups={signups}
                                eventId={selectedEvent.id}
                                eventName={selectedEvent.name}
                                onDelete={(id) => {
                                    void handleDeleteSignup(id);
                                }}
                                onEdit={(id) => router.push(`/beheer/kroegentocht/deelnemer/${id}`)}
                                eventGroups={((selectedEvent.groups || []) as unknown[])}
                                onUpdateGroup={handleUpdateGroup}
                                onRefresh={handleRefresh}
                            />
                        </Box>
                    </Stack>
                ) : (
                    <Paper withBorder p="xl" ta="center" style={{ borderStyle: 'dashed' }}>
                        <Stack align="center" gap="xs" py="xl">
                            <AlertCircle size={48} opacity={0.25} />
                            <Title order={2} size="h3">Geen Event Geselecteerd</Title>
                            <Text size="sm" c="dimmed">Kies een event hierboven om de data te bekijken.</Text>
                        </Stack>
                    </Paper>
                )}
            </Stack>
        </Container>
    );
}
