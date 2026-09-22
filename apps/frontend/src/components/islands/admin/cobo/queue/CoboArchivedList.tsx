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
            <div className="text-center py-12 bg-bg-card rounded-2xl border border-dashed border-border-color">
                {isCompleted ? (
                    <CheckCircle2 className="h-10 w-10 text-text-muted/40 mx-auto mb-3" />
                ) : (
                    <Clock className="h-10 w-10 text-text-muted/40 mx-auto mb-3" />
                )}
                <p className="text-text-muted text-sm font-medium">
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
                    className={`bg-bg-card rounded-xl p-4 border transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                        isCompleted
                            ? 'border-border-color opacity-85 hover:opacity-100'
                            : 'border-amber-500/30 bg-amber-500/5'
                    }`}
                >
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <h4
                                className={`font-semibold text-text-main text-sm sm:text-base truncate ${
                                    isCompleted ? 'line-through text-text-muted' : ''
                                }`}
                            >
                                {board.board_name}
                            </h4>
                        </div>
                        <div className="mt-1 flex items-center gap-2 flex-wrap">
                            <CoboActivityBadge
                                type={board.activity_type}
                                custom={board.activity_custom}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <button
                            type="button"
                            onClick={() => onRestore(board.id, board.board_name || 'Bestuur')}
                            className="beheer-button px-3 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-600 hover:text-white text-purple-700 dark:text-purple-300 border border-purple-500/20 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 min-h-11 sm:min-h-9"
                        >
                            <RotateCcw className="h-3.5 w-3.5" />
                            <span>{isCompleted ? 'Herstel naar wachtrij' : 'Terug in wachtrij'}</span>
                        </button>

                        {!isCompleted && onDelete && (
                            <button
                                type="button"
                                onClick={() => onDelete(board.id, board.board_name || 'Bestuur')}
                                title="Verwijderen"
                                className="icon-button p-2 rounded-lg text-text-muted hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer min-h-11 min-w-11 sm:min-h-9 sm:min-w-9 flex items-center justify-center"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
