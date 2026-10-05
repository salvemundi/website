'use client';

import {
    Calendar,
    Users,
    Edit,
    Eye,
    MapPin,
    Euro
} from 'lucide-react';
import { BeheerActivity } from '@salvemundi/validations';
import MediaAsset from '@/components/ui/media/MediaAsset';
import { isEventPast } from '@/shared/lib/utils/date';

const formatDate = (dateString: string) =>
    new Intl.DateTimeFormat('nl-NL', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    }).format(new Date(dateString));

interface Props {
    event?: BeheerActivity;
    canEdit?: boolean;
    isPending?: boolean;
    onViewSignups?: (id: number) => void;
    onViewAttendance?: (id: number) => void;
    onEdit?: (id: number) => void;
}

export default function ActivityCard({
    event,
    canEdit = false,
    onViewSignups = () => { },
    onViewAttendance = () => { },
    onEdit = () => { } }: Props) {
    if (!event) return null;
    const isPast = isEventPast(
        event.event_date_end || event.event_date,
        event.event_time_end || event.event_time,
        !!event.event_time_end
    );
    const isDraft = event.status === 'draft';
    const isScheduled = event.status === 'published' && event.publish_date && new Date(event.publish_date) > new Date();

    return (
        <div
            className={`activity-card ${isPast ? 'grayscale-0.5 opacity-60' : ''}`}
        >
            <div className="activity-card-media">
                <div className="absolute inset-0 p-4">
                    <div className="relative size-full">
                        <MediaAsset
                            asset={event.image}
                            alt={event.name}
                            fill
                            objectFit="contain"
                            className="drop-shadow-md"
                        />
                    </div>
                </div>
            </div>

            <div className="activity-card-body">
                <div className="activity-card-header">
                    <h3 className="text-2xl leading-tight font-semibold text-beheer-text">
                        {event.name}
                    </h3>
                    <div className="flex gap-2">
                        {isDraft && <span className="key-badge-mono">Draft</span>}
                        {isScheduled && <span className="key-badge-mono">Ingepland</span>}
                        {isPast && <span className="key-badge-mono">Verleden</span>}
                    </div>
                </div>

                <div className="activity-card-meta">
                    <div className="flex items-center gap-2">
                        <Calendar className="size-3.5 text-beheer-accent" />
                        <span>{formatDate(event.event_date)}</span>
                    </div>
                    {event.location && (
                        <div className="flex items-center gap-2">
                            <MapPin className="size-3.5 text-theme-error" />
                            <span className="truncate">{event.location}</span>
                        </div>
                    )}
                </div>

                {event.description && (
                    <p className="activity-card-desc">
                        {event.description}
                    </p>
                )}

                <div className="flex flex-wrap items-center gap-4">
                    <div className="group/stats activity-card-pill">
                        <div className="activity-card-stats-icon">
                            <Users className="size-4" />
                        </div>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-xl leading-none font-semibold text-beheer-text">{event.signup_count || 0}</span>
                            {event.max_sign_ups && <span className="text-sm font-semibold text-beheer-text-muted">/ {event.max_sign_ups}</span>}
                            <span className="ml-1 text-2xs font-semibold text-beheer-text-muted">aanmeldingen</span>
                        </div>
                    </div>
                    {(event.price_members !== undefined || event.price_non_members !== undefined) && (
                        <div className="group/price activity-card-pill">
                            <div className="icon-box-active p-2 transition-transform group-hover/price:scale-110">
                                <Euro className="size-4" />
                            </div>
                            <div className="activity-card-price-text">
                                {event.price_members === 0 && event.price_non_members === 0 ? (
                                    <span className="text-theme-success">Gratis</span>
                                ) : (
                                    <>
                                        <span>€{event.price_members || 0} Lid</span>
                                        <span className="text-beheer-border">|</span>
                                        <span className="text-beheer-text-muted">€{event.price_non_members || 0} Niet lid</span>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="activity-card-actions">
                <button
                    onClick={() => onViewSignups(event.id)}
                    className="group/btn btn-card-action-lg"
                    type="button">
                    <Eye className="size-5 transition-transform group-hover/btn:scale-110" />
                    <span>Aanmeldingen</span>
                </button>

                <button
                    onClick={() => onViewAttendance(event.id)}
                    className="group/btn btn-card-success-lg"
                    type="button">
                    <Users className="size-5 transition-transform group-hover/btn:scale-110" />
                    <span>Aanwezigheid</span>
                </button>

                {canEdit && (
                    <button
                        onClick={() => onEdit(event.id)}
                        className="group/btn btn-card-edit-lg"
                        type="button">
                        <Edit className="size-5 transition-transform group-hover/btn:rotate-12" />
                        <span>Bewerken</span>
                    </button>
                )}
            </div>
        </div>
    );
}