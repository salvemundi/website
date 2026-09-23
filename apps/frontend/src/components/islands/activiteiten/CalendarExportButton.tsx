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
                    "tab-button group relative inline-flex items-center justify-center gap-2.5 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl border transition-all active:scale-95 text-[10px] font-black uppercase tracking-widest min-h-42px",
                    "bg-bg-card text-theme-purple border-border-color/30 hover:border-theme-purple/30 hover:bg-theme-purple/5 shadow-xs"
                )}
                aria-expanded={isOpen}
                aria-haspopup="dialog"
            >
                <div className="h-5 w-5 rounded-full flex items-center justify-center transition-colors shrink-0 bg-theme-purple/10 text-theme-purple group-hover:bg-theme-purple group-hover:text-white">
                    <Calendar className="h-3 w-3" />
                </div>
                <span>{label}</span>
            </button>

            {isOpen && (
                <div 
                    className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby={modalTitleId}
                >
                    <div 
                        ref={modalRef}
                        className={cn(
                            "w-full sm:max-w-lg bg-(--bg-card) border border-border-color/40 dark:border-white/10 shadow-2xl",
                            "rounded-t-3xl sm:rounded-3xl max-h-[90vh] sm:max-h-[85vh] overflow-y-auto overscroll-contain flex flex-col p-5 sm:p-7 space-y-5",
                            "animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-2 duration-200"
                        )}
                    >
                        <div className="flex items-start justify-between gap-4 border-b border-border-color/20 pb-4">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <div className="h-8 w-8 rounded-xl bg-purple-500/10 text-purple-700 dark:text-purple-300 flex items-center justify-center shrink-0 border border-purple-500/20">
                                        <CalendarPlus className="h-4 w-4" />
                                    </div>
                                    <h3 id={modalTitleId} className="text-lg sm:text-xl font-black text-purple-700 dark:text-purple-300">
                                        Agenda Koppelen
                                    </h3>
                                </div>
                                <p className="text-xs text-(--text-muted) leading-relaxed">
                                    {isLoggedIn && calendarToken ? (
                                        <span className="flex items-center gap-1.5 flex-wrap">
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
                                className="icon-button h-8 w-8 rounded-full bg-(--bg-main) hover:bg-border-color/40 text-(--text-muted) hover:text-(--text-main) flex items-center justify-center transition-colors shrink-0 active:scale-95"
                                aria-label="Sluiten"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {showGoogleInstructions && (
                            <div className="rounded-2xl border border-purple-500/30 bg-purple-500/5 dark:bg-purple-500/10 p-4 space-y-3 animate-in fade-in duration-200">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                                            <Sparkles className="h-3.5 w-3.5 text-purple-500" />
                                            {isMobile ? 'Google Agenda (via browser of PC)' : 'Google Agenda geopend'}
                                        </p>
                                        <p className="text-xs text-(--text-muted) leading-relaxed">
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
                                        className="icon-button text-(--text-muted) hover:text-(--text-main) p-1"
                                        aria-label="Verberg instructies"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                </div>

                                <div className="flex items-center gap-2">
                                    <code className="flex-1 rounded-xl bg-(--bg-card) border border-border-color/30 px-2.5 py-1.5 text-[11px] text-(--text-muted) truncate font-mono">
                                        {getBaseFeedUrl()}
                                    </code>
                                    <button
                                        type="button"
                                        onClick={() => { void handleCopyGoogleUrl(); }}
                                        className="form-button inline-flex items-center gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 text-xs font-bold transition-all active:scale-95 shrink-0 shadow-xs"
                                    >
                                        {googleCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                                        <span>{googleCopied ? 'Gekopieerd' : 'Kopieer'}</span>
                                    </button>
                                </div>

                                {isMobile && (
                                    <div className="pt-2 border-t border-border-color/20 flex flex-wrap items-center justify-between gap-2 text-[11px] text-(--text-muted)">
                                        <span>Tip: Direct op je mobiel? Gebruik de Apple/Systeem knop hieronder.</span>
                                        <a
                                            href="https://calendar.google.com/calendar/r/settings/addbyurl"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-purple-600 dark:text-purple-400 font-bold hover:underline inline-flex items-center gap-1"
                                        >
                                            <span>Toch openen in browser</span>
                                            <ExternalLink className="h-3 w-3" />
                                        </a>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="space-y-2">
                            <p className="text-[10px] font-bold tracking-widest uppercase text-(--text-muted) px-1">
                                Kies jouw agenda
                            </p>

                            <button
                                type="button"
                                onClick={() => { void handleGoogleCalendar(); }}
                                className="btn-calendar-google w-full flex items-center gap-3.5 p-3 rounded-2xl border border-border-color/30 bg-(--bg-card) hover:bg-purple-500/5 hover:border-purple-500/30 transition-all text-left group active:scale-[0.99]"
                            >
                                <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-700 dark:text-purple-300 flex items-center justify-center shrink-0 border border-purple-500/10 group-hover:scale-105 transition-transform">
                                    <CalendarPlus className="h-5 w-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-(--text-main) group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">
                                        Google Calendar
                                    </p>
                                    <p className="text-xs text-(--text-muted) truncate">
                                        {isMobile ? 'Instellen via computer/browser' : 'Voor Google accounts'}
                                    </p>
                                </div>
                                <ExternalLink className="h-4 w-4 text-(--text-muted) group-hover:text-purple-500 transition-colors shrink-0" />
                            </button>

                            <button
                                type="button"
                                onClick={() => { void handleAppleCalendar(); }}
                                className="btn-calendar-apple w-full flex items-center gap-3.5 p-3 rounded-2xl border border-border-color/30 bg-(--bg-card) hover:bg-purple-500/5 hover:border-purple-500/30 transition-all text-left group active:scale-[0.99]"
                            >
                                <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-700 dark:text-purple-300 flex items-center justify-center shrink-0 border border-purple-500/10 group-hover:scale-105 transition-transform">
                                    <Calendar className="h-5 w-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-(--text-main) group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">
                                        Apple & Systeemagenda
                                    </p>
                                    <p className="text-xs text-(--text-muted) truncate">
                                        Direct synchroniseren (iOS, macOS & Android webcal)
                                    </p>
                                </div>
                                <ExternalLink className="h-4 w-4 text-(--text-muted) group-hover:text-purple-500 transition-colors shrink-0" />
                            </button>

                            <button
                                type="button"
                                onClick={handleOutlookCalendar}
                                className="btn-calendar-outlook w-full flex items-center gap-3.5 p-3 rounded-2xl border border-border-color/30 bg-(--bg-card) hover:bg-purple-500/5 hover:border-purple-500/30 transition-all text-left group active:scale-[0.99]"
                            >
                                <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-700 dark:text-purple-300 flex items-center justify-center shrink-0 border border-purple-500/10 group-hover:scale-105 transition-transform">
                                    <Calendar className="h-5 w-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-(--text-main) group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">
                                        Outlook / Office 365
                                    </p>
                                    <p className="text-xs text-(--text-muted) truncate">
                                        Toevoegen aan je Microsoft school- of werkagenda
                                    </p>
                                </div>
                                <ExternalLink className="h-4 w-4 text-(--text-muted) group-hover:text-purple-500 transition-colors shrink-0" />
                            </button>
                        </div>

                        <div className="pt-2 border-t border-border-color/20 grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <a
                                href={getDownloadUrl()}
                                download={`${resolvedCalendarName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}.ics`}
                                onClick={() => setIsOpen(false)}
                                className="form-button flex items-center justify-center gap-2 p-3 rounded-xl border border-border-color/30 bg-(--bg-main) hover:bg-purple-500/5 hover:border-purple-500/30 transition-all text-xs font-bold text-(--text-main) active:scale-95"
                            >
                                <Download className="h-4 w-4 text-purple-500" />
                                <span>Download .ics</span>
                            </a>

                            <button
                                type="button"
                                onClick={() => { void handleCopyGeneralFeed(); }}
                                className="form-button flex items-center justify-center gap-2 p-3 rounded-xl border border-border-color/30 bg-(--bg-main) hover:bg-purple-500/5 hover:border-purple-500/30 transition-all text-xs font-bold text-(--text-main) active:scale-95"
                            >
                                {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4 text-purple-500" />}
                                <span>{copied ? 'Link gekopieerd!' : 'Kopieer URL'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
