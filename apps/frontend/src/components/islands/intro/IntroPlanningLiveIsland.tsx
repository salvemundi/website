'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Clock, MapPin, Download, Rss, Check, Calendar, PartyPopper, ImageOff, X, ZoomIn, Sunrise } from 'lucide-react';
import type { IntroPlanningItem } from '@salvemundi/validations/schema/intro.zod';
import { toLocalISOString } from '@/lib/utils/date-utils';
import { formatDate } from '@/shared/lib/utils/date';

const TOMORROW_OVERVIEW_HOUR = 22;

interface Props {
    planning: IntroPlanningItem[];
    planningImageUrl: string | null;
}

function nowKey(): string {
    return toLocalISOString(new Date(), true) || '';
}

function startKey(item: IntroPlanningItem): string {
    const t = item.time_start.length === 5 ? `${item.time_start}:00` : item.time_start;
    return `${item.date}T${t}`;
}

function endKey(item: IntroPlanningItem): string | null {
    if (!item.time_end) return null;
    const t = item.time_end.length === 5 ? `${item.time_end}:00` : item.time_end;
    return `${item.date}T${t}`;
}

function formatTimeRange(item: IntroPlanningItem): string {
    const start = item.time_start.slice(0, 5);
    if (!item.time_end) return start;
    return `${start} - ${item.time_end.slice(0, 5)}`;
}

// Minimal inline formatting for activity descriptions: **bold**, __underline__,
// *italic*, and line breaks. Built as plain React nodes (never innerHTML) so
// there's no HTML-injection surface even though the text comes from admins.
const INLINE_FORMAT_PATTERN = /(\*\*.+?\*\*|__.+?__|\*.+?\*)/g;

function renderInlineFormatting(line: string): React.ReactNode[] {
    return line.split(INLINE_FORMAT_PATTERN).filter(part => part !== '').map((part, idx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={idx}>{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('__') && part.endsWith('__')) {
            return <u key={idx}>{part.slice(2, -2)}</u>;
        }
        if (part.startsWith('*') && part.endsWith('*')) {
            return <em key={idx}>{part.slice(1, -1)}</em>;
        }
        return part;
    });
}

function FormattedText({ text }: { text: string }) {
    const lines = text.split('\n');
    return (
        <>
            {lines.map((line, idx) => (
                <Fragment key={idx}>
                    {idx > 0 && <br />}
                    {renderInlineFormatting(line)}
                </Fragment>
            ))}
        </>
    );
}

function addDays(dateStr: string, days: number): string {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    dt.setUTCDate(dt.getUTCDate() + days);
    return dt.toISOString().slice(0, 10);
}

