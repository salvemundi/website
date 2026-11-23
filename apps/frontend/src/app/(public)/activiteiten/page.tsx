import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { Box, Center, Container, Stack, VisuallyHidden } from '@mantine/core';
import ActivitiesBannerIsland from '@/components/islands/activiteiten/ActivitiesBannerIsland';
import ActivitiesProviderIsland from '@/components/islands/activiteiten/ActivitiesProviderIsland';
import { getActivities } from '@/server/actions/events/activiteiten/activiteiten-public.actions';
import { getEnrichedSession } from '@/server/auth/auth-utils';
import { generateCalendarToken } from '@/server/auth/calendar-token';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
    title: 'Activiteiten | Salve Mundi',
    description: 'Bekijk alle aankomende en afgelopen activiteiten van studievereniging Salve Mundi.'
};

export default async function ActivitiesPage() {
    const session = await getEnrichedSession();
    const email = session?.user.email;
    const calendarToken = email ? generateCalendarToken(email) : null;
    const cookieStore = await cookies();
    const viewModeCookie = cookieStore.get('activities_view_mode')?.value;
    const initialViewMode = (viewModeCookie === 'list' || viewModeCookie === 'grid' || viewModeCookie === 'calendar')
        ? viewModeCookie
        : 'list';

    const showPastCookie = cookieStore.get('activities_show_past')?.value;
    const initialShowPast = showPastCookie === 'true';

    const events = await getActivities(email);
    const serverTime = new Date().toISOString();

    return (
        <Box mih="100vh">
            <VisuallyHidden component="h1">Activiteiten Salve Mundi</VisuallyHidden>

            <Container size="xl" py="xl">
                <Stack gap="xl">
                    <Center>
                        <ActivitiesBannerIsland events={events} serverTime={serverTime} />
                    </Center>

                    <Box>
                        <ActivitiesProviderIsland
                            events={events}
                            serverTime={serverTime}
                            initialViewMode={initialViewMode}
                            initialShowPast={initialShowPast}
                            isLoggedIn={!!session}
                            calendarToken={calendarToken}
                        />
                    </Box>
                </Stack>
            </Container>
        </Box>
    );
}
