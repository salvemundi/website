"use client";

import { useMemo, useState, useEffect } from 'react';
import { Chrono } from 'react-chrono';
import BoardImage from './BoardImage';
import { GraduationCap } from 'lucide-react';

type TimelineProps = {
    boards: any[];
};

export default function Timeline({ boards: rawBoards }: TimelineProps) {
    const boards = Array.isArray(rawBoards) ? rawBoards : [];
    if (boards.length === 0) return null;

    // Sort by year descending (newest to oldest).
    // Boards may have year as a range string like '2017-2018', so extract the
    // leading 4-digit year for sorting while keeping the original title display.
    const sortedBoards = useMemo(() => {
        const extractYear = (v: any) => {
            if (v == null) return 0;
            if (typeof v === 'number') return Number(v) || 0;
            if (typeof v === 'string') {
                // Try to find the first 4-digit year in the string
                const m = v.match(/(\d{4})/);
                if (m) return Number(m[1]);
                const n = Number(v);
                return isNaN(n) ? 0 : n;
            }
            return 0;
        };

        return [...boards].sort((a, b) => {
            const yaRaw = a?.year ?? a?.jaar ?? a?.id ?? 0;
            const ybRaw = b?.year ?? b?.jaar ?? b?.id ?? 0;
            const ya = extractYear(yaRaw);
            const yb = extractYear(ybRaw);

            // Primary: year descending
            if (yb !== ya) return Number(yb) - Number(ya);

            // Secondary: when years are equal, sort by numeric part of name (largest number first)
            const nameA = String(a?.naam ?? a?.name ?? '').trim();
            const nameB = String(b?.naam ?? b?.name ?? '').trim();

            const extractNumber = (s: string) => {
                if (!s) return -1;
                const matches = s.match(/(\d+)/g);
                if (!matches) return -1;
                // take the last numeric group (e.g. "Bestuur 2019-2" -> 2)
                const n = parseInt(matches[matches.length - 1], 10);
                return isNaN(n) ? -1 : n;
            };

            const na = extractNumber(nameA);
            const nb = extractNumber(nameB);

            if (nb !== na) return nb - na;

            // Fallback: purely lexicographic descending by name
            const aLower = nameA.toLowerCase();
            const bLower = nameB.toLowerCase();
            if (bLower > aLower) return 1;
            if (bLower < aLower) return -1;
            return 0;
        });
    }, [boards]);

    // Transform data for react-chrono
    const items = useMemo(() => {
        return sortedBoards.map((board) => ({
            title: String(board.year ?? board.jaar ?? '—'),
            cardTitle: (board.naam || '').toUpperCase(),
            cardSubtitle: board.omschrijving || undefined,
            cardDetailedText: board.members?.length ? `${board.members.length} bestuursleden` : undefined,
        }));
    }, [sortedBoards]);

    // Detect dark mode
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        const checkDarkMode = () => {
            setIsDarkMode(document.documentElement.classList.contains('dark'));
        };

        checkDarkMode();

        const observer = new MutationObserver(checkDarkMode);
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class'],
        });

        return () => observer.disconnect();
    }, []);

    // Theme configuration based on mode
    const chronoTheme = useMemo(() => ({
        primary: 'var(--theme-purple)',
        secondary: isDarkMode ? 'var(--bg-main)' : 'var(--bg-soft)',
        cardBgColor: 'var(--bg-card)',
        cardForeColor: 'var(--text-main)',
        titleColor: isDarkMode ? '#ffffff' : 'var(--theme-purple)',
        titleColorActive: 'var(--theme-purple)',
        cardTitleColor: 'var(--theme-purple)',
        cardSubtitleColor: 'var(--text-muted)',
        cardDetailsColor: 'var(--text-main)',
    }), [isDarkMode]);

    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div className="w-full [&_.chrono-toolbar-wrapper]:!hidden [&_.SelecterLabel]:!hidden [&_.timeline-card-content]:!max-h-none [&_.timeline-card-content]:!overflow-visible [&_.card-content-wrapper]:!max-h-none [&_.card-content-wrapper]:!overflow-visible [&_.card-description]:!line-clamp-none dark:[&_.timeline-card-content]:bg-[var(--bg-card)] dark:[&_.timeline-card-content]:!text-white dark:[&_.card-title]:!text-white dark:[&_.card-subtitle]:!text-white dark:[&_.card-description]:!text-white dark:[&_.title]:!text-white dark:[&_.timeline-card-title]:!text-white dark:[&_.timeline-title]:!text-white">
            <Chrono
                items={items}
                mode={isMobile ? "VERTICAL" : "VERTICAL_ALTERNATING"}
                slideShow={false}
                scrollable={true}
                theme={chronoTheme}
                hideControls={true}
                enableOutline={false}
                //@ts-expect-error Chrono types
                disableAutoScrollOnClick={true}
                cardpositionhorizontal="TOP"
                mediaHeight={200}
                fontSizes={{
                    cardSubtitle: '0.875rem',
                    cardTitle: '1.25rem',
                    title: '1.125rem',
                }}
            >
                {sortedBoards.map((board, index) => (
                    <div key={board.id || `board-${index}`} className="p-6 space-y-6 rounded-3xl bg-[var(--bg-card)] shadow-lg dark:border dark:border-white/5 overflow-visible" data-testid={`timeline-item-${index}`}>
                        {/* Board image */}
                        {board.image && (
                            <div className="group relative w-full overflow-hidden rounded-2xl bg-[var(--bg-main)] shadow-inner flex items-center justify-center p-4">
                                <BoardImage
                                    src={board.computedImageUrl || '/img/group-jump.gif'}
                                    alt={board.naam}
                                    className="w-full h-auto"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                            </div>
                        )}

                        {/* Board description */}
                        {board.omschrijving && (
                            <div className="text-[var(--text-main)] text-sm leading-relaxed border-l-4 border-theme-purple pl-4 italic">
                                <p>{board.omschrijving}</p>
                            </div>
                        )}

                        {/* Members */}
                        {Array.isArray(board.members) && board.members.length > 0 && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-sm font-bold text-theme-purple uppercase tracking-wider">
                                    <GraduationCap className="h-5 w-5" />
                                    <span>Bestuursleden ({board.members.length})</span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {board.members.map((member: any) => {
                                        const fullName = member.computedFullName || 'Onbekend';

                                        return (
                                            <div
                                                key={member.id ?? `${board.id}-${Math.random()}`}
                                                className="flex flex-col rounded-2xl bg-[var(--bg-main)] border border-[var(--border-color)] p-4 shadow-sm hover:shadow-md transition-all hover:border-theme-purple"
                                            >
                                                <p className="font-bold text-[var(--text-main)] text-sm whitespace-normal break-words">
                                                    {fullName}
                                                </p>
                                                {member.functie && (
                                                    <p className="text-[10px] uppercase font-black text-theme-purple whitespace-normal break-words mt-1">{member.functie}</p>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </Chrono>
        </div>
    );
}
