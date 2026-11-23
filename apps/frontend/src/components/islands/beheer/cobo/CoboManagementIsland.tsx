'use client';

import React, { useState } from 'react';
import {
    type CoboEvent,
    type CoboBoardPreference,
    type CoboGuestBoard
} from '@salvemundi/validations';
import {
    Button,
    Card,
    Container,
    Group,
    Stack,
    Tabs,
    Text,
    Title,
} from '@mantine/core';
import CoboQueueManager from './CoboQueueManager';
import CoboBoardPreferencesManager from './CoboBoardPreferencesManager';
import CoboEventModal from './CoboEventModal';
import { useAdminToast } from '@/hooks/use-beheer-toast';
import { Users, Shield, Calendar, MapPin, Plus } from 'lucide-react';
import { formatDate } from '@/shared/lib/utils/date';

interface Props {
    events?: CoboEvent[];
    activeEvent: CoboEvent | null;
    initialPreferences: CoboBoardPreference[];
    initialGuestBoards: CoboGuestBoard[];
    initialTab?: 'queue' | 'preferences';
    initialQueueSubtab?: 'queue' | 'completed' | 'late';
}

export default function CoboManagementIsland({
    activeEvent,
    initialPreferences,
    initialGuestBoards,
    initialTab = 'queue',
    initialQueueSubtab = 'queue'
}: Props) {
    const { showToast } = useAdminToast();
    const [activeTab, setActiveTab] = useState<'queue' | 'preferences'>(initialTab);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [eventToEdit, setEventToEdit] = useState<CoboEvent | null>(null);

    const handleTabChange = (tab: 'queue' | 'preferences') => {
        setActiveTab(tab);
        try {
            document.cookie = `cobo_admin_tab=${tab}; path=/; max-age=31536000; SameSite=Lax`;
            localStorage.setItem('sm_admin_cobo_tab', tab);
        } catch {
            // Ignore storage errors
        }
    };

    if (!activeEvent) {
        return (
            <Container size="sm" py="xl">
                <Stack align="center" gap="lg" ta="center" py="xl">
                    <Stack gap="xs">
                        <Title order={2} size="h3">Nog geen CoBo evenement aangemaakt</Title>
                        <Text size="sm" c="dimmed">
                            Maak een CoBo evenement aan om te starten met bestuursvoorkeuren en de gasten-wachtlijst.
                        </Text>
                    </Stack>
                    <Button
                        type="button"
                        onClick={() => {
                            setEventToEdit(null);
                            setIsModalOpen(true);
                        }}
                        leftSection={<Plus size={16} />}
                    >
                        Eerste CoBo Aanmaken
                    </Button>

                    <CoboEventModal
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                        eventToEdit={eventToEdit}
                        showToast={showToast}
                    />
                </Stack>
            </Container>
        );
    }

    return (
        <Stack gap="lg">
            <Card withBorder padding="md">
                <Group justify="space-between" align="center" wrap="wrap" gap="md">
                    <Stack gap={4} style={{ minWidth: 0 }}>
                        <Title order={2} size="h4" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {activeEvent.title || 'CoBo'}
                        </Title>
                        <Group gap="md" wrap="wrap">
                            {activeEvent.date && (
                                <Group gap={6}>
                                    <Text span c="brand" lh={1}><Calendar size={14} /></Text>
                                    <Text size="xs" c="dimmed" fw={500}>
                                        {formatDate(activeEvent.date, 'd MMMM yyyy HH:mm')}
                                    </Text>
                                </Group>
                            )}
                            {activeEvent.location && (
                                <Group gap={6}>
                                    <Text span c="brand" lh={1}><MapPin size={14} /></Text>
                                    <Text size="xs" c="dimmed" fw={500}>
                                        {activeEvent.location}
                                    </Text>
                                </Group>
                            )}
                        </Group>
                    </Stack>

                    <Tabs
                        value={activeTab}
                        onChange={(val) => {
                            if (val === 'queue' || val === 'preferences') {
                                handleTabChange(val);
                            }
                        }}
                    >
                        <Tabs.List>
                            <Tabs.Tab value="queue" leftSection={<Users size={14} />}>
                                Gasten Wachtlijst
                            </Tabs.Tab>
                            <Tabs.Tab value="preferences" leftSection={<Shield size={14} />}>
                                Bestuursvoorkeuren &amp; Veto&apos;s
                            </Tabs.Tab>
                        </Tabs.List>
                    </Tabs>
                </Group>
            </Card>

            {activeTab === 'queue' ? (
                <CoboQueueManager
                    coboId={activeEvent.id}
                    initialBoards={initialGuestBoards}
                    initialTab={initialQueueSubtab}
                    showToast={showToast}
                />
            ) : (
                <CoboBoardPreferencesManager
                    coboId={activeEvent.id}
                    initialPreferences={initialPreferences}
                    showToast={showToast}
                />
            )}

            <CoboEventModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                eventToEdit={eventToEdit}
                showToast={showToast}
            />
        </Stack>
    );
}
