'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { CoboGuestBoard } from '@salvemundi/validations';
import { Clock, AlertTriangle, Sparkles, UserCheck, Flame, Waves, ArrowRight } from 'lucide-react';

interface Props {
    coboId: number;
    initialGuestBoards: CoboGuestBoard[];
    limit?: number;
}

interface LiveApiResponse {
    success: boolean;
    guestBoards?: CoboGuestBoard[];
    allBoards?: CoboGuestBoard[];
}

export default function CoboPublicQueueIsland({
    coboId,
    initialGuestBoards,
    limit
}: Props) {
    const [boards, setBoards] = useState<CoboGuestBoard[]>(initialGuestBoards);

    useEffect(() => {
        setBoards(initialGuestBoards);
    }, [initialGuestBoards]);

    useEffect(() => {
        const fetchLiveQueue = async () => {
            try {
                const res = await fetch(`/api/cobo/live?coboId=${coboId}`, {
                    cache: 'no-store'
                });
                if (res.ok) {
                    const data = (await res.json()) as LiveApiResponse;
                    const newBoards = data.guestBoards || data.allBoards;
                    if (data.success && Array.isArray(newBoards)) {
                        setBoards(newBoards);
                    }
                }
            } catch {
                // Background polling error silent
            }
        };

        const interval = setInterval(() => {
            void fetchLiveQueue();
        }, 5000);
        return () => clearInterval(interval);
    }, [coboId]);

    // Filteren en sorteren
    const currentBoard = boards.find(b => b.status === 'current');
    const allActiveQueue = boards
        .filter(b => b.status === 'waiting' || b.status === 'late')
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

    const displayedQueue = limit ? allActiveQueue.slice(0, limit) : allActiveQueue;
    const remainingCount = limit ? Math.max(0, allActiveQueue.length - limit) : 0;

    const renderActivityBadge = (type: string | null | undefined, custom?: string | null) => {
        if (type === 'shotjes') {
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                    <Flame className="h-3.5 w-3.5 text-amber-500" />
                    <span>Shotjes</span>
                </span>
            );
        }
        if (type === 'watervallen') {
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20">
                    <Waves className="h-3.5 w-3.5 text-blue-500" />
                    <span>Watervallen</span>
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20">
                <Sparkles className="h-3.5 w-3.5 text-purple-500" />
                <span>{custom || 'Activiteit'}</span>
            </span>
        );
    };

    const hasAnyActive = Boolean(currentBoard || allActiveQueue.length > 0);

    return (
        <div className="space-y-6">
            {!hasAnyActive && (
                <div className="bg-bg-card rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center shadow-lg border border-border-color space-y-3">
                    <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center mx-auto border border-purple-500/20 text-purple-700 dark:text-purple-300">
                        <UserCheck className="h-7 w-7" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-black text-text-main">
                        De wachtlijst is momenteel leeg
                    </h3>
                    <p className="text-text-muted text-sm max-w-md mx-auto font-medium">
                        Meld je aan bij de pedel om op de lijst te komen.
                    </p>
                </div>
            )}

            {currentBoard && (
                <div className="bg-bg-card rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xl border-2 border-purple-500/30 text-center space-y-3">
                    <div className="flex items-center justify-center gap-2.5 flex-wrap">
                        <span className="inline-flex items-center px-3.5 py-1 rounded-full text-sm font-bold bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 uppercase tracking-wider">
                            Nu aan de beurt
                        </span>
                        {renderActivityBadge(currentBoard.activity_type, currentBoard.activity_custom)}
                    </div>

                    <div>
                        <h3 className="text-3xl sm:text-4xl font-black text-theme-purple tracking-tight">
                            {currentBoard.board_name}
                        </h3>
                    </div>
                </div>
            )}

            {displayedQueue.length > 0 && (
                <div className="bg-bg-card rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-lg border border-border-color space-y-4">
                    <div className="flex items-center justify-between border-b border-border-color/60 pb-3">
                        <h3 className="text-sm font-black uppercase tracking-wider text-text-muted flex items-center gap-2">
                            <Clock className="h-4 w-4 text-purple-600 dark:text-purple-300" />
                            {limit && allActiveQueue.length > limit
                                ? `Eerstvolgende (${displayedQueue.length} van ${allActiveQueue.length})`
                                : `Wachtend (${allActiveQueue.length})`}
                        </h3>
                    </div>

                    <div className="divide-y divide-border-color/40">
                        {displayedQueue.map((board, index) => {
                            const isLate = board.status === 'late';

                            return (
                                <div
                                    key={board.id}
                                    className={`py-4 flex items-center justify-between gap-4 transition-colors ${
                                        isLate ? 'opacity-90 bg-rose-500/5 -mx-4 px-4 rounded-xl' : ''
                                    }`}
                                >
                                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                                        <div
                                            className={`h-8 w-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                                                isLate
                                                    ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                                                    : 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/15'
                                            }`}
                                        >
                                            #{index + 1}
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h4 className="font-bold text-text-main text-sm sm:text-base truncate">
                                                    {board.board_name}
                                                </h4>
                                                {isLate && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-black uppercase tracking-wider bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                                                        <AlertTriangle className="h-3 w-3" />
                                                        Niet op tijd
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="shrink-0">
                                        {renderActivityBadge(board.activity_type, board.activity_custom)}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {remainingCount > 0 && (
                        <div className="pt-4 border-t border-border-color/40">
                            <Link
                                href="/cobo/wachtlijst"
                                className="beheer-button w-full py-3 px-4 bg-purple-500/10 hover:bg-purple-500/15 text-purple-700 dark:text-purple-300 font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 border border-purple-500/20 shadow-xs"
                            >
                                <span>
                                    Bekijk nog {remainingCount} {remainingCount === 1 ? 'ander wachtend bestuur' : 'andere wachtende besturen'}
                                </span>
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

