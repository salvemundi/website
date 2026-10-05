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
            className={`card-row-queue-item ${
                isDragged
                    ? 'scale-0.99 border-theme-purple opacity-40'
                    : isDragOver
                    ? 'border-theme-purple bg-theme-purple/5'
                    : 'border-border-color hover:border-theme-purple/40'
            }`}
        >
            <div className="flex min-w-0 flex-1 items-center gap-3">
                <div
                    className="drag-handle-button"
                    title="Sleep om volgorde direct te wijzigen"
                >
                    <GripVertical className="size-4" />
                </div>

                <div className="relative shrink-0" title="Klik om direct naar positie te springen">
                    <select
                        value={index + 1}
                        onChange={(event) => {
                            const targetPos = parseInt(event.target.value, 10) - 1;
                            onReorder(index, targetPos);
                        }}
                        className="beheer-select h-8! w-auto! min-w-11! text-center font-bold text-theme-purple"
                    >
                        {Array.from({ length: totalCount }, (_, pIdx) => (
                            <option key={pIdx} value={pIdx + 1} className="bg-bg-card font-semibold text-text-main">
                                #{pIdx + 1}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="min-w-0 flex-1">
                    <h4 className="card-title-archived">
                        {board.board_name}
                    </h4>
                    <div className="filter-button-strip">
                        <CoboActivityBadge
                            type={board.activity_type}
                            custom={board.activity_custom}
                        />
                    </div>
                </div>
            </div>

            <div className="action-strip-end">
                {index > 0 && (
                    <button
                        type="button"
                        onClick={() => onReorder(index, 0)}
                        title="Direct naar boven (#1)"
                        className="btn-pill-purple"
                    >
                        <ArrowUpToLine className="size-3.5" />
                        <span className="hidden md:inline">Naar #1</span>
                    </button>
                )}

                <div className="button-group-border">
                    <button
                        type="button"
                        onClick={() => onReorder(index, index - 1)}
                        disabled={index === 0}
                        title="Eén plek omhoog"
                        className="btn-icon-move"
                    >
                        <MoveUp className="size-3.5" />
                    </button>
                    <button
                        type="button"
                        onClick={() => onReorder(index, index + 1)}
                        disabled={index === totalCount - 1}
                        title="Eén plek omlaag"
                        className="btn-icon-move"
                    >
                        <MoveDown className="size-3.5" />
                    </button>
                </div>

                <button
                    type="button"
                    onClick={() => onStatusChange(board.id, 'current', board.board_name || 'Bestuur')}
                    title="Nu aan de beurt zetten"
                    className="btn-pill-purple"
                >
                    <Play className="size-3" />
                    <span>Nu</span>
                </button>

                <button
                    type="button"
                    onClick={() => onStatusChange(board.id, 'late', board.board_name || 'Bestuur')}
                    title="Markeren als niet op tijd"
                    className="btn-icon-amber"
                >
                    <Clock className="size-3.5" />
                </button>

                <button
                    type="button"
                    onClick={() => onDelete(board.id, board.board_name || 'Bestuur')}
                    title="Verwijderen"
                    className="btn-icon-rose"
                >
                    <Trash2 className="size-3.5" />
                </button>
            </div>
        </div>
    );
}
