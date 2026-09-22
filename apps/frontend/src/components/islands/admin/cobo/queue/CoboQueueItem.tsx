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
            className={`bg-bg-card rounded-xl p-3.5 sm:p-4 border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group ${
                isDragged
                    ? 'opacity-40 border-purple-500 scale-[0.99]'
                    : isDragOver
                    ? 'border-purple-500 bg-purple-500/5'
                    : 'border-border-color hover:border-purple-500/40'
            }`}
        >
            <div className="flex items-center gap-3 min-w-0 flex-1">
                <div
                    className="cursor-grab active:cursor-grabbing text-text-muted hover:text-purple-600 dark:hover:text-purple-400 p-1 -ml-1 rounded-md transition-colors shrink-0"
                    title="Sleep om volgorde direct te wijzigen"
                >
                    <GripVertical className="h-4 w-4" />
                </div>

                <div className="relative shrink-0" title="Klik om direct naar positie te springen">
                    <select
                        value={index + 1}
                        onChange={(e) => {
                            const targetPos = parseInt(e.target.value, 10) - 1;
                            onReorder(index, targetPos);
                        }}
                        className="beheer-select w-auto! h-8! min-w-11! px-2! py-0! bg-none! text-center font-bold text-xs rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/20 cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
                    >
                        {Array.from({ length: totalCount }, (_, pIdx) => (
                            <option key={pIdx} value={pIdx + 1} className="bg-bg-card text-text-main font-semibold">
                                #{pIdx + 1}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="min-w-0 flex-1">
                    <h4 className="font-semibold text-text-main text-sm sm:text-base truncate">
                        {board.board_name}
                    </h4>
                    <div className="mt-1 flex items-center gap-2 flex-wrap">
                        <CoboActivityBadge
                            type={board.activity_type}
                            custom={board.activity_custom}
                        />
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end flex-wrap">
                {index > 0 && (
                    <button
                        type="button"
                        onClick={() => onReorder(index, 0)}
                        title="Direct naar boven (#1)"
                        className="beheer-button px-2.5 py-1 min-h-11 sm:min-h-8 rounded-lg bg-purple-500/10 hover:bg-purple-600 hover:text-white text-purple-700 dark:text-purple-300 border border-purple-500/20 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                    >
                        <ArrowUpToLine className="h-3.5 w-3.5" />
                        <span className="hidden md:inline">Naar #1</span>
                    </button>
                )}

                <div className="flex items-center bg-bg-soft rounded-lg border border-border-color/60 p-0.5 min-h-11 sm:min-h-8">
                    <button
                        type="button"
                        onClick={() => onReorder(index, index - 1)}
                        disabled={index === 0}
                        title="Eén plek omhoog"
                        className="icon-button min-h-10 min-w-10 sm:min-h-7 sm:min-w-7 flex items-center justify-center p-1 text-text-muted hover:text-purple-500 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                    >
                        <MoveUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                        type="button"
                        onClick={() => onReorder(index, index + 1)}
                        disabled={index === totalCount - 1}
                        title="Eén plek omlaag"
                        className="icon-button min-h-10 min-w-10 sm:min-h-7 sm:min-w-7 flex items-center justify-center p-1 text-text-muted hover:text-purple-500 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                    >
                        <MoveDown className="h-3.5 w-3.5" />
                    </button>
                </div>

                <button
                    type="button"
                    onClick={() => onStatusChange(board.id, 'current', board.board_name || 'Bestuur')}
                    title="Nu aan de beurt zetten"
                    className="beheer-button px-2.5 py-1 min-h-11 sm:min-h-8 rounded-lg bg-purple-500/10 text-purple-700 dark:text-purple-300 hover:bg-purple-600 hover:text-white border border-purple-500/20 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                >
                    <Play className="h-3 w-3" />
                    <span>Nu</span>
                </button>

                <button
                    type="button"
                    onClick={() => onStatusChange(board.id, 'late', board.board_name || 'Bestuur')}
                    title="Markeren als niet op tijd"
                    className="icon-button min-h-11 min-w-11 sm:min-h-8 sm:min-w-8 flex items-center justify-center p-1.5 rounded-lg text-text-muted hover:text-amber-500 hover:bg-amber-500/10 transition-colors cursor-pointer"
                >
                    <Clock className="h-3.5 w-3.5" />
                </button>

                <button
                    type="button"
                    onClick={() => onDelete(board.id, board.board_name || 'Bestuur')}
                    title="Verwijderen"
                    className="icon-button min-h-11 min-w-11 sm:min-h-8 sm:min-w-8 flex items-center justify-center p-1.5 rounded-lg text-text-muted hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                >
                    <Trash2 className="h-3.5 w-3.5" />
                </button>
            </div>
        </div>
    );
}
