'use client';

import { Card, SimpleGrid, Stack, Text } from '@mantine/core';
import { stripHtml } from '@/shared/lib/text';
import ActiviteitCard from './ActiviteitCard';
import { isEventPast } from '@/shared/lib/utils/date';
import { useAuth } from '@/features/auth/providers/auth-provider';
import type { Activiteit } from '@salvemundi/validations/schema/activity.zod';

interface ActiviteitListProps {
    events: (Activiteit & { is_signed_up?: boolean })[];
    onEventClick: (event: Activiteit) => void;
    variant?: 'list' | 'grid';
    serverTime?: string;
}

export default function ActiviteitList({ events, onEventClick, variant = 'list', serverTime }: ActiviteitListProps) {
    const { user } = useAuth();

    if (events.length === 0) {
        return (
            <Card padding="xl" shadow="sm" ta="center">
                <Text c="dimmed">Geen activiteiten gevonden.</Text>
            </Card>
        );
    }

    if (variant === 'grid') {
        return (
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
                {events.map((event) => {
                    const isFull = event.max_sign_ups !== null && (event.signup_count ?? 0) >= event.max_sign_ups;
                    return (
                        <ActiviteitCard
                            key={event.id}
                            id={event.id}
                            title={event.name}
                            description={stripHtml(event.description || '')}
                            short_description={event.short_description}
                            date={event.event_date}
                            endDate={event.event_date_end ?? undefined}
                            startTime={event.event_time ?? undefined}
                            endTime={event.event_time_end ?? undefined}
                            location={event.location ?? undefined}
                            price={user?.membership_status === 'active' ? event.price_members : event.price_non_members}
                            image={event.afbeelding_id ?? undefined}
                            isPast={isEventPast(
                                event.event_date_end || event.event_date,
                                event.event_time_end || event.event_time,
                                !!event.event_time_end,
                                serverTime ? new Date(serverTime) : undefined
                            )}
                            serverTime={serverTime}
                            isSignedUp={event.is_signed_up}
                            isFull={isFull}
                            variant="grid"
                            committeeName={event.committee_name ?? undefined}
                            contact={event.contact ?? undefined}
                            registrationDeadline={event.registration_deadline ?? undefined}
                            onlyMembers={event.only_members}
                            onShowDetails={() => onEventClick(event)}
                            onSignup={() => onEventClick(event)}
                        />
                    );
                })}
            </SimpleGrid>
        );
    }

    return (
        <Stack gap="md">
            {events.map((event) => {
                const isFull = event.max_sign_ups !== null && (event.signup_count ?? 0) >= event.max_sign_ups;
                return (
                    <ActiviteitCard
                        key={event.id}
                        id={event.id}
                        title={event.name}
                        description={stripHtml(event.description || '')}
                        short_description={event.short_description}
                        date={event.event_date}
                        endDate={event.event_date_end ?? undefined}
                        startTime={event.event_time ?? undefined}
                        endTime={event.event_time_end ?? undefined}
                        location={event.location ?? undefined}
                        price={user?.membership_status === 'active' ? event.price_members : event.price_non_members}
                        image={event.afbeelding_id ?? undefined}
                        isPast={isEventPast(
                            event.event_date_end || event.event_date,
                            event.event_time_end || event.event_time,
                            !!event.event_time_end,
                            serverTime ? new Date(serverTime) : undefined
                        )}
                        serverTime={serverTime}
                        isSignedUp={event.is_signed_up}
                        isFull={isFull}
                        variant="list"
                        committeeName={event.committee_name ?? undefined}
                        contact={event.contact ?? undefined}
                        registrationDeadline={event.registration_deadline ?? undefined}
                        onlyMembers={event.only_members}
                        onShowDetails={() => onEventClick(event)}
                        onSignup={() => onEventClick(event)}
                    />
                );
            })}
        </Stack>
    );
}
