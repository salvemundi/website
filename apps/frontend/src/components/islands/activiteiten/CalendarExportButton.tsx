'use client';

import { useState, useRef, useEffect } from 'react';
import { Calendar, Download, ExternalLink, Check } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { safeConsoleError } from '@/server/utils/logger';

export default function CalendarExportButton() {
    const [isOpen, setIsOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleWebCal = () => {
        if (typeof window === 'undefined') return;
        const webcalUrl = window.location.origin.replace(/^https?:\/\//, 'webcal://') + '/api/activiteiten/ics';
        window.location.href = webcalUrl;
        setIsOpen(false);
    };

    const handleCopyFeed = () => {
        if (typeof window === 'undefined') return;
        const feedUrl = `${window.location.origin}/api/activiteiten/ics`;
        navigator.clipboard.writeText(feedUrl).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }).catch((error: unknown) => {
            safeConsoleError('[CalendarExportButton.tsx][CalendarExportButton] Kon agendalink niet kopiëren naar klembord', error);
        });
    };

    return (
        <div className="relative inline-block text-left" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "tab-button inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold transition-all active:scale-95",
                    "bg-(--bg-card) text-purple-700 dark:text-purple-300 border-purple-500/20 hover:border-purple-500/40 hover:bg-purple-500/5"
                )}
                aria-expanded={isOpen}
            >
                <Calendar className="h-4 w-4 text-purple-500 dark:text-purple-400" />
                <span>Agenda koppelen</span>
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-(--bg-card) border border-purple-500/20 shadow-xl z-50 p-2 space-y-1">
                    <div className="px-3 py-2 border-b border-purple-500/10 text-[10px] font-bold uppercase tracking-wider text-(--text-muted)">
                        Koppel met telefoons
                    </div>
                    
                    <button
                        type="button"
                        onClick={handleWebCal}
                        className="tab-button w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-(--text-main) hover:bg-purple-500/10 transition-colors text-left"
                    >
                        <div className="h-7 w-7 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                            <ExternalLink className="h-3.5 w-3.5" />
                        </div>
                        <div>
                            <p className="font-bold">Live Synchroniseren</p>
                            <p className="text-[10px] text-(--text-muted)">Apple, Google & Outlook Agenda</p>
                        </div>
                    </button>

                    <a
                        href="/api/activiteiten/ics?download=1"
                        onClick={() => setIsOpen(false)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-(--text-main) hover:bg-purple-500/10 transition-colors text-left"
                    >
                        <div className="h-7 w-7 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                            <Download className="h-3.5 w-3.5" />
                        </div>
                        <div>
                            <p className="font-bold">Download .ics bestand</p>
                            <p className="text-[10px] text-(--text-muted)">Eenmalig importeren</p>
                        </div>
                    </a>

                    <button
                        type="button"
                        onClick={handleCopyFeed}
                        className="tab-button w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-(--text-main) hover:bg-purple-500/10 transition-colors text-left border-t border-purple-500/10 mt-1"
                    >
                        <div className="h-7 w-7 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                            {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Calendar className="h-3.5 w-3.5" />}
                        </div>
                        <div>
                            <p className="font-bold">{copied ? 'Link gekopieerd!' : 'Kopieer Agenda URL'}</p>
                            <p className="text-[10px] text-(--text-muted)">Handmatig toevoegen via URL</p>
                        </div>
                    </button>
                </div>
            )}
        </div>
    );
}
