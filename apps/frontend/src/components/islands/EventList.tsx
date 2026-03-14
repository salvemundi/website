'use client';

import { stripHtml } from '@/shared/lib/text';
import ActiviteitCard from './ActiviteitCard';
import { getImageUrl } from '@/shared/lib/api/salvemundi';
import { isEventPast } from '@/shared/lib/utils/date';
import { useAuth } from '@/features/auth/providers/auth-provider';

interface EventListProps {
    events: any[];
    onEventClick: (event: any) => void;
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
                        title={event.titel || event.name || 'Activiteit'}
                        description={stripHtml(event.beschrijving || event.description || '')}
                        date={event.datum_start || event.event_date}
                        endDate={event.datum_eind || event.event_date_end}
                        startTime={event.event_time}
                        endTime={event.event_time_end || event.time_end}
                        location={event.locatie || event.location}
                        price={user?.membership_status === 'active' ? event.price_members : event.price_non_members}
                        image={getImageUrl(event.afbeelding_id || event.image)}
                        isPast={isEventPast(event.datum_start || event.event_date)}
                        variant="grid"
                        committeeName={event.committee_name}
                        contact={event.contact}
                        inschrijfDeadline={event.inschrijf_deadline}
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
                    title={event.titel || event.name || 'Activiteit'}
                    description={stripHtml(event.beschrijving || event.description || '')}
                    date={event.datum_start || event.event_date}
                    endDate={event.datum_eind || event.event_date_end}
                    startTime={event.event_time}
                    endTime={event.event_time_end || event.time_end}
                    location={event.locatie || event.location}
                    price={user?.membership_status === 'active' ? event.price_members : event.price_non_members}
                    image={getImageUrl(event.afbeelding_id || event.image)}
                    isPast={isEventPast(event.datum_start || event.event_date)}
                    variant="list"
                    committeeName={event.committee_name}
                    contact={event.contact}
                    inschrijfDeadline={event.inschrijf_deadline}
                    onlyMembers={event.only_members}
                    onShowDetails={() => onEventClick(event)}
                    onSignup={() => onEventClick(event)}
                />
            ))}
        </div>
    );
}
