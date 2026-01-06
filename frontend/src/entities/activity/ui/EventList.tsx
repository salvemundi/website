'use client';

import React from 'react';
import { stripHtml } from '@/shared/lib/text';
import ActiviteitCard from './ActiviteitCard';
import { getImageUrl } from '@/shared/lib/api/salvemundi';
import { isEventPast } from '@/shared/lib/utils/date';

interface EventListProps {
    events: any[];
    onEventClick: (event: any) => void;
}

export default function EventList({ events, onEventClick }: EventListProps) {
    if (events.length === 0) {
        return (
            <div className="text-center py-12 bg-white rounded-3xl shadow-sm">
                <p className="text-gray-500">Geen activiteiten gevonden.</p>
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
                    description={stripHtml(event.description)}
                    date={event.event_date}
                    startTime={event.event_time}
                    endTime={event.event_time_end || event.time_end}
                    location={event.location}
                    price={event.price}
                    image={getImageUrl(event.image)}
                    isPast={isEventPast(event.event_date)}
                    variant="list"
                    committeeName={event.committee_name}
                    contact={event.contact}
                    inschrijfDeadline={event.inschrijf_deadline}
                    onShowDetails={() => onEventClick(event)}
                    onSignup={() => onEventClick(event)}
                />
            ))}
        </div>
    );
}