function ActivityCard({
    label,
    item,
    accent,
    icon: Icon
}: {
    label: string;
    item: IntroPlanningItem | null;
    accent: 'live' | 'next';
    icon: React.ComponentType<{ className?: string }>;
}) {
    return (
        <div
            className={[
                'squircle-lg p-5 sm:p-6 border shadow-lg',
                accent === 'live'
                    ? 'bg-gradient-to-br from-purple-600 to-purple-800 border-purple-500/40 text-white'
                    : 'bg-bg-card border-border-color dark:border-white/10'
            ].join(' ')}
        >
            <div className="flex items-center gap-2">
                <span className={`flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider ${accent === 'live' ? 'text-white/80' : 'text-purple-500'}`}>
                    {accent === 'live' && <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white/70" /><span className="relative inline-flex rounded-full h-2 w-2 bg-white" /></span>}
                    {label}
                </span>
            </div>

            {item ? (
                <div className="mt-3">
                    <h3 className={`text-xl sm:text-2xl font-black leading-tight ${accent === 'live' ? 'text-white' : 'text-text-main'}`}>{item.title}</h3>
                    <div className={`mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm font-semibold ${accent === 'live' ? 'text-white/90' : 'text-text-muted'}`}>
                        <span className="flex items-center gap-1.5"><Clock className="h-4 w-4 shrink-0" />{formatTimeRange(item)}</span>
                        {item.location && <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 shrink-0" />{item.location}</span>}
                    </div>
                    {item.description && (
                        <p className={`mt-3 text-sm leading-relaxed ${accent === 'live' ? 'text-white/80' : 'text-text-muted'}`}><FormattedText text={item.description} /></p>
                    )}
                </div>
            ) : (
                <div className={`mt-3 flex items-center gap-2 text-sm font-semibold ${accent === 'live' ? 'text-white/80' : 'text-text-muted'}`}>
                    <Icon className="h-4 w-4" />
                    {accent === 'live' ? 'Er is nu geen activiteit bezig' : 'De introweek zit erop, tot volgend jaar!'}
                </div>
            )}
        </div>
    );
}

export default function IntroPlanningLiveIsland({ planning, planningImageUrl }: Props) {
    const searchParams = useSearchParams();
    const previewTomorrow = searchParams.get('previewTomorrow') === '1';

    const [now, setNow] = useState('');
    const [copied, setCopied] = useState(false);
    const [lightboxOpen, setLightboxOpen] = useState(false);

    useEffect(() => {
        setNow(nowKey());
        const id = setInterval(() => setNow(nowKey()), 30000);
        return () => clearInterval(id);
    }, []);

    useEffect(() => {
        if (!lightboxOpen) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setLightboxOpen(false);
        };
        document.addEventListener('keydown', onKeyDown);
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKeyDown);
            document.body.style.overflow = previousOverflow;
        };
    }, [lightboxOpen]);

    const sorted = useMemo(
        () => [...planning].sort((a, b) => startKey(a).localeCompare(startKey(b))),
        [planning]
    );

    const current = useMemo(() => {
        if (!now) return null;
        const started = sorted.filter(item => startKey(item) <= now);
        const candidate = started.length > 0 ? started[started.length - 1] : null;
        if (!candidate) return null;
        const end = endKey(candidate);
        if (end && end < now) return null;
        return candidate;
    }, [sorted, now]);

    const next = useMemo(() => {
        if (!now) return null;
        return sorted.find(item => startKey(item) > now) || null;
    }, [sorted, now]);

    const showTomorrowOverview = useMemo(() => {
        if (previewTomorrow) return true;
        if (!now) return false;
        return Number(now.slice(11, 13)) >= TOMORROW_OVERVIEW_HOUR;
    }, [now, previewTomorrow]);

    const tomorrowItems = useMemo(() => {
        // In preview mode "today" (the real date) is likely outside the intro week,
        // so there's nothing at real-tomorrow to show — fall back to the schedule's
        // first day so the preview actually renders something.
        if (previewTomorrow) {
            const firstDate = sorted[0]?.date;
            return firstDate ? sorted.filter(item => item.date === firstDate) : [];
        }
        if (!now) return [];
        const tomorrowDate = addDays(now.slice(0, 10), 1);
        return sorted.filter(item => item.date === tomorrowDate);
    }, [sorted, now, previewTomorrow]);

    const handleSubscribe = async () => {
        const webcalUrl = `webcal://${window.location.host}/api/intro/planning.ics`;
        try {
            await navigator.clipboard.writeText(webcalUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        } catch {
            // clipboard not available, fall through to direct navigation
        }
        window.location.href = webcalUrl;
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ActivityCard label="Nu bezig" item={current} accent="live" icon={PartyPopper} />
                <ActivityCard label="Volgende activiteit" item={next} accent="next" icon={Calendar} />
            </div>

            {showTomorrowOverview && tomorrowItems.length > 0 && (
                <div className="squircle-lg bg-bg-card border border-border-color dark:border-white/10 shadow-lg p-5 sm:p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="h-10 w-10 squircle bg-purple-600 flex items-center justify-center shrink-0">
                            <Sunrise className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl sm:text-2xl font-black text-theme-purple leading-tight">Planning voor morgen</h2>
                            <p className="text-sm text-text-muted font-medium capitalize">{formatDate(tomorrowItems[0].date, 'EEEE d MMMM')}</p>
                        </div>
                    </div>

                    <div>
                        {tomorrowItems.map((item, idx) => {
                            const isLast = idx === tomorrowItems.length - 1;
                            const isCurrentOrNext = current?.id === item.id || next?.id === item.id;
                            return (
                                <div key={item.id} className="grid grid-cols-[3.25rem_auto] sm:grid-cols-[4rem_auto] gap-x-3 sm:gap-x-4">
                                    <div className={`relative text-right pr-3 sm:pr-4 border-r-2 ${isCurrentOrNext ? 'border-purple-500' : 'border-border-color dark:border-white/10'}`}>
                                        <span className={`text-xs sm:text-sm font-black leading-tight ${isCurrentOrNext ? 'text-purple-500' : 'text-text-main'}`}>
                                            {item.time_start.slice(0, 5)}
                                        </span>
                                        <span
                                            className={`absolute top-1 -right-[7px] h-3 w-3 rounded-full ring-4 ring-bg-card ${isCurrentOrNext ? 'bg-purple-500' : 'bg-border-color dark:bg-white/20'}`}
                                        />
                                    </div>
                                    <div className={isLast ? 'pb-1' : 'pb-6'}>
                                        <p className="font-bold text-text-main leading-snug">{item.title}</p>
                                        {item.time_end && (
                                            <p className="mt-0.5 text-xs font-semibold text-text-muted">tot {item.time_end.slice(0, 5)}</p>
                                        )}
                                        {item.location && (
                                            <p className="mt-1.5 text-xs font-semibold text-text-muted flex items-center gap-1"><MapPin className="h-3.5 w-3.5 shrink-0" />{item.location}</p>
                                        )}
                                        {item.description && (
                                            <p className="mt-1.5 text-sm text-text-muted leading-relaxed"><FormattedText text={item.description} /></p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className="squircle-lg bg-bg-card border border-border-color dark:border-white/10 shadow-lg p-5 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <h2 className="text-xl sm:text-2xl font-black text-theme-purple">Volledige planning</h2>
                    <div className="flex gap-2">
                        <a
                            href="/api/intro/planning.ics?download=1"
                            className="inline-flex items-center justify-center gap-1.5 sm:gap-2 squircle bg-purple-600 text-white px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-semibold shadow-md hover:shadow-lg hover:scale-[1.02] transition-all"
                        >
                            <Download className="h-4 w-4 shrink-0" />
                            <span className="whitespace-nowrap">Download .ics</span>
                        </a>
                        <button
                            type="button"
                            onClick={() => { void handleSubscribe(); }}
                            className="btn-subscribe inline-flex items-center justify-center gap-1.5 sm:gap-2 squircle bg-bg-main border border-border-color dark:border-white/10 text-text-main px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-semibold shadow-sm hover:shadow-md transition-all"
                        >
                            {copied ? <Check className="h-4 w-4 text-emerald-500 shrink-0" /> : <Rss className="h-4 w-4 shrink-0" />}
                            <span className="whitespace-nowrap">
                                <span className="sm:hidden">{copied ? 'Gekopieerd' : 'Abonneren'}</span>
                                <span className="hidden sm:inline">{copied ? 'Link gekopieerd' : 'Abonneer op agenda'}</span>
                            </span>
                        </button>
                    </div>
                </div>

                {planningImageUrl ? (
                    <button
                        type="button"
                        onClick={() => setLightboxOpen(true)}
                        className="btn-open-lightbox group relative block -mx-9 sm:mx-0 sm:squircle overflow-hidden border-0 sm:border border-border-color dark:border-white/10 cursor-zoom-in"
                    >
                        <Image
                            src={planningImageUrl}
                            alt="Planning introweek"
                            width={1600}
                            height={2000}
                            unoptimized
                            className="w-full h-auto"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                            <span className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-2 squircle bg-black/60 text-white px-4 py-2.5 text-sm font-semibold">
                                <ZoomIn className="h-4 w-4" />
                                Bekijk fullscreen
                            </span>
                        </div>
                    </button>
                ) : (
                    <div className="squircle bg-bg-main/50 border border-dashed border-border-color p-10 text-center">
                        <ImageOff className="h-8 w-8 text-purple-500 mx-auto mb-4" />
                        <p className="text-lg font-bold text-text-main opacity-60">De planning wordt binnenkort bekendgemaakt</p>
                    </div>
                )}
            </div>

            {lightboxOpen && planningImageUrl && (
                <div
                    className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4 sm:p-8 cursor-zoom-out"
                    onClick={() => setLightboxOpen(false)}
                >
                    <button
                        type="button"
                        onClick={() => setLightboxOpen(false)}
                        aria-label="Sluiten"
                        className="btn-close-lightbox absolute top-4 right-4 sm:top-6 sm:right-6 squircle bg-white/10 hover:bg-white/20 text-white p-2.5 transition-colors"
                    >
                        <X className="h-6 w-6" />
                    </button>
                    <Image
                        src={planningImageUrl}
                        alt="Planning introweek"
                        width={1600}
                        height={2000}
                        unoptimized
                        onClick={(e) => e.stopPropagation()}
                        className="max-w-full max-h-full w-auto h-auto object-contain cursor-default"
                    />
                </div>
            )}
        </div>
    );
}
