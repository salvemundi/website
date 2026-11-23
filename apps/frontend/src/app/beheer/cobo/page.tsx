import type { Metadata } from 'next';
import Link from '@/components/ui/Link';
import { ChevronLeft } from 'lucide-react';
import { Button, Container, Group, Stack, Title } from '@mantine/core';
import { getCoboBeheerSettings } from '@/server/actions/beheer/cobo/beheer-cobo.actions';
import {
    getCoboEventsDb,
    getLatestActiveCoboDb,
    getActiveBoardMembersDb,
    getCoboGuestBoardsDb
} from '@/server/queries/cobo/beheer-cobo.queries';
import CoboManagementIsland from '@/components/islands/beheer/cobo/CoboManagementIsland';
import CoboEventSwitcher from '@/components/islands/beheer/cobo/CoboEventSwitcher';
import CoboVisibilityToggle from '@/components/islands/beheer/cobo/CoboVisibilityToggle';
import { connection } from 'next/server';
import { cookies } from 'next/headers';
import type { CoboEvent } from '@salvemundi/validations';

export async function generateMetadata(): Promise<Metadata> {
    const latestEvent = await getLatestActiveCoboDb();
    const title = latestEvent?.title ? `${latestEvent.title} - Beheer | Salve Mundi` : 'CoBo Beheer | Salve Mundi';
    return { title, description: 'Beheer de Constitutieborrel (CoBo) instellingen, voorkeuren en gasten.' };
}

export default async function AdminCoboPage() {
    await connection();

    const [events, settings, cookieStore] = await Promise.all([
        getCoboEventsDb(),
        getCoboBeheerSettings().catch(() => ({
            show: true,
            disabled_message: null,
            canToggleVisibility: true
        })),
        cookies()
    ]);

    const cookieSelectedId = cookieStore.get('cobo_admin_selected_id')?.value;
    const selectedId = cookieSelectedId ? Number(cookieSelectedId) : undefined;
    const activeEvent = (selectedId ? events.find(e => e.id === selectedId) : events[0]) as CoboEvent | undefined;

    const cookieTab = cookieStore.get('cobo_admin_tab')?.value;
    const initialTab = cookieTab === 'preferences' ? 'preferences' : 'queue';

    const cookieQueueSubtab = cookieStore.get('cobo_admin_queue_subtab')?.value;
    const initialQueueSubtab = (cookieQueueSubtab === 'completed' || cookieQueueSubtab === 'late') ? cookieQueueSubtab : 'queue';

    const boardPreferences = activeEvent ? await getActiveBoardMembersDb(activeEvent.id) : [];
    const guestBoards = activeEvent ? await getCoboGuestBoardsDb(activeEvent.id) : [];
    const pageTitle = activeEvent?.title ? `CoBo Beheer: ${activeEvent.title}` : 'CoBo Beheer';

    return (
        <Container size="xl" py="lg">
            <Stack gap="lg">
                <Group justify="space-between" wrap="wrap" gap="md">
                    <Group gap="md" wrap="wrap">
                        <Button
                            component={Link}
                            href="/beheer"
                            size="sm"
                            leftSection={<ChevronLeft size={16} />}
                        >
                            Terug
                        </Button>
                        <Title order={1} size="h2" c="brand">
                            {pageTitle}
                        </Title>
                    </Group>

                    <Group gap="xs" wrap="wrap">
                        <CoboEventSwitcher
                            events={events}
                            activeEvent={activeEvent ?? null}
                        />
                        <CoboVisibilityToggle
                            initialVisible={settings.show}
                            canToggle={settings.canToggleVisibility}
                        />
                    </Group>
                </Group>

                <CoboManagementIsland
                    events={events}
                    activeEvent={activeEvent ?? null}
                    initialPreferences={boardPreferences}
                    initialGuestBoards={guestBoards}
                    initialTab={initialTab}
                    initialQueueSubtab={initialQueueSubtab}
                />
            </Stack>
        </Container>
    );
}
