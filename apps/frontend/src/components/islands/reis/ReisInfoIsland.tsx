'use client';

import { Calendar, Info, ShieldCheck, Mail, ExternalLink } from 'lucide-react';
import MediaAsset from '@/components/ui/media/MediaAsset';
import type { ReisTrip } from '@salvemundi/validations/schema/trip.zod';
import { SafeMarkdown } from '@/components/ui/security/SafeMarkdown';
import { safeConsoleError } from '@/server/utils/logger';

interface ReisInfoIslandProps {
    nextTrip: ReisTrip | null;
}

const formatFullDate = (d: Date) => {
    try {
        return new Intl.DateTimeFormat('nl-NL', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }).format(d);
    } catch (error) {
        safeConsoleError('[ReisInfoIsland.tsx][formatFullDate] ', error);
        return 'Onbekend';
    }
};

export function ReisInfoIsland({ nextTrip }: ReisInfoIslandProps) {

    const nextTripStartDate = nextTrip?.start_date ? new Date(nextTrip.start_date) : null;
    const nextTripEndDate = nextTrip?.end_date ? new Date(nextTrip.end_date) : null;

    const formattedFromDate = nextTripStartDate && !isNaN(nextTripStartDate.getTime())
        ? formatFullDate(nextTripStartDate)
        : null;

    const formattedUntilDate = nextTripEndDate && !isNaN(nextTripEndDate.getTime())
        ? formatFullDate(nextTripEndDate)
        : null;

    return (
        <div className="flex w-full flex-col gap-8 lg:w-1/2">
            {nextTrip && (
                <div className="group relative overflow-hidden rounded-3xl bg-bg-card shadow-2xl dark:border dark:border-white/10">
                    {nextTrip.image ? (
                        <div className="relative h-75 w-full overflow-hidden sm:h-100">
                            <MediaAsset
                                asset={nextTrip.image}
                                alt={nextTrip.name ?? 'Reis'}
                                fill
                                objectFit="contain"
                            />
                        </div>
                    ) : (
                        <div />
                    )}

                    <div className="p-6 sm:p-8">
                        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
                            <div className="flex items-center gap-4">
                                <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-theme-purple/20 bg-theme-purple/10">
                                    <Calendar className="size-7 text-theme-purple" />
                                </div>
                                <div>
                                    <p className="mt-1 text-xl font-bold text-theme-purple sm:text-2xl">
                                        {formattedFromDate && formattedUntilDate ? (
                                            formattedFromDate === formattedUntilDate ? formattedFromDate : `${formattedFromDate} – ${formattedUntilDate}`
                                        ) : (
                                            'Wordt aangekondigd'
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {nextTrip?.description && (
                <div className="relative overflow-hidden rounded-3xl bg-bg-card p-6 shadow-2xl sm:p-10 dark:border dark:border-white/10">
                    <div className="absolute -bottom-12 -left-12 size-32 rounded-full bg-theme-purple/5 blur-3xl" />
                    <div className="relative z-10">
                        <h3 className="mb-6 flex items-center gap-3 text-xl font-bold text-theme-purple sm:text-2xl">
                            Over de Reis
                        </h3>
                        <SafeMarkdown
                            className="prose prose-sm max-w-none space-y-4 font-medium text-text-muted prose-purple sm:prose dark:prose-invert prose-p:leading-relaxed"
                            content={nextTrip.description}
                        />
                    </div>
                </div>
            )}

            <div className="relative overflow-hidden rounded-3xl bg-bg-card p-6 shadow-2xl sm:p-10 dark:border dark:border-white/10">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <ShieldCheck className="size-32 text-theme-purple" />
                </div>
                <div className="relative z-10">
                    <h3 className="mb-8 flex items-center gap-3 text-xl font-bold text-theme-purple sm:text-2xl">
                        Goed om te weten
                    </h3>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        {[
                            { icon: <ShieldCheck className="size-5" />, title: 'Lidmaatschap', content: <>Je hoeft <strong>geen lid</strong> te zijn om mee te gaan.</> },
                            { icon: <Mail className="size-5" />, title: 'Bevestiging', content: <>Je krijgt direct een mail na je inschrijving.</> },
                            { icon: <Info className="size-5" />, title: 'Leeftijd', content: <>Minimumleeftijd voor deelname is 18 jaar.</> },
                            { icon: <ExternalLink className="size-5" />, title: 'Vragen?', content: <>Mail ons op <a href="mailto:reis@salvemundi.nl" className="font-bold text-theme-purple hover:underline">reis@salvemundi.nl</a></> },
                        ].map((item, i) => (
                            <div key={i} className="group flex gap-4">
                                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-theme-purple/10 bg-theme-purple/5 text-theme-purple transition-colors group-hover:bg-theme-purple/10">
                                    {item.icon}
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold tracking-widest text-text-muted">{item.title}</p>
                                    <div className="text-sm leading-relaxed font-medium text-text-main">
                                        {item.content}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}