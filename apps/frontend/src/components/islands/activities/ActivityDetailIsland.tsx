'use client';

import React from 'react';
import { MapPin, User, Mail, CalendarClock } from 'lucide-react';
import { SafeMarkdown } from '@/components/ui/security/SafeMarkdown';
import { ObfuscatedEmail } from '@/components/ui/security/ObfuscatedEmail';
import { type Activiteit } from '@salvemundi/validations/schema/activity.zod';
import { buildCommitteeEmail, formatActivityDateTime } from '@/shared/lib/activity-utils';
import MediaAsset from '@/components/ui/media/MediaAsset';

interface ActivityDetailIslandProps {
    activity?: Activiteit;
    isLoggedIn?: boolean;
    children?: React.ReactNode;
}

export default function ActivityDetailIsland({ activity, isLoggedIn = false, children }: ActivityDetailIslandProps) {
    const contact = activity?.contact;
    const committeeEmail = contact && contact.includes('@')
        ? contact
        : activity ? buildCommitteeEmail(activity.committee_name) : null;

    const { displayDate, timeRange } = formatActivityDateTime(
        {
            datum_start: activity?.datum_start || '',
            datum_eind: activity?.datum_eind,
            event_time: activity?.event_time,
            event_time_end: activity?.event_time_end
        },
        'detail'
    );

    return (
        <div className="w-full flex flex-col min-h-screen">
            {activity?.afbeelding_id ? (
                <div className="relative h-[45vh] min-h-[400px] w-full overflow-hidden bg-(--bg-soft)">
                    <MediaAsset
                        asset={activity.afbeelding_id}
                        alt={activity.titel}
                        fill
                        priority
                        className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-(--bg-main) via-(--bg-main)/40 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 max-w-7xl mx-auto px-4 pb-12">
                        <div className="max-w-3xl space-y-4">
                            <span className="inline-block px-4 py-1.5 rounded-full bg-(--theme-purple) text-white text-[11px] font-black uppercase tracking-widest mb-4 shadow-xl border border-white/10">
                                {activity.committee_name || 'Algemene Activiteit'}
                            </span>
                            <h1 className="text-4xl md:text-7xl font-black text-text-main drop-shadow-sm tracking-tight leading-tight">
                                {activity.titel}
                            </h1>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="pt-20 pb-10 max-w-7xl mx-auto px-4">
                    <span className="inline-block px-4 py-1.5 rounded-full bg-(--theme-purple) text-white text-[11px] font-black uppercase tracking-widest mb-4 shadow-xl border border-white/10">
                        {activity?.committee_name || 'Algemene Activiteit'}
                    </span>
                    <h1 className="text-4xl md:text-7xl font-black text-text-main tracking-tight leading-tight">
                        {activity?.titel}
                    </h1>
                </div>
            )}

            <main className="w-full max-w-7xl mx-auto px-4 py-8 md:py-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                    <div className="order-1 lg:order-1 flex flex-col gap-6">
                        {children}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="squircle bg-(--bg-card) border border-(--border-color) p-6 shadow-lg shadow-(--theme-purple)/5 flex items-center gap-4 transition-all hover:border-(--theme-purple)/30 group">
                                <div className="h-14 w-14 squircle bg-(--theme-purple)/5 flex items-center justify-center text-(--theme-purple) group-hover:scale-110 transition-transform shrink-0">
                                    <CalendarClock className="h-7 w-7" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-[10px] uppercase font-black text-text-muted tracking-[0.2em] mb-1">Datum & Tijd</p>
                                    <p className="text-base font-bold text-(--text-main)">
                                        {displayDate}
                                    </p>
                                    {timeRange && (
                                        <p className="text-sm font-medium text-(--text-muted)">
                                            {timeRange}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {activity?.locatie && (
                                <div className="squircle bg-(--bg-card) border border-(--border-color) p-6 shadow-lg shadow-(--theme-purple)/5 flex items-center gap-4 transition-all hover:border-(--theme-purple)/30 group">
                                    <div className="h-14 w-14 squircle bg-(--theme-purple)/5 flex items-center justify-center text-(--theme-purple) group-hover:scale-110 transition-transform shrink-0">
                                        <MapPin className="h-7 w-7" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] uppercase font-black text-text-muted tracking-[0.2em] mb-1">Locatie</p>
                                        <p className="text-base font-bold text-(--text-main)">
                                            {activity.locatie}
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="squircle bg-(--bg-card) border border-(--border-color) p-6 shadow-lg shadow-(--theme-purple)/5 flex items-center gap-4 transition-all hover:border-(--theme-purple)/30 group">
                                <div className="h-14 w-14 squircle bg-(--theme-purple)/5 flex items-center justify-center text-(--theme-purple) group-hover:scale-110 transition-transform shrink-0">
                                    <User className="h-7 w-7" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-[10px] uppercase font-black text-text-muted tracking-[0.2em] mb-1">Organisatie</p>
                                    <p className="text-base font-bold text-(--text-main) truncate">
                                        {activity?.committee_name || 'Bestuur'}
                                    </p>
                                </div>
                            </div>

                            <div className="squircle bg-(--bg-card) border border-(--border-color) p-6 shadow-lg shadow-(--theme-purple)/5 flex items-center gap-4 transition-all hover:border-(--theme-purple)/30 group">
                                <div className="h-14 w-14 squircle bg-(--theme-purple)/5 flex items-center justify-center text-(--theme-purple) group-hover:scale-110 transition-transform shrink-0">
                                    <Mail className="h-7 w-7" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-[10px] uppercase font-black text-text-muted tracking-[0.2em] mb-1">Contact</p>
                                    {committeeEmail ? (
                                        <div className="text-sm font-bold text-(--theme-purple) truncate block">
                                            <ObfuscatedEmail email={committeeEmail} showIcon={false} />
                                        </div>
                                    ) : (
                                        <div className="text-sm font-bold text-(--theme-purple) truncate block">
                                            <ObfuscatedEmail email="bestuur@salvemundi.nl" showIcon={false} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="order-2 lg:order-2 h-full">
                        <div className="squircle-lg bg-(--bg-card) border border-(--border-color) p-8 shadow-xl shadow-(--theme-purple)/5 h-full">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="h-8 w-2 bg-(--theme-purple) rounded-full shadow-[0_0_15px_var(--theme-purple)]" />
                                <h2 className="text-2xl font-black text-(--theme-purple) uppercase tracking-widest">
                                    Over deze activiteit
                                </h2>
                            </div>
                            <div className="prose prose-purple max-w-none text-(--text-main) font-medium leading-relaxed">
                                <SafeMarkdown content={activity?.beschrijving || 'Geen beschrijving beschikbaar.'} />
                                {isLoggedIn && activity?.description_logged_in && (
                                    <>
                                        <hr className="my-8 border-(--border-color)/50" />
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="h-6 w-1.5 bg-amber-500 rounded-full shadow-[0_0_10px_theme(colors.amber.500)]" />
                                            <h3 className="text-xl font-black text-amber-500/90 uppercase tracking-widest">
                                                Extra Informatie (alleen ingelogd)
                                            </h3>
                                        </div>
                                        <SafeMarkdown content={activity.description_logged_in} />
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
