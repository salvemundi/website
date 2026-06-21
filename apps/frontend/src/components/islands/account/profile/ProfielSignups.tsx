'use client';

import Link from 'next/link';
import { Calendar, ChevronRight, CreditCard } from 'lucide-react';
import { Tile } from './ProfielUI';
import { slugify } from '@/shared/lib/utils/slug';
import { type EventSignup } from '@salvemundi/validations/schema/profiel.zod';
import { type EnrichedPubCrawlSignup } from '@salvemundi/validations/schema/pub-crawl.zod';

const formatDate = (dateStr: string) =>
    new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(dateStr));

type EnrichedSignup = (EventSignup & { _type: 'event' }) | (EnrichedPubCrawlSignup & { _type: 'pub_crawl' });

interface ProfielSignupsProps {
    filteredSignups?: EnrichedSignup[];
    showPastEvents?: boolean;
    setShowPastEvents?: (val: boolean | ((v: boolean) => boolean)) => void;
}

export default function ProfielSignups({
    filteredSignups = [],
    showPastEvents = false,
    setShowPastEvents = () => { }
}: ProfielSignupsProps) {
    return (
        <Tile
            title="Mijn aanmeldingen"
            icon={<Calendar className="h-5 w-5" />}
            className="h-fit"
            actions={
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowPastEvents((v) => !v)}
                        className="inline-flex items-center justify-center rounded-xl bg-purple-50 dark:bg-white/5 px-4 py-2 text-[10px] font-black uppercase text-purple-700 dark:text-white hover:bg-purple-100 dark:hover:bg-white/10 transition border border-purple-100 dark:border-white/10 disabled:opacity-50"
                    >
                        {showPastEvents ? "Verberg oude" : "Toon oude"}
                    </button>
                    <Link
                        href="/profiel/tickets"
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-50 dark:bg-white/5 px-4 py-2 text-[10px] font-black uppercase text-purple-700 dark:text-white hover:bg-purple-100 dark:hover:bg-white/10 transition border border-purple-100 dark:border-white/10"
                    >
                        Tickets <ChevronRight className="h-3 w-3" />
                    </Link>
                    <Link
                        href="/activiteiten"
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-500 px-4 py-2 text-[10px] font-black uppercase text-white hover:bg-purple-600 transition shadow-lg"
                    >
                        Kalender <ChevronRight className="h-3 w-3" />
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
                        const icon = isEvent ? <Calendar className="h-7 w-7" /> : <CreditCard className="h-7 w-7" />;

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
                                className={`group h-full flex items-center justify-between gap-4 squircle-lg p-5 text-left transition-all border shadow-sm ${isPast
                                    ? "bg-licht-paars/5 dark:bg-white/5 opacity-60 grayscale border-licht-paars/10 dark:border-white/5"
                                    : "bg-licht-paars/10 dark:bg-white/5 border-licht-paars/20 dark:border-white/10 hover:shadow-lg hover:-translate-y-0.5"
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="shrink-0 h-16 w-16 flex items-center justify-center rounded-2xl bg-purple-100 dark:bg-transparent text-purple-500 dark:text-purple-300 shadow-sm dark:shadow-none">
                                        {icon}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-lg font-bold text-purple-700 dark:text-white line-clamp-1">
                                                {eventData.name}
                                            </h3>
                                        </div>
                                        <p className="mt-1 flex items-center gap-2 text-xs font-bold text-(--text-muted)">
                                            <Calendar className="h-3.5 w-3.5" />
                                            {eventDateStr && formatDate(eventDateStr)}
                                        </p>
                                    </div>
                                </div>
                                <ChevronRight className="h-6 w-6 shrink-0 text-purple-200 transition-transform group-hover:translate-x-1" />
                            </Link>
                        );
                    })}
                </div>
            ) : (
                <div className="squircle-lg border-2 border-dashed border-licht-paars/20 dark:border-white/10 bg-licht-paars/5 dark:bg-white/5 p-12 text-center shadow-inner">
                    <p className="text-purple-700 dark:text-white font-bold text-lg mb-2">
                        Je bent nog niet aangemeld voor activiteiten.
                    </p>
                    <p className="text-(--text-muted) text-sm mb-6">
                        Bekijk de kalender om aankomende activiteiten te ontdekken
                    </p>
                    <Link
                        href="/activiteiten"
                        className="inline-flex items-center gap-2 squircle bg-purple-500 px-8 py-3 text-sm font-bold text-white shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl"
                    >
                        Ontdek activiteiten
                    </Link>
                </div>
            )}
        </Tile>
    );
}
