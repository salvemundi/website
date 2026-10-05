'use client';

import { type CoboGuestBoard } from '@salvemundi/validations';
import { CheckCircle2, Clock, RotateCcw, Trash2 } from 'lucide-react';
import CoboActivityBadge from './CoboActivityBadge';

interface Props {
    type: 'completed' | 'late';
    boards: CoboGuestBoard[];
    onRestore: (id: number, name: string) => void;
    onDelete?: (id: number, name: string) => void;
}

export default function CoboArchivedList({
    type,
    boards,
    onRestore,
    onDelete
}: Props) {
    const isCompleted = type === 'completed';

    if (boards.length === 0) {
        return (
            <div className="card-empty-dashed">
                {isCompleted ? (
                    <CheckCircle2 className="mx-auto mb-3 size-10 text-text-muted/40" />
                ) : (
                    <Clock className="mx-auto mb-3 size-10 text-text-muted/40" />
                )}
                <p className="text-sm font-medium text-text-muted">
                    {isCompleted
                        ? 'Nog geen besturen geweest.'
                        : 'Geen te late of afwezige besturen.'}
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-2.5">
            {boards.map((board) => (
                <div
                    key={board.id}
                    className={`card-row-archived-base ${
                        isCompleted
                            ? 'card-row-completed'
                            : 'card-row-late'
                    }`}
                >
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <h4
                                className={`card-title-archived ${
                                    isCompleted ? 'text-text-muted line-through' : ''
                                }`}
                            >
                                {board.board_name}
                            </h4>
                        </div>
                        <div className="filter-button-strip">
                            <CoboActivityBadge
                                type={board.activity_type}
                                custom={board.activity_custom}
                            />
                        </div>
                    </div>

                    <div className="action-strip-end">
                        <button
                            type="button"
                            onClick={() => onRestore(board.id, board.board_name || 'Bestuur')}
                            className="beheer-button-secondary min-h-11 text-theme-purple sm:min-h-9"
                        >
                            <RotateCcw className="size-3.5" />
                            <span>{isCompleted ? 'Herstel naar wachtrij' : 'Terug in wachtrij'}</span>
                        </button>

                        {!isCompleted && onDelete && (
                            <button
                                type="button"
                                onClick={() => onDelete(board.id, board.board_name || 'Bestuur')}
                                title="Verwijderen"
                                className="btn-icon-delete-soft"
                            >
                                <Trash2 className="size-4" />
                            </button>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
