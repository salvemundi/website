'use client';

import { useState, useRef, useEffect, useId } from 'react';
import { 
    Calendar, 
    Download, 
    Check, 
    Copy, 
    X, 
    Sparkles, 
    ExternalLink,
    CalendarPlus
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { safeConsoleError } from '@/server/utils/logger';

interface CalendarExportButtonProps {
    feedPath?: string;
    calendarName?: string;
    calendarToken?: string | null;
    isLoggedIn?: boolean;
    label?: string;
    buttonClassName?: string;
}

export default function CalendarExportButton({ 
    feedPath = '/api/activiteiten/ics',
    calendarName,
    calendarToken, 
    isLoggedIn = false,
    label = 'Agenda koppelen',
    buttonClassName
}: CalendarExportButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const [googleCopied, setGoogleCopied] = useState(false);
    const [showGoogleInstructions, setShowGoogleInstructions] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const modalRef = useRef<HTMLDivElement>(null);
    const modalTitleId = useId();

    const resolvedCalendarName = calendarName || (isLoggedIn && calendarToken ? 'Salve Mundi Mijn Activiteiten' : 'Salve Mundi Activiteiten');

    useEffect(() => {
        setIsMobile(/Android|iPhone|iPad|iPod/i.test(navigator.userAgent));
    }, []);

    const getBaseFeedUrl = () => {
        if (typeof window === 'undefined') return '';
        const separator = feedPath.includes('?') ? '&' : '?';
        const path = calendarToken 
            ? `${feedPath}${separator}token=${encodeURIComponent(calendarToken)}` 
            : feedPath;
        return `${window.location.origin}${path}`;
    };

    const getWebcalUrl = () => {
        if (typeof window === 'undefined') return '';
        const separator = feedPath.includes('?') ? '&' : '?';
        const path = calendarToken 
            ? `${feedPath}${separator}token=${encodeURIComponent(calendarToken)}` 
            : feedPath;
        return `webcal://${window.location.host}${path}`;
    };

    const getDownloadUrl = () => {
        if (typeof window === 'undefined') return `${feedPath}?download=1`;
        const separator = feedPath.includes('?') ? '&' : '?';
        const tokenPart = calendarToken ? `token=${encodeURIComponent(calendarToken)}&` : '';
        return `${feedPath}${separator}${tokenPart}download=1`;
    };

    useEffect(() => {
        if (!isOpen) return;

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        }

        function handleClickOutside(event: MouseEvent) {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('mousedown', handleClickOutside);
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('mousedown', handleClickOutside);
            document.body.style.overflow = originalOverflow;
        };
    }, [isOpen]);

    const handleAppleCalendar = async () => {
        const webcalUrl = getWebcalUrl();
        try {
            await navigator.clipboard.writeText(webcalUrl);
        } catch {
        }
        window.location.href = webcalUrl;
        setIsOpen(false);
    };

    const handleGoogleCalendar = async () => {
        const feedUrl = getBaseFeedUrl();
        try {
            await navigator.clipboard.writeText(feedUrl);
            setGoogleCopied(true);
        } catch {
            setGoogleCopied(false);
        }
        if (!isMobile) {
            window.open('https://calendar.google.com/calendar/r/settings/addbyurl', '_blank', 'noopener,noreferrer');
        }
        setShowGoogleInstructions(true);
    };

    const handleCopyGoogleUrl = async () => {
        const feedUrl = getBaseFeedUrl();
        try {
            await navigator.clipboard.writeText(feedUrl);
            setGoogleCopied(true);
            setTimeout(() => setGoogleCopied(false), 2500);
        } catch (error: unknown) {
            safeConsoleError('[CalendarExportButton.tsx] Kon link niet kopiëren', error);
        }
    };

    const handleOutlookCalendar = () => {
        const feedUrl = getBaseFeedUrl();
        const calName = resolvedCalendarName;
        const url = `https://outlook.live.com/calendar/0/addfromweb?url=${encodeURIComponent(feedUrl)}&name=${encodeURIComponent(calName)}`;
        window.open(url, '_blank', 'noopener,noreferrer');
        setIsOpen(false);
    };

    const handleCopyGeneralFeed = async () => {
        const feedUrl = getBaseFeedUrl();
        try {
            await navigator.clipboard.writeText(feedUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        } catch (error: unknown) {
            safeConsoleError('[CalendarExportButton.tsx] Kon link niet kopiëren', error);
        }
    };

    return (
        <div className="relative inline-block text-left">
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className={buttonClassName || cn(
                    "tab-button group min-h-42px relative inline-flex items-center justify-center gap-2.5 rounded-xl border px-4 py-2.5 text-[10px] font-black tracking-widest uppercase transition-all active:scale-95 sm:px-6 sm:py-3",
                    "border-border-color/30 bg-bg-card text-theme-purple shadow-xs hover:border-theme-purple/30 hover:bg-theme-purple/5"
                )}
                aria-expanded={isOpen}
                aria-haspopup="dialog"
            >
                <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-theme-purple/10 text-theme-purple transition-colors group-hover:bg-theme-purple group-hover:text-white">
                    <Calendar className="size-3" />
                </div>
                <span>{label}</span>
            </button>

            {isOpen && (
                <div 
                    className="animate-in fade-in fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-xs duration-200 sm:items-center sm:p-4"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby={modalTitleId}
                >
                    <div 
                        ref={modalRef}
                        className={cn(
                            "w-full border border-border-color/40 bg-(--bg-card) shadow-2xl sm:max-w-lg dark:border-white/10",
                            "flex max-h-[90vh] flex-col space-y-5 overflow-y-auto overscroll-contain rounded-t-3xl p-5 sm:max-h-[85vh] sm:rounded-3xl sm:p-7",
                            "animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-2 duration-200"
                        )}
                    >
                        <div className="flex items-start justify-between gap-4 border-b border-border-color/20 pb-4">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <div className="flex size-8 shrink-0 items-center justify-center rounded-xl border border-purple-500/20 bg-purple-500/10 text-purple-700 dark:text-purple-300">
                                        <CalendarPlus className="size-4" />
                                    </div>
                                    <h3 id={modalTitleId} className="text-lg font-black text-purple-700 sm:text-xl dark:text-purple-300">
                                        Agenda Koppelen
                                    </h3>
                                </div>
                                <p className="text-xs leading-relaxed text-(--text-muted)">
                                    {isLoggedIn && calendarToken ? (
                                        <span className="flex flex-wrap items-center gap-1.5">
                                            <span>met jouw inschrijfstatus (🟢 ingeschreven / 🔴 niet ingeschreven).</span>
                                        </span>
                                    ) : (
                                        `Synchroniseer ${resolvedCalendarName.toLowerCase()} direct met jouw agenda.`
                                    )}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="icon-button flex size-8 shrink-0 items-center justify-center rounded-full bg-(--bg-main) text-(--text-muted) transition-colors hover:bg-border-color/40 hover:text-(--text-main) active:scale-95"
                                aria-label="Sluiten"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        {showGoogleInstructions && (
                            <div className="animate-in fade-in space-y-3 rounded-2xl border border-purple-500/30 bg-purple-500/5 p-4 duration-200 dark:bg-purple-500/10">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="space-y-1">
                                        <p className="flex items-center gap-1.5 text-xs font-bold text-purple-700 dark:text-purple-300">
                                            <Sparkles className="size-3.5 text-purple-500" />
                                            {isMobile ? 'Google Agenda (via browser of PC)' : 'Google Agenda geopend'}
                                        </p>
                                        <p className="text-xs leading-relaxed text-(--text-muted)">
                                            {isMobile ? (
                                                <>
                                                    De Google Agenda mobiele app ondersteunt internetagenda&apos;s (URL) helaas niet rechtstreeks.
                                                    Plak de link eenmalig op je computer in Google Agenda bij <strong className="text-(--text-main)">&quot;Andere agenda&apos;s &gt; Via URL&quot;</strong>.
                                                    De agenda synchroniseert daarna vanzelf naar je telefoon!
                                                </>
                                            ) : (
                                                googleCopied 
                                                    ? 'De link is gekopieerd! Plak deze in Google Agenda in het veld "Van URL" en klik op Toevoegen.' 
                                                    : 'Kopieer de link hieronder en plak deze in het veld "Van URL".'
                                            )}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setShowGoogleInstructions(false)}
                                        className="icon-button p-1 text-(--text-muted) hover:text-(--text-main)"
                                        aria-label="Verberg instructies"
                                    >
                                        <X className="size-3.5" />
                                    </button>
                                </div>

                                <div className="flex items-center gap-2">
                                    <code className="flex-1 truncate rounded-xl border border-border-color/30 bg-(--bg-card) px-2.5 py-1.5 font-mono text-[11px] text-(--text-muted)">
                                        {getBaseFeedUrl()}
                                    </code>
                                    <button
                                        type="button"
                                        onClick={() => { void handleCopyGoogleUrl(); }}
                                        className="form-button inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-purple-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-purple-700 active:scale-95"
                                    >
                                        {googleCopied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                                        <span>{googleCopied ? 'Gekopieerd' : 'Kopieer'}</span>
                                    </button>
                                </div>

                                {isMobile && (
                                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border-color/20 pt-2 text-[11px] text-(--text-muted)">
                                        <span>Tip: Direct op je mobiel? Gebruik de Apple/Systeem knop hieronder.</span>
                                        <a
                                            href="https://calendar.google.com/calendar/r/settings/addbyurl"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 font-bold text-purple-600 hover:underline dark:text-purple-400"
                                        >
                                            <span>Toch openen in browser</span>
                                            <ExternalLink className="size-3" />
                                        </a>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="space-y-2">
                            <p className="px-1 text-[10px] font-bold tracking-widest text-(--text-muted) uppercase">
                                Kies jouw agenda
                            </p>

                            <button
                                type="button"
                                onClick={() => { void handleGoogleCalendar(); }}
                                className="btn-calendar-google group active:scale-0.99 flex w-full items-center gap-3.5 rounded-2xl border border-border-color/30 bg-(--bg-card) p-3 text-left transition-all hover:border-purple-500/30 hover:bg-purple-500/5"
                            >
                                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-purple-500/10 bg-purple-500/10 text-purple-700 transition-transform group-hover:scale-105 dark:text-purple-300">
                                    <CalendarPlus className="size-5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-bold text-(--text-main) transition-colors group-hover:text-purple-700 dark:group-hover:text-purple-300">
                                        Google Calendar
                                    </p>
                                    <p className="truncate text-xs text-(--text-muted)">
                                        {isMobile ? 'Instellen via computer/browser' : 'Voor Google accounts'}
                                    </p>
                                </div>
                                <ExternalLink className="size-4 shrink-0 text-(--text-muted) transition-colors group-hover:text-purple-500" />
                            </button>

                            <button
                                type="button"
                                onClick={() => { void handleAppleCalendar(); }}
                                className="btn-calendar-apple group active:scale-0.99 flex w-full items-center gap-3.5 rounded-2xl border border-border-color/30 bg-(--bg-card) p-3 text-left transition-all hover:border-purple-500/30 hover:bg-purple-500/5"
                            >
                                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-purple-500/10 bg-purple-500/10 text-purple-700 transition-transform group-hover:scale-105 dark:text-purple-300">
                                    <Calendar className="size-5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-bold text-(--text-main) transition-colors group-hover:text-purple-700 dark:group-hover:text-purple-300">
                                        Apple & Systeemagenda
                                    </p>
                                    <p className="truncate text-xs text-(--text-muted)">
                                        Direct synchroniseren (iOS, macOS & Android webcal)
                                    </p>
                                </div>
                                <ExternalLink className="size-4 shrink-0 text-(--text-muted) transition-colors group-hover:text-purple-500" />
                            </button>

                            <button
                                type="button"
                                onClick={handleOutlookCalendar}
                                className="btn-calendar-outlook group active:scale-0.99 flex w-full items-center gap-3.5 rounded-2xl border border-border-color/30 bg-(--bg-card) p-3 text-left transition-all hover:border-purple-500/30 hover:bg-purple-500/5"
                            >
                                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-purple-500/10 bg-purple-500/10 text-purple-700 transition-transform group-hover:scale-105 dark:text-purple-300">
                                    <Calendar className="size-5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-bold text-(--text-main) transition-colors group-hover:text-purple-700 dark:group-hover:text-purple-300">
                                        Outlook / Office 365
                                    </p>
                                    <p className="truncate text-xs text-(--text-muted)">
                                        Toevoegen aan je Microsoft school- of werkagenda
                                    </p>
                                </div>
                                <ExternalLink className="size-4 shrink-0 text-(--text-muted) transition-colors group-hover:text-purple-500" />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 gap-2 border-t border-border-color/20 pt-2 sm:grid-cols-2">
                            <a
                                href={getDownloadUrl()}
                                download={`${resolvedCalendarName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}.ics`}
                                onClick={() => setIsOpen(false)}
                                className="form-button flex items-center justify-center gap-2 rounded-xl border border-border-color/30 bg-(--bg-main) p-3 text-xs font-bold text-(--text-main) transition-all hover:border-purple-500/30 hover:bg-purple-500/5 active:scale-95"
                            >
                                <Download className="size-4 text-purple-500" />
                                <span>Download .ics</span>
                            </a>

                            <button
                                type="button"
                                onClick={() => { void handleCopyGeneralFeed(); }}
                                className="form-button flex items-center justify-center gap-2 rounded-xl border border-border-color/30 bg-(--bg-main) p-3 text-xs font-bold text-(--text-main) transition-all hover:border-purple-500/30 hover:bg-purple-500/5 active:scale-95"
                            >
                                {copied ? <Check className="size-4 text-emerald-500" /> : <Copy className="size-4 text-purple-500" />}
                                <span>{copied ? 'Link gekopieerd!' : 'Kopieer URL'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
