'use client';

import {
    Calendar,
    Users,
    Edit,
    Eye,
    MapPin,
    Euro
} from 'lucide-react';
import { AdminActivity } from '@salvemundi/validations';
import MediaAsset from '@/components/ui/media/MediaAsset';
import { isEventPast } from '@/shared/lib/utils/date';

const formatDate = (dateString: string) =>
    new Intl.DateTimeFormat('nl-NL', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    }).format(new Date(dateString));

interface Props {
    event?: AdminActivity;
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
            className={`group/card relative flex flex-col overflow-hidden rounded-(--beheer-radius) border border-(--beheer-border) bg-(--beheer-card-bg) shadow-lg transition-all hover:shadow-2xl md:flex-row ${isPast ? 'grayscale-0.5 opacity-60' : ''}`}
        >
            <div className="relative hidden min-h-40 w-full shrink-0 border-r border-(--beheer-border) bg-(--beheer-card-soft)/50 md:block md:min-h-full md:w-48 lg:w-56">
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

            <div className="flex min-w-0 flex-1 flex-col justify-center px-6 py-4 sm:px-8 sm:py-5">
                <div className="mb-2 flex flex-wrap items-center gap-3">
                    <h3 className="text-2xl leading-tight font-semibold text-(--beheer-text)">
                        {event.name}
                    </h3>
                    <div className="flex gap-2">
                        {isDraft && <span className="rounded-full border border-(--beheer-border) bg-(--beheer-text-muted)/10 px-3 py-1 text-[8px] font-semibold text-(--beheer-text-muted)">Draft</span>}
                        {isScheduled && <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-[8px] font-semibold text-blue-500">Ingepland</span>}
                        {isPast && <span className="rounded-full bg-(--beheer-border) px-3 py-1 text-[8px] font-semibold text-(--beheer-text-muted)">Verleden</span>}
                    </div>
                </div>

                <div className="mb-4 flex flex-wrap gap-x-6 gap-y-2 text-xs font-semibold text-(--beheer-text-muted)">
                    <div className="flex items-center gap-2">
                        <Calendar className="size-3.5 text-(--beheer-accent)" />
                        <span>{formatDate(event.event_date)}</span>
                    </div>
                    {event.location && (
                        <div className="flex items-center gap-2">
                            <MapPin className="size-3.5 text-red-500" />
                            <span className="truncate">{event.location}</span>
                        </div>
                    )}
                </div>

                {event.description && (
                    <p className="mb-4 line-clamp-2 text-sm leading-relaxed font-medium text-(--beheer-text-muted)">
                        {event.description}
                    </p>
                )}

                <div className="flex flex-wrap items-center gap-4">
                    <div className="group/stats flex items-center gap-3 rounded-2xl border border-(--beheer-border) bg-(--beheer-card-soft)/50 px-5 py-2.5">
                        <div className="rounded-full bg-(--beheer-accent)/10 p-2 text-(--beheer-accent) transition-transform group-hover/stats:rotate-12">
                            <Users className="size-4" />
                        </div>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-xl leading-none font-semibold text-(--beheer-text)">{event.signup_count || 0}</span>
                            {event.max_sign_ups && <span className="text-sm font-semibold text-(--beheer-text-muted)">/ {event.max_sign_ups}</span>}
                            <span className="ml-1 text-[10px] font-semibold text-(--beheer-text-muted)">aanmeldingen</span>
                        </div>
                    </div>
                    {(event.price_members !== undefined || event.price_non_members !== undefined) && (
                        <div className="group/price flex items-center gap-4 rounded-2xl border border-(--beheer-border) bg-(--beheer-card-soft)/50 px-5 py-2.5">
                            <div className="rounded-full bg-emerald-500/10 p-2 text-emerald-500 transition-transform group-hover/price:scale-110">
                                <Euro className="size-4" />
                            </div>
                            <div className="flex items-center gap-2 font-semibold text-(--beheer-text)">
                                {event.price_members === 0 && event.price_non_members === 0 ? (
                                    <span className="text-emerald-500">Gratis</span>
                                ) : (
                                    <>
                                        <span>€{event.price_members || 0} Lid</span>
                                        <span className="text-(--beheer-border)">|</span>
                                        <span className="text-(--beheer-text-muted)">€{event.price_non_members || 0} Niet lid</span>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex flex-col items-stretch justify-center gap-2 border-t border-(--beheer-border) bg-(--beheer-card-soft)/20 p-4 md:w-64 md:gap-3 md:border-t-0 md:border-l md:p-6">
                <button
                    onClick={() => onViewSignups(event.id)}
                    className="group/btn beheer-button flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-(--beheer-accent)/10 px-4 py-3 text-[11px] font-semibold text-(--beheer-accent) transition-all hover:bg-(--beheer-accent) hover:text-white active:scale-95 md:gap-4 md:px-6 md:py-5"
                >
                    <Eye className="size-5 transition-transform group-hover/btn:scale-110" />
                    <span>Aanmeldingen</span>
                </button>

                <button
                    onClick={() => onViewAttendance(event.id)}
                    className="group/btn beheer-button flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-emerald-500/10 px-4 py-3 text-[11px] font-semibold text-emerald-600 transition-all hover:bg-emerald-500 hover:text-white active:scale-95 md:gap-4 md:px-6 md:py-5"
                >
                    <Users className="size-5 transition-transform group-hover/btn:scale-110" />
                    <span>Aanwezigheid</span>
                </button>

                {canEdit && (
                    <button
                        onClick={() => onEdit(event.id)}
                        className="group/btn beheer-button flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-(--beheer-border) px-4 py-3 text-[11px] font-semibold text-(--beheer-text) transition-all hover:bg-(--beheer-border) active:scale-95 md:gap-4 md:px-6 md:py-5"
                    >
                        <Edit className="size-5 transition-transform group-hover/btn:rotate-12" />
                        <span>Bewerken</span>
                    </button>
                )}
            </div>
        </div>
    );
}