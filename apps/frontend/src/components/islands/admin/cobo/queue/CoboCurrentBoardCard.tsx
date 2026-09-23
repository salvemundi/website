'use client';

import { type CoboGuestBoard } from '@salvemundi/validations';
import { CheckCircle2, Clock, ArrowRight, RotateCcw } from 'lucide-react';
import CoboActivityBadge from './CoboActivityBadge';

interface Props {
    currentBoard: CoboGuestBoard | null;
    waitingCount: number;
    nextBoardName?: string | null;
    onStatusChange: (id: number, status: string, name: string) => void;
    onNext: () => void;
}

export default function CoboCurrentBoardCard({
    currentBoard,
    waitingCount,
    nextBoardName,
    onStatusChange,
    onNext
}: Props) {
    if (!currentBoard) {
        return (
            <div className="space-y-3 rounded-2xl border border-border-color bg-bg-card p-6 text-center">
                <div>
                    <p className="text-base font-semibold text-text-main">Geen bestuur actief</p>
                    <p className="mt-0.5 text-xs text-text-muted">Kies een bestuur uit de wachtrij of start de volgende.</p>
                </div>
                {waitingCount > 0 && (
                    <button
                        type="button"
                        onClick={onNext}
                        className="beheer-button inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-purple-700"
                    >
                        <span>Start Volgende ({nextBoardName ?? 'Bestuur'})</span>
                        <ArrowRight className="size-4" />
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-4 rounded-2xl border border-border-color bg-bg-card p-6 text-center shadow-xs">
            <div className="mx-auto max-w-xl space-y-2">
                <h2 className="wrap-break-words text-2xl font-bold tracking-tight text-text-main sm:text-3xl">
                    {currentBoard.board_name}
                </h2>
                <div className="flex flex-wrap items-center justify-center gap-2">
                    <CoboActivityBadge
                        type={currentBoard.activity_type}
                        custom={currentBoard.activity_custom}
                    />
                </div>
            </div>

            <div className="mx-auto grid w-full max-w-xl grid-cols-2 items-center justify-center gap-2.5 pt-1 sm:flex sm:flex-wrap">
                <button
                    type="button"
                    onClick={() => onStatusChange(currentBoard.id, 'completed', currentBoard.board_name || 'Bestuur')}
                    className="beheer-button flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-purple-700 active:scale-95 sm:flex-1"
                >
                    <CheckCircle2 className="size-4" />
                    <span>Klaar</span>
                </button>

                {waitingCount > 0 && (
                    <button
                        type="button"
                        onClick={onNext}
                        title="Volgende oproepen"
                        className="beheer-button flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 active:scale-95 sm:flex-1"
                    >
                        <ArrowRight className="size-4" />
                        <span>Volgende</span>
                    </button>
                )}

                <button
                    type="button"
                    onClick={() => onStatusChange(currentBoard.id, 'waiting', currentBoard.board_name || 'Bestuur')}
                    title="Terugzetten in de wachtrij"
                    className="beheer-button flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-border-color bg-bg-soft px-4 py-2.5 text-sm font-semibold text-text-muted transition-colors hover:bg-bg-card hover:text-text-main active:scale-95 sm:flex-1"
                >
                    <RotateCcw className="size-4" />
                    <span>Terug</span>
                </button>

                <button
                    type="button"
                    onClick={() => onStatusChange(currentBoard.id, 'late', currentBoard.board_name || 'Bestuur')}
                    title="Markeren als niet op tijd"
                    className="beheer-button flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-border-color bg-bg-soft px-4 py-2.5 text-sm font-semibold text-text-muted transition-colors hover:border-amber-500/30 hover:bg-amber-500/10 hover:text-amber-600 active:scale-95 sm:flex-1 dark:hover:text-amber-400"
                >
                    <Clock className="size-4" />
                    <span>Niet op tijd</span>
                </button>
            </div>
        </div>
    );
}
