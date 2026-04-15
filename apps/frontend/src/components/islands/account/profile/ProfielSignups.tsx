'use client';

import React from 'react';
import Link from 'next/link';
import { Calendar, ChevronRight, CreditCard } from 'lucide-react';
import { format, isBefore, startOfDay } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Tile } from './ProfielUI';

interface ProfielSignupsProps {
    isLoading?: boolean;
    filteredSignups?: any[];
    showPastEvents?: boolean;
    setShowPastEvents?: (val: boolean | ((v: boolean) => boolean)) => void;
}

export default function ProfielSignups({
    isLoading = false,
    filteredSignups = [],
    showPastEvents = false,
    setShowPastEvents = () => {}
}: ProfielSignupsProps) {
    return (
        <Tile
            title="Mijn aanmeldingen"
            icon={<Calendar className="h-5 w-5" />}
            className="h-fit"
            aria-busy={isLoading}
            actions={
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowPastEvents((v) => !v)}
                        disabled={isLoading}
                        className="inline-flex items-center justify-center rounded-xl bg-[var(--color-purple-50)] px-4 py-2 text-[10px] font-black uppercase text-[var(--color-purple-700)] hover:bg-[var(--color-purple-100)] transition border border-[var(--color-purple-100)] disabled:opacity-50"
                    >
                        {showPastEvents ? "Verberg oude" : "Toon oude"}
                    </button>
                    <Link
                        href="/activiteiten"
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--color-purple-500)] px-4 py-2 text-[10px] font-black uppercase text-white hover:bg-[var(--color-purple-600)] transition shadow-lg"
                    >
                        Kalender <ChevronRight className="h-3 w-3" />
                    </Link>
                </div>
            }
        >
            {(isLoading || filteredSignups.length > 0) ? (
                <div className={`grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 ${isLoading ? 'skeleton-active' : ''}`}>
                    {(isLoading ? [1, 2, 3] : filteredSignups).map((signup: any, idx: number) => {
                        const isEvent = isLoading ? true : signup._type === 'event';
                        const eventData = isLoading ? { name: 'Loading Activity Name', id: 'loading' } : (isEvent ? signup.event_id : signup.pub_crawl_event_id);
                        const eventDateStr = isLoading ? '2024-01-01' : (isEvent ? eventData?.event_date : eventData?.date);
                        const detailHref = isLoading ? '#' : (isEvent ? `/activiteiten/${eventData.id}` : `/kroegentocht`);
                        const icon = isLoading ? <Calendar className="h-7 w-7" /> : (isEvent ? <Calendar className="h-7 w-7" /> : <CreditCard className="h-7 w-7" />);

                        if (!eventData) return null;

                        const isPast = (() => {
                            try {
                                if (isLoading || !eventDateStr) return false;
                                return isBefore(startOfDay(new Date(eventDateStr)), startOfDay(new Date()));
                            } catch { return false; }
                        })();

                        return (
                            <Link
                                key={isLoading ? idx : `${signup._type}-${signup.id}`}
                                href={detailHref}
                                className={`group h-full flex items-center justify-between gap-4 rounded-3xl p-5 text-left transition-all border shadow-sm ${
                                    isPast 
                                    ? "bg-slate-50 dark:bg-black/10 opacity-60 grayscale border-slate-200 dark:border-white/5" 
                                    : "bg-slate-50 dark:bg-black/20 border-slate-200 dark:border-white/10 hover:shadow-lg hover:-translate-y-0.5"
                                }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="shrink-0 h-16 w-16 flex items-center justify-center rounded-2xl bg-[var(--color-purple-100)] text-[var(--color-purple-500)] shadow-sm">
                                         {icon}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-lg font-bold text-[var(--color-purple-700)] dark:text-white line-clamp-1">
                                                {eventData.name}
                                            </h3>
                                        </div>
                                        <p className="mt-1 flex items-center gap-2 text-xs font-bold text-[var(--text-muted)]">
                                            <Calendar className="h-3.5 w-3.5" />
                                            {isLoading ? '01 JAN 2024' : (eventDateStr && format(new Date(eventDateStr), "d MMM yyyy", { locale: nl }))}
                                        </p>
                                    </div>
                                </div>
                                <ChevronRight className="h-6 w-6 shrink-0 text-[var(--color-purple-200)] transition-transform group-hover:translate-x-1" />
                            </Link>
                        );
                    })}
                </div>
            ) : (
                <div className="rounded-3xl border-2 border-dashed border-slate-300 dark:border-white/20 bg-slate-50 dark:bg-black/10 p-12 text-center shadow-inner">
                    <p className="text-[var(--color-purple-700)] dark:text-white font-bold text-lg mb-2">
                        Je bent nog niet aangemeld voor activiteiten.
                    </p>
                    <p className="text-[var(--text-muted)] text-sm mb-6">
                        Bekijk de kalender om aankomende activiteiten te ontdekken
                    </p>
                    <Link
                        href="/activiteiten"
                        className="inline-flex items-center gap-2 rounded-full bg-[var(--color-purple-500)] px-8 py-3 text-sm font-bold text-white shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl"
                    >
                        Ontdek activiteiten
                    </Link>
                </div>
            )}
        </Tile>
    );
}

