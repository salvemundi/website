import React from 'react';
import Image from 'next/image';
import { Calendar, MapPin, Clock, Info, User, Mail, Euro, CalendarClock } from 'lucide-react';
import SafeHtml from '@/components/ui/security/SafeHtml';
import { Activiteit } from '@salvemundi/validations';
import { buildCommitteeEmail, formatDutchDate, formatTime } from '@/shared/lib/activity-utils';
import { getImageUrl } from '@/shared/lib/api/salvemundi';

interface ActivityDetailIslandProps {
    activity: Activiteit;
    children?: React.ReactNode; // For EventSignupIsland
}

export default function ActivityDetailIsland({ activity, children }: ActivityDetailIslandProps) {
    const imageUrl = getImageUrl(activity.afbeelding_id) || '/img/backgrounds/Kroto2025.jpg';

    const committeeEmail = activity.contact?.includes('@') 
        ? activity.contact 
        : buildCommitteeEmail(activity.committee_name);

    const startTime = formatTime(activity.event_time);
    const endTime = formatTime(activity.event_time_end);
    const timeRange = startTime ? (endTime ? `${startTime} - ${endTime}` : startTime) : null;

    const displayPrice = () => {
        if (activity.price_members === 0 && activity.price_non_members === 0) return 'Gratis';
        if (activity.price_members === activity.price_non_members) return `€${activity.price_members?.toFixed(2)}`;
        return `Vanaf €${Math.min(activity.price_members || 0, activity.price_non_members || 0).toFixed(2)}`;
    };

    return (
        <div className="w-full flex flex-col min-h-screen bg-[var(--bg-main)]">
            {/* Hero Banner Area */}
            {activity.afbeelding_id ? (
                <div className="relative h-[45vh] min-h-[400px] w-full overflow-hidden">
                    <Image
                        src={imageUrl}
                        alt={activity.titel}
                        fill
                        priority
                        className="object-cover"
                        unoptimized
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-main)] via-[var(--bg-main)]/40 to-transparent" />
                    
                    <div className="absolute inset-x-0 bottom-0 max-w-7xl mx-auto px-4 pb-12">
                        <div className="max-w-3xl">
                            <span className="inline-block px-4 py-1.5 rounded-full bg-[var(--theme-purple)] text-white text-[11px] font-black uppercase tracking-widest mb-4 shadow-xl border border-white/10">
                                {activity.committee_name || 'Algemene Activiteit'}
                            </span>
                            <h1 className="text-4xl md:text-7xl font-black text-white dropshadow-sm tracking-tight leading-tight">
                                {activity.titel}
                            </h1>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="pt-20 pb-10 max-w-7xl mx-auto px-4">
                    <span className="inline-block px-4 py-1.5 rounded-full bg-[var(--theme-purple)] text-white text-[11px] font-black uppercase tracking-widest mb-4 shadow-xl border border-white/10">
                        {activity.committee_name || 'Algemene Activiteit'}
                    </span>
                    <h1 className="text-4xl md:text-7xl font-black text-[var(--theme-purple)] tracking-tight leading-tight">
                        {activity.titel}
                    </h1>
                </div>
            )}

            {/* Content Grid Area */}
            <main className="w-full max-w-7xl mx-auto px-4 py-8 md:py-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                    
                    {/* Left Column: Signup Island (Inject via children) */}
                    <div className="order-1 lg:order-1 h-full">
                        {children}
                    </div>

                    {/* Right Column: Info Tiles Grid */}
                    <div className="order-2 lg:order-2 grid grid-cols-1 sm:grid-cols-2 gap-4 h-full">
                        {/* Date & Time Tile */}
                        <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] p-6 shadow-lg shadow-[var(--theme-purple)]/5 flex items-center gap-4 transition-all hover:border-[var(--theme-purple)]/30 group sm:col-span-2">
                            <div className="h-14 w-14 rounded-2xl bg-[var(--theme-purple)]/5 flex items-center justify-center text-[var(--theme-purple)] group-hover:scale-110 transition-transform">
                                <CalendarClock className="h-7 w-7" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] uppercase font-black text-[var(--theme-purple)]/40 tracking-[0.2em] mb-1">Datum & Tijd</p>
                                <p className="text-base font-bold text-[var(--text-main)] truncate">{formatDutchDate(activity.datum_start)}</p>
                                {timeRange && (
                                    <p className="text-sm font-medium text-[var(--text-muted)]">{timeRange}</p>
                                )}
                            </div>
                        </div>


                        {/* Location Tile */}
                        {activity.locatie && (
                            <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] p-6 shadow-lg shadow-[var(--theme-purple)]/5 flex items-center gap-4 transition-all hover:border-[var(--theme-purple)]/30 group sm:col-span-2">
                                <div className="h-14 w-14 rounded-2xl bg-[var(--theme-purple)]/5 flex items-center justify-center text-[var(--theme-purple)] group-hover:scale-110 transition-transform">
                                    <MapPin className="h-7 w-7" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] uppercase font-black text-[var(--theme-purple)]/40 tracking-[0.2em] mb-1">Locatie</p>
                                    <p className="text-base font-bold text-[var(--text-main)]">{activity.locatie}</p>
                                </div>
                            </div>
                        )}

                        {/* Organization/Committee Tile */}
                        <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] p-6 shadow-lg shadow-[var(--theme-purple)]/5 flex items-center gap-4 transition-all hover:border-[var(--theme-purple)]/30 group">
                            <div className="h-14 w-14 rounded-2xl bg-[var(--theme-purple)]/5 flex items-center justify-center text-[var(--theme-purple)] group-hover:scale-110 transition-transform">
                                <User className="h-7 w-7" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] uppercase font-black text-[var(--theme-purple)]/40 tracking-[0.2em] mb-1">Organisatie</p>
                                <p className="text-base font-bold text-[var(--text-main)] truncate">{activity.committee_name || 'Bestuur'}</p>
                            </div>
                        </div>

                        {/* Contact/Support Tile */}
                        <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] p-6 shadow-lg shadow-[var(--theme-purple)]/5 flex items-center gap-4 transition-all hover:border-[var(--theme-purple)]/30 group">
                            <div className="h-14 w-14 rounded-2xl bg-[var(--theme-purple)]/5 flex items-center justify-center text-[var(--theme-purple)] group-hover:scale-110 transition-transform">
                                <Mail className="h-7 w-7" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] uppercase font-black text-[var(--theme-purple)]/40 tracking-[0.2em] mb-1">Contact</p>
                                {committeeEmail ? (
                                    <a href={`mailto:${committeeEmail}`} className="text-sm font-bold text-[var(--theme-purple)] hover:underline truncate block">
                                        {committeeEmail}
                                    </a>
                                ) : (
                                    <span className="text-sm font-bold text-[var(--text-muted)] italic">Via website</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Full Width Description Row */}
                    <div className="lg:col-span-2 order-3 pt-6">
                        <div className="rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] p-8 shadow-xl shadow-[var(--theme-purple)]/5">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="h-8 w-2 bg-[var(--theme-purple)] rounded-full shadow-[0_0_15px_var(--theme-purple)]" />
                                <h2 className="text-2xl font-black text-[var(--theme-purple)] uppercase tracking-widest">Over dit evenement</h2>
                            </div>
                            <div className="prose prose-purple max-w-none text-[var(--text-main)] font-medium leading-relaxed">
                                <SafeHtml html={activity.beschrijving || 'Geen beschrijving beschikbaar.'} />
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
