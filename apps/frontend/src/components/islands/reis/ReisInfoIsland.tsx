'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Calendar, Info, ShieldCheck, Mail, ExternalLink } from 'lucide-react';
import { getImageUrl } from '@/lib/utils/image-utils';
import type { ReisTrip } from '@salvemundi/validations/schema/reis.zod';
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
        safeConsoleError('[ReisInfoIsland][formatFullDate]', error);
        return 'Onbekend';
    }
};

export function ReisInfoIsland({ nextTrip }: ReisInfoIslandProps) {
    const [imageError, setImageError] = useState(false);

    const nextTripStartDate = nextTrip?.start_date ? new Date(nextTrip.start_date) : null;
    const nextTripEndDate = nextTrip?.end_date ? new Date(nextTrip.end_date) : null;

    const formattedFromDate = nextTripStartDate && !isNaN(nextTripStartDate.getTime())
        ? formatFullDate(nextTripStartDate)
        : null;

    const formattedUntilDate = nextTripEndDate && !isNaN(nextTripEndDate.getTime())
        ? formatFullDate(nextTripEndDate)
        : null;

    return (
        <div className="w-full lg:w-1/2 flex flex-col gap-8">
            {nextTrip && (
                <div className="bg-bg-card dark:border dark:border-white/10 rounded-3xl overflow-hidden shadow-2xl group relative">
                    {nextTrip.image ? (
                        <div className="relative w-full h-[300px] sm:h-[400px] overflow-hidden">
                            <Image
                                src={imageError ? '/img/placeholder.svg' : getImageUrl(nextTrip.image)}
                                alt={nextTrip.name}
                                fill
                                className="object-contain"
                                unoptimized
                                onError={() => setImageError(true)}
                            />
                        </div>
                    ) : (
                        <div />
                    )}

                    <div className="p-6 sm:p-8">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-theme-purple/10 flex items-center justify-center flex-shrink-0 border border-theme-purple/20">
                                    <Calendar className="h-7 w-7 text-theme-purple" />
                                </div>
                                <div>
                                    <p className="text-xl sm:text-2xl font-bold text-theme-purple mt-1">
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
                <div className="bg-bg-card dark:border dark:border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
                    <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-theme-purple/5 rounded-full blur-3xl" />
                    <div className="relative z-10">
                        <h3 className="text-xl sm:text-2xl font-bold text-theme-purple mb-6 flex items-center gap-3">
                            Over de Reis
                        </h3>
                        <SafeMarkdown
                            className="text-text-muted space-y-4 prose prose-sm sm:prose prose-purple dark:prose-invert max-w-none prose-p:leading-relaxed font-medium"
                            content={nextTrip.description}
                        />
                    </div>
                </div>
            )}

            <div className="bg-bg-card dark:border dark:border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <ShieldCheck className="h-32 w-32 text-theme-purple" />
                </div>
                <div className="relative z-10">
                    <h3 className="text-xl sm:text-2xl font-bold text-theme-purple mb-8 flex items-center gap-3">
                        Goed om te weten
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {[
                            { icon: <ShieldCheck className="h-5 w-5" />, title: 'Lidmaatschap', content: <>Je hoeft <strong>geen lid</strong> te zijn om mee te gaan.</> },
                            { icon: <Mail className="h-5 w-5" />, title: 'Bevestiging', content: <>Je krijgt direct een mail na je inschrijving.</> },
                            { icon: <Info className="h-5 w-5" />, title: 'Leeftijd', content: <>Minimumleeftijd voor deelname is 18 jaar.</> },
                            { icon: <ExternalLink className="h-5 w-5" />, title: 'Vragen?', content: <>Mail ons op <a href="mailto:reis@salvemundi.nl" className="text-theme-purple font-bold hover:underline">reis@salvemundi.nl</a></> },
                        ].map((item, i) => (
                            <div key={i} className="flex gap-4 group">
                                <div className="h-10 w-10 rounded-xl bg-theme-purple/5 text-theme-purple flex items-center justify-center flex-shrink-0 group-hover:bg-theme-purple/10 transition-colors border border-theme-purple/10">
                                    {item.icon}
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold tracking-widest text-text-muted">{item.title}</p>
                                    <div className="text-sm text-text-main font-medium leading-relaxed">
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