'use client';

import React from 'react';
import { type CoboGuestBoard } from '@salvemundi/validations';
import { GripVertical, ArrowUpToLine, MoveUp, MoveDown, Play, Clock, Trash2 } from 'lucide-react';
import CoboActivityBadge from './CoboActivityBadge';

interface Props {
    board: CoboGuestBoard;
    index: number;
    totalCount: number;
    isDragged: boolean;
    isDragOver: boolean;
    onDragStart: (e: React.DragEvent) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
    onDragEnd: () => void;
    onReorder: (fromIndex: number, toIndex: number) => void;
    onStatusChange: (id: number, status: string, name: string) => void;
    onDelete: (id: number, name: string) => void;
}

export default function CoboQueueItem({
    board,
    index,
    totalCount,
    isDragged,
    isDragOver,
    onDragStart,
    onDragOver,
    onDrop,
    onDragEnd,
    onReorder,
    onStatusChange,
    onDelete
}: Props) {
    return (
        <div
            draggable
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onDragEnd={onDragEnd}
            className={`group flex flex-col items-start justify-between gap-3 rounded-xl border bg-bg-card p-3.5 transition-all sm:flex-row sm:items-center sm:p-4 ${
                isDragged
                    ? 'scale-0.99 border-purple-500 opacity-40'
                    : isDragOver
                    ? 'border-purple-500 bg-purple-500/5'
                    : 'border-border-color hover:border-purple-500/40'
            }`}
        >
            <div className="flex min-w-0 flex-1 items-center gap-3">
                <div
                    className="-ml-1 shrink-0 cursor-grab rounded-md p-1 text-text-muted transition-colors hover:text-purple-600 active:cursor-grabbing dark:hover:text-purple-400"
                    title="Sleep om volgorde direct te wijzigen"
                >
                    <GripVertical className="size-4" />
                </div>

                <div className="relative shrink-0" title="Klik om direct naar positie te springen">
                    <select
                        value={index + 1}
                        onChange={(e) => {
                            const targetPos = parseInt(e.target.value, 10) - 1;
                            onReorder(index, targetPos);
                        }}
                        className="beheer-select h-8! w-auto! min-w-11! cursor-pointer rounded-lg border border-purple-500/20 bg-purple-500/10 bg-none! px-2! py-0! text-center text-xs font-bold text-purple-700 transition-colors hover:bg-purple-500/20 focus:ring-2 focus:ring-purple-500 focus:outline-none dark:text-purple-300"
                    >
                        {Array.from({ length: totalCount }, (_, pIdx) => (
                            <option key={pIdx} value={pIdx + 1} className="bg-bg-card font-semibold text-text-main">
                                #{pIdx + 1}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="min-w-0 flex-1">
                    <h4 className="truncate text-sm font-semibold text-text-main sm:text-base">
                        {board.board_name}
                    </h4>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                        <CoboActivityBadge
                            type={board.activity_type}
                            custom={board.activity_custom}
                        />
                    </div>
                </div>
            </div>

            <div className="flex w-full flex-wrap items-center justify-end gap-1.5 sm:w-auto">
                {index > 0 && (
                    <button
                        type="button"
                        onClick={() => onReorder(index, 0)}
                        title="Direct naar boven (#1)"
                        className="beheer-button flex min-h-11 cursor-pointer items-center gap-1 rounded-lg border border-purple-500/20 bg-purple-500/10 px-2.5 py-1 text-xs font-semibold text-purple-700 transition-colors hover:bg-purple-600 hover:text-white sm:min-h-8 dark:text-purple-300"
                    >
                        <ArrowUpToLine className="size-3.5" />
                        <span className="hidden md:inline">Naar #1</span>
                    </button>
                )}

                <div className="flex min-h-11 items-center rounded-lg border border-border-color/60 bg-bg-soft p-0.5 sm:min-h-8">
                    <button
                        type="button"
                        onClick={() => onReorder(index, index - 1)}
                        disabled={index === 0}
                        title="Eén plek omhoog"
                        className="icon-button flex min-h-10 min-w-10 cursor-pointer items-center justify-center p-1 text-text-muted hover:text-purple-500 disabled:cursor-not-allowed disabled:opacity-20 sm:min-h-7 sm:min-w-7"
                    >
                        <MoveUp className="size-3.5" />
                    </button>
                    <button
                        type="button"
                        onClick={() => onReorder(index, index + 1)}
                        disabled={index === totalCount - 1}
                        title="Eén plek omlaag"
                        className="icon-button flex min-h-10 min-w-10 cursor-pointer items-center justify-center p-1 text-text-muted hover:text-purple-500 disabled:cursor-not-allowed disabled:opacity-20 sm:min-h-7 sm:min-w-7"
                    >
                        <MoveDown className="size-3.5" />
                    </button>
                </div>

                <button
                    type="button"
                    onClick={() => onStatusChange(board.id, 'current', board.board_name || 'Bestuur')}
                    title="Nu aan de beurt zetten"
                    className="beheer-button flex min-h-11 cursor-pointer items-center gap-1 rounded-lg border border-purple-500/20 bg-purple-500/10 px-2.5 py-1 text-xs font-semibold text-purple-700 transition-colors hover:bg-purple-600 hover:text-white sm:min-h-8 dark:text-purple-300"
                >
                    <Play className="size-3" />
                    <span>Nu</span>
                </button>

                <button
                    type="button"
                    onClick={() => onStatusChange(board.id, 'late', board.board_name || 'Bestuur')}
                    title="Markeren als niet op tijd"
                    className="icon-button flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-lg p-1.5 text-text-muted transition-colors hover:bg-amber-500/10 hover:text-amber-500 sm:min-h-8 sm:min-w-8"
                >
                    <Clock className="size-3.5" />
                </button>

                <button
                    type="button"
                    onClick={() => onDelete(board.id, board.board_name || 'Bestuur')}
                    title="Verwijderen"
                    className="icon-button flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-lg p-1.5 text-text-muted transition-colors hover:bg-rose-500/10 hover:text-rose-500 sm:min-h-8 sm:min-w-8"
                >
                    <Trash2 className="size-3.5" />
                </button>
            </div>
        </div>
    );
}
