'use client';

import { stripHtml } from '@/shared/lib/text';
import ActiviteitCard from './ActiviteitCard';
import { getImageUrl } from '@/lib/utils/image-utils';
import { isEventPast } from '@/shared/lib/utils/date';
import { useAuth } from '@/features/auth/providers/auth-provider';
import type { Activiteit } from '@salvemundi/validations/schema/activity.zod';

interface EventListProps {
    events: (Activiteit & { is_signed_up?: boolean })[];
    onEventClick: (event: Activiteit) => void;
    variant?: 'list' | 'grid';
}

export default function EventList({ events, onEventClick, variant = 'list' }: EventListProps) {
    const { user } = useAuth();

    if (events.length === 0) {
        return (
            <div className="text-center py-12 bg-[var(--bg-card)] rounded-3xl shadow-sm">
                <p className="text-[var(--text-muted)]">Geen activiteiten gevonden.</p>
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
                        title={event.titel || 'Activiteit'}
                        description={stripHtml(event.beschrijving || '')}
                        date={event.datum_start}
                        endDate={event.datum_eind ?? undefined}
                        startTime={event.event_time ?? undefined}
                        endTime={event.event_time_end ?? undefined}
                        location={event.locatie ?? undefined}
                        price={(user as any)?.membership_status === 'active' ? (event.price_members ?? undefined) : (event.price_non_members ?? undefined)}
                        image={event.afbeelding_id ?? undefined}
                        isPast={isEventPast(event.datum_start)}
                        isSignedUp={event.is_signed_up}
                        variant="grid"
                        committeeName={event.committee_name ?? undefined}
                        contact={event.contact ?? undefined}
                        registrationDeadline={event.registration_deadline ?? undefined}
                        onlyMembers={event.only_members ?? undefined}
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
                    title={event.titel || 'Activiteit'}
                    description={stripHtml(event.beschrijving || '')}
                    date={event.datum_start}
                    endDate={event.datum_eind ?? undefined}
                    startTime={event.event_time ?? undefined}
                    endTime={event.event_time_end ?? undefined}
                    location={event.locatie ?? undefined}
                    price={(user as any)?.membership_status === 'active' ? (event.price_members ?? undefined) : (event.price_non_members ?? undefined)}
                    image={event.afbeelding_id ?? undefined}
                    isPast={isEventPast(event.datum_start)}
                    isSignedUp={event.is_signed_up}
                    variant="list"
                    committeeName={event.committee_name ?? undefined}
                    contact={event.contact ?? undefined}
                    registrationDeadline={event.registration_deadline ?? undefined}
                    onlyMembers={event.only_members ?? undefined}
                    onShowDetails={() => onEventClick(event)}
                    onSignup={() => onEventClick(event)}
                />
            ))}
        </div>
    );
}
