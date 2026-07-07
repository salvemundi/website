'use client';

import { stripHtml } from '@/shared/lib/text';
import ActiviteitCard from './ActiviteitCard';
import { isEventPast } from '@/shared/lib/utils/date';
import { useAuth } from '@/features/auth/providers/auth-provider';
import type { Activiteit } from '@salvemundi/validations/schema/activity.zod';
import { type MembershipUserData } from '@/components/islands/account/MembershipStatusIsland';

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
            <div className="text-center py-12 bg-(--bg-card) rounded-3xl shadow-sm">
                <p className="text-(--text-muted)">Geen activiteiten gevonden.</p>
            </div>
        );
    }

    if (variant === 'grid') {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event) => (
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
                        price={user && (user as unknown as MembershipUserData).membership_status === 'active' ? event.price_members : event.price_non_members}
                        image={event.afbeelding_id ?? undefined}
                        isPast={isEventPast(
                            event.event_date_end || event.event_date,
                            event.event_time_end || event.event_time,
                            !!event.event_time_end,
                            serverTime ? new Date(serverTime) : undefined
                        )}
                        serverTime={serverTime}
                        isSignedUp={event.is_signed_up}
                        variant="grid"
                        committeeName={event.committee_name ?? undefined}
                        contact={event.contact ?? undefined}
                        registrationDeadline={event.registration_deadline ?? undefined}
                        onlyMembers={event.only_members}
                        onShowDetails={() => onEventClick(event)}
                        onSignup={() => onEventClick(event)}
                    />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {events.map((event) => (
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
                    price={user && (user as unknown as MembershipUserData).membership_status === 'active' ? event.price_members : event.price_non_members}
                    image={event.afbeelding_id ?? undefined}
                    isPast={isEventPast(
                        event.event_date_end || event.event_date,
                        event.event_time_end || event.event_time,
                        !!event.event_time_end,
                        serverTime ? new Date(serverTime) : undefined
                    )}
                    serverTime={serverTime}
                    isSignedUp={event.is_signed_up}
                    variant="list"
                    committeeName={event.committee_name ?? undefined}
                    contact={event.contact ?? undefined}
                    registrationDeadline={event.registration_deadline ?? undefined}
                    onlyMembers={event.only_members}
                    onShowDetails={() => onEventClick(event)}
                    onSignup={() => onEventClick(event)}
                />
            ))}
        </div>
    );
}