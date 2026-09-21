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
    calendarToken?: string | null;
    isLoggedIn?: boolean;
}

export default function CalendarExportButton({ 
    calendarToken, 
    isLoggedIn = false 
}: CalendarExportButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const [googleCopied, setGoogleCopied] = useState(false);
    const [showGoogleInstructions, setShowGoogleInstructions] = useState(false);
    const modalRef = useRef<HTMLDivElement>(null);
    const modalTitleId = useId();

    const getBaseFeedUrl = () => {
        if (typeof window === 'undefined') return '';
        const path = calendarToken 
            ? `/api/activiteiten/ics?token=${encodeURIComponent(calendarToken)}` 
            : '/api/activiteiten/ics';
        return `${window.location.origin}${path}`;
    };

    const getWebcalUrl = () => {
        if (typeof window === 'undefined') return '';
        const path = calendarToken 
            ? `/api/activiteiten/ics?token=${encodeURIComponent(calendarToken)}` 
            : '/api/activiteiten/ics';
        return `webcal://${window.location.host}${path}`;
    };

    const getDownloadUrl = () => {
        if (typeof window === 'undefined') return '/api/activiteiten/ics?download=1';
        const separator = calendarToken ? '&' : '?';
        const path = calendarToken 
            ? `/api/activiteiten/ics?token=${encodeURIComponent(calendarToken)}${separator}download=1` 
            : '/api/activiteiten/ics?download=1';
        return path;
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
        window.open('https://calendar.google.com/calendar/r/settings/addbyurl', '_blank', 'noopener,noreferrer');
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
        const calName = isLoggedIn ? 'Salve Mundi Mijn Activiteiten' : 'Salve Mundi Activiteiten';
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
                className={cn(
                    "tab-button group relative inline-flex items-center justify-center gap-2.5 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl border transition-all active:scale-95 text-[10px] font-black uppercase tracking-widest min-h-42px",
                    "bg-bg-card text-theme-purple border-border-color/30 hover:border-theme-purple/30 hover:bg-theme-purple/5 shadow-xs"
                )}
                aria-expanded={isOpen}
                aria-haspopup="dialog"
            >
                <div className="h-5 w-5 rounded-full flex items-center justify-center transition-colors shrink-0 bg-theme-purple/10 text-theme-purple group-hover:bg-theme-purple group-hover:text-white">
                    <Calendar className="h-3 w-3" />
                </div>
                <span>Agenda koppelen</span>
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
                                    {isLoggedIn ? (
                                        <span className="flex items-center gap-1.5 flex-wrap">
                                            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                                                <Sparkles className="h-3 w-3" /> Live gesynchroniseerd
                                            </span>
                                            <span>met jouw inschrijfstatus (🟢 ingeschreven / 🔴 niet ingeschreven).</span>
                                        </span>
                                    ) : (
                                        'Synchroniseer alle openbare activiteiten van Salve Mundi direct met jouw agenda.'
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
                            <div className="rounded-2xl border border-purple-500/30 bg-purple-500/5 dark:bg-purple-500/10 p-4 space-y-2.5 animate-in fade-in duration-200">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                                            <Sparkles className="h-3.5 w-3.5 text-purple-500" />
                                            Google Agenda geopend
                                        </p>
                                        <p className="text-xs text-(--text-muted) leading-relaxed">
                                            {googleCopied 
                                                ? 'De link is gekopieerd! Plak deze in Google Agenda in het veld "Van URL" en klik op Toevoegen.' 
                                                : 'Kopieer de link hieronder en plak deze in het veld "Van URL".'}
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
                                        Aanbevolen voor Android & Google accounts
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
                                        Apple Agenda
                                    </p>
                                    <p className="text-xs text-(--text-muted) truncate">
                                        Direct koppelen op iPhone, iPad & Mac
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
                                download="salve-mundi-activiteiten.ics"
                                onClick={() => setIsOpen(false)}
                                className="form-button flex items-center justify-center gap-2 p-3 rounded-xl border border-border-color/30 bg-(--bg-main) hover:bg-purple-500/5 hover:border-purple-500/30 transition-all text-xs font-bold text-(--text-main) active:scale-95"
                            >
                                <Download className="h-4 w-4 text-purple-500" />
                                <span>Download .ics</span>
                            </a>

                            {/* Copy URL */}
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
