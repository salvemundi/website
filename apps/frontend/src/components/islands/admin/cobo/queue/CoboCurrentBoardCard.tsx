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
            <div className="bg-bg-card rounded-2xl p-6 border border-border-color text-center space-y-3">
                <div>
                    <p className="font-semibold text-text-main text-base">Geen bestuur actief</p>
                    <p className="text-xs text-text-muted mt-0.5">Kies een bestuur uit de wachtrij of start de volgende.</p>
                </div>
                {waitingCount > 0 && (
                    <button
                        type="button"
                        onClick={onNext}
                        className="beheer-button min-h-11 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
                    >
                        <span>Start Volgende ({nextBoardName ?? 'Bestuur'})</span>
                        <ArrowRight className="h-4 w-4" />
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="bg-bg-card rounded-2xl p-6 border border-border-color shadow-xs text-center space-y-4">
            <div className="space-y-2 max-w-xl mx-auto">
                <h2 className="text-2xl sm:text-3xl font-bold text-text-main tracking-tight wrap-break-words">
                    {currentBoard.board_name}
                </h2>
                <div className="flex items-center justify-center gap-2 flex-wrap">
                    <CoboActivityBadge
                        type={currentBoard.activity_type}
                        custom={currentBoard.activity_custom}
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center justify-center gap-2.5 pt-1 max-w-xl mx-auto w-full">
                <button
                    type="button"
                    onClick={() => onStatusChange(currentBoard.id, 'completed', currentBoard.board_name || 'Bestuur')}
                    className="beheer-button sm:flex-1 min-h-11 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Klaar</span>
                </button>

                {waitingCount > 0 && (
                    <button
                        type="button"
                        onClick={onNext}
                        title="Volgende oproepen"
                        className="beheer-button sm:flex-1 min-h-11 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                    >
                        <ArrowRight className="h-4 w-4" />
                        <span>Volgende</span>
                    </button>
                )}

                <button
                    type="button"
                    onClick={() => onStatusChange(currentBoard.id, 'waiting', currentBoard.board_name || 'Bestuur')}
                    title="Terugzetten in de wachtrij"
                    className="beheer-button sm:flex-1 min-h-11 px-4 py-2.5 rounded-xl border border-border-color bg-bg-soft hover:bg-bg-card text-text-muted hover:text-text-main font-semibold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                    <RotateCcw className="h-4 w-4" />
                    <span>Terug</span>
                </button>

                <button
                    type="button"
                    onClick={() => onStatusChange(currentBoard.id, 'late', currentBoard.board_name || 'Bestuur')}
                    title="Markeren als niet op tijd"
                    className="beheer-button sm:flex-1 min-h-11 px-4 py-2.5 rounded-xl border border-border-color bg-bg-soft hover:bg-amber-500/10 hover:border-amber-500/30 text-text-muted hover:text-amber-600 dark:hover:text-amber-400 font-semibold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                    <Clock className="h-4 w-4" />
                    <span>Niet op tijd</span>
                </button>
            </div>
        </div>
    );
}
