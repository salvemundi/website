"use client";

import { useMemo, useState, useEffect } from 'react';
import { Chrono } from 'react-chrono';
import { Users } from 'lucide-react';

type TimelineProps = {
    boards: any[];
    getImageUrl?: (id: any, options?: { quality?: number; width?: number; height?: number; format?: string }) => string;
    getMemberFullName?: (m: any) => string;
};

export default function Timeline({ boards, getImageUrl, getMemberFullName }: TimelineProps) {
    if (!boards || boards.length === 0) return null;

    // Sort by year descending (newest to oldest)
    const sortedBoards = useMemo(() => {
        return [...boards].sort((a, b) => {
            const ya = a?.year ?? a?.jaar ?? a?.id ?? 0;
            const yb = b?.year ?? b?.jaar ?? b?.id ?? 0;
            return Number(yb) - Number(ya);
        });
    }, [boards]);

    // Transform data for react-chrono
    const items = useMemo(() => {
        return sortedBoards.map((board) => ({
            title: String(board.year ?? board.jaar ?? '—'),
            cardTitle: board.naam,
            cardSubtitle: board.omschrijving || undefined,
            cardDetailedText: board.members?.length ? `${board.members.length} bestuursleden` : undefined,
        }));
    }, [sortedBoards]);

    // Detect dark mode
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        // Check initial dark mode state
        const checkDarkMode = () => {
            setIsDarkMode(document.documentElement.classList.contains('dark'));
        };

        checkDarkMode();

        // Watch for theme changes
        const observer = new MutationObserver(checkDarkMode);
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class'],
        });

        return () => observer.disconnect();
    }, []);

    // Theme configuration based on mode
    const chronoTheme = useMemo(() => ({
        primary: '#663265',
        // keep secondary subtle; use card variable for actual card background
        secondary: isDarkMode ? '#1a141b' : '#f8f9fa',
        // use CSS variable so cards match site's card background in both themes
        cardBgColor: 'var(--bg-card)',
        // title colors should adapt to theme so they're readable on the card
        titleColor: isDarkMode ? '#ffffff' : '#663265',
        titleColorActive: '#ff6b35',
        cardTitleColor: isDarkMode ? '#ffffff' : '#1a141b',
        cardSubtitleColor: isDarkMode ? 'rgba(255,255,255,0.7)' : '#64748b',
        cardDetailsColor: isDarkMode ? 'rgba(255,255,255,0.8)' : '#475569',
    }), [isDarkMode]);

    // Detect mobile for better timeline layout
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Helper to resolve member picture
    const resolvePicture = (m: any) => {
        const candidates = [
            m?.member_id?.picture,
            m?.member_id?.picture_id,
            m?.member_id?.picture?.id,
            m?.member_id?.user?.picture,
            m?.member_id?.user?.avatar,
            m?.member_id?.user?.avatar?.id,
            m?.user_id?.picture,
            m?.user_id?.picture?.id,
            m?.user_id?.avatar,
            m?.user_id?.avatar?.id,
            m?.picture,
            m?.picture?.id,
            m?.avatar,
            m?.avatar?.id,
        ];
        for (const c of candidates) {
            if (!c) continue;
            return c;
        }
        return null;
    };

    return (
        <div className="w-full [&_.timeline-card-content]:!max-h-none [&_.timeline-card-content]:!overflow-visible [&_.card-content-wrapper]:!max-h-none [&_.card-content-wrapper]:!overflow-visible [&_.card-description]:!line-clamp-none dark:[&_.timeline-card-content]:bg-[var(--bg-card)] dark:[&_.timeline-card-content]:!text-white dark:[&_.card-title]:!text-white dark:[&_.card-subtitle]:!text-white dark:[&_.card-description]:!text-white dark:[&_.title]:!text-white dark:[&_.timeline-card-title]:!text-white dark:[&_.timeline-title]:!text-white">
            <Chrono
                items={items}
                mode={isMobile ? "VERTICAL" : "VERTICAL_ALTERNATING"}
                slideShow={false}
                scrollable={true}
                theme={chronoTheme}
                hideControls={true}
                enableOutline={false}
                // @ts-expect-error: disableAutoScrollOnClick does not exist in types yet
                disableAutoScrollOnClick={true}
                cardPositionHorizontal="TOP"
                mediaHeight={200}
                fontSizes={{
                    cardSubtitle: '0.875rem',
                    cardTitle: '1.25rem',
                    title: '1rem',
                }}
            >
                {sortedBoards.map((board, index) => (
                    <div key={board.id || `board-${index}`} className="p-6 space-y-4 rounded-3xl bg-[var(--bg-card)] shadow-lg border border-slate-200/5 overflow-visible" data-testid={`timeline-item-${index}`}>                        {/* Board description */}
                        {board.omschrijving && (
                            <div className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
                                <p>{board.omschrijving}</p>
                            </div>
                        )}
                        {/* Board image */}
                        {board.image && (
                            <div className="w-full overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-700 mb-4">
                                <img
                                    src={
                                        (typeof board.image === 'string' && (board.image.startsWith('http') || board.image.startsWith('/')))
                                            ? board.image
                                            : (getImageUrl ? getImageUrl(board.image, { width: 1200, height: 600 }) : '/img/group-jump.gif')
                                    }
                                    alt={board.naam}
                                    className="aspect-video w-full object-cover rounded-xl"
                                    loading="lazy"
                                    onError={(e) => {
                                        const t = e.target as HTMLImageElement;
                                        t.src = '/img/group-jump.gif';
                                    }}
                                />
                            </div>
                        )}

                        {/* Members */}
                        {Array.isArray(board.members) && board.members.length > 0 && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-sm font-semibold text-paars dark:text-purple-400">
                                    <Users className="h-5 w-5" />
                                    <span>Bestuursleden ({board.members.length})</span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 xl:grid-cols-2 gap-3">
                                    {board.members.map((member: any) => {
                                        const avatarRef = resolvePicture(member);
                                        let avatarSrc = '/img/placeholder.svg';
                                        if (avatarRef) {
                                            if (typeof avatarRef === 'string' && (avatarRef.startsWith('http://') || avatarRef.startsWith('https://') || avatarRef.startsWith('/'))) {
                                                avatarSrc = avatarRef;
                                            } else if (getImageUrl) {
                                                avatarSrc = getImageUrl(avatarRef, { width: 200, height: 200 });
                                            } else if (typeof avatarRef === 'string') {
                                                avatarSrc = avatarRef;
                                            }
                                        }

                                        const fullName = getMemberFullName
                                            ? getMemberFullName(member)
                                            : (member.member_id?.first_name && member.member_id?.last_name
                                                ? `${member.member_id.first_name} ${member.member_id.last_name}`
                                                : member.member_id?.name ?? 'Onbekend');

                                        return (
                                            <div
                                                key={member.id ?? `${board.id}-${Math.random()}`}
                                                className="flex items-center gap-3 rounded-xl bg-[var(--bg-card)] border border-slate-200/50 dark:border-white/10 p-3 shadow-sm hover:shadow-md transition-shadow"
                                            >
                                                <img
                                                    src={avatarSrc}
                                                    alt={fullName}
                                                    className="h-12 w-12 flex-shrink-0 rounded-full object-cover bg-slate-100 dark:bg-slate-700 border-2 border-white/50 dark:border-slate-600"
                                                    loading="lazy"
                                                    onError={(e) => {
                                                        const t = e.target as HTMLImageElement;
                                                        t.src = '/img/placeholder.svg';
                                                    }}
                                                />
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">
                                                        {fullName}
                                                    </p>
                                                    {member.functie && (
                                                        <p className="text-xs text-paars dark:text-purple-400 truncate font-medium">{member.functie}</p>
                                                    )}
                                                </div>
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
