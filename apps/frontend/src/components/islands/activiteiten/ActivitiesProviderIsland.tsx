'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, LayoutGrid, List, Calendar as CalendarIcon } from 'lucide-react';
import { Box, Button, Group, Paper, Stack } from '@mantine/core';
import CalendarView from './CalendarView';
import DayDetails from './DayDetails';
import ActiviteitList from './ActiviteitList';
import CalendarExportButton from './CalendarExportButton';
import type { Activiteit } from '@salvemundi/validations/schema/activity.zod';
import { slugify } from '@/shared/lib/utils/slug';
import { getActivityUrl } from '@/shared/lib/utils/activity';
import { isEventPast } from '@/shared/lib/utils/date';

interface ActivitiesProviderIslandProps {
    events?: (Activiteit & { is_signed_up?: boolean })[];
    serverTime?: string;
    initialViewMode?: 'list' | 'grid' | 'calendar';
    initialShowPast?: boolean;
    isLoggedIn?: boolean;
    calendarToken?: string | null;
}

export default function ActivitiesProviderIsland({
    events = [],
    serverTime,
    initialViewMode = 'list',
    initialShowPast = false,
    isLoggedIn = false,
    calendarToken = null
}: ActivitiesProviderIslandProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [viewMode, setViewModeState] = useState<'list' | 'grid' | 'calendar'>(initialViewMode);

    const setViewMode = useCallback((mode: 'list' | 'grid' | 'calendar') => {
        setViewModeState(mode);
        document.cookie = `activities_view_mode=${mode}; path=/; max-age=31536000; SameSite=Lax`;
    }, []);

    const [showPastActivities, setShowPastActivitiesState] = useState<boolean>(initialShowPast);

    const toggleShowPastActivities = useCallback(() => {
        setShowPastActivitiesState(prev => {
            const next = !prev;
            document.cookie = `activities_show_past=${next}; path=/; max-age=31536000; SameSite=Lax`;
            return next;
        });
    }, []);

    const [selectedDay, setSelectedDay] = useState<Date | null>(null);
    const [currentDate, setCurrentDate] = useState(serverTime ? new Date(serverTime) : new Date());

    const filteredEvents = useMemo(() => {
        const now = serverTime ? new Date(serverTime) : new Date();
        let filtered = events;

        if (!showPastActivities) {
            filtered = filtered.filter(event => {
                return !isEventPast(
                    event.event_date_end || event.event_date,
                    event.event_time_end || event.event_time,
                    !!event.event_time_end,
                    now
                );
            });
        }

        return [...filtered].sort((a, b) => {
            const isAPast = isEventPast(
                a.event_date_end || a.event_date,
                a.event_time_end || a.event_time,
                !!a.event_time_end,
                now
            );
            const isBPast = isEventPast(
                b.event_date_end || b.event_date,
                b.event_time_end || b.event_time,
                !!b.event_time_end,
                now
            );

            if (isAPast !== isBPast) return isAPast ? 1 : -1;

            const getEventTime = (event: Activiteit) => {
                const date = event.event_date;
                return (event.event_time && date.length <= 10)
                    ? new Date(`${date}T${event.event_time}`).getTime()
                    : new Date(date).getTime();
            };

            const aTime = getEventTime(a);
            const bTime = getEventTime(b);

            if (!isAPast) {
                return aTime - bTime;
            } else {
                return bTime - aTime;
            }
        });
    }, [events, showPastActivities, serverTime]);

    const handleShowDetails = useCallback((activity: Activiteit) => {
        router.push(getActivityUrl({ name: activity.name || '', custom_url: activity.custom_url }));
    }, [router]);

    useEffect(() => {
        const status = searchParams.get('payment_status');
        const eventId = searchParams.get('event_id');

        if (status === 'success' && eventId) {
            const event = events.find(e => e.id.toString() === eventId.toString());
            const slug = event ? slugify(event.name || '') : eventId;
            router.replace(`/activiteiten/${slug}`);
        }
    }, [searchParams, router, events]);

    return (
        <Stack gap="lg" w="100%">
            <Group justify="space-between" align="center" wrap="wrap" gap="md">
                <Paper p={4} withBorder w={{ base: '100%', sm: 'auto' }}>
                    <Group gap={4} role="tablist" aria-label="Weergavemodus" grow>
                        <Button
                            type="button"
                            role="tab"
                            aria-selected={viewMode === 'list'}
                            size="xs"
                            variant={viewMode === 'list' ? 'filled' : 'subtle'}
                            onClick={() => setViewMode('list')}
                            leftSection={<List size={16} />}
                        >
                            Lijst
                        </Button>
                        <Button
                            type="button"
                            role="tab"
                            aria-selected={viewMode === 'grid'}
                            size="xs"
                            variant={viewMode === 'grid' ? 'filled' : 'subtle'}
                            onClick={() => setViewMode('grid')}
                            leftSection={<LayoutGrid size={16} />}
                        >
                            Kaarten
                        </Button>
                        <Button
                            type="button"
                            role="tab"
                            aria-selected={viewMode === 'calendar'}
                            size="xs"
                            visibleFrom="lg"
                            variant={viewMode === 'calendar' ? 'filled' : 'subtle'}
                            onClick={() => setViewMode('calendar')}
                            leftSection={<CalendarIcon size={16} />}
                        >
                            Kalender
                        </Button>
                    </Group>
                </Paper>

                <Group gap="sm" wrap="wrap" w={{ base: '100%', sm: 'auto' }}>
                    <CalendarExportButton
                        calendarToken={calendarToken}
                        isLoggedIn={isLoggedIn}
                    />

                    <Button
                        type="button"
                        size="sm"
                        variant={showPastActivities ? 'filled' : 'default'}
                        onClick={toggleShowPastActivities}
                        rightSection={showPastActivities ? <EyeOff size={14} /> : <Eye size={14} />}
                    >
                        {showPastActivities ? 'Verberg afgelopen' : 'Toon afgelopen'}
                    </Button>
                </Group>
            </Group>

            <Box w="100%">
                {viewMode === 'calendar' && (
                    <>
                        <Box visibleFrom="lg">
                            <CalendarView
                                currentDate={currentDate}
                                events={filteredEvents}
                                selectedDay={selectedDay}
                                onSelectDay={setSelectedDay}
                                onEventClick={handleShowDetails}
                                onPrevMonth={() => {
                                    const d = new Date(currentDate);
                                    d.setMonth(d.getMonth() - 1);
                                    setCurrentDate(d);
                                }}
                                onNextMonth={() => {
                                    const d = new Date(currentDate);
                                    d.setMonth(d.getMonth() + 1);
                                    setCurrentDate(d);
                                }}
                                onGoToDate={(d: Date) => setCurrentDate(d)}
                            />
                        </Box>
                        <Box hiddenFrom="lg">
                            <ActiviteitList
                                events={filteredEvents}
                                onEventClick={handleShowDetails}
                            />
                        </Box>
                    </>
                )}

                {viewMode === 'list' && (
                    <ActiviteitList
                        events={filteredEvents}
                        onEventClick={handleShowDetails}
                        serverTime={serverTime}
                    />
                )}

                {viewMode === 'grid' && (
                    <ActiviteitList
                        events={filteredEvents}
                        onEventClick={handleShowDetails}
                        variant="grid"
                        serverTime={serverTime}
                    />
                )}
            </Box>

            {selectedDay && (
                <DayDetails
                    selectedDay={selectedDay}
                    activities={events}
                    onClose={() => setSelectedDay(null)}
                    onEventClick={handleShowDetails}
                />
            )}
        </Stack>
    );
}
