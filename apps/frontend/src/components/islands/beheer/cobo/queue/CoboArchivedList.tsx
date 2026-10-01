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
            <div className="rounded-2xl border border-dashed border-border-color bg-bg-card py-12 text-center">
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
                    className={`flex flex-col items-start justify-between gap-3 rounded-xl border bg-bg-card p-4 transition-colors sm:flex-row sm:items-center ${
                        isCompleted
                            ? 'border-border-color opacity-85 hover:opacity-100'
                            : 'border-amber-500/30 bg-amber-500/5'
                    }`}
                >
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <h4
                                className={`truncate text-sm font-semibold text-text-main sm:text-base ${
                                    isCompleted ? 'text-text-muted line-through' : ''
                                }`}
                            >
                                {board.board_name}
                            </h4>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                            <CoboActivityBadge
                                type={board.activity_type}
                                custom={board.activity_custom}
                            />
                        </div>
                    </div>

                    <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
                        <button
                            type="button"
                            onClick={() => onRestore(board.id, board.board_name || 'Bestuur')}
                            className="beheer-button flex min-h-11 cursor-pointer items-center gap-1.5 rounded-lg border border-purple-500/20 bg-purple-500/10 px-3 py-1.5 text-xs font-semibold text-purple-700 transition-colors hover:bg-purple-600 hover:text-white sm:min-h-9 dark:text-purple-300"
                        >
                            <RotateCcw className="size-3.5" />
                            <span>{isCompleted ? 'Herstel naar wachtrij' : 'Terug in wachtrij'}</span>
                        </button>

                        {!isCompleted && onDelete && (
                            <button
                                type="button"
                                onClick={() => onDelete(board.id, board.board_name || 'Bestuur')}
                                title="Verwijderen"
                                className="icon-button flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-lg p-2 text-text-muted transition-colors hover:bg-rose-500/10 hover:text-rose-500 sm:min-h-9 sm:min-w-9"
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
