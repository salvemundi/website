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
            event_date: activity?.event_date || '',
            event_date_end: activity?.event_date_end,
            event_time: activity?.event_time,
            event_time_end: activity?.event_time_end
        },
        'detail'
    );

    return (
        <div className="flex min-h-screen w-full flex-col">
            {activity?.afbeelding_id ? (
                <div className="relative h-[45vh] min-h-100 w-full overflow-hidden bg-bg-soft">
                    <MediaAsset
                        asset={activity.afbeelding_id}
                        alt={activity.name}
                        fill
                        priority
                        className="object-cover"
                    />
                    <div className="from-bg-main via-bg-main/40 absolute inset-0 bg-linear-to-t to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 mx-auto max-w-7xl px-4 pb-12">
                        <div className="max-w-3xl space-y-4">
                            <span className="mb-4 inline-block rounded-full border border-white/10 bg-theme-purple px-4 py-1.5 text-[11px] font-black tracking-widest text-white uppercase shadow-xl">
                                {activity.committee_name || 'Algemene Activiteit'}
                            </span>
                            <h1 className="text-4xl leading-tight font-black tracking-tight text-text-main drop-shadow-sm md:text-7xl">
                                {activity.name}
                            </h1>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="mx-auto max-w-7xl px-4 pt-20 pb-10">
                    <span className="mb-4 inline-block rounded-full border border-white/10 bg-theme-purple px-4 py-1.5 text-[11px] font-black tracking-widest text-white uppercase shadow-xl">
                        {activity?.committee_name || 'Algemene Activiteit'}
                    </span>
                    <h1 className="text-4xl leading-tight font-black tracking-tight text-text-main md:text-7xl">
                        {activity?.name}
                    </h1>
                </div>
            )}

            <main className="mx-auto w-full max-w-7xl px-4 py-8 md:py-12">
                <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-2">
                    <div className="order-1 flex flex-col gap-6 lg:order-1">
                        {children}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="squircle flex flex-col justify-center border border-border-color bg-bg-card p-5 shadow-lg shadow-theme-purple/5 transition-all hover:border-theme-purple/30">
                                <div className="mb-1.5 flex items-center gap-2">
                                    <CalendarClock className="size-4 text-theme-purple" />
                                    <p className="text-[10px] font-black tracking-[0.2em] text-text-muted uppercase">Datum & Tijd</p>
                                </div>
                                <p className="text-base leading-snug font-bold text-text-main">
                                    {displayDate}
                                </p>
                                {timeRange && (
                                    <p className="mt-0.5 text-sm font-semibold text-theme-purple">
                                        {timeRange}
                                    </p>
                                )}
                            </div>

                            {activity?.location && (
                                <div className="squircle flex flex-col justify-center border border-border-color bg-bg-card p-5 shadow-lg shadow-theme-purple/5 transition-all hover:border-theme-purple/30">
                                    <div className="mb-1.5 flex items-center gap-2">
                                        <MapPin className="size-4 text-theme-purple" />
                                        <p className="text-[10px] font-black tracking-[0.2em] text-text-muted uppercase">Locatie</p>
                                    </div>
                                    <p className="text-base leading-snug font-bold wrap-break-word text-text-main">
                                        {activity.location}
                                    </p>
                                </div>
                            )}

                            <div className="squircle flex flex-col justify-center border border-border-color bg-bg-card p-5 shadow-lg shadow-theme-purple/5 transition-all hover:border-theme-purple/30">
                                <div className="mb-1.5 flex items-center gap-2">
                                    <User className="size-4 text-theme-purple" />
                                    <p className="text-[10px] font-black tracking-[0.2em] text-text-muted uppercase">Organisatie</p>
                                </div>
                                <p className="text-base leading-snug font-bold wrap-break-word text-text-main">
                                    {activity?.committee_name || 'Bestuur'}
                                </p>
                            </div>

                            <div className="squircle flex flex-col justify-center border border-border-color bg-bg-card p-5 shadow-lg shadow-theme-purple/5 transition-all hover:border-theme-purple/30">
                                <div className="mb-1.5 flex items-center gap-2">
                                    <Mail className="size-4 text-theme-purple" />
                                    <p className="text-[10px] font-black tracking-[0.2em] text-text-muted uppercase">Contact</p>
                                </div>
                                <div className="text-sm leading-snug font-bold text-theme-purple">
                                    <ObfuscatedEmail email={committeeEmail || 'bestuur@salvemundi.nl'} showIcon={false} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="order-2 h-full lg:order-2">
                        <div className="squircle-lg h-full border border-border-color bg-bg-card p-8 shadow-xl shadow-theme-purple/5">
                            <div className="mb-8 flex items-center gap-3">
                                <div className="h-8 w-2 rounded-full bg-theme-purple shadow-[0_0_15px_var(--theme-purple)]" />
                                <h2 className="text-2xl font-black tracking-widest text-theme-purple uppercase">
                                    Over deze activiteit
                                </h2>
                            </div>
                            <div className="prose max-w-none leading-relaxed font-medium text-text-main prose-purple">
                                <SafeMarkdown content={activity?.description || 'Geen beschrijving beschikbaar.'} />
                                {isLoggedIn && activity?.description_logged_in && (
                                    <>
                                        <hr className="my-8 border-border-color/50" />
                                        <div className="mb-6 flex items-center gap-3">
                                            <div className="h-6 w-1.5 rounded-full bg-text-muted shadow-[0_0_10px_var(--color-text-muted)]" />
                                            <h3 className="text-xl font-black tracking-widest text-text-muted/90 uppercase">
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
