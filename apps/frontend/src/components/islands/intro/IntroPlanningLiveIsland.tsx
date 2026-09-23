'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Clock, MapPin, Calendar, CalendarDays, ChevronDown, PartyPopper, ImageOff, X, ZoomIn, Sunrise } from 'lucide-react';
import type { IntroPlanningItem } from '@salvemundi/validations/schema/intro.zod';
import { toLocalISOString } from '@/lib/utils/date-utils';
import { formatDate } from '@/shared/lib/utils/date';
import CalendarExportButton from '@/components/islands/activiteiten/CalendarExportButton';

const TOMORROW_OVERVIEW_HOUR = 22;

// Desktop week-calendar grid layout constants.
const HOUR_HEIGHT = 64; // px per hour row
const PX_PER_MINUTE = HOUR_HEIGHT / 60;
const DEFAULT_DURATION_MINUTES = 45; // fallback block size for items without an end time
const MIN_ITEM_HEIGHT = 30;

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

function toMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
}

interface DayLayoutItem {
    item: IntroPlanningItem;
    top: number;
    height: number;
    col: number;
    cols: number;
}

// Greedy interval-graph column packing (the standard calendar-week layout
// algorithm): items are placed in the first column whose previous item has
// already ended, so overlapping items fan out side by side instead of stacking.
function layoutDay(items: IntroPlanningItem[], startHour: number): DayLayoutItem[] {
    const withTimes = items
        .map(item => {
            const start = toMinutes(item.time_start);
            const rawEnd = item.time_end ? toMinutes(item.time_end) : start + DEFAULT_DURATION_MINUTES;
            return { item, start, end: Math.max(rawEnd, start + 15) };
        })
        .sort((a, b) => a.start - b.start);

    const columnEnds: number[] = [];
    const placed = withTimes.map(({ item, start, end }) => {
        let col = columnEnds.findIndex(colEnd => colEnd <= start);
        if (col === -1) {
            col = columnEnds.length;
            columnEnds.push(end);
        } else {
            columnEnds.splice(col, 1, end);
        }
        return { item, start, end, col };
    });

    const cols = Math.max(1, columnEnds.length);
    return placed.map(({ item, start, end, col }) => ({
        item,
        top: (start - startHour * 60) * PX_PER_MINUTE,
        height: Math.max((end - start) * PX_PER_MINUTE, MIN_ITEM_HEIGHT),
        col,
        cols
    }));
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
                    ? 'bg-linear-to-br from-purple-600 to-purple-800 border-purple-500/40 text-white'
                    : 'bg-bg-card border-border-color dark:border-white/10'
            ].join(' ')}
        >
            <div className="flex items-center gap-2">
                <span className={`flex items-center gap-1.5 text-[11px] font-black tracking-wider uppercase ${accent === 'live' ? 'text-white/80' : 'text-purple-500'}`}>
                    {accent === 'live' && <span className="relative flex size-2"><span className="absolute inline-flex size-full animate-ping rounded-full bg-white/70" /><span className="relative inline-flex size-2 rounded-full bg-white" /></span>}
                    {label}
                </span>
            </div>

            {item ? (
                <div className="mt-3">
                    <h3 className={`text-xl leading-tight font-black sm:text-2xl ${accent === 'live' ? 'text-white' : 'text-text-main'}`}>{item.title}</h3>
                    <div className={`mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm font-semibold ${accent === 'live' ? 'text-white/90' : 'text-text-muted'}`}>
                        <span className="flex items-center gap-1.5"><Clock className="size-4 shrink-0" />{formatTimeRange(item)}</span>
                        {item.location && <span className="flex items-center gap-1.5"><MapPin className="size-4 shrink-0" />{item.location}</span>}
                    </div>
                    {item.description && (
                        <p className={`mt-3 text-sm leading-relaxed ${accent === 'live' ? 'text-white/80' : 'text-text-muted'}`}><FormattedText text={item.description} /></p>
                    )}
                </div>
            ) : (
                <div className={`mt-3 flex items-center gap-2 text-sm font-semibold ${accent === 'live' ? 'text-white/80' : 'text-text-muted'}`}>
                    <Icon className="size-4" />
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
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [fullPlanningOpen, setFullPlanningOpen] = useState(false);
    const [selectedDay, setSelectedDay] = useState<string | null>(null);
    const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
    const [selectedGridItemId, setSelectedGridItemId] = useState<number | null>(null);

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

    useEffect(() => {
        if (!fullPlanningOpen) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setFullPlanningOpen(false);
        };
        document.addEventListener('keydown', onKeyDown);
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKeyDown);
            document.body.style.overflow = previousOverflow;
        };
    }, [fullPlanningOpen]);

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

    // `sorted` is already ordered by date+time, so a plain Map preserves
    // chronological day order as it's built without a separate sort step.
    const planningByDate = useMemo(() => {
        const map = new Map<string, IntroPlanningItem[]>();
        for (const item of sorted) {
            const list = map.get(item.date);
            if (list) list.push(item);
            else map.set(item.date, [item]);
        }
        return map;
    }, [sorted]);

    const planningDates = useMemo(() => Array.from(planningByDate.keys()), [planningByDate]);

    // Shared hour axis for the desktop week-calendar grid, so every day
    // column and the time gutter line up on the same hour rows.
    const { startHour, endHour } = useMemo(() => {
        if (sorted.length === 0) return { startHour: 8, endHour: 22 };
        let minStart = Infinity;
        let maxEnd = -Infinity;
        for (const item of sorted) {
            const start = toMinutes(item.time_start);
            const end = item.time_end ? toMinutes(item.time_end) : start + DEFAULT_DURATION_MINUTES;
            if (start < minStart) minStart = start;
            if (end > maxEnd) maxEnd = end;
        }
        return { startHour: Math.floor(minStart / 60), endHour: Math.ceil(maxEnd / 60) };
    }, [sorted]);

    const hours = useMemo(
        () => Array.from({ length: Math.max(endHour - startHour, 1) + 1 }, (_, i) => startHour + i),
        [startHour, endHour]
    );

    const totalHeight = Math.max(endHour - startHour, 1) * HOUR_HEIGHT;

    const selectedGridItem = useMemo(
        () => sorted.find(item => item.id === selectedGridItemId) || null,
        [sorted, selectedGridItemId]
    );

    const openFullPlanning = () => {
        const today = now.slice(0, 10);
        setSelectedDay(prev =>
            prev && planningDates.includes(prev) ? prev : (planningDates.find(d => d >= today) || planningDates[0] || null)
        );
        setSelectedGridItemId(null);
        setFullPlanningOpen(true);
    };

    const toggleExpanded = (id: number) => {
        setExpandedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <ActivityCard label="Nu bezig" item={current} accent="live" icon={PartyPopper} />
                <ActivityCard label="Volgende activiteit" item={next} accent="next" icon={Calendar} />
            </div>

            {showTomorrowOverview && tomorrowItems.length > 0 && (
                <div className="squircle-lg border border-border-color bg-bg-card p-5 shadow-lg sm:p-8 dark:border-white/10">
                    <div className="mb-6 flex items-center gap-3">
                        <div className="squircle flex size-10 shrink-0 items-center justify-center bg-purple-600">
                            <Sunrise className="size-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl leading-tight font-black text-theme-purple sm:text-2xl">Planning voor morgen</h2>
                            <p className="text-sm font-medium text-text-muted capitalize">{formatDate(tomorrowItems[0].date, 'EEEE d MMMM')}</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {tomorrowItems.map(item => {
                            const isCurrentOrNext = current?.id === item.id || next?.id === item.id;
                            return (
                                <div
                                    key={item.id}
                                    className={`squircle border px-3.5 py-3 ${
                                        isCurrentOrNext
                                            ? 'border-purple-500/30 bg-purple-500/10'
                                            : 'bg-bg-main/60 border-border-color dark:border-white/10'
                                    }`}
                                >
                                    <span className={`inline-flex items-center gap-1.5 text-xs font-black tracking-wide uppercase ${isCurrentOrNext ? 'text-purple-500' : 'text-text-muted'}`}>
                                        <Clock className="size-3.5 shrink-0" />
                                        {formatTimeRange(item)}
                                    </span>
                                    <p className="mt-1.5 leading-snug font-bold text-text-main">{item.title}</p>
                                    {item.location && (
                                        <p className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-text-muted"><MapPin className="size-3.5 shrink-0" />{item.location}</p>
                                    )}
                                    {item.description && (
                                        <p className="mt-1.5 text-sm leading-relaxed text-text-muted"><FormattedText text={item.description} /></p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className="squircle-lg border border-border-color bg-bg-card p-5 shadow-lg sm:p-8 dark:border-white/10">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-xl font-black text-theme-purple sm:text-2xl">Volledige planning</h2>
                    <div className="flex flex-wrap gap-2">
                        {planning.length > 0 && (
                            <button
                                type="button"
                                onClick={openFullPlanning}
                                className="btn-open-timeline squircle hover:scale-1.02 inline-flex items-center justify-center gap-1.5 bg-purple-600 px-3 py-2.5 text-xs font-semibold text-white shadow-md transition-all hover:shadow-lg sm:gap-2 sm:px-4 sm:text-sm"
                            >
                                <CalendarDays className="size-4 shrink-0" />
                                <span className="whitespace-nowrap">Bekijk tijdlijn</span>
                            </button>
                        )}
                        <CalendarExportButton
                            feedPath="/api/intro/planning.ics"
                            calendarName="Salve Mundi Introductie"
                            label="Abonneer op agenda"
                            buttonClassName="btn-subscribe inline-flex items-center justify-center gap-1.5 sm:gap-2 squircle bg-bg-main border border-border-color dark:border-white/10 text-text-main px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-semibold shadow-sm hover:shadow-md transition-all cursor-pointer"
                        />
                    </div>
                </div>

                {planningImageUrl ? (
                    <button
                        type="button"
                        onClick={() => setLightboxOpen(true)}
                        className="btn-open-lightbox group sm:squircle relative -mx-9 block cursor-zoom-in overflow-hidden border-0 border-border-color sm:mx-0 sm:border dark:border-white/10"
                    >
                        <Image
                            src={planningImageUrl}
                            alt="Planning introweek"
                            width={1600}
                            height={2000}
                            unoptimized
                            className="h-auto w-full"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/30">
                            <span className="squircle inline-flex items-center gap-2 bg-black/60 px-4 py-2.5 text-sm font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">
                                <ZoomIn className="size-4" />
                                Bekijk fullscreen
                            </span>
                        </div>
                    </button>
                ) : (
                    <div className="squircle bg-bg-main/50 border border-dashed border-border-color p-10 text-center">
                        <ImageOff className="mx-auto mb-4 size-8 text-purple-500" />
                        <p className="text-lg font-bold text-text-main opacity-60">De planning wordt binnenkort bekendgemaakt</p>
                    </div>
                )}
            </div>

            {fullPlanningOpen && (
                <div
                    className="fixed inset-0 z-200 flex items-end justify-center bg-black/70 sm:items-center"
                    onClick={() => setFullPlanningOpen(false)}
                >
                    <div
                        className="sm:squircle-lg relative flex max-h-[90vh] w-full flex-col overflow-hidden rounded-t-3xl bg-bg-card shadow-2xl sm:max-h-[85vh] sm:max-w-2xl lg:max-w-5xl xl:max-w-6xl"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-border-color px-5 py-4 sm:px-6 dark:border-white/10">
                            <h2 className="text-lg font-black text-theme-purple sm:text-xl">Volledige planning</h2>
                            <button
                                type="button"
                                onClick={() => setFullPlanningOpen(false)}
                                aria-label="Sluiten"
                                className="btn-close-timeline squircle bg-bg-main shrink-0 p-2.5 text-text-main transition-colors hover:bg-border-color/40"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        {planningDates.length > 1 && (
                            <div className="flex shrink-0 items-center gap-2 overflow-x-auto border-b border-border-color px-4 py-3 sm:hidden sm:px-6 dark:border-white/10">
                                {planningDates.map(date => {
                                    const isToday = date === now.slice(0, 10);
                                    const isSelected = date === selectedDay;
                                    return (
                                        <button
                                            key={date}
                                            type="button"
                                            onClick={() => setSelectedDay(date)}
                                            className={`tab-button squircle shrink-0 px-3.5 py-2 text-xs font-bold whitespace-nowrap capitalize transition-all sm:text-sm ${
                                                isSelected
                                                    ? 'bg-purple-600 text-white shadow-md'
                                                    : 'bg-bg-main border border-border-color text-text-muted hover:text-text-main dark:border-white/10'
                                            }`}
                                        >
                                            {formatDate(date, 'EEE d MMM')}
                                            {isToday && (
                                                <span className={`ml-1.5 inline-block size-1.5 rounded-full align-middle ${isSelected ? 'bg-white' : 'bg-purple-500'}`} />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5 sm:hidden sm:px-6">
                            {selectedDay ? (
                                <>
                                    <p className="mb-4 text-sm font-bold text-text-muted capitalize">
                                        {formatDate(selectedDay, 'EEEE d MMMM')}
                                    </p>
                                    <div className="space-y-2.5">
                                        {(planningByDate.get(selectedDay) || []).map(item => {
                                            const isCurrentOrNext = current?.id === item.id || next?.id === item.id;
                                            const hasDescription = Boolean(item.description);
                                            const isExpanded = hasDescription && expandedIds.has(item.id);
                                            return (
                                                <button
                                                    key={item.id}
                                                    type="button"
                                                    onClick={() => hasDescription && toggleExpanded(item.id)}
                                                    aria-expanded={hasDescription ? isExpanded : undefined}
                                                    className={`btn-timeline-item squircle w-full border px-3.5 py-3 text-left transition-colors ${
                                                        isCurrentOrNext
                                                            ? 'border-purple-500/30 bg-purple-500/10'
                                                            : 'bg-bg-main/60 border-border-color dark:border-white/10'
                                                    } ${hasDescription ? 'hover:bg-bg-main active:bg-bg-main cursor-pointer' : 'cursor-default'}`}
                                                >
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="min-w-0">
                                                            <span className={`inline-flex items-center gap-1.5 text-xs font-black tracking-wide uppercase ${isCurrentOrNext ? 'text-purple-500' : 'text-text-muted'}`}>
                                                                <Clock className="size-3.5 shrink-0" />
                                                                {formatTimeRange(item)}
                                                            </span>
                                                            <p className="mt-1.5 leading-snug font-bold text-text-main">{item.title}</p>
                                                            {item.location && (
                                                                <p className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-text-muted"><MapPin className="size-3.5 shrink-0" />{item.location}</p>
                                                            )}
                                                        </div>
                                                        {hasDescription && (
                                                            <ChevronDown className={`mt-1 size-4 shrink-0 text-text-muted transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                                        )}
                                                    </div>
                                                    {item.description && (
                                                        <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${isExpanded ? 'mt-2 grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                                                            <div className="overflow-hidden">
                                                                <p className="text-sm leading-relaxed text-text-muted"><FormattedText text={item.description} /></p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </>
                            ) : (
                                <p className="py-10 text-center text-sm text-text-muted">Geen planning beschikbaar.</p>
                            )}
                        </div>

                        {/* Desktop: full week as a calendar grid — every day side by side on a shared hour axis. */}
                        <div className="hidden min-h-0 flex-1 overflow-auto overscroll-contain sm:block">
                            {planningDates.length > 0 ? (
                                <>
                                    <div className="sticky top-0 z-10 flex border-b border-border-color bg-bg-card dark:border-white/10">
                                        <div className="w-14 shrink-0" />
                                        {planningDates.map(date => {
                                            const isToday = date === now.slice(0, 10);
                                            return (
                                                <div
                                                    key={date}
                                                    className="min-w-36 flex-1 border-l border-border-color px-2 py-2.5 text-center dark:border-white/10"
                                                >
                                                    <p className={`text-[11px] font-black tracking-wide uppercase ${isToday ? 'text-purple-500' : 'text-text-muted'}`}>
                                                        {formatDate(date, 'EEE')}
                                                    </p>
                                                    <p className={`text-sm font-black capitalize ${isToday ? 'text-purple-500' : 'text-text-main'}`}>
                                                        {formatDate(date, 'd MMM')}
                                                    </p>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="flex p-4 sm:px-6">
                                        <div className="relative w-14 shrink-0" style={{ height: totalHeight }}>
                                            {hours.map(hour => (
                                                <span
                                                    key={hour}
                                                    className="absolute right-2 -translate-y-1/2 text-[11px] font-semibold text-text-muted"
                                                    style={{ top: (hour - startHour) * HOUR_HEIGHT }}
                                                >
                                                    {String(hour).padStart(2, '0')}:00
                                                </span>
                                            ))}
                                        </div>

                                        {planningDates.map(date => {
                                            const dayLayout = layoutDay(planningByDate.get(date) || [], startHour);
                                            return (
                                                <div
                                                    key={date}
                                                    className="relative min-w-36 flex-1 border-l border-border-color px-1 dark:border-white/10"
                                                    style={{ height: totalHeight }}
                                                >
                                                    {hours.map(hour => (
                                                        <div
                                                            key={hour}
                                                            className="absolute inset-x-0 border-t border-border-color/60 dark:border-white/5"
                                                            style={{ top: (hour - startHour) * HOUR_HEIGHT }}
                                                        />
                                                    ))}
                                                    {dayLayout.map(({ item, top, height, col, cols }) => {
                                                        const isCurrentOrNext = current?.id === item.id || next?.id === item.id;
                                                        const isSelected = selectedGridItemId === item.id;
                                                        return (
                                                            <button
                                                                key={item.id}
                                                                type="button"
                                                                onClick={() => setSelectedGridItemId(prev => (prev === item.id ? null : item.id))}
                                                                className={`btn-grid-item absolute cursor-pointer overflow-hidden rounded-lg border border-l-4 py-1 pr-1.5 pl-2 text-left shadow-sm transition-shadow hover:shadow-md hover:brightness-110 ${
                                                                    isSelected ? 'z-10 ring-2 ring-purple-400' : ''
                                                                } ${
                                                                    isCurrentOrNext
                                                                        ? 'border-purple-500 border-l-purple-200 bg-purple-600 text-white shadow-md'
                                                                        : 'border-border-color border-l-purple-500 bg-bg-card text-text-main dark:border-white/10'
                                                                }`}
                                                                style={{
                                                                    // 2px inset on top/bottom leaves a visible gap between
                                                                    // back-to-back items instead of their borders touching.
                                                                    top: top + 2,
                                                                    height: Math.max(height - 4, 24),
                                                                    left: `${(col / cols) * 100}%`,
                                                                    width: `calc(${100 / cols}% - 3px)`
                                                                }}
                                                                title={`${formatTimeRange(item)} — ${item.title}`}
                                                            >
                                                                <p className={`text-[10px] leading-tight font-black ${isCurrentOrNext ? 'text-white/80' : 'text-purple-500'}`}>
                                                                    {item.time_start.slice(0, 5)}
                                                                </p>
                                                                <p className="line-clamp-2 text-[11px] leading-snug font-bold">{item.title}</p>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </>
                            ) : (
                                <p className="py-10 text-center text-sm text-text-muted">Geen planning beschikbaar.</p>
                            )}
                        </div>

                        {selectedGridItem && (
                            <div className="hidden shrink-0 items-start gap-3 border-t border-border-color bg-bg-card px-5 py-4 sm:flex sm:px-6 dark:border-white/10">
                                <div className="min-w-0 flex-1">
                                    <span className="inline-flex items-center gap-1.5 text-xs font-black tracking-wide text-purple-500 uppercase">
                                        <Clock className="size-3.5 shrink-0" />
                                        {formatTimeRange(selectedGridItem)}
                                    </span>
                                    <h3 className="mt-1 text-base leading-snug font-black text-text-main sm:text-lg">{selectedGridItem.title}</h3>
                                    {selectedGridItem.location && (
                                        <p className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-text-muted"><MapPin className="size-3.5 shrink-0" />{selectedGridItem.location}</p>
                                    )}
                                    {selectedGridItem.description && (
                                        <p className="mt-1.5 text-sm leading-relaxed text-text-muted"><FormattedText text={selectedGridItem.description} /></p>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setSelectedGridItemId(null)}
                                    aria-label="Sluiten"
                                    className="btn-close-grid-item squircle bg-bg-main shrink-0 p-2 text-text-main transition-colors hover:bg-border-color/40"
                                >
                                    <X className="size-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {lightboxOpen && planningImageUrl && (
                <div
                    className="fixed inset-0 z-200 flex cursor-zoom-out items-center justify-center bg-black/90 p-4 sm:p-8"
                    onClick={() => setLightboxOpen(false)}
                >
                    <button
                        type="button"
                        onClick={() => setLightboxOpen(false)}
                        aria-label="Sluiten"
                        className="btn-close-lightbox squircle absolute top-4 right-4 bg-white/10 p-2.5 text-white transition-colors hover:bg-white/20 sm:top-6 sm:right-6"
                    >
                        <X className="size-6" />
                    </button>
                    <Image
                        src={planningImageUrl}
                        alt="Planning introweek"
                        width={1600}
                        height={2000}
                        unoptimized
                        onClick={(e) => e.stopPropagation()}
                        className="size-auto max-h-full max-w-full cursor-default object-contain"
                    />
                </div>
            )}
        </div>
    );
}
