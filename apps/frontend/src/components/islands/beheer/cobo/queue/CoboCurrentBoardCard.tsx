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
            <div className="card-inactive-board">
                <div>
                    <p className="text-base font-semibold text-text-main">Geen bestuur actief</p>
                    <p className="mt-0.5 text-xs text-text-muted">Kies een bestuur uit de wachtrij of start de volgende.</p>
                </div>
                {waitingCount > 0 && (
                    <button
                        type="button"
                        onClick={onNext}
                        className="beheer-button min-h-11"
                    >
                        <span>Start Volgende ({nextBoardName ?? 'Bestuur'})</span>
                        <ArrowRight className="size-4" />
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="card-active-board">
            <div className="mx-auto max-w-xl space-y-2">
                <h2 className="title-active-board">
                    {currentBoard.board_name}
                </h2>
                <div className="badge-group-centered">
                    <CoboActivityBadge
                        type={currentBoard.activity_type}
                        custom={currentBoard.activity_custom}
                    />
                </div>
            </div>

            <div className="action-grid-centered">
                <button
                    type="button"
                    onClick={() => onStatusChange(currentBoard.id, 'completed', currentBoard.board_name || 'Bestuur')}
                    className="beheer-button min-h-11 sm:flex-1"
                >
                    <CheckCircle2 className="size-4" />
                    <span>Klaar</span>
                </button>

                {waitingCount > 0 && (
                    <button
                        type="button"
                        onClick={onNext}
                        title="Volgende oproepen"
                        className="btn-emerald-action"
                    >
                        <ArrowRight className="size-4" />
                        <span>Volgende</span>
                    </button>
                )}

                <button
                    type="button"
                    onClick={() => onStatusChange(currentBoard.id, 'waiting', currentBoard.board_name || 'Bestuur')}
                    title="Terugzetten in de wachtrij"
                    className="beheer-button-secondary min-h-11 text-text-muted sm:flex-1"
                >
                    <RotateCcw className="size-4" />
                    <span>Terug</span>
                </button>

                <button
                    type="button"
                    onClick={() => onStatusChange(currentBoard.id, 'late', currentBoard.board_name || 'Bestuur')}
                    title="Markeren als niet op tijd"
                    className="btn-amber-secondary"
                >
                    <Clock className="size-4" />
                    <span>Niet op tijd</span>
                </button>
            </div>
        </div>
    );
}
