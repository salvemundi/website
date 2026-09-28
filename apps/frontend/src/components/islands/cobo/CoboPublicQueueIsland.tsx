'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { CoboGuestBoard } from '@salvemundi/validations';
import { Clock, AlertTriangle, UserCheck, ArrowRight } from 'lucide-react';

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

    const renderActivityBadge = (type: string | null | undefined, custom?: string | null, isCurrent: boolean = false) => {
        const sizeClasses = isCurrent
            ? 'px-3.5 py-1 rounded-full text-sm font-bold uppercase tracking-wider'
            : 'px-2.5 py-1 rounded-full text-xs font-semibold';

        if (type === 'shotjes') {
            return (
                <span className={`inline-flex items-center ${sizeClasses} border border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300`}>
                    <span>Shotjes</span>
                </span>
            );
        }
        if (type === 'watervallen') {
            return (
                <span className={`inline-flex items-center ${sizeClasses} border border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300`}>
                    <span>Watervallen</span>
                </span>
            );
        }
        return (
            <span className={`inline-flex items-center ${sizeClasses} border border-purple-500/20 bg-purple-500/10 text-purple-700 dark:text-purple-300`}>
                <span>{custom || 'Activiteit'}</span>
            </span>
        );
    };

    const hasAnyActive = Boolean(currentBoard || allActiveQueue.length > 0);

    return (
        <div className="space-y-6">
            {!hasAnyActive && (
                <div className="space-y-3 rounded-2xl border border-border-color bg-bg-card p-8 text-center shadow-lg sm:rounded-3xl sm:p-12">
                    <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-purple-500/20 bg-purple-500/10 text-purple-700 dark:text-purple-300">
                        <UserCheck className="size-7" />
                    </div>
                    <h3 className="text-lg font-black text-text-main sm:text-xl">
                        De wachtlijst is momenteel leeg
                    </h3>
                    <p className="mx-auto max-w-md text-sm font-medium text-text-muted">
                        Meld je aan bij de pedel om op de lijst te komen.
                    </p>
                </div>
            )}

            {currentBoard && (
                <div className="space-y-3 rounded-2xl border-2 border-purple-500/30 bg-bg-card p-6 text-center shadow-xl sm:rounded-3xl sm:p-8">
                    <div className="flex flex-wrap items-center justify-center gap-2.5">
                        <span className="inline-flex items-center rounded-full border border-purple-500/20 bg-purple-500/10 px-3.5 py-1 text-sm font-bold tracking-wider text-purple-700 uppercase dark:text-purple-300">
                            Nu aan de beurt
                        </span>
                        {renderActivityBadge(currentBoard.activity_type, currentBoard.activity_custom, true)}
                    </div>

                    <div>
                        <h3 className="text-3xl font-black tracking-tight text-theme-purple sm:text-4xl">
                            {currentBoard.board_name}
                        </h3>
                    </div>
                </div>
            )}

            {displayedQueue.length > 0 && (
                <div className="space-y-4 rounded-2xl border border-border-color bg-bg-card p-6 shadow-lg sm:rounded-3xl sm:p-8">
                    <div className="flex items-center justify-between border-b border-border-color/60 pb-3">
                        <h3 className="flex items-center gap-2 text-sm font-black tracking-wider text-text-muted uppercase">
                            <Clock className="size-4 text-purple-600 dark:text-purple-300" />
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
                                    className={`flex items-center justify-between gap-4 py-4 transition-colors ${
                                        isLate ? '-mx-4 rounded-xl bg-rose-500/5 px-4 opacity-90' : ''
                                    }`}
                                >
                                    <div className="flex min-w-0 flex-1 items-center gap-3.5">
                                        <div
                                            className={`flex size-8 shrink-0 items-center justify-center rounded-xl text-xs font-black ${
                                                isLate
                                                    ? 'border border-rose-500/30 bg-rose-500/15 text-rose-600 dark:text-rose-400'
                                                    : 'border border-purple-500/15 bg-purple-500/10 text-purple-700 dark:text-purple-300'
                                            }`}
                                        >
                                            #{index + 1}
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h4 className="truncate text-sm font-bold text-text-main sm:text-base">
                                                    {board.board_name}
                                                </h4>
                                                {isLate && (
                                                    <span className="inline-flex items-center gap-1 rounded-md border border-rose-500/30 bg-rose-500/15 px-2 py-0.5 text-[11px] font-black tracking-wider text-rose-600 uppercase dark:text-rose-400">
                                                        <AlertTriangle className="size-3" />
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
                        <div className="border-t border-border-color/40 pt-4">
                            <Link
                                href="/cobo/wachtlijst"
                                className="beheer-button flex w-full items-center justify-center gap-2 rounded-xl border border-purple-500/20 bg-purple-500/10 px-4 py-3 text-sm font-bold text-purple-700 shadow-xs transition-all hover:bg-purple-500/15 dark:text-purple-300"
                            >
                                <span>
                                    Bekijk nog {remainingCount} {remainingCount === 1 ? 'ander wachtend bestuur' : 'andere wachtende besturen'}
                                </span>
                                <ArrowRight className="size-4" />
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

