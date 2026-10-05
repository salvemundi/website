'use client';

import Link from 'next/link';
import { Calendar, ChevronRight, CreditCard } from 'lucide-react';
import { Tile } from './ProfielUI';
import { slugify } from '@/shared/lib/utils/slug';
import { type ProfileEventSignup } from '@salvemundi/validations/schema/profiel.zod';
import { type EnrichedPubCrawlSignup } from '@salvemundi/validations/schema/pub-crawl.zod';

const formatDate = (dateStr: string) =>
    new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(dateStr));

type EnrichedSignup = (ProfileEventSignup & { _type: 'event' }) | (EnrichedPubCrawlSignup & { _type: 'pub_crawl' });

interface ProfielSignupsProps {
    filteredSignups?: EnrichedSignup[];
    showPastEvents?: boolean;
    setShowPastEvents?: (value: boolean | ((previousValue: boolean) => boolean)) => void;
}

export default function ProfielSignups({
    filteredSignups = [],
    showPastEvents = false,
    setShowPastEvents = () => { }
}: ProfielSignupsProps) {
    return (
        <Tile
            title="Mijn aanmeldingen"
            icon={<Calendar className="size-5" />}
            className="h-fit"
            actions={
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowPastEvents((previousValue) => !previousValue)}
                        className="tab-button border border-theme-purple/20 bg-theme-purple/10 font-black text-theme-purple uppercase transition hover:bg-theme-purple/20"
                        type="button">
                        {showPastEvents ? "Verberg oude" : "Toon oude"}
                    </button>
                    <Link
                        href="/profiel/tickets"
                        className="btn-secondary"
                    >
                        Tickets <ChevronRight className="size-3" />
                    </Link>
                    <Link
                        href="/activiteiten"
                        className="beheer-button form-button"
                    >
                        Kalender <ChevronRight className="size-3" />
                    </Link>
                </div>
            }
        >
            {filteredSignups.length > 0 ? (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                    {filteredSignups.map((signup: EnrichedSignup) => {
                        const isEvent = signup._type === 'event';
                        const eventData = isEvent ? signup.event_id : signup.pub_crawl_event_id;

                        const isExpanded = (data: unknown): data is { name: string; event_date?: string | null; date?: string | null } => {
                            return typeof data === 'object' && data !== null && 'name' in (data as { [key: string]: unknown });
                        };

                        if (!isExpanded(eventData)) return null;

                        const eventDateStr = isEvent ? eventData.event_date : eventData.date;
                        const detailHref = isEvent ? `/activiteiten/${slugify(eventData.name)}` : `/kroegentocht`;
                        const icon = isEvent ? <Calendar className="size-7" /> : <CreditCard className="size-7" />;

                        const isPast = (() => {
                            try {
                                if (!eventDateStr) return false;
                                const eventDate = new Date(eventDateStr);
                                eventDate.setHours(0, 0, 0, 0);
                                const today = new Date();
                                today.setHours(0, 0, 0, 0);
                                return eventDate.getTime() < today.getTime();
                            } catch { return false; }
                        })();

                        return (
                            <Link
                                key={`${signup._type}-${signup.id}`}
                                href={detailHref}
                                className={`group flex h-full items-center justify-between gap-4 squircle-lg border p-5 text-left shadow-sm transition-all ${isPast
                                    ? "border-licht-paars/10 bg-licht-paars/5 opacity-60 grayscale dark:border-white/5 dark:bg-white/5"
                                    : "border-licht-paars/20 bg-licht-paars/10 hover:shadow-lg dark:border-white/10 dark:bg-white/5"
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="icon-box size-16 rounded-2xl">
                                        {icon}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className="line-clamp-1 text-lg font-bold text-theme-purple">
                                                {eventData.name}
                                            </h3>
                                        </div>
                                        <p className="mt-1 flex items-center gap-2 text-xs font-bold text-(--text-muted)">
                                            <Calendar className="size-3.5" />
                                            {eventDateStr && formatDate(eventDateStr)}
                                        </p>
                                    </div>
                                </div>
                                <ChevronRight className="size-6 shrink-0 text-theme-purple opacity-40 transition-transform group-hover:translate-x-1 group-hover:opacity-100" />
                            </Link>
                        );
                    })}
                </div>
            ) : (
                <div className="squircle-lg border-2 border-dashed border-licht-paars/20 bg-licht-paars/5 p-12 text-center shadow-inner dark:border-white/10 dark:bg-white/5">
                    <p className="mb-2 text-lg font-bold text-theme-purple">
                        Je bent nog niet aangemeld voor activiteiten.
                    </p>
                    <p className="mb-6 text-sm text-(--text-muted)">
                        Bekijk de kalender om aankomende activiteiten te ontdekken
                    </p>
                    <Link
                        href="/activiteiten"
                        className="beheer-button form-button"
                    >
                        Ontdek activiteiten
                    </Link>
                </div>
            )}
        </Tile>
    );
}
